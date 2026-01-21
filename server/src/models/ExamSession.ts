import mongoose, { Schema, Document, Types } from "mongoose";

export interface ExamAnswer {
  questionId: number;
  selected: "a" | "b" | "c" | "d" | null;
  correct: "a" | "b" | "c" | "d";
  isCorrect: boolean;
}

export interface ExamSessionDocument extends Document {
  user?: Types.ObjectId;
  mode: "timed" | "practice";
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  score: number;
  totalQuestions: number;
  answers: ExamAnswer[];
}

const ExamAnswerSchema = new Schema<ExamAnswer>(
  {
    questionId: { type: Number, required: true },
    selected: { type: String, enum: ["a", "b", "c", "d", null], default: null },
    correct: { type: String, enum: ["a", "b", "c", "d"], required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const ExamSessionSchema = new Schema<ExamSessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    mode: { type: String, enum: ["timed", "practice"], default: "timed" },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    durationSeconds: { type: Number, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: { type: [ExamAnswerSchema], required: true },
  },
  { timestamps: true }
);

export const ExamSession = mongoose.model<ExamSessionDocument>(
  "ExamSession",
  ExamSessionSchema
);


