import type { Types } from "mongoose";
import { PremiumPlan, type PremiumPlanDocument, type ExamQuotaPeriod } from "../models/PremiumPlan";
import { UserSubscription } from "../models/UserSubscription";

export type AccessTier = "free" | "trial" | "premium" | "expired";

export type PremiumAccessInfo = {
  tier: AccessTier;
  isPremium: boolean;
  subscriptionId?: string;
  plan?: {
    id: string;
    name: string;
    slug: string;
    examQuota: number;
    examQuotaPeriod: ExamQuotaPeriod;
    features: string[];
    expiresAt: string;
  };
};

function toId(value: Types.ObjectId | string | undefined): string | undefined {
  if (!value) return undefined;
  return String(value);
}

export async function getActiveSubscription(userId: string) {
  const now = new Date();
  const sub = await UserSubscription.findOne({
    user: userId,
    status: { $in: ["active", "trial"] },
    expiresAt: { $gt: now },
  })
    .sort({ expiresAt: -1 })
    .populate<{ plan: PremiumPlanDocument }>("plan");

  if (!sub) return null;

  if (sub.expiresAt <= now) {
    sub.status = "expired";
    await sub.save();
    return null;
  }

  return sub;
}

export async function getPremiumAccess(userId?: string | null): Promise<PremiumAccessInfo> {
  if (!userId) {
    return { tier: "free", isPremium: false };
  }

  const sub = await getActiveSubscription(userId);
  if (!sub || !sub.plan) {
    const expired = await UserSubscription.findOne({
      user: userId,
      status: { $in: ["expired", "cancelled"] },
    }).sort({ expiresAt: -1 });

    if (expired) {
      return { tier: "expired", isPremium: false };
    }
    return { tier: "free", isPremium: false };
  }

  const plan = sub.plan as PremiumPlanDocument;
  const tier: AccessTier = sub.status === "trial" ? "trial" : "premium";

  return {
    tier,
    isPremium: tier === "premium" || tier === "trial",
    subscriptionId: sub.id,
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      examQuota: plan.examQuota,
      examQuotaPeriod: plan.examQuotaPeriod,
      features: plan.features ?? [],
      expiresAt: sub.expiresAt.toISOString(),
    },
  };
}

export async function grantSubscription(input: {
  userId: string;
  planId: string;
  grantedBy?: string;
  notes?: string;
  status?: "active" | "trial";
  paymentReference?: string;
}) {
  const plan = await PremiumPlan.findById(input.planId);
  if (!plan || !plan.active) {
    throw new Error("Plan not found or inactive");
  }

  const startedAt = new Date();
  const expiresAt = addDuration(startedAt, plan.duration, plan.durationUnit);

  await UserSubscription.updateMany(
    { user: input.userId, status: { $in: ["active", "trial"] } },
    { $set: { status: "cancelled", cancelledAt: new Date() } }
  );

  return UserSubscription.create({
    user: input.userId,
    plan: plan.id,
    status: input.status ?? "active",
    startedAt,
    expiresAt,
    grantedBy: input.grantedBy,
    notes: input.notes,
    paymentReference: input.paymentReference,
  });
}

function addDuration(from: Date, duration: number, unit: "days" | "weeks" | "months"): Date {
  const d = new Date(from);
  if (unit === "days") d.setDate(d.getDate() + duration);
  else if (unit === "weeks") d.setDate(d.getDate() + duration * 7);
  else d.setMonth(d.getMonth() + duration);
  return d;
}

export async function listActivePlans() {
  return PremiumPlan.find({ active: true }).sort({ sortOrder: 1, price: 1 });
}

export { toId };
