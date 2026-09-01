import { api } from "./http";
import type { PremiumAccessInfo, QuotaStatus } from "./premiumApi";

export type PremiumPlan = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: "days" | "weeks" | "months";
  examQuota: number;
  examQuotaPeriod: "daily" | "weekly" | "monthly" | "subscription_period" | "unlimited";
  features: string[];
  active: boolean;
  sortOrder: number;
};

export type PlatformSettings = {
  readiness: {
    recentPerformanceWeight: number;
    topicMasteryWeight: number;
    consistencyWeight: number;
    mistakeRecoveryWeight: number;
    mockPerformanceWeight: number;
    bandBeginnerMax: number;
    bandLearningMax: number;
    bandImprovingMax: number;
    bandStrongMax: number;
  };
  battle: {
    enabled: boolean;
    maxBattlesPerDay: number;
    defaultQuestionCount: number;
    minQuestionsForRanking: number;
    challengeExpiryHours: number;
    quickDuelEnabled: boolean;
    friendChallengeEnabled: boolean;
    topicBattleEnabled: boolean;
    classBattleEnabled: boolean;
    weeklyArenaEnabled: boolean;
    pointsCorrect: number;
    pointsWrong: number;
    pointsSpeedBonus: number;
    consumeExamQuota: boolean;
    maxPlayers: number;
    minPlayers: number;
    durationSeconds: number;
    groupEnabled: boolean;
  };
  leaderboard: {
    enabled: boolean;
    optInRequired: boolean;
    improvementWeight: number;
    masteryWeight: number;
    consistencyWeight: number;
    maxPointsPerDay: number;
    weeklyEnabled: boolean;
    monthlyEnabled: boolean;
    friendsEnabled: boolean;
    schoolEnabled: boolean;
  };
  gamification: {
    enabled: boolean;
    streakEnabled: boolean;
    achievementsEnabled: boolean;
  };
  premiumFeatures: Record<string, boolean>;
  paywall: {
    headline: string;
    subheadline: string;
    bulletPoints: string[];
    ctaLabel: string;
    storyHeadline: string;
    requestHint: string;
    featuredPlanSlug: string;
    socialProof: string[];
    freeList: string[];
    premiumList: string[];
  };
  masteryBandBeginnerMax: number;
  masteryBandLearningMax: number;
  masteryBandImprovingMax: number;
  masteryBandStrongMax: number;
  smartPracticeMistakeWeight: number;
  smartPracticeWeakTopicWeight: number;
  smartPracticeNewQuestionWeight: number;
  smartPracticeMasteredWeight: number;
  dailyPlanMaxMinutes: number;
};

export type QuotaAnalyticsRow = {
  plan: { id: string; name: string; examQuota: number; examQuotaPeriod: string };
  activeSubscribers: number;
  totalConsumed: number;
  avgPerUser: number;
  highUsageUsers: number;
  lowUsageUsers: number;
};

export async function adminPremiumPlansApi() {
  const res = await api.get<PremiumPlan[]>("/admin/premium/plans");
  return res.data;
}

export async function adminCreatePremiumPlanApi(data: Partial<PremiumPlan>) {
  const res = await api.post<PremiumPlan>("/admin/premium/plans", data);
  return res.data;
}

export async function adminUpdatePremiumPlanApi(id: string, data: Partial<PremiumPlan>) {
  const res = await api.put<PremiumPlan>(`/admin/premium/plans/${id}`, data);
  return res.data;
}

export async function adminDeletePremiumPlanApi(id: string) {
  const res = await api.delete<{ message: string }>(`/admin/premium/plans/${id}`);
  return res.data;
}

export async function adminGrantSubscriptionApi(data: {
  userId: string;
  planId: string;
  status?: "active" | "trial";
  notes?: string;
}) {
  const res = await api.post("/admin/premium/subscriptions/grant", data);
  return res.data;
}

export async function adminPlatformSettingsApi() {
  const res = await api.get<PlatformSettings>("/admin/platform-settings");
  return res.data;
}

export async function adminUpdatePlatformSettingsApi(data: Partial<PlatformSettings>) {
  const res = await api.put<PlatformSettings>("/admin/platform-settings", data);
  return res.data;
}

export async function adminQuotaAnalyticsApi() {
  const res = await api.get<QuotaAnalyticsRow[]>("/admin/premium/quota-analytics");
  return res.data;
}

export async function adminUserQuotaApi(userId: string) {
  const res = await api.get<{ access: PremiumAccessInfo; quota: QuotaStatus }>(
    `/admin/premium/users/${userId}/quota`
  );
  return res.data;
}
