import mongoose, { Schema, Document } from "mongoose";

export interface SystemSettingsDocument extends Document {
  systemName: string;
  logoUrl?: string;
  examRules?: string;
  passingCriteria?: number; // Default pass mark percentage
  questionRandomization: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

const SystemSettingsSchema = new Schema<SystemSettingsDocument>(
  {
    systemName: { type: String, required: true, default: "PROVIQUIZ" },
    logoUrl: { type: String },
    examRules: { type: String },
    passingCriteria: { type: Number, default: 60, min: 0, max: 100 },
    questionRandomization: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
SystemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const SystemSettings = mongoose.model<SystemSettingsDocument>("SystemSettings", SystemSettingsSchema);
