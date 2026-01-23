import { Router } from "express";
import { z } from "zod";
import { SystemSettings } from "../models/SystemSettings";
import { authMiddleware, requireRole } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware, requireRole(["admin", "superadmin"]));

const settingsSchema = z.object({
  systemName: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  examRules: z.string().optional(),
  passingCriteria: z.number().int().min(0).max(100).optional(),
  questionRandomization: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
});

// GET /api/admin/settings - Get system settings
router.get("/settings", async (_req: AuthRequest, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/settings - Update system settings
router.put("/settings", async (req: AuthRequest, res) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create(parsed.data as any);
    } else {
      Object.assign(settings, parsed.data as any);
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
