import { api } from "./http";

export type BattleMode = "duel" | "group";
export type BattleStatus = "lobby" | "in_progress" | "finished";

export type BattleQuestion = {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  imageUrl?: string;
  topic?: string;
  correct?: "a" | "b" | "c" | "d";
  explanation?: string;
};

export type BattlePlayer = {
  userId: string;
  name: string;
  isHost: boolean;
  isYou: boolean;
  answeredCount: number;
  finished: boolean;
  correctCount?: number;
  score?: number;
};

export type BattleRoom = {
  code: string;
  mode: BattleMode;
  status: BattleStatus;
  questionCount: number;
  durationSeconds: number;
  maxPlayers: number;
  hostUserId: string;
  isHost: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  remainingSeconds: number;
  yourAnswers: Record<string, string>;
  youFinished: boolean;
  players: BattlePlayer[];
  winner: { userId: string; name: string; score?: number; correctCount?: number } | null;
  questions: BattleQuestion[];
};

export async function createBattleApi(mode: BattleMode) {
  const res = await api.post<BattleRoom>("/premium/battles", { mode });
  return res.data;
}

export async function joinBattleApi(code: string) {
  const res = await api.post<BattleRoom>("/premium/battles/join", { code });
  return res.data;
}

export async function getBattleApi(code: string) {
  const res = await api.get<BattleRoom>(`/premium/battles/${code}`);
  return res.data;
}

export async function startBattleApi(code: string) {
  const res = await api.post<BattleRoom>(`/premium/battles/${code}/start`);
  return res.data;
}

export async function answerBattleApi(code: string, questionId: number, selected: string) {
  const res = await api.post<BattleRoom>(`/premium/battles/${code}/answer`, { questionId, selected });
  return res.data;
}

export async function finishBattleApi(code: string) {
  const res = await api.post<BattleRoom>(`/premium/battles/${code}/finish`);
  return res.data;
}
