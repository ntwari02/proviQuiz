import { Router } from "express";
import { z } from "zod";
import { ExamConfig } from "../models/ExamConfig";
import { Question } from "../models/Question";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole(["admin", "superadmin"]));

const examConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  increments: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).min(1),
  questionCount: z.number().int().positive(),
  timeLimitMinutes: z.number().int().positive().optional(),
  passMarkPercent: z.number().int().min(0).max(100),
  randomizeQuestions: z.boolean().optional(),
  randomizeAnswers: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

// GET /api/admin/exam-configs - List all exam configurations
router.get("/exam-configs", async (_req: AuthRequest, res) => {
  try {
    const configs = await ExamConfig.find().sort({ createdAt: -1 });
    res.json(configs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/exam-configs/:id - Get single exam config
router.get("/exam-configs/:id", async (req: AuthRequest, res) => {
  try {
    const config = await ExamConfig.findById(req.params.id);
    if (!config) return res.status(404).json({ message: "Exam config not found" });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/exam-configs - Create exam configuration
router.post("/exam-configs", async (req: AuthRequest, res) => {
  try {
    const parsed = examConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    const config = await ExamConfig.create({
      ...parsed.data,
      createdBy: req.userId,
    } as any);

    res.status(201).json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/exam-configs/:id - Update exam configuration
router.put("/exam-configs/:id", async (req: AuthRequest, res) => {
  try {
    const parsed = examConfigSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    const config = await ExamConfig.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!config) return res.status(404).json({ message: "Exam config not found" });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/exam-configs/:id - Delete exam configuration
router.delete("/exam-configs/:id", async (req: AuthRequest, res) => {
  try {
    const config = await ExamConfig.findByIdAndDelete(req.params.id);
    if (!config) return res.status(404).json({ message: "Exam config not found" });
    res.json({ message: "Exam config deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/exam-configs/:id/preview - Preview questions that would be included
router.get("/exam-configs/:id/preview", async (req: AuthRequest, res) => {
  try {
    const config = await ExamConfig.findById(req.params.id);
    if (!config) return res.status(404).json({ message: "Exam config not found" });

    const match: any = {
      isDeleted: { $ne: true },
      status: "published",
      increment: { $in: config.increments },
    };

    const totalAvailable = await Question.countDocuments(match);
    const questions = await Question.find(match).limit(Math.min(config.questionCount, totalAvailable));

    res.json({
      config,
      totalAvailable,
      previewQuestions: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        increment: q.increment,
        category: q.category,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
