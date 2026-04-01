import { Router } from 'express';
import authRoutes from './authRoutes';
import interviewRoutes from "./interviewRoutes";
import profileRoutes from "./profileRoutes";
import paywallRoutes from "./paywallRoutes";

const router = Router();

router.use('/auth', authRoutes);
router.use("/interview", interviewRoutes);
router.use("/profile", profileRoutes);
router.use("/paywall", paywallRoutes);
export default router;
