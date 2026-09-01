import { Router } from "express";
import { z } from "zod";
import { PremiumPlan } from "../models/PremiumPlan";
import { UserSubscription } from "../models/UserSubscription";
import { PremiumExamUsage } from "../models/PremiumExamUsage";
import { User } from "../models/User";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { grantSubscription, getPremiumAccess } from "../services/premiumAccessService";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "../services/platformSettingsService";
import { getExamQuotaStatus } from "../services/examQuotaService";

const router = Router();
router.use(authMiddleware, requireRole(["admin", "superadmin"]));

const planSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(3).max(3).default("RWF"),
  duration: z.number().int().positive(),
  durationUnit: z.enum(["days", "weeks", "months"]).default("days"),
  examQuota: z.number().int().min(0),
  examQuotaPeriod: z.enum(["daily", "weekly", "monthly", "subscription_period", "unlimited"]),
  features: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ─── Premium Plans ───────────────────────────────────────────────────────────

router.get("/premium/plans", async (_req, res) => {
  try {
    const plans = await PremiumPlan.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/premium/plans", async (req: AuthRequest, res) => {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const plan = await PremiumPlan.create(parsed.data);
    res.status(201).json(plan);
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ message: "Plan slug already exists" });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/premium/plans/:id", async (req: AuthRequest, res) => {
  try {
    const parsed = planSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const plan = await PremiumPlan.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ message: "Plan slug already exists" });
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/premium/plans/:id", async (req: AuthRequest, res) => {
  try {
    const activeSubs = await UserSubscription.countDocuments({
      plan: req.params.id,
      status: { $in: ["active", "trial"] },
      expiresAt: { $gt: new Date() },
    });
    if (activeSubs > 0) {
      return res.status(400).json({
        message: "Cannot delete plan with active subscriptions. Deactivate instead.",
        activeSubscriptions: activeSubs,
      });
    }
    const plan = await PremiumPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Subscriptions (manual grant) ────────────────────────────────────────────

const grantSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["active", "trial"]).optional(),
  notes: z.string().optional(),
  paymentReference: z.string().optional(),
});

router.post("/premium/subscriptions/grant", async (req: AuthRequest, res) => {
  try {
    const parsed = grantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const user = await User.findById(parsed.data.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const sub = await grantSubscription({
      userId: parsed.data.userId,
      planId: parsed.data.planId,
      grantedBy: req.userId,
      status: parsed.data.status,
      notes: parsed.data.notes,
      paymentReference: parsed.data.paymentReference,
    });

    res.status(201).json(sub);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ message: err?.message ?? "Grant failed" });
  }
});

router.get("/premium/subscriptions", async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const [items, total] = await Promise.all([
      UserSubscription.find()
        .populate("user", "email name role")
        .populate("plan", "name slug price currency examQuota examQuotaPeriod")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserSubscription.countDocuments(),
    ]);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/premium/subscriptions/:id/cancel", async (req: AuthRequest, res) => {
  try {
    const sub = await UserSubscription.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled", cancelledAt: new Date() },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json(sub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Platform Settings (admin-configurable ecosystem) ──────────────────────

router.get("/platform-settings", async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/platform-settings", async (req: AuthRequest, res) => {
  try {
    const settings = await updatePlatformSettings(req.body);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Quota analytics ─────────────────────────────────────────────────────────

router.get("/premium/quota-analytics", async (_req: AuthRequest, res) => {
  try {
    const plans = await PremiumPlan.find({ active: true });
    const results = [];

    for (const plan of plans) {
      const subs = await UserSubscription.find({
        plan: plan._id,
        status: { $in: ["active", "trial"] },
        expiresAt: { $gt: new Date() },
      }).select("user");

      const userIds = subs.map((s) => s.user);
      let usageStats = { totalConsumed: 0, avgPerUser: 0, highUsageUsers: 0, lowUsageUsers: 0 };

      if (userIds.length > 0) {
        const usageByUser = await PremiumExamUsage.aggregate([
          { $match: { user: { $in: userIds } } },
          { $group: { _id: "$user", count: { $sum: 1 } } },
        ]);

        const counts = usageByUser.map((u) => u.count as number);
        const totalConsumed = counts.reduce((a, b) => a + b, 0);
        const avgPerUser = userIds.length > 0 ? totalConsumed / userIds.length : 0;
        const threshold = plan.examQuotaPeriod === "unlimited" ? 50 : plan.examQuota * 0.8;

        usageStats = {
          totalConsumed,
          avgPerUser: Math.round(avgPerUser * 10) / 10,
          highUsageUsers: counts.filter((c) => c >= threshold).length,
          lowUsageUsers: counts.filter((c) => c <= Math.max(1, threshold * 0.2)).length,
        };
      }

      results.push({
        plan: {
          id: String(plan._id),
          name: plan.name,
          examQuota: plan.examQuota,
          examQuotaPeriod: plan.examQuotaPeriod,
        },
        activeSubscribers: userIds.length,
        ...usageStats,
      });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/premium/users/:userId/quota", async (req: AuthRequest, res) => {
  try {
    const access = await getPremiumAccess(req.params.userId as string);
    const quota = await getExamQuotaStatus(req.params.userId as string);
    res.json({ access, quota });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
