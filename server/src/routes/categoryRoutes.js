"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Question_1 = require("../models/Question");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
// GET /api/admin/categories - Get all unique categories with question counts
router.get("/categories", async (_req, res) => {
    try {
        const categories = await Question_1.Question.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                    category: { $exists: true, $ne: null, $nin: [null, ""] },
                },
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json(categories.map((c) => ({
            name: c._id,
            questionCount: c.count,
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/topics - Get all unique topics with question counts
router.get("/topics", async (_req, res) => {
    try {
        const topics = await Question_1.Question.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                    topic: { $exists: true, $ne: null, $nin: [null, ""] },
                },
            },
            {
                $group: {
                    _id: "$topic",
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json(topics.map((t) => ({
            name: t._id,
            questionCount: t.count,
        })));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/categories/rename - Rename a category across all questions
const renameCategorySchema = zod_1.z.object({
    oldName: zod_1.z.string().min(1),
    newName: zod_1.z.string().min(1),
});
router.patch("/categories/rename", async (req, res) => {
    try {
        const parsed = renameCategorySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const { oldName, newName } = parsed.data;
        const result = await Question_1.Question.updateMany({ category: oldName, isDeleted: { $ne: true } }, { $set: { category: newName } });
        res.json({ message: "Category renamed", updated: result.modifiedCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/topics/rename - Rename a topic across all questions
const renameTopicSchema = zod_1.z.object({
    oldName: zod_1.z.string().min(1),
    newName: zod_1.z.string().min(1),
});
router.patch("/topics/rename", async (req, res) => {
    try {
        const parsed = renameTopicSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const { oldName, newName } = parsed.data;
        const result = await Question_1.Question.updateMany({ topic: oldName, isDeleted: { $ne: true } }, { $set: { topic: newName } });
        res.json({ message: "Topic renamed", updated: result.modifiedCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// DELETE /api/admin/categories/:name - Remove category from all questions (set to null)
router.delete("/categories/:name", async (req, res) => {
    try {
        const name = typeof req.params.name === "string" ? decodeURIComponent(req.params.name) : "";
        if (!name)
            return res.status(400).json({ message: "Invalid category name" });
        const result = await Question_1.Question.updateMany({ category: name, isDeleted: { $ne: true } }, { $unset: { category: "" } });
        res.json({ message: "Category removed", updated: result.modifiedCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// DELETE /api/admin/topics/:name - Remove topic from all questions (set to null)
router.delete("/topics/:name", async (req, res) => {
    try {
        const name = typeof req.params.name === "string" ? decodeURIComponent(req.params.name) : "";
        if (!name)
            return res.status(400).json({ message: "Invalid topic name" });
        const result = await Question_1.Question.updateMany({ topic: name, isDeleted: { $ne: true } }, { $unset: { topic: "" } });
        res.json({ message: "Topic removed", updated: result.modifiedCount });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map