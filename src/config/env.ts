import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3000", 10),

  MONGODB_URI: process.env.MONGODB_URI ?? "",

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "mail adress",

  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS ?? "900000",
    10,
  ),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
} as const;
