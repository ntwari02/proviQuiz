import mongoose from "mongoose";
import { ExamSession } from "../models/ExamSession";
import { getPlatformSettings } from "./platformSettingsService";
import { computeReadinessScore, type ReadinessInput } from "./readinessScoreService";

const safePct = (num: number, den: number) => (den <= 0 ? 0 : num / den);

export type TopicMasteryRow = {
  topic: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  mastery: number;
  lastSeenAt: string | null;
  status: string;
};

function masteryStatus(masteryPercent: number, settings: Awaited<ReturnType<typeof getPlatformSettings>>) {
  if (masteryPercent <= settings.masteryBandBeginnerMax) return "Beginner";
  if (masteryPercent <= settings.masteryBandLearningMax) return "Learning";
  if (masteryPercent <= settings.masteryBandImprovingMax) return "Improving";
  if (masteryPercent <= settings.masteryBandStrongMax) return "Strong";
  return "Mastered";
}

export async function buildAnalyse(userId: string) {
  const settings = await getPlatformSettings();
  const userOid = new mongoose.Types.ObjectId(userId);
  const matchUser = { user: userOid };

  const exams = await ExamSession.find(matchUser)
    .sort({ createdAt: -1 })
    .select("score totalQuestions durationSeconds createdAt mode answers")
    .lean();

  const examCount = exams.length;
  const totalCorrect = exams.reduce((s, e) => s + (e.score ?? 0), 0);
  const totalQuestions = exams.reduce((s, e) => s + (e.totalQuestions ?? 0), 0);
  const overallAccuracy = safePct(totalCorrect, totalQuestions);
  const scores = exams.map((e) => safePct(e.score, Math.max(e.totalQuestions, 1)));
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const recent = exams.slice(0, 10).map((e) => ({
    id: String(e._id),
    createdAt: e.createdAt,
    mode: e.mode,
    score: e.score,
    totalQuestions: e.totalQuestions,
    accuracy: safePct(e.score, Math.max(e.totalQuestions, 1)),
    durationSeconds: e.durationSeconds,
  }));
  const recentAccuracy =
    recent.length === 0 ? 0 : recent.reduce((s, e) => s + e.accuracy, 0) / recent.length;

  const mockExams = exams.filter((e) => e.mode === "timed");
  const mockAccuracy =
    mockExams.length === 0
      ? overallAccuracy
      : mockExams.reduce((s, e) => s + safePct(e.score, Math.max(e.totalQuestions, 1)), 0) / mockExams.length;

  let consistency = 0;
  if (scores.length >= 2) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
    consistency = Math.max(0, 1 - Math.sqrt(variance) * 2);
  } else if (scores.length === 1) {
    consistency = scores[0] ?? 0;
  }

  const topicAgg = await ExamSession.aggregate([
    { $match: matchUser },
    { $unwind: "$answers" },
    {
      $lookup: {
        from: "questions",
        localField: "answers.questionId",
        foreignField: "id",
        as: "q",
      },
    },
    { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$q.topic", { $ifNull: ["$q.category", "uncategorized"] }] },
        attempted: { $sum: 1 },
        correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
        lastSeenAt: { $max: "$createdAt" },
      },
    },
    { $sort: { attempted: -1 } },
  ]);

  const topics: TopicMasteryRow[] = topicAgg.map((t: any) => {
    const accuracy = safePct(t.correct, t.attempted);
    const mastery = Math.round(accuracy * 100);
    return {
      topic: t._id || "uncategorized",
      attempted: t.attempted,
      correct: t.correct,
      wrong: t.attempted - t.correct,
      accuracy,
      mastery,
      lastSeenAt: t.lastSeenAt ? new Date(t.lastSeenAt).toISOString() : null,
      status: masteryStatus(mastery, settings),
    };
  });

  const topicMasteryAvg =
    topics.length === 0 ? 0 : topics.reduce((s, t) => s + t.accuracy, 0) / topics.length;

  const weakTopics = [...topics].filter((t) => t.attempted >= 3).sort((a, b) => a.mastery - b.mastery).slice(0, 5);
  const strongTopics = [...topics].filter((t) => t.attempted >= 3).sort((a, b) => b.mastery - a.mastery).slice(0, 5);

  const missedAgg = await ExamSession.aggregate([
    { $match: matchUser },
    { $unwind: "$answers" },
    { $match: { "answers.isCorrect": false } },
    {
      $group: {
        _id: "$answers.questionId",
        missedCount: { $sum: 1 },
        lastMissedAt: { $max: "$createdAt" },
        lastSelected: { $last: "$answers.selected" },
        correct: { $last: "$answers.correct" },
      },
    },
    { $sort: { missedCount: -1, lastMissedAt: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: "questions",
        localField: "_id",
        foreignField: "id",
        as: "q",
      },
    },
    { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        questionId: "$_id",
        missedCount: 1,
        lastMissedAt: 1,
        lastSelected: 1,
        correct: 1,
        question: "$q.question",
        explanation: "$q.explanation",
        topic: { $ifNull: ["$q.topic", { $ifNull: ["$q.category", "uncategorized"] }] },
        imageUrl: "$q.imageUrl",
        options: "$q.options",
      },
    },
  ]);

  const recoveredAgg = await ExamSession.aggregate([
    { $match: matchUser },
    { $unwind: "$answers" },
    {
      $group: {
        _id: "$answers.questionId",
        wrong: { $sum: { $cond: ["$answers.isCorrect", 0, 1] } },
        right: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
      },
    },
    { $match: { wrong: { $gte: 1 } } },
  ]);
  const recovered = recoveredAgg.filter((x: any) => x.right > 0).length;
  const mistakeRecovery = recoveredAgg.length === 0 ? overallAccuracy : safePct(recovered, recoveredAgg.length);

  const oldest = exams[exams.length - 1];
  const newest = exams[0];
  const improvement =
    exams.length >= 2 && oldest && newest
      ? safePct(newest.score, Math.max(newest.totalQuestions, 1)) -
        safePct(oldest.score, Math.max(oldest.totalQuestions, 1))
      : 0;

  const readinessInput: ReadinessInput = {
    recentAccuracy,
    overallAccuracy,
    topicMasteryAvg,
    consistency,
    mistakeRecovery,
    mockAccuracy,
  };
  const readiness = computeReadinessScore(readinessInput, settings.readiness);

  const weakest = weakTopics[0] ?? null;
  const nextMove = weakest
    ? {
        topic: weakest.topic,
        mastery: weakest.mastery,
        attempted: weakest.attempted,
        recommended: `Practice ${Math.min(15, Math.max(5, weakest.wrong || 10))} ${weakest.topic} questions`,
        cta: "START TRAINING",
      }
    : examCount === 0
      ? {
          topic: "Get started",
          mastery: 0,
          attempted: 0,
          recommended: "Take your first mock exam so we can identify your weak topics.",
          cta: "START EXAM",
        }
      : {
          topic: "Keep going",
          mastery: Math.round(overallAccuracy * 100),
          attempted: totalQuestions,
          recommended: "Take another mock exam to unlock topic-level recommendations.",
          cta: "START EXAM",
        };

  return {
    totals: {
      examCount,
      averageScore: overallAccuracy,
      bestScore,
      accuracy: overallAccuracy,
      questionsAnswered: totalQuestions,
      correctAnswers: totalCorrect,
      wrongAnswers: Math.max(0, totalQuestions - totalCorrect),
      improvement,
    },
    recent,
    readiness,
    topics,
    weakTopics,
    strongTopics,
    frequentlyMissed: missedAgg,
    nextMove,
  };
}

export async function buildMistakes(userId: string, limit = 50) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const items = await ExamSession.aggregate([
    { $match: { user: userOid } },
    { $unwind: "$answers" },
    { $match: { "answers.isCorrect": false } },
    {
      $group: {
        _id: "$answers.questionId",
        missedCount: { $sum: 1 },
        lastMissedAt: { $max: "$createdAt" },
        lastSelected: { $last: "$answers.selected" },
        correct: { $last: "$answers.correct" },
      },
    },
    { $sort: { missedCount: -1, lastMissedAt: -1 } },
    { $limit: Math.min(limit, 100) },
    {
      $lookup: {
        from: "questions",
        localField: "_id",
        foreignField: "id",
        as: "q",
      },
    },
    { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        questionId: "$_id",
        missedCount: 1,
        lastMissedAt: 1,
        lastSelected: 1,
        correct: 1,
        question: "$q.question",
        explanation: "$q.explanation",
        topic: { $ifNull: ["$q.topic", { $ifNull: ["$q.category", "uncategorized"] }] },
        imageUrl: "$q.imageUrl",
        options: "$q.options",
      },
    },
  ]);
  return { items, total: items.length };
}
