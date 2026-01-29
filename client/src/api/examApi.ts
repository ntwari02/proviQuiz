import type { Question } from "../types/exam";
import { api } from "./http";

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
  // Helpful for debugging: how many questions satisfied the filter on the server
  totalAvailable?: number;
};

export type StartExamOptions = {
  rangeStart?: number;
  rangeEnd?: number;
  imageFilter?: "all" | "images" | "text";
};

function stripLeadingNumbering(text: string): string {
  // Removes patterns like "268. ", "268) ", "268 - ", "268: " at the start
  return text.replace(/^\s*\d+\s*([.)\-:])\s*/u, "").trim();
}

export async function startExamFromApi(options?: StartExamOptions): Promise<Question[]> {
  const res = await api.get<StartExamResponse>("/exams/start", {
    params: options ?? {},
  });

  // In dev, log how many questions the server says are available
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
    console.log("[startExamFromApi]", {
      options,
      limit: res.data.limit,
      totalAvailable: res.data.totalAvailable,
    });
  }

  // Ensure no duplicates (defensive: backend $sample should already be unique)
  const uniqueById = new Map<number, ServerQuestion>();
  for (const q of res.data.questions) uniqueById.set(q.id, q);

  return Array.from(uniqueById.values()).map<Question>((q) => {
    const correctKey = q.correct;

    const optionsArray: Question["options"] = (["a", "b", "c", "d"] as const).map((key) => ({
      // Keep ids as the option key so we can render A–D cleanly
      id: key,
      text: q.options[key],
      isCorrect: key === correctKey,
    }));

    return {
      // Do not expose DB numeric ids in UI; we keep it internal only.
      // Also strip leading numbering that may be present in imported question text.
      id: `q-${crypto.randomUUID()}`,
      text: stripLeadingNumbering(q.question),
      options: optionsArray,
      explanation: q.explanation,
      imageUrl: q.imageUrl,
    };
  });
}

