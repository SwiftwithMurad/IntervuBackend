import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import * as profileController from "../controllers/profileController";

const router = Router();

router.use(authMiddleware);
router.get("/me", profileController.me);

export default router;
