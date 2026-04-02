import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { connectMongo } from "./db/connectMongo";

const app = express();

// Liveness: must not depend on MongoDB (Vercel cold starts + Atlas IP allowlist debugging).
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
