import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { requirePremium, type PremiumRequest } from "../middleware/requirePremium";
import { getPremiumAccess, listActivePlans } from "../services/premiumAccessService";
import { getExamQuotaStatus } from "../services/examQuotaService";
import { getPlatformSettings } from "../services/platformSettingsService";
import { pickSmartPracticeQuestions } from "../services/smartPracticeService";
import { buildAnalyse, buildMistakes } from "../services/analyseService";
import {
  BattleError,
  createBattle,
  joinBattle,
  getBattle,
  startBattle,
  answerBattle,
  finishBattle,
} from "../services/battleService";

const router = Router();

// Public: active plans for paywall/pricing (no auth)
router.get("/plans", async (_req, res) => {
  try {
    const plans = await listActivePlans();
    res.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        currency: p.currency,
        duration: p.duration,
        durationUnit: p.durationUnit,
        examQuota: p.examQuota,
        examQuotaPeriod: p.examQuotaPeriod,
        features: p.features,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public paywall copy (admin-configurable)
router.get("/paywall", async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json({
      paywall: settings.paywall,
      premiumFeatures: settings.premiumFeatures,
      battle: {
        enabled: settings.battle.enabled && settings.premiumFeatures.battle,
        quickDuelEnabled: settings.battle.quickDuelEnabled,
        groupEnabled: settings.battle.groupEnabled ?? settings.battle.classBattleEnabled,
        defaultQuestionCount: settings.battle.defaultQuestionCount,
        durationSeconds: settings.battle.durationSeconds ?? 600,
        maxPlayers: settings.battle.maxPlayers ?? 8,
        minPlayers: settings.battle.minPlayers ?? 2,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Authenticated: current user's premium status + quota
router.get("/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const access = await getPremiumAccess(req.userId);
    let quota = null;
    if (access.isPremium && req.userId) {
      quota = await getExamQuotaStatus(req.userId);
    }
    res.json({ access, quota });
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
      return res.json({ applies: false, message: "Quota applies to Premium subscribers only" });
    }
    const quota = await getExamQuotaStatus(req.userId);
    res.json(quota);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard", authMiddleware, requirePremium(), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const analyse = await buildAnalyse(req.userId);
    res.json({
      access: req.premiumAccess,
      readiness: analyse.readiness,
      nextMove: analyse.nextMove,
      totals: analyse.totals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analyse", authMiddleware, requirePremium("analyse"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const data = await buildAnalyse(req.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/practice/smart", authMiddleware, requirePremium("smartPractice"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const limit = Math.min(Number(req.query.limit) || 15, 30);
    const questions = await pickSmartPracticeQuestions(req.userId, limit);
    res.json({ questions, limit: questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/mistakes", authMiddleware, requirePremium("myMistakes"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const data = await buildMistakes(req.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

function handleBattleError(err: unknown, res: import("express").Response) {
  if (err instanceof BattleError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ message: "Server error" });
}

router.post("/battles", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const mode = req.body?.mode === "group" ? "group" : "duel";
    const room = await createBattle(req.userId, mode);
    res.status(201).json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

router.post("/battles/join", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const code = String(req.body?.code || "");
    const room = await joinBattle(req.userId, code);
    res.json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

router.get("/battles/:code", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const room = await getBattle(req.userId, String(req.params.code));
    res.json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

router.post("/battles/:code/start", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const room = await startBattle(req.userId, String(req.params.code));
    res.json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

router.post("/battles/:code/answer", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const room = await answerBattle(
      req.userId,
      String(req.params.code),
      Number(req.body?.questionId),
      String(req.body?.selected || "")
    );
    res.json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

router.post("/battles/:code/finish", authMiddleware, requirePremium("battle"), async (req: PremiumRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
    const room = await finishBattle(req.userId, String(req.params.code));
    res.json(room);
  } catch (err) {
    handleBattleError(err, res);
  }
});

export default router;
