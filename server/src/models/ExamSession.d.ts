import mongoose, { Document, Types } from "mongoose";
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
    createdAt: Date;
    updatedAt: Date;
}
export declare const ExamSession: mongoose.Model<ExamSessionDocument, {}, {}, {}, mongoose.Document<unknown, {}, ExamSessionDocument, {}, mongoose.DefaultSchemaOptions> & ExamSessionDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ExamSessionDocument>;
//# sourceMappingURL=ExamSession.d.ts.map