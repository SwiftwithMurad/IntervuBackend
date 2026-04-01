import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { AppError, ERROR_CODES } from "../utils/errors";
import { env } from "../config/env";

export async function me(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
    }
    res.json({
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      plan: req.user.plan,
      isEmailVerified: req.user.isEmailVerified,
      links: {
        blog: env.BLOG_URL,
        termsOfUse: env.TERMS_OF_USE_URL,
        privacyPolicy: env.PRIVACY_POLICY_URL,
      },
    });
  } catch (e) {
    next(e);
  }
}
