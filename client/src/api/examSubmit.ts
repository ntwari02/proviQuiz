import type { Question } from "../types/exam";
import { readAuthToken } from "../auth/authStorage";
import { submitExamApi } from "./premiumApi";
import { enqueueOfflineSession, MAX_OFFLINE_SESSIONS } from "../offline/examOfflineStore";
import { syncOfflineExamSessions } from "../offline/syncExamSessions";

export async function persistExamResult(input: {
  questions: Question[];
  selectedAnswers: Record<string, string | undefined>;
  startedAt: number;
  finishedAt: number;
}) {
  const answers = input.questions.map((q) => {
    const selected = input.selectedAnswers[q.id];
    return {
      questionId: q.dbQuestionId,
      selected: (selected as "a" | "b" | "c" | "d" | undefined) ?? null,
    };
  });

  const payload = {
    mode: "timed" as const,
    startedAt: new Date(input.startedAt).toISOString(),
    completedAt: new Date(input.finishedAt).toISOString(),
    answers,
  };

  const correctCount = input.questions.reduce((n, q) => {
    const selected = input.selectedAnswers[q.id];
    const correct = q.options.find((o) => o.isCorrect)?.id;
    return selected && correct && selected === correct ? n + 1 : n;
  }, 0);

  const trySubmit = async () => {
    if (!readAuthToken()) return { status: "guest" as const };
    return submitExamApi(payload).then(() => ({ status: "synced" as const }));
  };

  try {
    if (navigator.onLine && readAuthToken()) {
      await trySubmit();
      await syncOfflineExamSessions();
      return { status: "synced" as const };
    }
  } catch (err) {
    console.error("[persistExamResult] online submit failed, queueing", err);
  }

  if (!readAuthToken()) {
    return { status: "guest" as const };
  }

  const queued = await enqueueOfflineSession({
    id: `exam-${input.startedAt}-${Date.now()}`,
    createdAt: Date.now(),
    synced: false,
    payload,
    summary: {
      correctCount,
      totalQuestions: input.questions.length,
      scorePercent: input.questions.length === 0 ? 0 : (correctCount / input.questions.length) * 100,
    },
  });

  return {
    status: "queued" as const,
    droppedOldest: queued.droppedOldest,
    max: MAX_OFFLINE_SESSIONS,
  };
}
