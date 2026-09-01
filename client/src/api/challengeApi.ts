import { api } from "./http";

export type DailyQuestion = {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  imageUrl?: string;
  topic?: string;
  correct?: "a" | "b" | "c" | "d";
  explanation?: string;
};

export type DailyChallenge = {
  enabled: boolean;
  dateKey: string;
  questionCount?: number;
  completed?: boolean;
  result?: { correctCount: number; total: number; scorePercent: number } | null;
  streak?: number;
  longestStreak?: number;
  examDate?: string | null;
  explanationsLocked?: boolean;
  questions?: DailyQuestion[];
};

export async function dailyChallengeApi() {
  const res = await api.get<DailyChallenge>("/challenges/today");
  return res.data;
}

export async function submitDailyChallengeApi(
  answers: Array<{ questionId: number; selected: string | null }>
) {
  const res = await api.post<DailyChallenge>("/challenges/today/submit", { answers });
  return res.data;
}

export async function dailyBoardApi() {
  const res = await api.get<{
    dateKey: string;
    items: Array<{ rank: number; name: string; scorePercent: number; correctCount: number; total: number }>;
  }>("/challenges/today/board");
  return res.data;
}

export async function setExamDateApi(examDate: string | null) {
  const res = await api.put<{ examDate: string | null }>("/challenges/exam-date", { examDate });
  return res.data;
}
