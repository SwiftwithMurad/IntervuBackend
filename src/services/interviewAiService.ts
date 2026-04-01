import OpenAI from "openai";
import { env } from "../config/env";
import { IAnswerFeedback } from "../models/InterviewSession";

export interface GenerateQuestionsInput {
  role: string;
  level: "JUNIOR" | "MIDDLE" | "SENIOR";
  style: "FAANG" | "STARTUP";
  topics: string[];
  questionCount: number;
}

const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

function fallbackQuestions(input: GenerateQuestionsInput): { prompt: string; topic: string }[] {
  const topics = input.topics.length > 0 ? input.topics : ["General Engineering"];
  return Array.from({ length: input.questionCount }).map((_, i) => {
    const topic = topics[i % topics.length];
    return {
      topic,
      prompt: `(${input.style}) ${input.level} ${input.role} interview question #${i + 1} on ${topic}. Explain your approach and trade-offs.`,
    };
  });
}

export async function generateInterviewQuestions(
  input: GenerateQuestionsInput,
): Promise<{ prompt: string; topic: string }[]> {
  if (!client) {
    return fallbackQuestions(input);
  }

  const prompt = `
Generate exactly ${input.questionCount} realistic software engineering interview questions.
Role: ${input.role}
Level: ${input.level}
Style: ${input.style}
Topics: ${input.topics.join(", ")}

Return strict JSON only with this shape:
{"questions":[{"prompt":"...", "topic":"..."}]}
No markdown.
`;

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(raw) as { questions: { prompt: string; topic: string }[] };
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return fallbackQuestions(input);
    }
    return parsed.questions.slice(0, input.questionCount).map((q) => ({
      prompt: q.prompt,
      topic: q.topic,
    }));
  } catch {
    return fallbackQuestions(input);
  }
}

export async function evaluateInterviewAnswer(params: {
  role: string;
  level: string;
  style: string;
  topic: string;
  question: string;
  answer: string;
}): Promise<IAnswerFeedback> {
  if (!client) {
    return {
      accuracy: 70,
      clarity: 72,
      depth: 68,
      whatDidWell: "You gave a structured response and stayed on topic.",
      whatMissed: "You can include more edge-cases and practical constraints.",
      howToImprove: "Use a clearer framework and provide one concrete example.",
      idealAnswer: "A strong answer explains architecture choices, trade-offs, and testing strategy with one real-world scenario.",
    };
  }

  const prompt = `
You are an interview evaluator.
Assess this answer for role=${params.role}, level=${params.level}, style=${params.style}, topic=${params.topic}.
Question: ${params.question}
Answer: ${params.answer}

Return strict JSON only:
{
  "accuracy": number 0-100,
  "clarity": number 0-100,
  "depth": number 0-100,
  "whatDidWell": "string",
  "whatMissed": "string",
  "howToImprove": "string",
  "idealAnswer": "string"
}
No markdown.
`;

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(raw) as IAnswerFeedback;
    return {
      accuracy: Math.max(0, Math.min(100, Number(parsed.accuracy) || 0)),
      clarity: Math.max(0, Math.min(100, Number(parsed.clarity) || 0)),
      depth: Math.max(0, Math.min(100, Number(parsed.depth) || 0)),
      whatDidWell: parsed.whatDidWell ?? "",
      whatMissed: parsed.whatMissed ?? "",
      howToImprove: parsed.howToImprove ?? "",
      idealAnswer: parsed.idealAnswer ?? "",
    };
  } catch {
    return {
      accuracy: 65,
      clarity: 65,
      depth: 65,
      whatDidWell: "You attempted to explain your reasoning process.",
      whatMissed: "More technical details and concrete examples were needed.",
      howToImprove: "Use a STAR-like structure and mention trade-offs explicitly.",
      idealAnswer: "An ideal answer would define assumptions, show approach details, and justify decisions with measurable outcomes.",
    };
  }
}
