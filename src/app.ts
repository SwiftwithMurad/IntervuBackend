import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { connectMongo } from "./db/connectMongo";

const app = express();

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

app.all("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
