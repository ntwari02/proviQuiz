import { PremiumPlan } from "../models/PremiumPlan";

const DEFAULT_PLANS = [
  {
    name: "Premium Weekly",
    slug: "premium-weekly",
    description: "Full Premium access for one week",
    price: 1000,
    currency: "RWF",
    duration: 7,
    durationUnit: "days" as const,
    examQuota: 20,
    examQuotaPeriod: "weekly" as const,
    features: ["analyse", "learn", "smartPractice", "battle", "leaderboard"],
    active: true,
    sortOrder: 1,
  },
  {
    name: "Premium Monthly",
    slug: "premium-monthly",
    description: "Full Premium access for one month",
    price: 3000,
    currency: "RWF",
    duration: 30,
    durationUnit: "days" as const,
    examQuota: 100,
    examQuotaPeriod: "monthly" as const,
    features: ["analyse", "learn", "smartPractice", "myMistakes", "battle", "leaderboard", "autoEcole"],
    active: true,
    sortOrder: 2,
  },
  {
    name: "Premium Unlimited",
    slug: "premium-unlimited",
    description: "Unlimited mock exams plus all Premium features",
    price: 5000,
    currency: "RWF",
    duration: 30,
    durationUnit: "days" as const,
    examQuota: 0,
    examQuotaPeriod: "unlimited" as const,
    features: ["analyse", "learn", "smartPractice", "myMistakes", "battle", "leaderboard", "autoEcole", "roadSignAcademy"],
    active: true,
    sortOrder: 3,
  },
];

export async function ensureDefaultPremiumPlans() {
  const count = await PremiumPlan.countDocuments();
  if (count > 0) return;

  await PremiumPlan.insertMany(DEFAULT_PLANS);
  console.log("[seed] Created default Premium plans");
}
