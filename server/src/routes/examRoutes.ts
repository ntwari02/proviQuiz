import { Router } from "express";
import { z } from "zod";
import { Question } from "../models/Question";
import { ExamSession } from "../models/ExamSession";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

// Start exam: get 20 random questions
router.get("/start", async (_req, res) => {
  try {
    const limit = 20;
    const questions = await Question.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: limit } },
    ]);
    res.json({ questions, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Also support POST /api/exams/start to match some client expectations
router.post("/start", async (_req, res) => {
  try {
    const limit = 20;
    const questions = await Question.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: limit } },
    ]);
    res.json({ questions, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const submitSchema = z.object({
  mode: z.enum(["timed", "practice"]).default("timed"),
  startedAt: z.coerce.date(), // from ISO string
  completedAt: z.coerce.date(),
  answers: z.array(
    z.object({
      questionId: z.number(),
      selected: z.enum(["a", "b", "c", "d"]).nullable(),
    })
  ),
});

// Submit exam and store results
router.post("/submit", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    const { mode, startedAt, completedAt, answers } = parsed.data;
    const durationSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
    );

    const ids = answers.map((a) => a.questionId);
    const questions = await Question.find({ id: { $in: ids } });
    const byId = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    const graded = answers.map((a) => {
      const q = byId.get(a.questionId);
      const correct = (q?.correct ?? "a") as "a" | "b" | "c" | "d";
      const isCorrect = a.selected === correct;
      if (isCorrect) score += 1;
      return {
        questionId: a.questionId,
        selected: a.selected,
        correct,
        isCorrect,
      };
    });

    const exam = await ExamSession.create({
      user: req.userId as any,
      mode,
      startedAt,
      completedAt,
      durationSeconds,
      score,
      totalQuestions: answers.length,
      answers: graded,
    });

    res.status(201).json({
      examId: exam.id,
      score,
      totalQuestions: answers.length,
      durationSeconds,
      answers: graded,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user's exam history (for Dashboard)
router.get("/mine", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const exams = await ExamSession.find({ user: req.userId as any })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("score totalQuestions durationSeconds mode createdAt");

    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Simple stats: average score & exam count
router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const exams = await ExamSession.find({ user: req.userId as any }).select(
      "score totalQuestions"
    );
    if (exams.length === 0) {
      return res.json({ examCount: 0, averageScore: 0 });
    }

    const examCount = exams.length;
    const totalPct = exams.reduce((sum, ex) => {
      return sum + ex.score / Math.max(ex.totalQuestions, 1);
    }, 0);
    const averageScore = totalPct / examCount;

    res.json({ examCount, averageScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


