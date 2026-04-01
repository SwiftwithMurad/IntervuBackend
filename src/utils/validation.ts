import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character",
  );

const emailSchema = z.string().email("Please enter a valid email address");
const otpSchema = z
  .string()
  .length(4, "Verification code must be exactly 4 digits");

export const authSchemas = {
  register: z.object({
    fullName: z.string().min(1, "Full name is required").max(100),
    email: emailSchema,
    password: passwordSchema,
  }),
  verifyEmail: z.object({
    email: emailSchema,
    otp: otpSchema,
  }),
  resendOtp: z.object({
    email: emailSchema,
    purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
  }),
  login: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
  refresh: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
  forgotPassword: z.object({
    email: emailSchema,
  }),
  resetPassword: z.object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
  }),
  verifyResetOtp: z.object({
    email: emailSchema,
    otp: otpSchema,
  }),
  fcmToken: z.object({
    fcmToken: z.string().min(1, "FCM token is required"),
    lang: z.string().optional(),
  }),
};

export const paramsId = z.object({ id: z.string().min(1) });

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

export const interviewSchemas = {
  startSession: z.object({
    role: z.string().min(1, "role is required"),
    level: z.enum(["JUNIOR", "MIDDLE", "SENIOR"]),
    style: z.enum(["FAANG", "STARTUP"]),
    topics: z.array(z.string().min(1)).min(1, "at least one topic is required"),
    questionCount: z.number().int().min(1).max(20).default(5),
    questionTimeLimitSec: z.number().int().min(60).max(7200).default(900),
  }),
  submitAnswer: z.object({
    answerText: z.string().min(1, "answerText is required"),
  }),
};
