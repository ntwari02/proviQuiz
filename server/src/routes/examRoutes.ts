import { Router } from "express";
import { z } from "zod";
import { Question } from "../models/Question";
import { ExamSession } from "../models/ExamSession";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { optionalAuthMiddleware } from "../middleware/optionalAuth";
import { getPremiumAccess } from "../services/premiumAccessService";
import {
  assertCanStartExam,
  consumeExamQuota,
  ExamQuotaExceededError,
  getExamQuotaStatus,
} from "../services/examQuotaService";

const router = Router();

const START_TOTAL_QUESTIONS = 433;

const startQuerySchema = z.object({
  rangeStart: z.coerce.number().int().min(1).max(START_TOTAL_QUESTIONS).optional(),
  rangeEnd: z.coerce.number().int().min(1).max(START_TOTAL_QUESTIONS).optional(),
  imageFilter: z.enum(["all", "images", "text"]).optional(),
});

function hasImageUrl(doc: any): boolean {
  const raw = (doc.imageUrl ?? "").toString().trim();

  // Treat obvious placeholder / non-image values as "no image"
  if (!raw) return false;
  const lowered = raw.toLowerCase();
  if (lowered === "n/a" || lowered === "na" || lowered === "none" || lowered === "-") {
    return false;
  }

  return true;
}

async function assertPremiumExamQuota(userId?: string) {
  if (!userId) return;
  const access = await getPremiumAccess(userId);
  if (!access.isPremium) return;
  await assertCanStartExam(userId);
}

async function consumePremiumExamQuota(userId?: string) {
  if (!userId) return null;
  const access = await getPremiumAccess(userId);
  if (!access.isPremium) return null;
  return consumeExamQuota(userId);
}

// Start exam: get 20 random questions, optionally filtered by range and image/text
// Premium subscribers only: server-side exam quota check + consumption (free users unchanged)
router.get("/start", optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const limit = 20;
    const parsed = startQuerySchema.safeParse(req.query);

    let quota = null;
    if (req.userId) {
      try {
        await assertPremiumExamQuota(req.userId);
      } catch (err) {
        if (err instanceof ExamQuotaExceededError) {
          return res.status(429).json({
            message: "Exam quota exceeded for your Premium plan",
            code: "EXAM_QUOTA_EXCEEDED",
            quota: err.status,
          });
        }
        throw err;
      }
    }

    // Base range + non-deleted filter
    let from = 1;
    let to = START_TOTAL_QUESTIONS;
    let imageFilter: "all" | "images" | "text" = "all";

    if (parsed.success) {
      from = parsed.data.rangeStart ?? 1;
      to = Math.max(from, parsed.data.rangeEnd ?? START_TOTAL_QUESTIONS);
      imageFilter = parsed.data.imageFilter ?? "all";
    }

    const baseDocs = await Question.find({
      isDeleted: { $ne: true },
      id: { $gte: from, $lte: to },
    }).lean();

    let pool = baseDocs;
    if (imageFilter === "images") {
      pool = baseDocs.filter((q) => hasImageUrl(q));
    } else if (imageFilter === "text") {
      pool = baseDocs.filter((q) => !hasImageUrl(q));
    }

    const imageCount = baseDocs.filter((q) => hasImageUrl(q)).length;
    const textCount = baseDocs.length - imageCount;
    console.log("[GET /api/exams/start]", {
      range: { from, to },
      imageFilter,
      baseCount: baseDocs.length,
      imageCount,
      textCount,
      poolCount: pool.length,
      premiumQuota: quota,
    });

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const questions = pool.slice(0, limit);
    if (req.userId && questions.length > 0) {
      quota = await consumePremiumExamQuota(req.userId);
    }
    res.json({ questions, limit, totalAvailable: pool.length, quota });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/start", optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    let quota = null;
    if (req.userId) {
      try {
        await assertPremiumExamQuota(req.userId);
      } catch (err) {
        if (err instanceof ExamQuotaExceededError) {
          return res.status(429).json({
            message: "Exam quota exceeded for your Premium plan",
            code: "EXAM_QUOTA_EXCEEDED",
            quota: err.status,
          });
        }
        throw err;
      }
    }

    const limit = 20;
    const questions = await Question.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $sample: { size: limit } },
    ]);
    if (req.userId && questions.length > 0) {
      quota = await consumePremiumExamQuota(req.userId);
    }
    res.json({ questions, limit, quota });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/quota", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const access = await getPremiumAccess(req.userId);
    if (!access.isPremium) {
      return res.json({ applies: false });
    }
    const quota = await getExamQuotaStatus(req.userId);
    res.json(quota);
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


