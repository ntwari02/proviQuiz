import mongoose, { Document } from "mongoose";
export interface SystemSettingsDocument extends Document {
    systemName: string;
    logoUrl?: string;
    examRules?: string;
    passingCriteria?: number;
    questionRandomization: boolean;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
}
export declare const SystemSettings: mongoose.Model<SystemSettingsDocument, {}, {}, {}, mongoose.Document<unknown, {}, SystemSettingsDocument, {}, mongoose.DefaultSchemaOptions> & SystemSettingsDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, SystemSettingsDocument>;
//# sourceMappingURL=SystemSettings.d.ts.map