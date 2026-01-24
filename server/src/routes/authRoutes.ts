import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { User } from "../models/User";
import { signToken, authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { OAuth2Client } from "google-auth-library";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? "https://proviquiz-2.onrender.com/api/auth/google/callback";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://proviquiz-9yw9.vercel.app";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const { email, password, name } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createBody: any = { email, passwordHash, role: "student" };
    if (name) createBody.name = name;
    const user: any = await User.create(createBody);
    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

function requireGoogleConfig() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
}

router.get("/google", async (req, res) => {
  try {
    requireGoogleConfig();
    const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "/";
    const state = Buffer.from(JSON.stringify({ redirect })).toString("base64url");

    const client = new OAuth2Client({
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      redirectUri: GOOGLE_REDIRECT_URI,
    });

    const url = client.generateAuthUrl({
      access_type: "online",
      prompt: "select_account",
      scope: ["openid", "profile", "email"],
      state,
    });

    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google OAuth not configured" });
  }
});

router.get("/google/callback", async (req, res) => {
  try {
    requireGoogleConfig();
    const code = req.query.code as string | undefined;
    const stateParam = req.query.state as string | undefined;
    if (!code) return res.status(400).json({ message: "Missing code" });

    let redirect = "/";
    if (stateParam) {
      try {
        const parsed = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
        if (typeof parsed?.redirect === "string") redirect = parsed.redirect;
      } catch {
        // ignore malformed state
      }
    }

    const client = new OAuth2Client({
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
      redirectUri: GOOGLE_REDIRECT_URI,
    });

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.status(400).json({ message: "Failed to get id_token from Google" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID!,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(400).json({ message: "Invalid Google profile" });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name;

    let user: any = await User.findOne({ email });
    if (!user) {
      const createBody: any = { email, googleId, passwordHash: null, role: "student" };
      if (name) createBody.name = name;
      user = await User.create(createBody);
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = signToken(user.id);
    const dest = `${FRONTEND_URL}/oauth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(
      redirect
    )}`;
    res.redirect(dest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google OAuth failed" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Use Google Sign-In for this account." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ message: "Not authenticated" });
  const user = await User.findById(req.userId).select("email name role createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt });
});

const forgotSchema = z.object({
  email: z.string().email(),
});

// NOTE: In production you would EMAIL the token. For now, we return it in the response for simplicity.
router.post("/forgot-password", async (req, res) => {
  try {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const { email } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      // do not reveal user existence
      return res.json({ message: "If that email exists, a reset token has been generated." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    user.resetToken = token;
    user.resetTokenExpires = expires;
    await user.save();

    res.json({
      message: "Reset token generated.",
      // For now we return the token so you can test via frontend/postman.
      resetToken: token,
      expiresAt: expires,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const resetSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6),
});

router.post("/reset-password", async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const { token, newPassword } = parsed.data;

    const now = new Date();
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: now },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;


