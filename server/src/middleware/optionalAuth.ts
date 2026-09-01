import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/** Attach userId when a valid Bearer token is present; never reject. */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
