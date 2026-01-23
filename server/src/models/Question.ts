import mongoose, { Schema, Document } from "mongoose";

export type QuestionOptions = {
  a: string;
  b: string;
  c: string;
  d: string;
};

export interface QuestionDocument extends Omit<Document, "increment"> {
  id: number;
  question: string;
  options: QuestionOptions;
  correct: "a" | "b" | "c" | "d";
  explanation?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  imageUrl?: string;
  topic?: string; // alias if you want to tag by topic later
  source?: string;
  increment?: 1 | 2 | 3; // Section/Increment assignment
  status?: "draft" | "published"; // Draft or Published
  isDeleted?: boolean;
}

const QuestionSchema = new Schema<QuestionDocument>(
  {
    id: { type: Number, required: true, unique: true },
    question: { type: String, required: true },
    options: {
      a: { type: String, required: true },
      b: { type: String, required: true },
      c: { type: String, required: true },
      d: { type: String, required: true },
    },
    correct: { type: String, enum: ["a", "b", "c", "d"], required: true },
    explanation: { type: String },
    category: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    imageUrl: { type: String },
    topic: { type: String },
    source: { type: String },
    increment: { type: Number, enum: [1, 2, 3] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Question = mongoose.model<QuestionDocument>(
  "Question",
  QuestionSchema
);


