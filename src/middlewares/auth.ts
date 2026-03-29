import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models";
import { AppError, ERROR_CODES } from "../utils/errors";
import { IUser } from "../models/User";

export interface JwtPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        "Missing or invalid Authorization header",
        401,
      );
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (decoded.type !== "access") {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid token type", 401);
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, "User not found", 401);
    }
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(ERROR_CODES.TOKEN_EXPIRED, "Access token expired", 401),
      );
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid token", 401));
    }
    next(err);
  }
}

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  console.log("[Admin] ADMIN_IDS:", process.env.ADMIN_IDS);
  console.log("[Admin] User ID:", req.user!._id.toString());
  const adminIds = process.env.ADMIN_IDS?.split(",") ?? [];
  if (!adminIds.includes(req.user!._id.toString())) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}