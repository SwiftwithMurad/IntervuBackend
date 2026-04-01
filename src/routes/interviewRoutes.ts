import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { interviewSchemas, sessionIdParamSchema } from "../utils/validation";
import * as interviewController from "../controllers/interviewController";

const router = Router();

router.use(authMiddleware);

router.get("/main-config", interviewController.getMainConfig);
router.post("/sessions/start", validate(interviewSchemas.startSession), interviewController.startSession);
router.get("/sessions/:sessionId/question", validate(sessionIdParamSchema, "params"), interviewController.getSessionQuestion);
router.post(
  "/sessions/:sessionId/answer",
  validate(sessionIdParamSchema, "params"),
  validate(interviewSchemas.submitAnswer),
  interviewController.submitAnswer,
);
router.get("/sessions/:sessionId/feedback", validate(sessionIdParamSchema, "params"), interviewController.getSessionFeedback);
router.get("/sessions-summary", interviewController.getSessionsSummary);
router.get("/history", interviewController.getSessionHistory);

export default router;
