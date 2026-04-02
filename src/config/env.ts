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
  /** Shown as the sender display name in the inbox (Brevo `sender.name`). */
  EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME ?? "Intervu",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  TERMS_OF_USE_URL: process.env.TERMS_OF_USE_URL ?? "",
  PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL ?? "",
  BLOG_URL: process.env.BLOG_URL ?? "",
  /**
   * Public origin for absolute URLs in emails (e.g. https://intervu-backend.vercel.app).
   * Many clients block data: images; logo uses `${PUBLIC_BASE_URL}/email-assets/logo.png`.
   * On Vercel, `VERCEL_URL` is used as fallback if this is unset.
   */
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL ?? "",

  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS ?? "900000",
    10,
  ),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
} as const;

/** HTTPS origin without trailing slash, for email image URLs. */
export function getPublicBaseUrl(): string {
  const explicit = env.PUBLIC_BASE_URL.replace(/\/$/, "").trim();
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  }
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, "").trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "";
}
