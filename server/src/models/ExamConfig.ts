import mongoose, { Schema, Document } from "mongoose";

export interface ExamConfigDocument extends Document {
  name: string;
  description?: string;
  increments: number[]; // [1, 2, 3] - which increments to include
  questionCount: number; // Total questions to include
  timeLimitMinutes?: number; // Optional time limit
  passMarkPercent: number; // e.g., 60 for 60%
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  enabled: boolean;
  createdBy?: mongoose.Types.ObjectId;
}

const ExamConfigSchema = new Schema<ExamConfigDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    increments: { type: [Number], required: true },
    questionCount: { type: Number, required: true, min: 1 },
    timeLimitMinutes: { type: Number, min: 1 },
    passMarkPercent: { type: Number, required: true, min: 0, max: 100, default: 60 },
    randomizeQuestions: { type: Boolean, default: true },
    randomizeAnswers: { type: Boolean, default: true },
    enabled: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ExamConfig = mongoose.model<ExamConfigDocument>("ExamConfig", ExamConfigSchema);
