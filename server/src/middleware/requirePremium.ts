import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth";
import { getPremiumAccess, type PremiumAccessInfo } from "../services/premiumAccessService";
import { isPremiumFeatureEnabled, type PremiumFeatureKey } from "../services/platformSettingsService";

export interface PremiumRequest extends AuthRequest {
  premiumAccess?: PremiumAccessInfo;
}

export function requirePremium(feature?: PremiumFeatureKey) {
  return async (req: PremiumRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const access = await getPremiumAccess(req.userId);
    req.premiumAccess = access;

    if (!access.isPremium) {
      return res.status(403).json({
        message: "Premium subscription required",
        code: "PREMIUM_REQUIRED",
        tier: access.tier,
      });
    }

    if (feature) {
      const enabled = await isPremiumFeatureEnabled(feature);
      if (!enabled) {
        return res.status(403).json({
          message: "This premium feature is currently disabled",
          code: "FEATURE_DISABLED",
          feature,
        });
      }
    }

    next();
  };
}

export async function optionalPremiumContext(req: PremiumRequest, _res: Response, next: NextFunction) {
  if (req.userId) {
    req.premiumAccess = await getPremiumAccess(req.userId);
  }
  next();
}
