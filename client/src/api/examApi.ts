import axios from "axios";
import type { Question } from "../types/exam";

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
};

type StartExamResponse = {
  questions: ServerQuestion[];
  limit: number;
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000/api";

function stripLeadingNumbering(text: string): string {
  // Removes patterns like "268. ", "268) ", "268 - ", "268: " at the start
  return text.replace(/^\s*\d+\s*([.)\-:])\s*/u, "").trim();
}

export async function startExamFromApi(): Promise<Question[]> {
  const res = await axios.get<StartExamResponse>(`${API_BASE_URL}/exams/start`);

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
    };
  });
}

