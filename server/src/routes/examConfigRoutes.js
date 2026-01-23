"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const ExamConfig_1 = require("../models/ExamConfig");
const Question_1 = require("../models/Question");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
const examConfigSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    increments: zod_1.z.array(zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)])).min(1),
    questionCount: zod_1.z.number().int().positive(),
    timeLimitMinutes: zod_1.z.number().int().positive().optional(),
    passMarkPercent: zod_1.z.number().int().min(0).max(100),
    randomizeQuestions: zod_1.z.boolean().optional(),
    randomizeAnswers: zod_1.z.boolean().optional(),
    enabled: zod_1.z.boolean().optional(),
});
// GET /api/admin/exam-configs - List all exam configurations
router.get("/exam-configs", async (_req, res) => {
    try {
        const configs = await ExamConfig_1.ExamConfig.find().sort({ createdAt: -1 });
        res.json(configs);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/exam-configs/:id - Get single exam config
router.get("/exam-configs/:id", async (req, res) => {
    try {
        const config = await ExamConfig_1.ExamConfig.findById(req.params.id);
        if (!config)
            return res.status(404).json({ message: "Exam config not found" });
        res.json(config);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// POST /api/admin/exam-configs - Create exam configuration
router.post("/exam-configs", async (req, res) => {
    try {
        const parsed = examConfigSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const config = await ExamConfig_1.ExamConfig.create({
            ...parsed.data,
            createdBy: req.userId,
        });
        res.status(201).json(config);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PUT /api/admin/exam-configs/:id - Update exam configuration
router.put("/exam-configs/:id", async (req, res) => {
    try {
        const parsed = examConfigSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const config = await ExamConfig_1.ExamConfig.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
        if (!config)
            return res.status(404).json({ message: "Exam config not found" });
        res.json(config);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// DELETE /api/admin/exam-configs/:id - Delete exam configuration
router.delete("/exam-configs/:id", async (req, res) => {
    try {
        const config = await ExamConfig_1.ExamConfig.findByIdAndDelete(req.params.id);
        if (!config)
            return res.status(404).json({ message: "Exam config not found" });
        res.json({ message: "Exam config deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/exam-configs/:id/preview - Preview questions that would be included
router.get("/exam-configs/:id/preview", async (req, res) => {
    try {
        const config = await ExamConfig_1.ExamConfig.findById(req.params.id);
        if (!config)
            return res.status(404).json({ message: "Exam config not found" });
        const match = {
            isDeleted: { $ne: true },
            status: "published",
            increment: { $in: config.increments },
        };
        const totalAvailable = await Question_1.Question.countDocuments(match);
        const questions = await Question_1.Question.find(match).limit(Math.min(config.questionCount, totalAvailable));
        res.json({
            config,
            totalAvailable,
            previewQuestions: questions.length,
            questions: questions.map((q) => ({
                id: q.id,
                question: q.question,
                increment: q.increment,
                category: q.category,
            })),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=examConfigRoutes.js.map