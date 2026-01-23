import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes";
import questionRoutes from "./routes/questionRoutes";
import examRoutes from "./routes/examRoutes";
import userRoutes from "./routes/userRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import adminRoutes from "./routes/adminRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import examConfigRoutes from "./routes/examConfigRoutes";
import incrementRoutes from "./routes/incrementRoutes";
import analyticsAdminRoutes from "./routes/analyticsAdminRoutes";
import systemSettingsRoutes from "./routes/systemSettingsRoutes";

dotenv.config();

const app = express();

// Basic rate limit on auth endpoints to mitigate brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", categoryRoutes);
app.use("/api/admin", examConfigRoutes);
app.use("/api/admin", incrementRoutes);
app.use("/api/admin", analyticsAdminRoutes);
app.use("/api/admin", systemSettingsRoutes);

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI. Create server/.env with MONGO_URI=...");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI, { dbName: "proviQuiz" });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});


