import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  name?: string;
  passwordHash?: string | null;
  googleId?: string | null;
  role: "student" | "admin" | "superadmin";
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
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
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDocument>("User", UserSchema);


