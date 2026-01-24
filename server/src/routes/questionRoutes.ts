import { Router } from "express";
import { z } from "zod";
import { Question } from "../models/Question";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/questions/random?limit=20
router.get("/random", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const pipeline = [
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: limit } },
    ];
    const docs = await Question.aggregate(pipeline);

    // By default we send correct answers; frontend can choose when to reveal.
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/questions/all?limit=50&skip=0  (for Question Bank browsing)
router.get("/all", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = Number(req.query.skip) || 0;
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    
    // Build query with optional filters
    const query: any = { isDeleted: { $ne: true } };
    if (req.query.category) query.category = req.query.category;
    if (req.query.increment) query.increment = Number(req.query.increment);
    if (req.query.status) query.status = req.query.status;
    
    // Add search functionality
    if (searchQuery && searchQuery.length > 0) {
      const searchRegex = new RegExp(searchQuery, "i"); // Case-insensitive search
      query.$or = [
        { question: searchRegex },
        { "options.a": searchRegex },
        { "options.b": searchRegex },
        { "options.c": searchRegex },
        { "options.d": searchRegex },
        { category: searchRegex },
        { topic: searchRegex },
        { explanation: searchRegex },
      ];
    }
    
    const [items, total] = await Promise.all([
      Question.find(query)
        .sort({ id: 1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(query),
    ]);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Alias: GET /api/questions with pagination & optional category filter
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const skip = Number(req.query.skip) || 0;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    query.isDeleted = { $ne: true };

    const [items, total] = await Promise.all([
      Question.find(query).sort({ id: 1 }).skip(skip).limit(limit),
      Question.countDocuments(query),
    ]);

    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Admin question management =====

const optionSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  c: z.string().min(1),
  d: z.string().min(1),
});

const questionBodySchema = z.object({
  id: z.number().int().positive().optional(),
  question: z.string().min(5),
  options: optionSchema,
  correct: z.enum(["a", "b", "c", "d"]),
  explanation: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  imageUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((val) => {
      if (val === null || val === "" || (typeof val === "string" && val.trim() === "")) {
        return null;
      }
      return val;
    }),
  topic: z.string().optional(),
  increment: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

// Create single question
router.post(
  "/",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  async (req: AuthRequest, res) => {
    try {
      const parsed = questionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: parsed.error.issues });
      }

      const data = parsed.data;
      const nextId =
        data.id ??
        ((await Question.findOne().sort({ id: -1 }).select("id"))?.id || 0) + 1;

      const created = await Question.create({
        ...(data as any),
        id: nextId,
        isDeleted: false,
      } as any);
      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Bulk import questions
router.post(
  "/bulk",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  async (req: AuthRequest, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ message: "Expected an array of questions" });
      }
      const items: z.infer<typeof questionBodySchema>[] = [];
      for (const raw of req.body) {
        const parsed = questionBodySchema.safeParse(raw);
        if (!parsed.success) {
          return res
            .status(400)
          .json({ message: "Invalid item in bulk import", errors: parsed.error.issues });
        }
        items.push(parsed.data);
      }

      const maxExisting =
        (await Question.findOne().sort({ id: -1 }).select("id"))?.id || 0;
      let currentId = maxExisting + 1;

      const docs = items.map((q) => {
        const id = q.id ?? currentId++;
        return { ...(q as any), id, isDeleted: false } as any;
      });

      const result = await Question.insertMany(docs as any);
      res.status(201).json({ inserted: result.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update question
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  async (req: AuthRequest, res) => {
    try {
      const numericId = Number(req.params.id);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      // Build update data and validate each field
      const updateData: any = {};
      const updateQuery: any = {};
      let hasErrors: any[] = [];
      
      // Validate question if present
      if (req.body.question !== undefined) {
        const result = z.string().min(5).safeParse(req.body.question);
        if (result.success) {
          updateData.question = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      
      // Validate options if present
      if (req.body.options !== undefined) {
        const result = optionSchema.safeParse(req.body.options);
        if (result.success) {
          updateData.options = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      
      // Validate correct if present
      if (req.body.correct !== undefined) {
        const result = z.enum(["a", "b", "c", "d"]).safeParse(req.body.correct);
        if (result.success) {
          updateData.correct = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      
      // Optional fields
      if (req.body.explanation !== undefined) {
        updateData.explanation = req.body.explanation || undefined;
      }
      if (req.body.category !== undefined) {
        updateData.category = req.body.category || undefined;
      }
      if (req.body.topic !== undefined) {
        updateData.topic = req.body.topic || undefined;
      }
      if (req.body.difficulty !== undefined) {
        const result = z.enum(["easy", "medium", "hard"]).optional().safeParse(req.body.difficulty);
        if (result.success) {
          updateData.difficulty = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      if (req.body.increment !== undefined) {
        const result = z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().safeParse(req.body.increment);
        if (result.success) {
          updateData.increment = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      if (req.body.status !== undefined) {
        const result = z.enum(["draft", "published"]).optional().safeParse(req.body.status);
        if (result.success) {
          updateData.status = result.data;
        } else {
          hasErrors.push(...result.error.issues);
        }
      }
      
      // Handle imageUrl separately
      if (req.body.hasOwnProperty("imageUrl")) {
        if (req.body.imageUrl === null || req.body.imageUrl === "" || (typeof req.body.imageUrl === "string" && req.body.imageUrl.trim() === "")) {
          // Explicitly unset the imageUrl field
          updateQuery.$unset = { imageUrl: "" };
        } else {
          const result = z.string().url().safeParse(req.body.imageUrl);
          if (result.success) {
            updateData.imageUrl = result.data;
          } else {
            hasErrors.push(...result.error.issues);
          }
        }
      }
      
      if (hasErrors.length > 0) {
        console.error("Validation errors:", JSON.stringify(hasErrors, null, 2));
        console.error("Request body:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: hasErrors });
      }
      
      // Add remaining fields to $set
      if (Object.keys(updateData).length > 0) {
        updateQuery.$set = updateData;
      }

      const updated = await Question.findOneAndUpdate(
        { id: numericId },
        Object.keys(updateQuery).length > 0 ? updateQuery : { $set: updateData },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Question not found" });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Soft delete question
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin", "superadmin"]),
  async (req: AuthRequest, res) => {
    try {
      const numericId = Number(req.params.id);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      const updated = await Question.findOneAndUpdate(
        { id: numericId },
        { $set: { isDeleted: true } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Question not found" });
      res.json({ message: "Question deleted (soft)", id: numericId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;


