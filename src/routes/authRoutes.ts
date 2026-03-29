import { Router } from "express";
import * as authController from "../controllers/authController";
import { validate } from "../middlewares/validate";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { authSchemas } from "../utils/validation";

const router = Router();

router.post( "/register", validate(authSchemas.register), authController.register);
router.post( "/verify-email", validate(authSchemas.verifyEmail), authController.verifyEmail);
router.post("/login", validate(authSchemas.login), authController.login);
router.post("/refresh", validate(authSchemas.refresh), authController.refresh);
router.post("/resend-otp", validate(authSchemas.resendOtp),authController.resendOtp);
router.post("/forgot-password", validate(authSchemas.forgotPassword), authController.forgotPassword);
router.post("/verify-reset-otp", validate(authSchemas.verifyResetOtp), authController.verifyResetOtp);
router.post("/reset-password", validate(authSchemas.resetPassword),authController.resetPassword);
router.post(
  "/fcm-token",
  authMiddleware,
  validate(authSchemas.fcmToken),
  authController.updateFcmToken,
);
router.post(
  "/send-notification",
  authMiddleware,
  adminMiddleware,
  authController.sendNotificationToAll,
);

export default router;