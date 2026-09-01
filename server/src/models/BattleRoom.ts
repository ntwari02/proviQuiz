import mongoose, { Schema, Document, Types } from "mongoose";

export type BattleStatus = "lobby" | "in_progress" | "finished";
export type BattleMode = "duel" | "group";

export interface BattleQuestion {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct: "a" | "b" | "c" | "d";
  explanation?: string;
  imageUrl?: string;
  topic?: string;
}

export interface BattlePlayer {
  userId: Types.ObjectId;
  name: string;
  joinedAt: Date;
  answers: Map<string, string> | Record<string, string>;
  answeredCount: number;
  finishedAt?: Date | null;
  correctCount: number;
  score: number;
}

export interface BattleRoomDocument extends Document {
  code: string;
  hostUserId: Types.ObjectId;
  mode: BattleMode;
  status: BattleStatus;
  questionCount: number;
  durationSeconds: number;
  maxPlayers: number;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  questions: BattleQuestion[];
  players: BattlePlayer[];
  createdAt: Date;
  updatedAt: Date;
}

const battleQuestionSchema = new Schema<BattleQuestion>(
  {
    id: { type: Number, required: true },
    question: { type: String, required: true },
    options: {
      a: { type: String, required: true },
      b: { type: String, required: true },
      c: { type: String, required: true },
      d: { type: String, required: true },
    },
    correct: { type: String, enum: ["a", "b", "c", "d"], required: true },
    explanation: { type: String },
    imageUrl: { type: String },
    topic: { type: String },
  },
  { _id: false }
);

const battlePlayerSchema = new Schema<BattlePlayer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    answers: { type: Map, of: String, default: {} },
    answeredCount: { type: Number, default: 0 },
    finishedAt: { type: Date, default: null },
    correctCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const BattleRoomSchema = new Schema<BattleRoomDocument>(
  {
    code: { type: String, required: true, unique: true, index: true },
    hostUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["duel", "group"], default: "duel" },
    status: { type: String, enum: ["lobby", "in_progress", "finished"], default: "lobby" },
    questionCount: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
    maxPlayers: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    questions: { type: [battleQuestionSchema], default: [] },
    players: { type: [battlePlayerSchema], default: [] },
  },
  { timestamps: true }
);

BattleRoomSchema.index({ createdAt: 1 });
BattleRoomSchema.index({ "players.userId": 1, createdAt: -1 });

export const BattleRoom = mongoose.model<BattleRoomDocument>("BattleRoom", BattleRoomSchema);
