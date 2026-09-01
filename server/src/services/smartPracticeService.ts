import mongoose from "mongoose";
import { Question } from "../models/Question";
import { ExamSession } from "../models/ExamSession";
import { getPlatformSettings } from "./platformSettingsService";

type Weighted = { question: any; weight: number };

export async function pickSmartPracticeQuestions(userId: string, limit = 15) {
  const settings = await getPlatformSettings();
  const userOid = new mongoose.Types.ObjectId(userId);

  const missed = await ExamSession.aggregate([
    { $match: { user: userOid } },
    { $unwind: "$answers" },
    { $match: { "answers.isCorrect": false } },
    { $group: { _id: "$answers.questionId", missedCount: { $sum: 1 } } },
  ]);
  const missedMap = new Map<number, number>(missed.map((m: any) => [m._id as number, m.missedCount as number]));

  const topicStats = await ExamSession.aggregate([
    { $match: { user: userOid } },
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
        total: { $sum: 1 },
        correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
      },
    },
  ]);
  const weakTopics = new Set(
    topicStats
      .filter((t: any) => t.total >= 3 && t.correct / t.total < 0.7)
      .map((t: any) => t._id as string)
  );

  const seenIds = await ExamSession.aggregate([
    { $match: { user: userOid } },
    { $unwind: "$answers" },
    { $group: { _id: "$answers.questionId" } },
  ]);
  const seen = new Set(seenIds.map((x: any) => x._id as number));

  const pool = await Question.find({ isDeleted: { $ne: true }, status: { $ne: "draft" } })
    .limit(800)
    .lean();

  const weighted: Weighted[] = pool.map((q: any) => {
    let weight = settings.smartPracticeNewQuestionWeight;
    const misses = missedMap.get(q.id) ?? 0;
    if (misses > 0) weight = settings.smartPracticeMistakeWeight + misses * 10;
    const topic = q.topic || q.category || "uncategorized";
    if (weakTopics.has(topic)) weight += settings.smartPracticeWeakTopicWeight;
    if (seen.has(q.id) && misses === 0) weight = settings.smartPracticeMasteredWeight;
    return { question: q, weight: Math.max(1, weight) };
  });

  const picked: any[] = [];
  const copy = [...weighted];
  const n = Math.min(limit, copy.length);
  for (let i = 0; i < n; i += 1) {
    const total = copy.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < copy.length; j += 1) {
      r -= copy[j]!.weight;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    const [item] = copy.splice(idx, 1);
    if (item) picked.push(item.question);
  }

  return picked.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    imageUrl: q.imageUrl,
    topic: q.topic || q.category,
  }));
}
