import mongoose from "mongoose";
import { BattleRoom, type BattleRoomDocument, type BattleMode } from "../models/BattleRoom";
import { Question } from "../models/Question";
import { User } from "../models/User";
import { getPlatformSettings } from "./platformSettingsService";
import { assertCanStartExam, consumeExamQuota, ExamQuotaExceededError } from "./examQuotaService";

export class BattleError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function playerAnswers(player: BattleRoomDocument["players"][number]) {
  if (player.answers instanceof Map) {
    return Object.fromEntries(player.answers);
  }
  return (player.answers as Record<string, string>) ?? {};
}

async function uniqueCode() {
  for (let i = 0; i < 12; i += 1) {
    const code = generateCode();
    const exists = await BattleRoom.exists({ code });
    if (!exists) return code;
  }
  throw new BattleError("Could not create a room code. Try again.", 500);
}

async function pickQuestions(count: number) {
  const docs = await Question.find({ isDeleted: { $ne: true } }).lean();
  const pool = [...docs];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
    imageUrl: q.imageUrl,
    topic: q.topic ?? q.category,
  }));
}

function scorePlayer(
  room: BattleRoomDocument,
  player: BattleRoomDocument["players"][number],
  finishedAt: Date
) {
  const answers = playerAnswers(player);
  let correctCount = 0;
  for (const q of room.questions) {
    if (answers[String(q.id)] === q.correct) correctCount += 1;
  }
  player.correctCount = correctCount;
  player.finishedAt = finishedAt;
  player.answeredCount = Object.keys(answers).length;
}

async function maybeFinishRoom(room: BattleRoomDocument, now = new Date()) {
  if (room.status !== "in_progress") return;
  const timedOut =
    room.startedAt && now.getTime() - room.startedAt.getTime() >= room.durationSeconds * 1000;
  const allDone = room.players.length > 0 && room.players.every((p) => Boolean(p.finishedAt));
  if (timedOut || allDone) {
    room.status = "finished";
    room.finishedAt = now;
    for (const player of room.players) {
      if (!player.finishedAt) scorePlayer(room, player, now);
      await applyScorePoints(room, player);
    }
  }
}

async function applyScorePoints(room: BattleRoomDocument, player: BattleRoomDocument["players"][number]) {
  const settings = await getPlatformSettings();
  const pointsCorrect = settings.battle.pointsCorrect ?? 10;
  const pointsWrong = settings.battle.pointsWrong ?? 0;
  const speedBonus = settings.battle.pointsSpeedBonus ?? 2;
  const answers = playerAnswers(player);
  let score = 0;
  for (const q of room.questions) {
    const picked = answers[String(q.id)];
    if (!picked) continue;
    score += picked === q.correct ? pointsCorrect : pointsWrong;
  }
  if (player.finishedAt && room.startedAt) {
    const used = (player.finishedAt.getTime() - room.startedAt.getTime()) / 1000;
    const remainingRatio = Math.max(0, 1 - used / room.durationSeconds);
    score += Math.round(speedBonus * remainingRatio * player.correctCount);
  }
  player.score = score;
}

function findPlayer(room: BattleRoomDocument, userId: string) {
  return room.players.find((p) => String(p.userId) === String(userId));
}

export function serializeBattle(room: BattleRoomDocument, viewerId: string) {
  const viewer = findPlayer(room, viewerId);
  const revealAnswers = room.status === "finished" || Boolean(viewer?.finishedAt);
  const now = Date.now();
  const remainingSeconds =
    room.status === "in_progress" && room.startedAt
      ? Math.max(0, room.durationSeconds - Math.floor((now - room.startedAt.getTime()) / 1000))
      : room.status === "lobby"
        ? room.durationSeconds
        : 0;

  const ranked = [...room.players]
    .map((p) => ({
      userId: String(p.userId),
      name: p.name,
      isHost: String(p.userId) === String(room.hostUserId),
      isYou: String(p.userId) === String(viewerId),
      answeredCount: p.answeredCount,
      finished: Boolean(p.finishedAt),
      correctCount: revealAnswers || Boolean(p.finishedAt) ? p.correctCount : undefined,
      score: revealAnswers || Boolean(p.finishedAt) ? p.score : undefined,
    }))
    .sort((a, b) => {
      const as = a.score ?? -1;
      const bs = b.score ?? -1;
      if (bs !== as) return bs - as;
      return (b.correctCount ?? 0) - (a.correctCount ?? 0);
    });

  const winner =
    room.status === "finished" && ranked.length
      ? ranked.reduce((best, p) => ((p.score ?? 0) > (best.score ?? 0) ? p : best), ranked[0])
      : null;

  const questions = revealAnswers
    ? room.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        imageUrl: q.imageUrl,
        topic: q.topic,
        correct: q.correct,
        explanation: q.explanation,
      }))
    : room.status === "in_progress"
      ? room.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          imageUrl: q.imageUrl,
          topic: q.topic,
        }))
      : [];

  return {
    code: room.code,
    mode: room.mode,
    status: room.status,
    questionCount: room.questionCount,
    durationSeconds: room.durationSeconds,
    maxPlayers: room.maxPlayers,
    hostUserId: String(room.hostUserId),
    isHost: String(room.hostUserId) === String(viewerId),
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    remainingSeconds,
    yourAnswers: viewer ? playerAnswers(viewer) : {},
    youFinished: Boolean(viewer?.finishedAt),
    players: ranked,
    winner: winner
      ? { userId: winner.userId, name: winner.name, score: winner.score, correctCount: winner.correctCount }
      : null,
    questions,
  };
}

async function assertDailyLimit(userId: string) {
  const settings = await getPlatformSettings();
  const max = settings.battle.maxBattlesPerDay ?? 20;
  const count = await BattleRoom.countDocuments({
    "players.userId": new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: startOfUtcDay() },
  });
  if (count >= max) {
    throw new BattleError(`Daily battle limit reached (${max}).`, 429, "BATTLE_DAILY_LIMIT");
  }
}

export async function createBattle(userId: string, mode: BattleMode) {
  const settings = await getPlatformSettings();
  if (!settings.battle.enabled || !settings.premiumFeatures.battle) {
    throw new BattleError("Battles are currently disabled.", 403, "FEATURE_DISABLED");
  }
  if (mode === "duel" && !settings.battle.quickDuelEnabled && !settings.battle.friendChallengeEnabled) {
    throw new BattleError("Duels are currently disabled.", 403, "FEATURE_DISABLED");
  }
  if (mode === "group" && !(settings.battle.groupEnabled ?? settings.battle.classBattleEnabled)) {
    throw new BattleError("Group battles are currently disabled.", 403, "FEATURE_DISABLED");
  }

  await assertDailyLimit(userId);
  const user = await User.findById(userId).lean();
  if (!user) throw new BattleError("User not found", 404);

  const maxPlayers =
    mode === "duel" ? 2 : Math.max(3, settings.battle.maxPlayers ?? 8);
  const questionCount = settings.battle.defaultQuestionCount ?? 10;
  const durationSeconds = settings.battle.durationSeconds ?? 600;

  const code = await uniqueCode();
  const room = await BattleRoom.create({
    code,
    hostUserId: userId,
    mode,
    status: "lobby",
    questionCount,
    durationSeconds,
    maxPlayers,
    players: [
      {
        userId,
        name: user.name || user.email || "Player",
        joinedAt: new Date(),
        answers: {},
        answeredCount: 0,
        correctCount: 0,
        score: 0,
      },
    ],
  });
  return serializeBattle(room, userId);
}

export async function joinBattle(userId: string, rawCode: string) {
  const settings = await getPlatformSettings();
  if (!settings.battle.enabled || !settings.premiumFeatures.battle) {
    throw new BattleError("Battles are currently disabled.", 403, "FEATURE_DISABLED");
  }
  const code = rawCode.trim().toUpperCase();
  const room = await BattleRoom.findOne({ code });
  if (!room) throw new BattleError("Room not found. Check the code.", 404);

  const existing = findPlayer(room, userId);
  if (existing) return serializeBattle(room, userId);

  if (room.status !== "lobby") {
    throw new BattleError("This battle already started.", 400, "BATTLE_STARTED");
  }
  if (room.players.length >= room.maxPlayers) {
    throw new BattleError("This room is full.", 409, "BATTLE_FULL");
  }

  await assertDailyLimit(userId);
  const user = await User.findById(userId).lean();
  if (!user) throw new BattleError("User not found", 404);

  room.players.push({
    userId: new mongoose.Types.ObjectId(userId),
    name: user.name || user.email || "Player",
    joinedAt: new Date(),
    answers: {},
    answeredCount: 0,
    finishedAt: null,
    correctCount: 0,
    score: 0,
  } as any);
  await room.save();
  return serializeBattle(room, userId);
}

export async function getBattle(userId: string, code: string) {
  const room = await BattleRoom.findOne({ code: code.trim().toUpperCase() });
  if (!room) throw new BattleError("Room not found", 404);
  if (!findPlayer(room, userId)) {
    throw new BattleError("You are not in this battle.", 403);
  }
  const before = room.status;
  await maybeFinishRoom(room);
  if (room.status !== before) {
    room.markModified("players");
    await room.save();
  }
  return serializeBattle(room, userId);
}

export async function startBattle(userId: string, code: string) {
  const room = await BattleRoom.findOne({ code: code.trim().toUpperCase() });
  if (!room) throw new BattleError("Room not found", 404);
  if (String(room.hostUserId) !== String(userId)) {
    throw new BattleError("Only the host can start.", 403);
  }
  if (room.status !== "lobby") return serializeBattle(room, userId);

  const settings = await getPlatformSettings();
  const minPlayers = settings.battle.minPlayers ?? 2;
  if (room.players.length < minPlayers) {
    throw new BattleError(`Need at least ${minPlayers} players to start.`, 400, "NOT_ENOUGH_PLAYERS");
  }

  if (settings.battle.consumeExamQuota) {
    try {
      for (const p of room.players) {
        await assertCanStartExam(String(p.userId));
      }
    } catch (err) {
      if (err instanceof ExamQuotaExceededError) {
        throw new BattleError(err.message, 429, "EXAM_QUOTA_EXCEEDED");
      }
      throw err;
    }
  }

  const questions = await pickQuestions(room.questionCount);
  if (questions.length < Math.min(room.questionCount, 5)) {
    throw new BattleError("Not enough questions available.", 500);
  }
  room.questions = questions;
  room.questionCount = questions.length;
  room.status = "in_progress";
  room.startedAt = new Date();

  if (settings.battle.consumeExamQuota) {
    for (const p of room.players) {
      await consumeExamQuota(String(p.userId));
    }
  }

  await room.save();
  return serializeBattle(room, userId);
}

export async function answerBattle(
  userId: string,
  code: string,
  questionId: number,
  selected: string
) {
  const room = await BattleRoom.findOne({ code: code.trim().toUpperCase() });
  if (!room) throw new BattleError("Room not found", 404);
  await maybeFinishRoom(room);
  if (room.status !== "in_progress") {
    throw new BattleError("Battle is not in progress.", 400);
  }
  const player = findPlayer(room, userId);
  if (!player) throw new BattleError("You are not in this battle.", 403);
  if (player.finishedAt) throw new BattleError("You already finished.", 400);

  const q = room.questions.find((item) => item.id === questionId);
  if (!q) throw new BattleError("Invalid question.", 400);
  if (!["a", "b", "c", "d"].includes(selected)) {
    throw new BattleError("Invalid answer.", 400);
  }

  if (player.answers instanceof Map) {
    player.answers.set(String(questionId), selected);
  } else {
    (player as any).answers = { ...playerAnswers(player), [String(questionId)]: selected };
  }
  player.answeredCount = Object.keys(playerAnswers(player)).length;
  room.markModified("players");
  await room.save();
  return serializeBattle(room, userId);
}

export async function finishBattle(userId: string, code: string) {
  const room = await BattleRoom.findOne({ code: code.trim().toUpperCase() });
  if (!room) throw new BattleError("Room not found", 404);
  const player = findPlayer(room, userId);
  if (!player) throw new BattleError("You are not in this battle.", 403);
  if (room.status === "lobby") throw new BattleError("Battle has not started.", 400);

  const now = new Date();
  if (!player.finishedAt) {
    scorePlayer(room, player, now);
    await applyScorePoints(room, player);
  }
  await maybeFinishRoom(room, now);
  room.markModified("players");
  await room.save();
  return serializeBattle(room, userId);
}
