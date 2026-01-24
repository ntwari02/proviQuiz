export type AnswerOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  options: AnswerOption[];
  explanation?: string;
  imageUrl?: string;
};

export type ExamStatus = "idle" | "in_progress" | "completed";

export type ExamResult = {
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  startedAt: number;
  finishedAt: number;
};

