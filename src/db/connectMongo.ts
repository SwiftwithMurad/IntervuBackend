import mongoose from "mongoose";
import { env } from "../config/env";
import { AppError, ERROR_CODES } from "../utils/errors";

let connPromise: Promise<typeof mongoose> | null = null;

/**
 * Connects once per warm serverless instance; safe for local `npm run dev` too.
 */
export async function connectMongo(): Promise<void> {
  if (!env.MONGODB_URI) {
    throw new AppError(
      ERROR_CODES.DATABASE_UNAVAILABLE,
      "MONGODB_URI is not set",
      503,
    );
  }
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!connPromise) {
    connPromise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
  }
  try {
    await connPromise;
  } catch (err) {
    console.error("[MongoDB] connection failed:", err);
    connPromise = null;
    throw new AppError(
      ERROR_CODES.DATABASE_UNAVAILABLE,
      "Database unavailable. Check MONGODB_URI and Atlas Network Access (allow Vercel: 0.0.0.0/0 or serverless-friendly rules).",
      503,
    );
  }
}
