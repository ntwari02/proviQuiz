import mongoose, { Schema, Document } from "mongoose";

export type ExamQuotaPeriod = "daily" | "weekly" | "monthly" | "subscription_period" | "unlimited";
export type DurationUnit = "days" | "weeks" | "months";

export interface PremiumPlanDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationUnit: DurationUnit;
  examQuota: number;
  examQuotaPeriod: ExamQuotaPeriod;
  features: string[];
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PremiumPlanSchema = new Schema<PremiumPlanDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "RWF", uppercase: true },
    duration: { type: Number, required: true, min: 1 },
    durationUnit: { type: String, enum: ["days", "weeks", "months"], default: "days" },
    examQuota: { type: Number, required: true, min: 0 },
    examQuotaPeriod: {
      type: String,
      enum: ["daily", "weekly", "monthly", "subscription_period", "unlimited"],
      default: "monthly",
    },
    features: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PremiumPlan = mongoose.model<PremiumPlanDocument>("PremiumPlan", PremiumPlanSchema);
