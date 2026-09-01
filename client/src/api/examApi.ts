import type { Question } from "../types/exam";
import type { QuotaStatus } from "./premiumApi";
import { api, getApiErrorMessage } from "./http";
import axios from "axios";

type ServerQuestion = {
  id: number;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correct: "a" | "b" | "c" | "d";
  explanation?: string;
  imageUrl?: string;
};

type StartExamResponse = {
  questions: ServerQuestion[];
  limit: number;
  totalAvailable?: number;
  quota?: QuotaStatus | null;
};

export type StartExamResult = {
  questions: Question[];
  quota: QuotaStatus | null;
};

export class ExamQuotaExceededError extends Error {
  quota?: QuotaStatus;
  constructor(message: string, quota?: QuotaStatus) {
    super(message);
    this.name = "ExamQuotaExceededError";
    this.quota = quota;
  }
}

export type StartExamOptions = {
  rangeStart?: number;
  rangeEnd?: number;
  imageFilter?: "all" | "images" | "text";
};

function stripLeadingNumbering(text: string): string {
  // Removes patterns like "268. ", "268) ", "268 - ", "268: " at the start
  return text.replace(/^\s*\d+\s*([.)\-:])\s*/u, "").trim();
}

export async function startExamFromApi(options?: StartExamOptions): Promise<StartExamResult> {
  try {
    const res = await api.get<StartExamResponse>("/exams/start", {
      params: options ?? {},
    });

    if (import.meta.env.DEV) {
      console.log("[startExamFromApi]", {
        options,
        limit: res.data.limit,
        totalAvailable: res.data.totalAvailable,
        quota: res.data.quota,
      });
    }

    const uniqueById = new Map<number, ServerQuestion>();
    for (const q of res.data.questions) uniqueById.set(q.id, q);

    const questions = Array.from(uniqueById.values()).map<Question>((q) => {
      const correctKey = q.correct;
      const optionsArray: Question["options"] = (["a", "b", "c", "d"] as const).map((key) => ({
        id: key,
        text: q.options[key],
        isCorrect: key === correctKey,
      }));

      return {
        id: `q-${q.id}`,
        dbQuestionId: q.id,
        text: stripLeadingNumbering(q.question),
        options: optionsArray,
        explanation: q.explanation,
        imageUrl: q.imageUrl,
      };
    });

    return { questions, quota: res.data.quota ?? null };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      const data = err.response.data as { message?: string; quota?: QuotaStatus };
      throw new ExamQuotaExceededError(data?.message ?? getApiErrorMessage(err), data?.quota);
    }
    throw err;
  }
}

