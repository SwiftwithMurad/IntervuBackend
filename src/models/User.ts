import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  plan: "FREE" | "PREMIUM";
  isEmailVerified: boolean;
  fcmToken?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plan: { type: String, enum: ["FREE", "PREMIUM"], default: "FREE" },
    isEmailVerified: { type: Boolean, default: false },
    fcmToken: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
