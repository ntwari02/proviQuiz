import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

// GET /api/users/profile - current user profile
router.get("/profile", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
  const user = await User.findById(req.userId).select("email name role createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  });
});

export default router;


