"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const questionRoutes_1 = __importDefault(require("./routes/questionRoutes"));
const examRoutes_1 = __importDefault(require("./routes/examRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const examConfigRoutes_1 = __importDefault(require("./routes/examConfigRoutes"));
const incrementRoutes_1 = __importDefault(require("./routes/incrementRoutes"));
const analyticsAdminRoutes_1 = __importDefault(require("./routes/analyticsAdminRoutes"));
const systemSettingsRoutes_1 = __importDefault(require("./routes/systemSettingsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Basic rate limit on auth endpoints to mitigate brute force
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use("/api/auth", authLimiter, authRoutes_1.default);
app.use("/api/questions", questionRoutes_1.default);
app.use("/api/exams", examRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/analytics", analyticsRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/admin", categoryRoutes_1.default);
app.use("/api/admin", examConfigRoutes_1.default);
app.use("/api/admin", incrementRoutes_1.default);
app.use("/api/admin", analyticsAdminRoutes_1.default);
app.use("/api/admin", systemSettingsRoutes_1.default);
const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI;
async function start() {
    if (!MONGO_URI) {
        console.error("Missing MONGO_URI. Create server/.env with MONGO_URI=...");
        process.exit(1);
    }
    await mongoose_1.default.connect(MONGO_URI, { dbName: "proviQuiz" });
    app.listen(PORT, () => {
        console.log(`API listening on http://localhost:${PORT}`);
    });
}
start().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map