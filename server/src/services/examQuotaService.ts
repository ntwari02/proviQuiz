import type { ExamQuotaPeriod } from "../models/PremiumPlan";
import { PremiumExamUsage } from "../models/PremiumExamUsage";
import { getActiveSubscription } from "./premiumAccessService";

export type QuotaStatus = {
  applies: boolean;
  unlimited: boolean;
  limit: number;
  used: number;
  remaining: number;
  period: ExamQuotaPeriod;
  periodKey: string;
  periodLabel: string;
  resetsAt?: string;
};

export function getPeriodKey(period: ExamQuotaPeriod, at: Date = new Date(), subscriptionStart?: Date): string {
  const y = at.getUTCFullYear();
  const m = String(at.getUTCMonth() + 1).padStart(2, "0");
  const d = String(at.getUTCDate()).padStart(2, "0");

  if (period === "unlimited") return "unlimited";
  if (period === "daily") return `day:${y}-${m}-${d}`;
  if (period === "monthly") return `month:${y}-${m}`;

  if (period === "weekly") {
    const { year, week } = getIsoWeek(at);
    return `week:${year}-W${String(week).padStart(2, "0")}`;
  }

  if (period === "subscription_period" && subscriptionStart) {
    const start = subscriptionStart.toISOString().slice(0, 10);
    return `sub:${start}`;
  }

  return `month:${y}-${m}`;
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function getPeriodLabel(period: ExamQuotaPeriod): string {
  switch (period) {
    case "daily":
      return "today";
    case "weekly":
      return "this week";
    case "monthly":
      return "this month";
    case "subscription_period":
      return "this subscription period";
    case "unlimited":
      return "unlimited";
    default:
      return "period";
  }
}

export function getResetsAt(period: ExamQuotaPeriod, at: Date = new Date()): Date | undefined {
  if (period === "unlimited") return undefined;

  const next = new Date(at);
  if (period === "daily") {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  if (period === "weekly") {
    const day = next.getUTCDay() || 7;
    next.setUTCDate(next.getUTCDate() + (8 - day));
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  if (period === "monthly") {
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  return undefined;
}

export async function getExamQuotaStatus(userId: string): Promise<QuotaStatus> {
  const sub = await getActiveSubscription(userId);
  if (!sub?.plan) {
    return {
      applies: false,
      unlimited: true,
      limit: 0,
      used: 0,
      remaining: 0,
      period: "unlimited",
      periodKey: "none",
      periodLabel: "not applicable",
    };
  }

  const plan = sub.plan as any;
  const period: ExamQuotaPeriod = plan.examQuotaPeriod ?? "monthly";

  if (period === "unlimited" || plan.examQuota === 0) {
    return {
      applies: true,
      unlimited: true,
      limit: 0,
      used: 0,
      remaining: -1,
      period,
      periodKey: "unlimited",
      periodLabel: "unlimited",
    };
  }

  const periodKey = getPeriodKey(period, new Date(), sub.startedAt);
  const used = await PremiumExamUsage.countDocuments({ user: userId, periodKey });
  const limit = plan.examQuota;
  const remaining = Math.max(0, limit - used);
  const resets = getResetsAt(period);

  return {
    applies: true,
    unlimited: false,
    limit,
    used,
    remaining,
    period,
    periodKey,
    periodLabel: getPeriodLabel(period),
    resetsAt: resets?.toISOString(),
  };
}

export class ExamQuotaExceededError extends Error {
  status: QuotaStatus;
  constructor(status: QuotaStatus) {
    super("Exam quota exceeded for current period");
    this.name = "ExamQuotaExceededError";
    this.status = status;
  }
}

export async function consumeExamQuota(userId: string): Promise<QuotaStatus> {
  const status = await getExamQuotaStatus(userId);
  if (!status.applies) return status;
  if (status.unlimited) return status;
  if (status.remaining <= 0) throw new ExamQuotaExceededError(status);

  await PremiumExamUsage.create({
    user: userId,
    periodKey: status.periodKey,
    consumedAt: new Date(),
  });

  return getExamQuotaStatus(userId);
}

export async function assertCanStartExam(userId: string): Promise<QuotaStatus | null> {
  const sub = await getActiveSubscription(userId);
  if (!sub) return null;
  const status = await getExamQuotaStatus(userId);
  if (status.applies && !status.unlimited && status.remaining <= 0) {
    throw new ExamQuotaExceededError(status);
  }
  return status;
}
