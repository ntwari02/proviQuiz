import mongoose, { Schema, Document, Types } from "mongoose";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial";

export interface UserSubscriptionDocument extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  cancelledAt?: Date;
  paymentReference?: string;
  grantedBy?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSubscriptionSchema = new Schema<UserSubscriptionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "PremiumPlan", required: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "trial"],
      default: "active",
    },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    cancelledAt: { type: Date },
    paymentReference: { type: String },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

UserSubscriptionSchema.index({ user: 1, status: 1 });
UserSubscriptionSchema.index({ expiresAt: 1 });

export const UserSubscription = mongoose.model<UserSubscriptionDocument>(
  "UserSubscription",
  UserSubscriptionSchema
);
