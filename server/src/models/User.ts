import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  name?: string;
  passwordHash?: string | null;
  googleId?: string | null;
  role: "student" | "admin" | "superadmin";
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
  active?: boolean; // Activate/deactivate user
  banned?: boolean; // Ban user (prevent login)
  bannedReason?: string; // Reason for ban
  bannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String },
    passwordHash: { type: String, required: false, default: null },
    googleId: { type: String, index: true, sparse: true },
    role: {
      type: String,
      enum: ["student", "admin", "superadmin"],
      default: "student",
    },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
    active: { type: Boolean, default: true },
    banned: { type: Boolean, default: false },
    bannedReason: { type: String },
    bannedAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", UserSchema);


