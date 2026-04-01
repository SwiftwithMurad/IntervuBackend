import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { InterviewSession } from "../models";
import { AppError, ERROR_CODES } from "../utils/errors";
import { evaluateInterviewAnswer, generateInterviewQuestions } from "../services/interviewAiService";
import { IUser } from "../models/User";

function requireUser(req: AuthRequest): IUser {
  if (!req.user) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Unauthorized", 401);
  }
  return req.user;
}

function isPremium(user: IUser): boolean {
  return user.plan === "PREMIUM";
}

export async function getMainConfig(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({
      roles: ["iOS Engineer", "Backend Engineer", "Frontend Engineer", "Fullstack Engineer"],
      levels: ["JUNIOR", "MIDDLE", "SENIOR"],
      styles: ["FAANG", "STARTUP"],
      topics: [
        "System Design",
        "Data Structures",
        "Algorithms",
        "Networking",
        "Databases",
        "Concurrency",
        "Security",
      ],
    });
  } catch (e) {
    next(e);
  }
}

export async function startSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const { role, level, style, topics, questionCount, questionTimeLimitSec } = req.body as {
      role: string;
      level: "JUNIOR" | "MIDDLE" | "SENIOR";
      style: "FAANG" | "STARTUP";
      topics: string[];
      questionCount: number;
      questionTimeLimitSec: number;
    };

    const questions = await generateInterviewQuestions({
      role,
      level,
      style,
      topics,
      questionCount,
    });

    const session = await InterviewSession.create({
      userId: user._id,
      role,
      level,
      style,
      topics,
      questionCount,
      questionTimeLimitSec,
      questions,
      currentQuestionIndex: 0,
      status: "IN_PROGRESS",
      answers: [],
    });

    res.status(201).json({
      sessionId: session._id,
      status: session.status,
      startedAt: session.startedAt,
      question: session.questions[0] ?? null,
      timeRemainingSec: session.questionTimeLimitSec,
    });
  } catch (e) {
    next(e);
  }
}

export async function getSessionQuestion(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
    if (!session) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Session not found", 404);
    }
    if (session.status !== "IN_PROGRESS") {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Session is not active", 400);
    }

    const elapsedSec = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const timeRemainingSec = Math.max(session.questionTimeLimitSec - elapsedSec, 0);
    const current = session.currentQuestionIndex;
    res.json({
      sessionId: session._id,
      currentQuestionIndex: current,
      questionCount: session.questionCount,
      timeRemainingSec,
      question: session.questions[current] ?? null,
    });
  } catch (e) {
    next(e);
  }
}

export async function submitAnswer(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const { sessionId } = req.params;
    const { answerText } = req.body as { answerText: string };
    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
    if (!session) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Session not found", 404);
    }
    if (session.status !== "IN_PROGRESS") {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Session is not active", 400);
    }

    const currentIndex = session.currentQuestionIndex;
    const question = session.questions[currentIndex];
    if (!question) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "No more questions in this session", 400);
    }
    const alreadySubmitted = session.answers.some((a) => a.questionIndex === currentIndex);
    if (alreadySubmitted) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "Question already answered", 400);
    }

    const feedback = await evaluateInterviewAnswer({
      role: session.role,
      level: session.level,
      style: session.style,
      topic: question.topic,
      question: question.prompt,
      answer: answerText,
    });

    session.answers.push({
      questionIndex: currentIndex,
      answerText,
      submittedAt: new Date(),
      feedback,
    });
    session.currentQuestionIndex += 1;

    if (session.currentQuestionIndex >= session.questionCount) {
      session.status = "COMPLETED";
      session.completedAt = new Date();
    }

    await session.save();

    const nextQuestion =
      session.status === "IN_PROGRESS"
        ? session.questions[session.currentQuestionIndex] ?? null
        : null;

    res.json({
      sessionId: session._id,
      status: session.status,
      nextQuestion,
      feedback: {
        ...feedback,
        idealAnswer: isPremium(user) ? feedback.idealAnswer : null,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getSessionFeedback(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const { sessionId } = req.params;
    const session = await InterviewSession.findOne({ _id: sessionId, userId: user._id });
    if (!session) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Session not found", 404);
    }

    const feedbackItems = session.answers
      .filter((a) => a.feedback)
      .map((a) => ({
        questionIndex: a.questionIndex,
        question: session.questions[a.questionIndex]?.prompt ?? "",
        topic: session.questions[a.questionIndex]?.topic ?? "",
        accuracy: a.feedback!.accuracy,
        clarity: a.feedback!.clarity,
        depth: a.feedback!.depth,
        whatDidWell: a.feedback!.whatDidWell,
        whatMissed: a.feedback!.whatMissed,
        howToImprove: a.feedback!.howToImprove,
        idealAnswer: isPremium(user) ? a.feedback!.idealAnswer : null,
      }));

    const total = feedbackItems.length || 1;
    const summary = feedbackItems.reduce(
      (acc, item) => {
        acc.accuracy += item.accuracy;
        acc.clarity += item.clarity;
        acc.depth += item.depth;
        return acc;
      },
      { accuracy: 0, clarity: 0, depth: 0 },
    );

    res.json({
      sessionId: session._id,
      status: session.status,
      summary: {
        accuracy: Math.round(summary.accuracy / total),
        clarity: Math.round(summary.clarity / total),
        depth: Math.round(summary.depth / total),
      },
      items: feedbackItems,
    });
  } catch (e) {
    next(e);
  }
}

export async function getSessionsSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const sessions = await InterviewSession.find({
      userId: user._id,
      status: "COMPLETED",
    }).sort({ completedAt: -1 });

    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.answers.length, 0);
    const allFeedback = sessions.flatMap((s) => s.answers.map((a) => a.feedback).filter(Boolean));
    const divisor = allFeedback.length || 1;
    const avg = allFeedback.reduce(
      (acc, f) => {
        acc.accuracy += f!.accuracy;
        acc.clarity += f!.clarity;
        acc.depth += f!.depth;
        return acc;
      },
      { accuracy: 0, clarity: 0, depth: 0 },
    );

    res.json({
      totalSessions,
      totalQuestions,
      averageAccuracy: Math.round(avg.accuracy / divisor),
      averageClarity: Math.round(avg.clarity / divisor),
      averageDepth: Math.round(avg.depth / divisor),
    });
  } catch (e) {
    next(e);
  }
}

export async function getSessionHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const limit = isPremium(user) ? 100 : 5;
    const sessions = await InterviewSession.find({
      userId: user._id,
      status: "COMPLETED",
    })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select("role level style topics status startedAt completedAt questionCount answers");

    res.json({
      tier: isPremium(user) ? "PRO" : "FREE",
      limit,
      sessions,
    });
  } catch (e) {
    next(e);
  }
}
