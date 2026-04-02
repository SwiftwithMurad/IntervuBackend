import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { connectMongo } from "./db/connectMongo";
import { EMAIL_LOGO_PNG_BASE64 } from "./emailAssets/logoPng";

const app = express();

// Liveness: must not depend on MongoDB (Vercel cold starts + Atlas IP allowlist debugging).
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public logo for transactional emails (Gmail etc. block data: URLs in <img>).
app.get("/email-assets/logo.png", (_req, res) => {
  const buf = Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.type("png").send(buf);
});

app.use(async (_req, _res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.set("trust proxy", 1);
app.use(rateLimiter);
app.use("/api/v1", routes);

// Readiness: same process path as API (Mongo already connected in middleware above).
app.get("/health/ready", (_req, res) => {
  res.json({ status: "ready", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
