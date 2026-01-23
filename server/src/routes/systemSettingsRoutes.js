"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const SystemSettings_1 = require("../models/SystemSettings");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
const settingsSchema = zod_1.z.object({
    systemName: zod_1.z.string().min(1).optional(),
    logoUrl: zod_1.z.string().url().optional(),
    examRules: zod_1.z.string().optional(),
    passingCriteria: zod_1.z.number().int().min(0).max(100).optional(),
    questionRandomization: zod_1.z.boolean().optional(),
    maintenanceMode: zod_1.z.boolean().optional(),
    maintenanceMessage: zod_1.z.string().optional(),
});
// GET /api/admin/settings - Get system settings
router.get("/settings", async (_req, res) => {
    try {
        let settings = await SystemSettings_1.SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings_1.SystemSettings.create({});
        }
        res.json(settings);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PUT /api/admin/settings - Update system settings
router.put("/settings", async (req, res) => {
    try {
        const parsed = settingsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        let settings = await SystemSettings_1.SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings_1.SystemSettings.create(parsed.data);
        }
        else {
            Object.assign(settings, parsed.data);
            await settings.save();
        }
        res.json(settings);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=systemSettingsRoutes.js.map