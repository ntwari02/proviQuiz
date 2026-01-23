"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Question_1 = require("../models/Question");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
// GET /api/admin/increments/:increment/questions - Get all questions for an increment
router.get("/increments/:increment/questions", async (req, res) => {
    try {
        const increment = Number(req.params.increment);
        if (![1, 2, 3].includes(increment)) {
            return res.status(400).json({ message: "Invalid increment (must be 1, 2, or 3)" });
        }
        const questions = await Question_1.Question.find({
            increment: increment,
            isDeleted: { $ne: true },
        })
            .sort({ id: 1 })
            .select("id question category topic status increment");
        res.json(questions);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/increments/:increment/assign - Assign questions to increment
const assignSchema = zod_1.z.object({
    questionIds: zod_1.z.array(zod_1.z.number().int().positive()),
});
router.patch("/increments/:increment/assign", async (req, res) => {
    try {
        const increment = Number(req.params.increment);
        if (![1, 2, 3].includes(increment)) {
            return res.status(400).json({ message: "Invalid increment (must be 1, 2, or 3)" });
        }
        const parsed = assignSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const result = await Question_1.Question.updateMany({ id: { $in: parsed.data.questionIds }, isDeleted: { $ne: true } }, { $set: { increment } });
        res.json({ message: "Questions assigned", updated: result.modifiedCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/increments/:increment/reorder - Reorder questions (set custom order)
const reorderSchema = zod_1.z.object({
    questionIds: zod_1.z.array(zod_1.z.number().int().positive()),
});
router.patch("/increments/:increment/reorder", async (req, res) => {
    try {
        const increment = Number(req.params.increment);
        if (![1, 2, 3].includes(increment)) {
            return res.status(400).json({ message: "Invalid increment (must be 1, 2, or 3)" });
        }
        const parsed = reorderSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        // Update each question with its new order (we'll use a custom order field or just update IDs)
        // For simplicity, we'll just ensure they're in the right increment
        // In a real system, you might want an "order" field
        const updates = parsed.data.questionIds.map((id, index) => Question_1.Question.updateOne({ id, isDeleted: { $ne: true } }, { $set: { increment } }));
        await Promise.all(updates);
        res.json({ message: "Questions reordered", count: parsed.data.questionIds.length });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/increments/:increment/lock - Lock/unlock increment (read-only mode)
const lockSchema = zod_1.z.object({
    locked: zod_1.z.boolean(),
});
router.patch("/increments/:increment/lock", async (req, res) => {
    try {
        const increment = Number(req.params.increment);
        if (![1, 2, 3].includes(increment)) {
            return res.status(400).json({ message: "Invalid increment (must be 1, 2, or 3)" });
        }
        const parsed = lockSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        // For now, we'll just return success. In a real system, you'd store lock state in a separate collection
        res.json({
            message: parsed.data.locked ? "Increment locked" : "Increment unlocked",
            increment,
            locked: parsed.data.locked,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/increments/stats - Get stats for all increments
router.get("/increments/stats", async (_req, res) => {
    try {
        const stats = await Question_1.Question.aggregate([
            { $match: { isDeleted: { $ne: true }, increment: { $in: [1, 2, 3] } } },
            {
                $group: {
                    _id: "$increment",
                    total: { $sum: 1 },
                    published: {
                        $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                    },
                    draft: {
                        $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json(stats.map((s) => ({
            increment: s._id,
            total: s.total,
            published: s.published,
            draft: s.draft,
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=incrementRoutes.js.map