"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Question_1 = require("../models/Question");
const ExamSession_1 = require("../models/ExamSession");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware, (0, auth_1.requireRole)(["admin", "superadmin"]));
// GET /api/admin/overview
router.get("/overview", async (_req, res) => {
    try {
        const [userCount, questionCount, examCount] = await Promise.all([
            User_1.User.countDocuments({}),
            Question_1.Question.countDocuments({ isDeleted: { $ne: true } }),
            ExamSession_1.ExamSession.countDocuments({}),
        ]);
        // last 14 days exam volume trend
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const examsByDay = await ExamSession_1.ExamSession.aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: {
                        y: { $year: "$createdAt" },
                        m: { $month: "$createdAt" },
                        d: { $dayOfMonth: "$createdAt" },
                    },
                    exams: { $sum: 1 },
                    totalCorrect: { $sum: "$score" },
                    totalQuestions: { $sum: "$totalQuestions" },
                },
            },
            { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
        ]);
        const trend = examsByDay.map((x) => {
            const date = new Date(x._id.y, x._id.m - 1, x._id.d);
            const accuracy = x.totalQuestions > 0 ? x.totalCorrect / x.totalQuestions : 0;
            return { date, exams: x.exams, accuracy };
        });
        // Questions per increment
        const questionsByIncrement = await Question_1.Question.aggregate([
            { $match: { isDeleted: { $ne: true }, increment: { $in: [1, 2, 3] } } },
            {
                $group: {
                    _id: "$increment",
                    count: { $sum: 1 },
                    published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Pass rate (exams with >= 60% accuracy)
        const passThreshold = 0.6;
        const allExams = await ExamSession_1.ExamSession.find({}).select("score totalQuestions");
        const totalExamCount = allExams.length;
        const passedExams = allExams.filter((e) => e.totalQuestions > 0 && e.score / e.totalQuestions >= passThreshold).length;
        const passRate = totalExamCount > 0 ? passedExams / totalExamCount : 0;
        // Active exam configs
        const ExamConfig = (await Promise.resolve().then(() => __importStar(require("../models/ExamConfig")))).ExamConfig;
        const activeExamConfigs = await ExamConfig.countDocuments({ enabled: true });
        res.json({
            userCount,
            questionCount,
            examCount,
            trend,
            questionsByIncrement: questionsByIncrement.map((q) => ({
                increment: q._id,
                total: q.count,
                published: q.published,
            })),
            passRate,
            activeExamConfigs,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/users?limit=25&skip=0&q=foo
router.get("/users", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 25, 200);
        const skip = Math.max(0, Number(req.query.skip) || 0);
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        const query = {};
        if (q) {
            query.$or = [
                { email: { $regex: q, $options: "i" } },
                { name: { $regex: q, $options: "i" } },
            ];
        }
        const [items, total] = await Promise.all([
            User_1.User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("email name role createdAt googleId active banned bannedReason bannedAt"),
            User_1.User.countDocuments(query),
        ]);
        res.json({
            items: items.map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                createdAt: u.createdAt,
                hasGoogle: Boolean(u.googleId),
                active: u.active ?? true,
                banned: u.banned ?? false,
                bannedReason: u.bannedReason,
                bannedAt: u.bannedAt,
            })),
            total,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
const updateRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["student", "admin", "superadmin"]),
});
// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
    try {
        const parsed = updateRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const updated = await User_1.User.findByIdAndUpdate(req.params.id, { $set: { role: parsed.data.role } }, { new: true }).select("email name role createdAt");
        if (!updated)
            return res.status(404).json({ message: "User not found" });
        res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, createdAt: updated.createdAt });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/users/:id/activate - Activate/deactivate user
router.patch("/users/:id/activate", async (req, res) => {
    try {
        const active = req.body.active === true;
        const updated = await User_1.User.findByIdAndUpdate(req.params.id, { $set: { active } }, { new: true }).select("email name role active");
        if (!updated)
            return res.status(404).json({ message: "User not found" });
        res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, active: updated.active ?? true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// PATCH /api/admin/users/:id/ban - Ban/unban user
const banSchema = zod_1.z.object({
    banned: zod_1.z.boolean(),
    reason: zod_1.z.string().optional(),
});
router.patch("/users/:id/ban", async (req, res) => {
    try {
        const parsed = banSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const update = { banned: parsed.data.banned };
        if (parsed.data.banned) {
            update.bannedAt = new Date();
            update.bannedReason = parsed.data.reason || "No reason provided";
        }
        else {
            update.bannedAt = null;
            update.bannedReason = null;
        }
        const updated = await User_1.User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select("email name role banned bannedReason bannedAt");
        if (!updated)
            return res.status(404).json({ message: "User not found" });
        res.json({
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            banned: updated.banned ?? false,
            bannedReason: updated.bannedReason,
            bannedAt: updated.bannedAt,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// POST /api/admin/users - Create new user (admin action)
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum(["student", "admin", "superadmin"]).default("student"),
});
router.post("/users", async (req, res) => {
    try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const { email, password, name, role } = parsed.data;
        const existing = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const createBody = {
            email: email.toLowerCase(),
            passwordHash,
            role: role || "student",
        };
        if (name)
            createBody.name = name;
        const user = await User_1.User.create(createBody);
        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// POST /api/admin/users/:id/reset-password - Reset user password (admin action)
const resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(6),
});
router.post("/users/:id/reset-password", async (req, res) => {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
        }
        const user = await User_1.User.findById(req.params.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (!user.passwordHash && user.googleId) {
            return res.status(400).json({ message: "User uses Google Sign-In. Cannot reset password." });
        }
        const passwordHash = await bcryptjs_1.default.hash(parsed.data.newPassword, 10);
        user.passwordHash = passwordHash;
        await user.save();
        res.json({ message: "Password reset successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/users/:id/progress - Get user progress/stats
router.get("/users/:id/progress", async (req, res) => {
    try {
        const userId = req.params.id;
        const exams = await ExamSession_1.ExamSession.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
        const totalExams = exams.length;
        const totalQuestions = exams.reduce((sum, e) => sum + e.totalQuestions, 0);
        const totalCorrect = exams.reduce((sum, e) => sum + e.score, 0);
        const averageAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
        const recentExams = exams.slice(0, 10).map((e) => ({
            id: e.id,
            score: e.score,
            totalQuestions: e.totalQuestions,
            accuracy: e.totalQuestions > 0 ? e.score / e.totalQuestions : 0,
            durationSeconds: e.durationSeconds,
            mode: e.mode,
            createdAt: e.createdAt,
        }));
        res.json({
            totalExams,
            totalQuestions,
            totalCorrect,
            averageAccuracy,
            recentExams,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/users/:id/exams - Get all exam attempts for a user
router.get("/users/:id/exams", async (req, res) => {
    try {
        const userId = req.params.id;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const exams = await ExamSession_1.ExamSession.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select("score totalQuestions durationSeconds mode createdAt");
        res.json(exams);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// GET /api/admin/exams?limit=25&skip=0
router.get("/exams", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 25, 200);
        const skip = Math.max(0, Number(req.query.skip) || 0);
        const items = await ExamSession_1.ExamSession.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "u",
                },
            },
            { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    id: "$_id",
                    createdAt: 1,
                    mode: 1,
                    score: 1,
                    totalQuestions: 1,
                    durationSeconds: 1,
                    user: {
                        id: "$u._id",
                        email: "$u.email",
                        name: "$u.name",
                        role: "$u.role",
                    },
                },
            },
        ]);
        const total = await ExamSession_1.ExamSession.countDocuments({});
        res.json({ items, total });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map