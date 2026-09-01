import { api } from "./http";

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
    examQuotaPeriod: string;
    features: string[];
    expiresAt: string;
  };
};

export type QuotaStatus = {
  applies: boolean;
  unlimited: boolean;
  limit: number;
  used: number;
  remaining: number;
  period: string;
  periodKey: string;
  periodLabel: string;
  resetsAt?: string;
};

export type PremiumPlanPublic = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: string;
  examQuota: number;
  examQuotaPeriod: string;
  features: string[];
};

export type PaywallContent = {
  paywall: {
    headline: string;
    subheadline: string;
    bulletPoints: string[];
    ctaLabel: string;
    storyHeadline?: string;
    requestHint?: string;
    featuredPlanSlug?: string;
    socialProof?: string[];
    freeList?: string[];
    premiumList?: string[];
  };
  premiumFeatures: Record<string, boolean>;
  battle?: {
    enabled: boolean;
    quickDuelEnabled: boolean;
    groupEnabled: boolean;
    defaultQuestionCount: number;
    durationSeconds: number;
    maxPlayers: number;
    minPlayers: number;
  };
};

export async function premiumStatusApi() {
  const res = await api.get<{ access: PremiumAccessInfo; quota: QuotaStatus | null }>("/premium/status");
  return res.data;
}

export async function premiumPlansPublicApi() {
  const res = await api.get<PremiumPlanPublic[]>("/premium/plans");
  return res.data;
}

export async function premiumPaywallApi() {
  const res = await api.get<PaywallContent>("/premium/paywall");
  return res.data;
}

export async function examQuotaApi() {
  const res = await api.get<QuotaStatus>("/exams/quota");
  return res.data;
}

export type AnalyseResponse = {
  totals: {
    examCount: number;
    averageScore: number;
    bestScore: number;
    accuracy: number;
    questionsAnswered: number;
    correctAnswers: number;
    wrongAnswers: number;
    improvement: number;
  };
  recent: Array<{
    id: string;
    createdAt: string;
    mode: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    durationSeconds: number;
  }>;
  readiness: {
    score: number;
    band: string;
    bandLabel: string;
    disclaimer: string;
  };
  topics: Array<{
    topic: string;
    attempted: number;
    correct: number;
    wrong: number;
    accuracy: number;
    mastery: number;
    lastSeenAt: string | null;
    status: string;
  }>;
  weakTopics: Array<{ topic: string; mastery: number; attempted: number }>;
  strongTopics: Array<{ topic: string; mastery: number; attempted: number }>;
  frequentlyMissed: Array<{
    questionId: number;
    missedCount: number;
    lastMissedAt: string;
    lastSelected: string | null;
    correct: string;
    question?: string;
    explanation?: string;
    topic?: string;
  }>;
  nextMove: {
    topic: string;
    mastery: number;
    attempted: number;
    recommended: string;
    cta: string;
  };
};

export async function premiumAnalyseApi() {
  const res = await api.get<AnalyseResponse>("/premium/analyse");
  return res.data;
}

export async function premiumSmartPracticeApi(limit = 15) {
  const res = await api.get<{
    questions: Array<{
      id: number;
      question: string;
      options: { a: string; b: string; c: string; d: string };
      correct: "a" | "b" | "c" | "d";
      explanation?: string;
      imageUrl?: string;
      topic?: string;
    }>;
    limit: number;
  }>("/premium/practice/smart", { params: { limit } });
  return res.data;
}

export async function premiumMistakesApi() {
  const res = await api.get<{
    items: AnalyseResponse["frequentlyMissed"];
    total: number;
  }>("/premium/mistakes");
  return res.data;
}

export type SubmitExamPayload = {
  mode?: "timed" | "practice";
  startedAt: string;
  completedAt: string;
  answers: Array<{ questionId: number; selected: "a" | "b" | "c" | "d" | null }>;
};

export async function submitExamApi(payload: SubmitExamPayload) {
  const res = await api.post("/exams/submit", payload);
  return res.data;
}
