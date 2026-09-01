import mongoose, { Schema, Document, Types } from "mongoose";

export interface DailyChallengeAttemptDocument extends Document {
  user: Types.ObjectId;
  dateKey: string;
  answers: Record<string, string>;
  correctCount: number;
  total: number;
  scorePercent: number;
  completedAt: Date;
}

const schema = new Schema<DailyChallengeAttemptDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    correctCount: { type: Number, required: true },
    total: { type: Number, required: true },
    scorePercent: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ user: 1, dateKey: 1 }, { unique: true });
schema.index({ dateKey: 1, scorePercent: -1, completedAt: 1 });

export const DailyChallengeAttempt = mongoose.model<DailyChallengeAttemptDocument>(
  "DailyChallengeAttempt",
  schema
);
