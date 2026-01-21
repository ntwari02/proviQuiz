import { create } from "zustand";
import type { ExamResult, ExamStatus, Question } from "../types/exam";

type ExamState = {
  questions: Question[];
  status: ExamStatus;
  startedAt: number | null;
  durationSeconds: number;
  currentIndex: number;
  selectedAnswers: Record<string, string | undefined>;
  result: ExamResult | null;
};

type ExamActions = {
  startExam: (questions: Question[], durationSeconds: number) => void;
  selectAnswer: (questionId: string, optionId: string) => void;
  goToQuestion: (index: number) => void;
  submitExam: () => void;
  resetExam: () => void;
};

export const useExamStore = create<ExamState & ExamActions>((set, get) => ({
  questions: [],
  status: "idle",
  startedAt: null,
  durationSeconds: 0,
  currentIndex: 0,
  selectedAnswers: {},
  result: null,

  startExam: (questions, durationSeconds) =>
    set(() => ({
      questions,
      durationSeconds,
      status: "in_progress",
      startedAt: Date.now(),
      currentIndex: 0,
      selectedAnswers: {},
      result: null,
    })),

  selectAnswer: (questionId, optionId) =>
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: optionId },
    })),

  goToQuestion: (index) =>
    set((state) => ({
      currentIndex: Math.min(Math.max(index, 0), state.questions.length - 1),
    })),

  submitExam: () => {
    const { questions, selectedAnswers, startedAt, durationSeconds } = get();
    if (!startedAt || questions.length === 0) return;

    let correctCount = 0;

    for (const q of questions) {
      const selected = selectedAnswers[q.id];
      const correctOption = q.options.find((o) => o.isCorrect);
      if (selected && correctOption && selected === correctOption.id) {
        correctCount += 1;
      }
    }

    const totalQuestions = questions.length;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercent = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;

    const finishedAt = Date.now();
    const maxFinish = startedAt + durationSeconds * 1000;

    const result: ExamResult = {
      scorePercent,
      totalQuestions,
      correctCount,
      incorrectCount,
      startedAt,
      finishedAt: Math.min(finishedAt, maxFinish),
    };

    set({
      status: "completed",
      result,
    });
  },

  resetExam: () =>
    set(() => ({
      questions: [],
      status: "idle",
      startedAt: null,
      durationSeconds: 0,
      currentIndex: 0,
      selectedAnswers: {},
      result: null,
    })),
}));

