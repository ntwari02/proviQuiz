import { PlatformSettings, type PlatformSettingsDocument } from "../models/PlatformSettings";

let cached: PlatformSettingsDocument | null = null;
let cacheAt = 0;
const CACHE_MS = 30_000;

export async function getPlatformSettings(): Promise<PlatformSettingsDocument> {
  const now = Date.now();
  if (cached && now - cacheAt < CACHE_MS) return cached;

  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  cached = settings;
  cacheAt = now;
  return settings;
}

export function invalidatePlatformSettingsCache() {
  cached = null;
  cacheAt = 0;
}

export async function updatePlatformSettings(
  patch: Partial<PlatformSettingsDocument>
): Promise<PlatformSettingsDocument> {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create(patch as any);
  } else {
    const topKeys = [
      "readiness",
      "battle",
      "leaderboard",
      "gamification",
      "premiumFeatures",
      "paywall",
      "masteryBandBeginnerMax",
      "masteryBandLearningMax",
      "masteryBandImprovingMax",
      "masteryBandStrongMax",
      "smartPracticeMistakeWeight",
      "smartPracticeWeakTopicWeight",
      "smartPracticeNewQuestionWeight",
      "smartPracticeMasteredWeight",
      "dailyPlanMaxMinutes",
    ] as const;

    for (const key of topKeys) {
      const val = (patch as any)[key];
      if (val === undefined) continue;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        (settings as any)[key] = { ...(settings as any)[key]?.toObject?.() ?? (settings as any)[key], ...val };
      } else {
        (settings as any)[key] = val;
      }
    }
    await settings.save();
  }
  invalidatePlatformSettingsCache();
  return settings;
}

export type PremiumFeatureKey = keyof PlatformSettingsDocument["premiumFeatures"];

export async function isPremiumFeatureEnabled(feature: PremiumFeatureKey): Promise<boolean> {
  const settings = await getPlatformSettings();
  return Boolean(settings.premiumFeatures?.[feature]);
}
