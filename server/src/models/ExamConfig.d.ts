import mongoose, { Document } from "mongoose";
export interface ExamConfigDocument extends Document {
    name: string;
    description?: string;
    increments: number[];
    questionCount: number;
    timeLimitMinutes?: number;
    passMarkPercent: number;
    randomizeQuestions: boolean;
    randomizeAnswers: boolean;
    enabled: boolean;
    createdBy?: mongoose.Types.ObjectId;
}
export declare const ExamConfig: mongoose.Model<ExamConfigDocument, {}, {}, {}, mongoose.Document<unknown, {}, ExamConfigDocument, {}, mongoose.DefaultSchemaOptions> & ExamConfigDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ExamConfigDocument>;
//# sourceMappingURL=ExamConfig.d.ts.map