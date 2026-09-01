import mongoose, { Schema, Document } from "mongoose";

export type ReadinessBand = "beginner" | "learning" | "improving" | "strong" | "ready";

export interface ReadinessConfig {
  recentPerformanceWeight: number;
  topicMasteryWeight: number;
  consistencyWeight: number;
  mistakeRecoveryWeight: number;
  mockPerformanceWeight: number;
  bandBeginnerMax: number;
  bandLearningMax: number;
  bandImprovingMax: number;
  bandStrongMax: number;
}

export interface BattleConfig {
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
}

export interface LeaderboardConfig {
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
}

export interface GamificationConfig {
  enabled: boolean;
  streakEnabled: boolean;
  achievementsEnabled: boolean;
}

export interface PremiumFeaturesConfig {
  analyse: boolean;
  learn: boolean;
  smartPractice: boolean;
  roadSignAcademy: boolean;
  scenarioLearning: boolean;
  spacedRepetition: boolean;
  learningJourney: boolean;
  myMistakes: boolean;
  autoEcole: boolean;
  battle: boolean;
  leaderboard: boolean;
}

export interface PaywallConfig {
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
}

export interface PlatformSettingsDocument extends Document {
  readiness: ReadinessConfig;
  battle: BattleConfig;
  leaderboard: LeaderboardConfig;
  gamification: GamificationConfig;
  premiumFeatures: PremiumFeaturesConfig;
  paywall: PaywallConfig;
  masteryBandBeginnerMax: number;
  masteryBandLearningMax: number;
  masteryBandImprovingMax: number;
  masteryBandStrongMax: number;
  smartPracticeMistakeWeight: number;
  smartPracticeWeakTopicWeight: number;
  smartPracticeNewQuestionWeight: number;
  smartPracticeMasteredWeight: number;
  dailyPlanMaxMinutes: number;
  updatedAt: Date;
}

const readinessSchema = new Schema<ReadinessConfig>(
  {
    recentPerformanceWeight: { type: Number, default: 30, min: 0, max: 100 },
    topicMasteryWeight: { type: Number, default: 25, min: 0, max: 100 },
    consistencyWeight: { type: Number, default: 20, min: 0, max: 100 },
    mistakeRecoveryWeight: { type: Number, default: 15, min: 0, max: 100 },
    mockPerformanceWeight: { type: Number, default: 10, min: 0, max: 100 },
    bandBeginnerMax: { type: Number, default: 39, min: 0, max: 100 },
    bandLearningMax: { type: Number, default: 59, min: 0, max: 100 },
    bandImprovingMax: { type: Number, default: 79, min: 0, max: 100 },
    bandStrongMax: { type: Number, default: 89, min: 0, max: 100 },
  },
  { _id: false }
);

const battleSchema = new Schema<BattleConfig>(
  {
    enabled: { type: Boolean, default: true },
    maxBattlesPerDay: { type: Number, default: 20, min: 1 },
    defaultQuestionCount: { type: Number, default: 10, min: 5, max: 50 },
    minQuestionsForRanking: { type: Number, default: 5, min: 1 },
    challengeExpiryHours: { type: Number, default: 48, min: 1 },
    quickDuelEnabled: { type: Boolean, default: true },
    friendChallengeEnabled: { type: Boolean, default: true },
    topicBattleEnabled: { type: Boolean, default: true },
    classBattleEnabled: { type: Boolean, default: true },
    weeklyArenaEnabled: { type: Boolean, default: true },
    pointsCorrect: { type: Number, default: 10, min: 0 },
    pointsWrong: { type: Number, default: 0, min: 0 },
    pointsSpeedBonus: { type: Number, default: 2, min: 0 },
    consumeExamQuota: { type: Boolean, default: false },
    maxPlayers: { type: Number, default: 8, min: 2, max: 20 },
    minPlayers: { type: Number, default: 2, min: 1, max: 20 },
    durationSeconds: { type: Number, default: 600, min: 60, max: 3600 },
    groupEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const leaderboardSchema = new Schema<LeaderboardConfig>(
  {
    enabled: { type: Boolean, default: true },
    optInRequired: { type: Boolean, default: true },
    improvementWeight: { type: Number, default: 40, min: 0, max: 100 },
    masteryWeight: { type: Number, default: 35, min: 0, max: 100 },
    consistencyWeight: { type: Number, default: 25, min: 0, max: 100 },
    maxPointsPerDay: { type: Number, default: 500, min: 0 },
    weeklyEnabled: { type: Boolean, default: true },
    monthlyEnabled: { type: Boolean, default: true },
    friendsEnabled: { type: Boolean, default: true },
    schoolEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const gamificationSchema = new Schema<GamificationConfig>(
  {
    enabled: { type: Boolean, default: true },
    streakEnabled: { type: Boolean, default: true },
    achievementsEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const premiumFeaturesSchema = new Schema<PremiumFeaturesConfig>(
  {
    analyse: { type: Boolean, default: true },
    learn: { type: Boolean, default: true },
    smartPractice: { type: Boolean, default: true },
    roadSignAcademy: { type: Boolean, default: true },
    scenarioLearning: { type: Boolean, default: true },
    spacedRepetition: { type: Boolean, default: true },
    learningJourney: { type: Boolean, default: true },
    myMistakes: { type: Boolean, default: true },
    autoEcole: { type: Boolean, default: true },
    battle: { type: Boolean, default: true },
    leaderboard: { type: Boolean, default: true },
  },
  { _id: false }
);

const paywallSchema = new Schema<PaywallConfig>(
  {
    headline: { type: String, default: "UNLOCK YOUR FULL PREPARATION" },
    subheadline: {
      type: String,
      default: "Personal analysis, smart practice, battles, and readiness tracking.",
    },
    bulletPoints: {
      type: [String],
      default: [
        "Personal weakness analysis",
        "Smart practice",
        "Learn from your mistakes",
        "Road Sign Academy",
        "Readiness Score",
        "Learning Journey",
        "Battles & Leaderboards",
        "Auto-école features",
      ],
    },
    ctaLabel: { type: String, default: "Upgrade to Premium" },
    storyHeadline: {
      type: String,
      default: "Learners who compete and review mistakes pass faster.",
    },
    requestHint: {
      type: String,
      default: "Premium is activated by your admin or auto-école. Sign in, then ask them to grant a plan.",
    },
    featuredPlanSlug: { type: String, default: "monthly" },
    socialProof: {
      type: [String],
      default: [
        "Live battles make revision feel like a real exam — with friends.",
        "See exactly which topics cost you marks, then practice those first.",
        "Same 20-question mock you already know, plus a coach for the rest.",
      ],
    },
    freeList: {
      type: [String],
      default: ["Timed 20-question mock exam", "Instant results after submit", "Offline packs on this device"],
    },
    premiumList: {
      type: [String],
      default: [
        "Live 1v1 and group battles",
        "Personal Analyse & readiness score",
        "Smart practice from your mistakes",
        "Exam quota based on your plan",
      ],
    },
  },
  { _id: false }
);

const PlatformSettingsSchema = new Schema<PlatformSettingsDocument>(
  {
    readiness: { type: readinessSchema, default: () => ({}) },
    battle: { type: battleSchema, default: () => ({}) },
    leaderboard: { type: leaderboardSchema, default: () => ({}) },
    gamification: { type: gamificationSchema, default: () => ({}) },
    premiumFeatures: { type: premiumFeaturesSchema, default: () => ({}) },
    paywall: { type: paywallSchema, default: () => ({}) },
    masteryBandBeginnerMax: { type: Number, default: 39 },
    masteryBandLearningMax: { type: Number, default: 59 },
    masteryBandImprovingMax: { type: Number, default: 79 },
    masteryBandStrongMax: { type: Number, default: 89 },
    smartPracticeMistakeWeight: { type: Number, default: 100 },
    smartPracticeWeakTopicWeight: { type: Number, default: 80 },
    smartPracticeNewQuestionWeight: { type: Number, default: 50 },
    smartPracticeMasteredWeight: { type: Number, default: 10 },
    dailyPlanMaxMinutes: { type: Number, default: 30 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const PlatformSettings = mongoose.model<PlatformSettingsDocument>(
  "PlatformSettings",
  PlatformSettingsSchema
);
