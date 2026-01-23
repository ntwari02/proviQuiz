import { Router } from "express";
import { z } from "zod";
import { Question } from "../models/Question";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole(["admin", "superadmin"]));

// GET /api/admin/categories - Get all unique categories with question counts
router.get("/categories", async (_req: AuthRequest, res) => {
  try {
    const categories = await Question.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          category: { $exists: true, $ne: null, $nin: [null, ""] },
        } as any,
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      categories.map((c) => ({
        name: c._id,
        questionCount: c.count,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/topics - Get all unique topics with question counts
router.get("/topics", async (_req: AuthRequest, res) => {
  try {
    const topics = await Question.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          topic: { $exists: true, $ne: null, $nin: [null, ""] },
        } as any,
      },
      {
        $group: {
          _id: "$topic",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      topics.map((t) => ({
        name: t._id,
        questionCount: t.count,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/categories/rename - Rename a category across all questions
const renameCategorySchema = z.object({
  oldName: z.string().min(1),
  newName: z.string().min(1),
});

router.patch("/categories/rename", async (req: AuthRequest, res) => {
  try {
    const parsed = renameCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    const { oldName, newName } = parsed.data;
    const result = await Question.updateMany(
      { category: oldName, isDeleted: { $ne: true } },
      { $set: { category: newName } }
    );

    res.json({ message: "Category renamed", updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/topics/rename - Rename a topic across all questions
const renameTopicSchema = z.object({
  oldName: z.string().min(1),
  newName: z.string().min(1),
});

router.patch("/topics/rename", async (req: AuthRequest, res) => {
  try {
    const parsed = renameTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    const { oldName, newName } = parsed.data;
    const result = await Question.updateMany(
      { topic: oldName, isDeleted: { $ne: true } },
      { $set: { topic: newName } }
    );

    res.json({ message: "Topic renamed", updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/categories/:name - Remove category from all questions (set to null)
router.delete("/categories/:name", async (req: AuthRequest, res) => {
  try {
    const name = typeof req.params.name === "string" ? decodeURIComponent(req.params.name) : "";
    if (!name) return res.status(400).json({ message: "Invalid category name" });
    const result = await Question.updateMany(
      { category: name, isDeleted: { $ne: true } },
      { $unset: { category: "" } }
    );

    res.json({ message: "Category removed", updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/topics/:name - Remove topic from all questions (set to null)
router.delete("/topics/:name", async (req: AuthRequest, res) => {
  try {
    const name = typeof req.params.name === "string" ? decodeURIComponent(req.params.name) : "";
    if (!name) return res.status(400).json({ message: "Invalid topic name" });
    const result = await Question.updateMany(
      { topic: name, isDeleted: { $ne: true } },
      { $unset: { topic: "" } }
    );

    res.json({ message: "Topic removed", updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
