"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Question_1 = require("../models/Question");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/questions/random?limit=20
router.get("/random", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const pipeline = [
            { $match: { isDeleted: { $ne: true } } },
            { $sample: { size: limit } },
        ];
        const docs = await Question_1.Question.aggregate(pipeline);
        // By default we send correct answers; frontend can choose when to reveal.
        res.json(docs);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/questions/all?limit=100&skip=0  (for Question Bank browsing)
router.get("/all", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 100, 200);
        const skip = Number(req.query.skip) || 0;
        const [items, total] = await Promise.all([
            Question_1.Question.find({ isDeleted: { $ne: true } })
                .sort({ id: 1 })
                .skip(skip)
                .limit(limit),
            Question_1.Question.countDocuments({ isDeleted: { $ne: true } }),
        ]);
        res.json({ items, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// Alias: GET /api/questions with pagination & optional category filter
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 100, 200);
        const skip = Number(req.query.skip) || 0;
        const category = typeof req.query.category === "string" ? req.query.category : undefined;
        const query = {};
        if (category)
            query.category = category;
        query.isDeleted = { $ne: true };
        const [items, total] = await Promise.all([
            Question_1.Question.find(query).sort({ id: 1 }).skip(skip).limit(limit),
            Question_1.Question.countDocuments(query),
        ]);
        res.json({ items, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// ===== Admin question management =====
const optionSchema = zod_1.z.object({
    a: zod_1.z.string().min(1),
    b: zod_1.z.string().min(1),
    c: zod_1.z.string().min(1),
    d: zod_1.z.string().min(1),
});
const questionBodySchema = zod_1.z.object({
    id: zod_1.z.number().int().positive().optional(),
    question: zod_1.z.string().min(5),
    options: optionSchema,
    correct: zod_1.z.enum(["a", "b", "c", "d"]),
    explanation: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
    imageUrl: zod_1.z.string().url().optional(),
    topic: zod_1.z.string().optional(),
    increment: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]).optional(),
    status: zod_1.z.enum(["draft", "published"]).optional(),
});
// Create single question
router.post("/", auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    try {
        const parsed = questionBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(400)
                .json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const data = parsed.data;
        const nextId = data.id ??
            ((await Question_1.Question.findOne().sort({ id: -1 }).select("id"))?.id || 0) + 1;
        const created = await Question_1.Question.create({
            ...data,
            id: nextId,
            isDeleted: false,
        });
        res.status(201).json(created);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// Bulk import questions
router.post("/bulk", auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    try {
        if (!Array.isArray(req.body)) {
            return res.status(400).json({ message: "Expected an array of questions" });
        }
        const items = [];
        for (const raw of req.body) {
            const parsed = questionBodySchema.safeParse(raw);
            if (!parsed.success) {
                return res
                    .status(400)
                    .json({ message: "Invalid item in bulk import", errors: parsed.error.issues });
            }
            items.push(parsed.data);
        }
        const maxExisting = (await Question_1.Question.findOne().sort({ id: -1 }).select("id"))?.id || 0;
        let currentId = maxExisting + 1;
        const docs = items.map((q) => {
            const id = q.id ?? currentId++;
            return { ...q, id, isDeleted: false };
        });
        const result = await Question_1.Question.insertMany(docs);
        res.status(201).json({ inserted: result.length });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// Update question
router.put("/:id", auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    try {
        const numericId = Number(req.params.id);
        if (Number.isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid id" });
        }
        const parsed = questionBodySchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res
                .status(400)
                .json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const updated = await Question_1.Question.findOneAndUpdate({ id: numericId }, { $set: parsed.data }, { new: true });
        if (!updated)
            return res.status(404).json({ message: "Question not found" });
        res.json(updated);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// Soft delete question
router.delete("/:id", auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]), async (req, res) => {
    try {
        const numericId = Number(req.params.id);
        if (Number.isNaN(numericId)) {
            return res.status(400).json({ message: "Invalid id" });
        }
        const updated = await Question_1.Question.findOneAndUpdate({ id: numericId }, { $set: { isDeleted: true } }, { new: true });
        if (!updated)
            return res.status(404).json({ message: "Question not found" });
        res.json({ message: "Question deleted (soft)", id: numericId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=questionRoutes.js.map