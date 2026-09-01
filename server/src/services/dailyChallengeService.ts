import { Question } from "../models/Question";
import { DailyChallengeAttempt } from "../models/DailyChallengeAttempt";
import { User } from "../models/User";
import { getPlatformSettings } from "./platformSettingsService";
import { getPremiumAccess } from "./premiumAccessService";

export function rwandaDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function seededShuffle<T>(items: T[], seed: string) {
  const pool = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

async function todayQuestions(count: number, dateKey: string) {
  const docs = await Question.find({ isDeleted: { $ne: true } }).lean();
  return seededShuffle(docs, `proviquiz-daily-${dateKey}`).slice(0, count);
}

function yesterdayKey(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export async function getDailyChallenge(userId?: string) {
  const settings = await getPlatformSettings();
  const cfg = settings.dailyChallenge ?? { enabled: true, questionCount: 5, explanationsPremiumOnly: true, boardEnabled: true };
  if (cfg.enabled === false) {
    return { enabled: false, dateKey: rwandaDateKey() };
  }

  const dateKey = rwandaDateKey();
  const count = cfg.questionCount ?? 5;
  const docs = await todayQuestions(count, dateKey);
  const attempt = userId
    ? await DailyChallengeAttempt.findOne({ user: userId, dateKey }).lean()
    : null;
  const user = userId ? await User.findById(userId).lean() : null;
  const access = userId ? await getPremiumAccess(userId) : null;
  const showExplain = Boolean(access?.isPremium) || !cfg.explanationsPremiumOnly;

  const questions = docs.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    imageUrl: q.imageUrl,
    topic: q.topic ?? q.category,
    ...(attempt && showExplain
      ? { correct: q.correct, explanation: q.explanation }
      : {}),
  }));

  return {
    enabled: true,
    dateKey,
    questionCount: questions.length,
    completed: Boolean(attempt),
    result: attempt
      ? {
          correctCount: attempt.correctCount,
          total: attempt.total,
          scorePercent: attempt.scorePercent,
        }
      : null,
    streak: user?.challengeStreak ?? 0,
    longestStreak: user?.longestChallengeStreak ?? 0,
    examDate: user?.examDate ?? null,
    explanationsLocked: Boolean(attempt) && !showExplain,
    questions,
  };
}

export async function submitDailyChallenge(
  userId: string,
  answers: Array<{ questionId: number; selected: string | null }>
) {
  const settings = await getPlatformSettings();
  const cfg = settings.dailyChallenge ?? { enabled: true, questionCount: 5, explanationsPremiumOnly: true, boardEnabled: true };
  if (cfg.enabled === false) {
    throw Object.assign(new Error("Daily challenge is disabled"), { status: 403 });
  }

  const dateKey = rwandaDateKey();
  const existing = await DailyChallengeAttempt.findOne({ user: userId, dateKey });
  if (existing) {
    return getDailyChallenge(userId);
  }

  const docs = await todayQuestions(cfg.questionCount ?? 5, dateKey);
  let correctCount = 0;
  const stored: Record<string, string> = {};
  for (const q of docs) {
    const picked = answers.find((a) => a.questionId === q.id)?.selected ?? null;
    if (picked) stored[String(q.id)] = picked;
    if (picked && picked === q.correct) correctCount += 1;
  }
  const total = docs.length;
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0;

  await DailyChallengeAttempt.create({
    user: userId,
    dateKey,
    answers: stored,
    correctCount,
    total,
    scorePercent,
    completedAt: new Date(),
  });

  const user = await User.findById(userId);
  if (user) {
    const prev = user.lastChallengeDate;
    const yest = yesterdayKey(dateKey);
    const nextStreak = prev === yest ? (user.challengeStreak || 0) + 1 : 1;
    user.challengeStreak = nextStreak;
    user.longestChallengeStreak = Math.max(user.longestChallengeStreak || 0, nextStreak);
    user.lastChallengeDate = dateKey;
    await user.save();
  }

  return getDailyChallenge(userId);
}

export async function dailyBoard(limit = 20) {
  const settings = await getPlatformSettings();
  if (settings.dailyChallenge && settings.dailyChallenge.boardEnabled === false) {
    return { dateKey: rwandaDateKey(), items: [] };
  }
  const dateKey = rwandaDateKey();
  const rows = await DailyChallengeAttempt.find({ dateKey })
    .sort({ scorePercent: -1, completedAt: 1 })
    .limit(Math.min(limit, 50))
    .populate("user", "name email")
    .lean();

  return {
    dateKey,
    items: rows.map((r, i) => {
      const u = r.user as any;
      return {
        rank: i + 1,
        name: u?.name || "Learner",
        scorePercent: r.scorePercent,
        correctCount: r.correctCount,
        total: r.total,
      };
    }),
  };
}

export async function setExamDate(userId: string, examDate: string | null) {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  user.examDate = examDate ? new Date(examDate) : null;
  await user.save();
  return { examDate: user.examDate };
}
