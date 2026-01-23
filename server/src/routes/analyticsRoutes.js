"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ExamSession_1 = require("../models/ExamSession");
const router = (0, express_1.Router)();
// Helpers
const safePct = (num, den) => (den <= 0 ? 0 : num / den);
// GET /api/analytics/performance
// Returns: examCount, averageAccuracy, recent trend, accuracy by category/topic (if present on questions)
router.get("/performance", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ message: "Not authenticated" });
        const matchUser = { user: { $eq: userId } };
        // Overall stats
        const overallAgg = await ExamSession_1.ExamSession.aggregate([
            { $match: matchUser },
            {
                $group: {
                    _id: null,
                    examCount: { $sum: 1 },
                    totalCorrect: { $sum: "$score" },
                    totalQuestions: { $sum: "$totalQuestions" },
                    totalDurationSeconds: { $sum: "$durationSeconds" },
                },
            },
        ]);
        const overall = overallAgg[0] ?? {
            examCount: 0,
            totalCorrect: 0,
            totalQuestions: 0,
            totalDurationSeconds: 0,
        };
        // Trend: last 10 exams with accuracy
        const recentExams = await ExamSession_1.ExamSession.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("score totalQuestions durationSeconds createdAt mode");
        const recent = recentExams
            .map((e) => ({
            createdAt: e.createdAt,
            mode: e.mode,
            accuracy: safePct(e.score, Math.max(e.totalQuestions, 1)),
            score: e.score,
            totalQuestions: e.totalQuestions,
            durationSeconds: e.durationSeconds,
        }))
            .reverse();
        // By-category and by-topic accuracy using $lookup into questions by numeric id.
        // If questions have no category/topic, they will appear as null -> "uncategorized".
        const byCategory = await ExamSession_1.ExamSession.aggregate([
            { $match: matchUser },
            { $unwind: "$answers" },
            {
                $lookup: {
                    from: "questions",
                    localField: "answers.questionId",
                    foreignField: "id",
                    as: "q",
                },
            },
            { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$q.category", "uncategorized"] },
                    total: { $sum: 1 },
                    correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
                },
            },
            { $sort: { total: -1 } },
        ]);
        const byTopic = await ExamSession_1.ExamSession.aggregate([
            { $match: matchUser },
            { $unwind: "$answers" },
            {
                $lookup: {
                    from: "questions",
                    localField: "answers.questionId",
                    foreignField: "id",
                    as: "q",
                },
            },
            { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$q.topic", "uncategorized"] },
                    total: { $sum: 1 },
                    correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
                },
            },
            { $sort: { total: -1 } },
        ]);
        res.json({
            examCount: overall.examCount,
            averageAccuracy: safePct(overall.totalCorrect, Math.max(overall.totalQuestions, 1)),
            totalDurationSeconds: overall.totalDurationSeconds,
            recent,
            byCategory: byCategory.map((x) => ({
                category: x._id,
                total: x.total,
                correct: x.correct,
                accuracy: safePct(x.correct, Math.max(x.total, 1)),
            })),
            byTopic: byTopic.map((x) => ({
                topic: x._id,
                total: x.total,
                correct: x.correct,
                accuracy: safePct(x.correct, Math.max(x.total, 1)),
            })),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/analytics/weak-areas?limit=10
// Returns: lowest-accuracy categories + most missed questions
router.get("/weak-areas", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ message: "Not authenticated" });
        const limit = Math.min(Number(req.query.limit) || 10, 50);
        const matchUser = { user: { $eq: userId } };
        // Worst categories by accuracy (only categories with enough attempts)
        const worstCategories = await ExamSession_1.ExamSession.aggregate([
            { $match: matchUser },
            { $unwind: "$answers" },
            {
                $lookup: {
                    from: "questions",
                    localField: "answers.questionId",
                    foreignField: "id",
                    as: "q",
                },
            },
            { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$q.category", "uncategorized"] },
                    total: { $sum: 1 },
                    correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
                },
            },
            { $match: { total: { $gte: 5 } } },
            {
                $addFields: {
                    accuracy: { $divide: ["$correct", "$total"] },
                },
            },
            { $sort: { accuracy: 1, total: -1 } },
            { $limit: limit },
        ]);
        // Most missed questions
        const mostMissed = await ExamSession_1.ExamSession.aggregate([
            { $match: matchUser },
            { $unwind: "$answers" },
            { $match: { "answers.isCorrect": false } },
            {
                $group: {
                    _id: "$answers.questionId",
                    missedCount: { $sum: 1 },
                },
            },
            { $sort: { missedCount: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: "questions",
                    localField: "_id",
                    foreignField: "id",
                    as: "q",
                },
            },
            { $unwind: { path: "$q", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    questionId: "$_id",
                    missedCount: 1,
                    question: "$q.question",
                    category: { $ifNull: ["$q.category", "uncategorized"] },
                    topic: { $ifNull: ["$q.topic", "uncategorized"] },
                },
            },
        ]);
        res.json({
            worstCategories: worstCategories.map((x) => ({
                category: x._id,
                total: x.total,
                correct: x.correct,
                accuracy: x.accuracy,
            })),
            mostMissed,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map