import mongoose, { Document } from "mongoose";
export interface UserDocument extends Document {
    email: string;
    name?: string;
    passwordHash?: string | null;
    googleId?: string | null;
    role: "student" | "admin" | "superadmin";
    resetToken?: string | null;
    resetTokenExpires?: Date | null;
    active?: boolean;
    banned?: boolean;
    bannedReason?: string;
    bannedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}, mongoose.DefaultSchemaOptions> & UserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, UserDocument>;
//# sourceMappingURL=User.d.ts.map