import mongoose from "mongoose";
import { env } from "../config/env";

let connPromise: Promise<typeof mongoose> | null = null;

/**
 * Connects once per warm serverless instance; safe for local `npm run dev` too.
 */
export async function connectMongo(): Promise<void> {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
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
  await connPromise;
}
