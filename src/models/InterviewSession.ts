import mongoose, { Document, Schema, Types } from "mongoose";

export type EngineerLevel = "JUNIOR" | "MIDDLE" | "SENIOR";
export type InterviewStyle = "FAANG" | "STARTUP";
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export interface IAnswerFeedback {
  accuracy: number;
  clarity: number;
  depth: number;
  whatDidWell: string;
  whatMissed: string;
  howToImprove: string;
  idealAnswer: string;
}

export interface IInterviewQuestion {
  prompt: string;
  topic: string;
}

export interface IInterviewAnswer {
  questionIndex: number;
  answerText: string;
  submittedAt: Date;
  feedback?: IAnswerFeedback;
}

export interface IInterviewSession extends Document {
  userId: Types.ObjectId;
  role: string;
  level: EngineerLevel;
  style: InterviewStyle;
  topics: string[];
  questionCount: number;
  questionTimeLimitSec: number;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  currentQuestionIndex: number;
  questions: IInterviewQuestion[];
  answers: IInterviewAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const AnswerFeedbackSchema = new Schema<IAnswerFeedback>(
  {
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    clarity: { type: Number, required: true, min: 0, max: 100 },
    depth: { type: Number, required: true, min: 0, max: 100 },
    whatDidWell: { type: String, required: true },
    whatMissed: { type: String, required: true },
    howToImprove: { type: String, required: true },
    idealAnswer: { type: String, required: true },
  },
  { _id: false },
);

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    prompt: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { _id: false },
);

const InterviewAnswerSchema = new Schema<IInterviewAnswer>(
  {
    questionIndex: { type: Number, required: true },
    answerText: { type: String, required: true },
    submittedAt: { type: Date, required: true, default: Date.now },
    feedback: { type: AnswerFeedbackSchema, required: false },
  },
  { _id: false },
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true },
    level: { type: String, enum: ["JUNIOR", "MIDDLE", "SENIOR"], required: true },
    style: { type: String, enum: ["FAANG", "STARTUP"], required: true },
    topics: { type: [String], required: true },
    questionCount: { type: Number, required: true, min: 1, max: 20 },
    questionTimeLimitSec: { type: Number, required: true, min: 60, max: 7200 },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
      default: "IN_PROGRESS",
      index: true,
    },
    startedAt: { type: Date, default: Date.now, required: true },
    completedAt: { type: Date },
    currentQuestionIndex: { type: Number, default: 0, min: 0, required: true },
    questions: { type: [InterviewQuestionSchema], required: true },
    answers: { type: [InterviewAnswerSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession = mongoose.model<IInterviewSession>(
  "InterviewSession",
  InterviewSessionSchema,
);
