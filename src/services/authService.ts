import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Otp, RefreshToken } from "../models";
import { env } from "../config/env";
import { AppError, ERROR_CODES } from "../utils/errors";
import { sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import { JwtPayload } from "../middlewares/auth";
import { IUser } from "../models/User";

const OTP_EXPIRE_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const BLOCK_HOURS = 24;
const MAX_RESEND_PER_HOUR = 3;
const SALT_ROUNDS = 12;

function generateOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function generateTokenPair(
  user: IUser,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      type: "access",
    } as JwtPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions,
  );
  const refreshToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      type: "refresh",
      jti: crypto.randomUUID(),
    } as JwtPayload & { jti: string },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );
  const refreshExpires = new Date();
  refreshExpires.setDate(refreshExpires.getDate() + 7);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpires,
  });
  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<void> {
  const emailLower = email.toLowerCase();
  const existing = await User.findOne({ email: emailLower });

  if (existing?.isEmailVerified) {
    throw new AppError(
      ERROR_CODES.EMAIL_ALREADY_EXISTS,
      "This email is already registered. Please log in.",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing) {
    existing.fullName = fullName;
    existing.password = hashedPassword;
    await existing.save();
  } else {
    await User.create({
      fullName,
      email: emailLower,
      password: hashedPassword,
      plan: "FREE",
      isEmailVerified: false,
    });
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
  const resendResetAt = new Date(Date.now() + 60 * 60 * 1000);

  await Otp.deleteMany({ email: emailLower, purpose: "EMAIL_VERIFICATION" });
  await Otp.create({
    email: emailLower,
    code,
    purpose: "EMAIL_VERIFICATION",
    expiresAt,
    resendResetAt,
  });

  await sendVerificationEmail(email, code);
}

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────
export async function verifyEmail(
  email: string,
  otp: string,
): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "No account found with this email.",
      400,
    );

  const record = await Otp.findOne({
    email: email.toLowerCase(),
    purpose: "EMAIL_VERIFICATION",
  }).sort({ createdAt: -1 });
  if (!record)
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Verification code not found. Please request a new one.",
      400,
    );

  if (record.blockedUntil && new Date() < record.blockedUntil) {
    throw new AppError(
      ERROR_CODES.OTP_BLOCKED_24H,
      "Too many failed attempts. Please try again in 24 hours.",
      400,
    );
  }
  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Verification code has expired. Please request a new one.",
      400,
    );
  }

  record.attempts += 1;
  if (record.code !== otp) {
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + BLOCK_HOURS * 60 * 60 * 1000);
      await record.save();
      throw new AppError(
        ERROR_CODES.OTP_BLOCKED_24H,
        "Too many failed attempts. Please try again in 24 hours.",
        400,
      );
    }
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      `Incorrect code. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      400,
    );
  }

  user.isEmailVerified = true;
  await user.save();
  await record.deleteOne();

  const tokens = await generateTokenPair(user);
  return { ...tokens, user };
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export async function login(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email or password.",
      401,
    );
  if (!user.isEmailVerified)
    throw new AppError(
      ERROR_CODES.EMAIL_NOT_VERIFIED,
      "Please verify your email before logging in.",
      403,
    );

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "Invalid email or password.",
      401,
    );

  const tokens = await generateTokenPair(user);
  return { ...tokens, user };
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
export async function refresh(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
  let decoded: JwtPayload & { jti?: string };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload & {
      jti?: string;
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(
        ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        "Session expired. Please log in again.",
        401,
      );
    }
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid token.", 401);
  }

  if (decoded.type !== "refresh")
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Invalid token type.", 401);

  const hash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({
    userId: decoded.userId,
    tokenHash: hash,
  });

  if (!stored || new Date() > stored.expiresAt) {
    if (stored) await stored.deleteOne();
    throw new AppError(
      ERROR_CODES.REFRESH_TOKEN_EXPIRED,
      "Session expired. Please log in again.",
      401,
    );
  }

  await stored.deleteOne();

  const user = await User.findById(decoded.userId);
  if (!user)
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      "Account not found. Please log in again.",
      401,
    );

  const tokens = await generateTokenPair(user);
  return { ...tokens, user };
}

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;

  const now = new Date();
  const existing = await Otp.findOne({
    email: email.toLowerCase(),
    purpose: "PASSWORD_RESET",
  }).sort({ createdAt: -1 });

  if (existing) {
    if (now < existing.expiresAt) {
      const minutesLeft = Math.ceil(
        (existing.expiresAt.getTime() - now.getTime()) / 60000,
      );
      throw new AppError(
        ERROR_CODES.RESEND_TOO_SOON,
        `A code was already sent. Please wait ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} before requesting a new one.`,
        429,
      );
    }
    if (
      existing.resendResetAt > now &&
      existing.resendCount >= MAX_RESEND_PER_HOUR
    ) {
      throw new AppError(
        ERROR_CODES.RESEND_LIMIT_EXCEEDED,
        "You've reached the resend limit. Please try again in 1 hour.",
        400,
      );
    }
    if (existing.resendResetAt <= now) {
      existing.resendCount = 0;
      existing.resendResetAt = new Date(now.getTime() + 60 * 60 * 1000);
    }
    existing.resendCount += 1;
    existing.code = generateOtpCode();
    existing.expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    existing.attempts = 0;
    existing.blockedUntil = undefined;
    await existing.save();
    await sendPasswordResetEmail(email, existing.code);
    return;
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
  const resendResetAt = new Date(Date.now() + 60 * 60 * 1000);
  await Otp.create({
    email: email.toLowerCase(),
    code,
    purpose: "PASSWORD_RESET",
    expiresAt,
    resendResetAt,
  });
  await sendPasswordResetEmail(email, code);
}

// ─────────────────────────────────────────────
// VERIFY RESET OTP
// ─────────────────────────────────────────────
export async function verifyResetOtp(
  email: string,
  otp: string,
): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "No account found with this email.",
      400,
    );

  const record = await Otp.findOne({
    email: email.toLowerCase(),
    purpose: "PASSWORD_RESET",
  }).sort({ createdAt: -1 });
  if (!record)
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Reset code not found. Please request a new one.",
      400,
    );

  if (record.blockedUntil && new Date() < record.blockedUntil) {
    throw new AppError(
      ERROR_CODES.OTP_BLOCKED_24H,
      "Too many failed attempts. Please try again in 24 hours.",
      400,
    );
  }
  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Reset code has expired. Please request a new one.",
      400,
    );
  }

  record.attempts += 1;
  if (record.code !== otp) {
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + BLOCK_HOURS * 60 * 60 * 1000);
      await record.save();
      throw new AppError(
        ERROR_CODES.OTP_BLOCKED_24H,
        "Too many failed attempts. Please try again in 24 hours.",
        400,
      );
    }
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      `Incorrect code. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      400,
    );
  }

  await record.save();
}

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user)
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      "No account found with this email.",
      400,
    );

  const record = await Otp.findOne({
    email: email.toLowerCase(),
    purpose: "PASSWORD_RESET",
  }).sort({ createdAt: -1 });
  if (!record)
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Reset code not found. Please request a new one.",
      400,
    );

  if (record.blockedUntil && new Date() < record.blockedUntil) {
    throw new AppError(
      ERROR_CODES.OTP_BLOCKED_24H,
      "Too many failed attempts. Please try again in 24 hours.",
      400,
    );
  }
  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "Reset code has expired. Please start over.",
      400,
    );
  }

  record.attempts += 1;
  if (record.code !== otp) {
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = new Date(Date.now() + BLOCK_HOURS * 60 * 60 * 1000);
      await record.save();
      throw new AppError(
        ERROR_CODES.OTP_BLOCKED_24H,
        "Too many failed attempts. Please try again in 24 hours.",
        400,
      );
    }
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS,
      `Incorrect code. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      400,
    );
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  await record.deleteOne();

  await RefreshToken.deleteMany({ userId: user._id });

  const tokens = await generateTokenPair(user);
  return { ...tokens, user };
}

// ─────────────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────────────
export type OtpPurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export async function resendOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  const now = new Date();
  const emailLower = email.toLowerCase();

  if (purpose === "EMAIL_VERIFICATION") {
    const user = await User.findOne({ email: emailLower });
    if (!user)
      throw new AppError(
        ERROR_CODES.INVALID_CREDENTIALS,
        "No account found with this email.",
        400,
      );
    if (user.isEmailVerified)
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "This email is already verified.",
        400,
      );
  }

  const record = await Otp.findOne({ email: emailLower, purpose }).sort({
    createdAt: -1,
  });
  if (!record) {
    if (purpose === "EMAIL_VERIFICATION")
      throw new AppError(
        ERROR_CODES.OTP_EXPIRED,
        "No active session found. Please register again.",
        400,
      );
    throw new AppError(
      ERROR_CODES.OTP_EXPIRED,
      "No active session found. Please use forgot password again.",
      400,
    );
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    throw new AppError(
      ERROR_CODES.OTP_BLOCKED_24H,
      "Too many failed attempts. Please try again in 24 hours.",
      400,
    );
  }

  if (now < record.expiresAt) {
    const minutesLeft = Math.ceil(
      (record.expiresAt.getTime() - now.getTime()) / 60000,
    );
    throw new AppError(
      ERROR_CODES.RESEND_TOO_SOON,
      `A code was already sent. Please wait ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} before requesting a new one.`,
      429,
    );
  }

  if (record.resendResetAt <= now) {
    record.resendCount = 0;
    record.resendResetAt = new Date(now.getTime() + 60 * 60 * 1000);
  }
  if (record.resendCount >= MAX_RESEND_PER_HOUR) {
    throw new AppError(
      ERROR_CODES.RESEND_LIMIT_EXCEEDED,
      "You've reached the resend limit. Please try again in 1 hour.",
      400,
    );
  }

  record.code = generateOtpCode();
  record.expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
  record.attempts = 0;
  record.blockedUntil = undefined;
  record.resendCount += 1;
  await record.save();

  if (purpose === "EMAIL_VERIFICATION") {
    await sendVerificationEmail(email, record.code);
  } else {
    await sendPasswordResetEmail(email, record.code);
  }
}