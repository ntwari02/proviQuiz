import type { ReadinessConfig } from "../models/PlatformSettings";

export type ReadinessBand = "beginner" | "learning" | "improving" | "strong" | "ready";

export type ReadinessInput = {
  recentAccuracy: number;
  overallAccuracy: number;
  topicMasteryAvg: number;
  consistency: number;
  mistakeRecovery: number;
  mockAccuracy: number;
};

export function bandForScore(score: number, cfg: ReadinessConfig): ReadinessBand {
  if (score <= cfg.bandBeginnerMax) return "beginner";
  if (score <= cfg.bandLearningMax) return "learning";
  if (score <= cfg.bandImprovingMax) return "improving";
  if (score <= cfg.bandStrongMax) return "strong";
  return "ready";
}

export function bandLabel(band: ReadinessBand): string {
  switch (band) {
    case "ready":
      return "READY";
    case "strong":
      return "STRONG";
    case "improving":
      return "IMPROVING";
    case "learning":
      return "LEARNING";
    default:
      return "BEGINNER";
  }
}

export function computeReadinessScore(input: ReadinessInput, cfg: ReadinessConfig) {
  const totalWeight =
    cfg.recentPerformanceWeight +
    cfg.topicMasteryWeight +
    cfg.consistencyWeight +
    cfg.mistakeRecoveryWeight +
    cfg.mockPerformanceWeight;

  const denom = totalWeight > 0 ? totalWeight : 100;
  const weighted =
    (input.recentAccuracy * cfg.recentPerformanceWeight +
      input.topicMasteryAvg * cfg.topicMasteryWeight +
      input.consistency * cfg.consistencyWeight +
      input.mistakeRecovery * cfg.mistakeRecoveryWeight +
      input.mockAccuracy * cfg.mockPerformanceWeight) /
    denom;

  const score = Math.round(Math.min(100, Math.max(0, weighted * 100)));
  const band = bandForScore(score, cfg);

  return {
    score,
    band,
    bandLabel: bandLabel(band),
    disclaimer:
      "This is a ProviQuiz learning metric. It is not an official government score and does not guarantee you will pass the official exam.",
    weights: {
      recentPerformance: cfg.recentPerformanceWeight,
      topicMastery: cfg.topicMasteryWeight,
      consistency: cfg.consistencyWeight,
      mistakeRecovery: cfg.mistakeRecoveryWeight,
      mockPerformance: cfg.mockPerformanceWeight,
    },
    factors: {
      recentAccuracy: round2(input.recentAccuracy),
      overallAccuracy: round2(input.overallAccuracy),
      topicMasteryAvg: round2(input.topicMasteryAvg),
      consistency: round2(input.consistency),
      mistakeRecovery: round2(input.mistakeRecovery),
      mockAccuracy: round2(input.mockAccuracy),
    },
  };
}

function round2(n: number) {
  return Math.round(n * 1000) / 1000;
}
