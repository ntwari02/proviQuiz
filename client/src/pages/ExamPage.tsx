import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup,
  LinearProgress,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXAM_DURATION_SECONDS } from "../data/mockQuestions";
import { startExamFromApi } from "../api/examApi";
import { useExamStore } from "../store/examStore";
import type { ExamStatus } from "../types/exam";
import toast from "react-hot-toast";

function formatTime(seconds: number): string {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamPage() {
  const navigate = useNavigate();

  const status = useExamStore((s) => s.status);
  const questions = useExamStore((s) => s.questions);
  const currentIndex = useExamStore((s) => s.currentIndex);
  const selectedAnswers = useExamStore((s) => s.selectedAnswers);
  const startedAt = useExamStore((s) => s.startedAt);
  const durationSeconds = useExamStore((s) => s.durationSeconds);

  const startExam = useExamStore((s) => s.startExam);
  const selectAnswer = useExamStore((s) => s.selectAnswer);
  const goToQuestion = useExamStore((s) => s.goToQuestion);
  const submitExam = useExamStore((s) => s.submitExam);

  const [remaining, setRemaining] = useState(() => durationSeconds || EXAM_DURATION_SECONDS);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "in_progress" || !startedAt) return;

    const updateRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const rem = Math.max(0, durationSeconds - elapsedSeconds);
      setRemaining(rem);
      if (rem <= 0) {
        submitExam();
        navigate("/results");
      }
    };

    updateRemaining();
    const id = setInterval(updateRemaining, 1000);
    return () => clearInterval(id);
  }, [status, startedAt, durationSeconds, submitExam, navigate]);

  const currentQuestion = useMemo(
    () => (questions.length > 0 ? questions[currentIndex] : null),
    [questions, currentIndex],
  );

  const totalQuestions = questions.length;

  const handleStart = async () => {
    try {
      setStarting(true);
      setStartError(null);
      const loaded = await startExamFromApi();
      if (!loaded.length) {
        setStartError("No questions available. Please try again later.");
        toast.error("No questions available.");
        return;
      }
      startExam(loaded, EXAM_DURATION_SECONDS);
      toast.success("Exam started");
    } catch (err) {
      console.error(err);
      setStartError("Failed to start exam. Check your connection and try again.");
      toast.error("Failed to start exam.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = () => {
    submitExam();
    toast.success("Exam submitted");
    navigate("/results");
  };

  const computedStatus: ExamStatus = status;

  if (computedStatus !== "in_progress") {
    return (
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing={-0.5}>
            Mock Exam
          </Typography>
          <Typography color="text.secondary">20 questions • 20 minutes • Single attempt</Typography>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={2}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Box>
                <Typography fontWeight={800}>Ready to begin?</Typography>
                <Typography variant="body2" color="text.secondary">
                  You will have 20 minutes to answer all questions. Your score will be shown at the end.
                </Typography>
                {startError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {startError}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" gap={1}>
                <Button onClick={() => navigate("/")} variant="text" sx={{ textTransform: "none", borderRadius: 999 }}>
                  Back
                </Button>
                <Button
                  onClick={handleStart}
                  disabled={starting}
                  variant="contained"
                  sx={{ textTransform: "none", borderRadius: 999 }}
                >
                  Start exam
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const completionPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const timePct = durationSeconds > 0 ? (remaining / durationSeconds) * 100 : 0;
  const timerColor = remaining <= 30 ? "error" : remaining <= 120 ? "warning" : "success";
  const timerPulse = remaining <= 30;

  return (
    <Stack spacing={3}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 0,
          position: "sticky",
          top: { xs: 8, sm: 12 },
          zIndex: 5,
          backdropFilter: "blur(10px)",
          bgcolor: "background.paper",
        }}
      >
        <CardContent sx={{ py: 0.75, px: { xs: 1.5, sm: 2 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5} alignItems={{ md: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Question {currentIndex + 1} / {totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {answeredCount} answered • {Math.round(completionPct)}% complete
              </Typography>
              <LinearProgress
                aria-label="Exam progress"
                variant="determinate"
                value={Math.min(100, Math.max(0, completionPct))}
                sx={{ mt: 0.75, height: 6, borderRadius: 999 }}
              />
            </Box>

            <Stack direction="row" gap={2} alignItems="center" justifyContent="flex-end">
              <Box
                sx={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  ...(timerPulse
                    ? {
                        "@keyframes pulse": {
                          "0%, 100%": { transform: "scale(1)" },
                          "50%": { transform: "scale(1.06)" },
                        },
                        animation: "pulse 1s ease-in-out infinite",
                      }
                    : null),
                }}
              >
                <CircularProgress
                  aria-label="Time remaining"
                  variant="determinate"
                  value={Math.min(100, Math.max(0, timePct))}
                  color={timerColor}
                    size={44}
                    thickness={4.2}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Typography variant="caption" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatTime(remaining)}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                color="secondary"
                sx={{ px: 2.5, py: 1.1 }}
                onClick={handleSubmit}
                aria-label="Submit exam"
              >
                Submit
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 0 }}>
        <CardContent>
          <Typography component="h2" variant="h6" fontWeight={900} sx={{ mb: 1, letterSpacing: 0.2, lineHeight: 1.35 }}>
            {currentQuestion.text}
          </Typography>

          <RadioGroup
            value={selectedAnswers[currentQuestion.id] ?? ""}
            onChange={(_e, value) => selectAnswer(currentQuestion.id, value)}
            aria-label="Answer choices"
          >
            <Stack spacing={1.25}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                const letter = option.id.toUpperCase(); // a-d -> A-D

                return (
                  <Box
                    key={option.id}
                    sx={{
                      borderRadius: 999,
                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected ? "primary.main" : "transparent",
                      color: isSelected ? "primary.contrastText" : "text.primary",
                      px: 1.5,
                      py: 0.75,
                      transition: "transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: isSelected ? "none" : "0 10px 24px rgba(17,24,39,0.08)",
                      },
                    }}
                  >
                    <FormControlLabel
                      value={option.id}
                      control={
                        <Radio
                          sx={{
                            color: isSelected ? "primary.contrastText" : "primary.main",
                            "&.Mui-checked": {
                              color: isSelected ? "primary.contrastText" : "primary.main",
                            },
                          }}
                        />
                      }
                      label={`${letter}. ${option.text}`}
                      sx={{
                        m: 0,
                        width: "100%",
                        ".MuiFormControlLabel-label": {
                          width: "100%",
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </RadioGroup>
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} alignItems="center">
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {questions.map((q, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = Boolean(selectedAnswers[q.id]);
            return (
              <Chip
                key={q.id}
                label={index + 1}
                color={isCurrent ? "primary" : isAnswered ? "success" : "default"}
                variant={isCurrent ? "filled" : "outlined"}
                size="small"
                onClick={() => goToQuestion(index)}
              />
            );
          })}
        </Stack>

        <Stack direction="row" gap={1} sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
          <Button
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: "none" }}
            disabled={currentIndex === 0}
            onClick={() => goToQuestion(currentIndex - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: "none" }}
            disabled={currentIndex === Math.max(totalQuestions - 1, 0)}
            onClick={() => goToQuestion(currentIndex + 1)}
          >
            Next
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", ml: 1, display: { xs: "none", sm: "block" } }}>
            {answeredCount}/{totalQuestions} answered
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

