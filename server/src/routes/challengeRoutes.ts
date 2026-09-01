import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { optionalAuthMiddleware } from "../middleware/optionalAuth";
import {
  getDailyChallenge,
  submitDailyChallenge,
  dailyBoard,
  setExamDate,
} from "../services/dailyChallengeService";

const router = Router();

router.get("/today", optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = await getDailyChallenge(req.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/today/submit", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const data = await submitDailyChallenge(req.userId, answers);
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(err?.status || 500).json({ message: err?.message ?? "Server error" });
  }
});

router.get("/today/board", optionalAuthMiddleware, async (_req, res) => {
  try {
    const data = await dailyBoard();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/exam-date", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const examDate = req.body?.examDate ? String(req.body.examDate) : null;
    const data = await setExamDate(req.userId, examDate);
    res.json(data);
  } catch (err: any) {
    res.status(err?.status || 500).json({ message: err?.message ?? "Server error" });
  }
});

export default router;
