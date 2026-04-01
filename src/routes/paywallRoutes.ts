import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import * as paywallController from "../controllers/paywallController";

const router = Router();

router.use(authMiddleware);
router.get("/", paywallController.getPaywall);

export default router;
