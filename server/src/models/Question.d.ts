import mongoose, { Document } from "mongoose";
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
    topic?: string;
    source?: string;
    increment?: 1 | 2 | 3;
    status?: "draft" | "published";
    isDeleted?: boolean;
}
export declare const Question: mongoose.Model<QuestionDocument, {}, {}, {}, mongoose.Document<unknown, {}, QuestionDocument, {}, mongoose.DefaultSchemaOptions> & QuestionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, QuestionDocument>;
//# sourceMappingURL=Question.d.ts.map