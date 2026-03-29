import { Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AuthRequest } from "../middlewares/auth";
import { User } from "../models";
import { sendToUser } from "../services/notificationService";

export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { fullName, email, password } = req.body;
    await authService.register(fullName, email, password);
    res.status(201).json({ message: "Verification code sent to email." });
  } catch (e) {
    next(e);
  }
}

export async function resendOtp(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, purpose } = req.body;
    await authService.resendOtp(email, purpose);
    const message =
      purpose === "EMAIL_VERIFICATION"
        ? "Verification code sent to email."
        : "Reset code sent to email.";
    res.json({ message });
  } catch (e) {
    next(e);
  }
}

export async function verifyEmail(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, otp } = req.body;
    const { accessToken, refreshToken, user } = await authService.verifyEmail(
      email,
      otp,
    );
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        plan: user.plan,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(
      email,
      password,
    );
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        plan: user.plan,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function refresh(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.body.refreshToken as string;
    const result = await authService.refresh(refreshToken);
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        plan: result.user.plan,
        isEmailVerified: result.user.isEmailVerified,
        createdAt: result.user.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ message: "If the email exists, a reset code has been sent." });
  } catch (e) {
    next(e);
  }
}

export async function verifyResetOtp(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, otp } = req.body;
    await authService.verifyResetOtp(email, otp);
    res.json({ message: "Code verified. You may now reset your password." });
  } catch (e) {
    next(e);
  }
}

export async function updateFcmToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { fcmToken, lang } = req.body;
    await User.findByIdAndUpdate(req.user!._id, {
      fcmToken,
      preferredLanguage: lang,
    });
    res.json({ message: "FCM token updated." });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    const { accessToken, refreshToken, user } = await authService.resetPassword(
      email,
      otp,
      newPassword,
    );
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        plan: user.plan,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function sendNotificationToAll(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title, body } = req.body;
    const users = await User.find({
      fcmToken: { $exists: true, $ne: null },
    }).select("_id fcmToken");

    await Promise.all(
      users.map((user) =>
        sendToUser(user._id.toString(), title, body).catch((e) =>
          console.error(`[FCM] Failed for ${user._id}:`, e.message)
        )
      )
    );

    res.json({ ok: true, sent: users.length });
  } catch (e) {
    next(e);
  }
}