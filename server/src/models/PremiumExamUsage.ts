import mongoose, { Schema, Document, Types } from "mongoose";

export interface PremiumExamUsageDocument extends Document {
  user: Types.ObjectId;
  periodKey: string;
  consumedAt: Date;
  examSessionId?: Types.ObjectId;
  createdAt: Date;
}

const PremiumExamUsageSchema = new Schema<PremiumExamUsageDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    periodKey: { type: String, required: true, index: true },
    consumedAt: { type: Date, required: true, default: Date.now },
    examSessionId: { type: Schema.Types.ObjectId, ref: "ExamSession" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PremiumExamUsageSchema.index({ user: 1, periodKey: 1, consumedAt: -1 });

export const PremiumExamUsage = mongoose.model<PremiumExamUsageDocument>(
  "PremiumExamUsage",
  PremiumExamUsageSchema
);
