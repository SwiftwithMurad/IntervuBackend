import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  code: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  expiresAt: Date;
  attempts: number;
  blockedUntil?: Date;
  resendCount: number;
  resendResetAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    blockedUntil: { type: Date },
    resendCount: { type: Number, default: 0 },
    resendResetAt: { type: Date, required: true },
  },
  { versionKey: false }
);

OtpSchema.index({ email: 1, purpose: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL optional, we also clean in cron

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
