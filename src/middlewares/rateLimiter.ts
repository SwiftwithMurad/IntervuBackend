import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "development" ? 10000 : env.RATE_LIMIT_MAX,
  message: {
    success: false,
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
