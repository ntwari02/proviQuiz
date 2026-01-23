"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ExamSession_1 = require("../models/ExamSession");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
// GET /api/admin/analytics/overview - Comprehensive analytics
router.get("/analytics/overview", async (_req, res) => {
    try {
        const allExams = await ExamSession_1.ExamSession.find({}).select("score totalQuestions mode createdAt");
        const totalExams = allExams.length;
        // Pass/Fail stats
        const passThreshold = 0.6;
        const passed = allExams.filter((e) => e.totalQuestions > 0 && e.score / e.totalQuestions >= passThreshold).length;
        const failed = totalExams - passed;
        // Average scores
        const totalQuestions = allExams.reduce((sum, e) => sum + e.totalQuestions, 0);
        const totalCorrect = allExams.reduce((sum, e) => sum + e.score, 0);
        const averageAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
        // Most failed questions
        const mostFailed = await ExamSession_1.ExamSession.aggregate([
            { $unwind: "$answers" },
            { $match: { "answers.isCorrect": false } },
            {
                $group: {
                    _id: "$answers.questionId",
                    missedCount: { $sum: 1 },
                },
            },
            { $sort: { missedCount: -1 } },
            { $limit: 20 },
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
                    questionId: "$_id",
                    missedCount: 1,
                    question: "$q.question",
                    category: "$q.category",
                    increment: "$q.increment",
                },
            },
        ]);
        // Average score per increment
        const examsWithIncrements = await ExamSession_1.ExamSession.aggregate([
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
                    _id: { examId: "$_id", increment: "$q.increment" },
                    correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
                    total: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.increment",
                    totalCorrect: { $sum: "$correct" },
                    totalQuestions: { $sum: "$total" },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const perIncrement = examsWithIncrements.map((e) => ({
            increment: e._id,
            averageAccuracy: e.totalQuestions > 0 ? e.totalCorrect / e.totalQuestions : 0,
            totalQuestions: e.totalQuestions,
        }));
        res.json({
            totalExams,
            passed,
            failed,
            passRate: totalExams > 0 ? passed / totalExams : 0,
            averageAccuracy,
            mostFailedQuestions: mostFailed,
            averageByIncrement: perIncrement,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=analyticsAdminRoutes.js.map