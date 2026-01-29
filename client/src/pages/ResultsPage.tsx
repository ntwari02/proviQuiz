import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExamStore } from "../store/examStore";

export function ResultsPage() {
  const navigate = useNavigate();

  const result = useExamStore((s) => s.result);
  const questions = useExamStore((s) => s.questions);
  const selectedAnswers = useExamStore((s) => s.selectedAnswers);
  const resetExam = useExamStore((s) => s.resetExam);
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!result || questions.length === 0) {
      navigate("/exam", { replace: true });
    }
  }, [result, questions.length, navigate]);

  if (!result || questions.length === 0) return null;

  const durationMs = result.finishedAt - result.startedAt;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const answeredCount = useMemo(
    () => Object.values(selectedAnswers).filter(Boolean).length,
    [selectedAnswers],
  );
  const notAnswered = Math.max(result.totalQuestions - answeredCount, 0);
  const passThreshold = Math.ceil(result.totalQuestions * 0.6); // pass if >= 60% (e.g., 12/20)
  const passed = result.correctCount >= passThreshold;
  const filteredQuestions = showOnlyIncorrect
    ? questions.filter((q) => {
        const selected = selectedAnswers[q.id];
        const correct = q.options.find((o) => o.isCorrect)?.id;
        return !selected || selected !== correct;
      })
    : questions;

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveQuestionId(id);
  };

  return (
    <Stack spacing={2.5}>
      {/* Compact strip like image */}
      <Card variant="outlined" sx={{ borderRadius: 0, boxShadow: "0 18px 40px rgba(15,23,42,0.08)" }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} gap={2} justifyContent="space-between">
            <Stack>
              <Typography variant="overline" color="text.secondary">
                Score
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                {result.correctCount} / {result.totalQuestions}
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={700}>
                Accuracy: {Math.round(result.scorePercent)}%
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="overline" color="text.secondary">
                Total Questions
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {result.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.correctCount} correct • {result.incorrectCount} wrong • {notAnswered} not attempted
              </Typography>
            </Stack>
            <Stack minWidth={{ xs: "100%", md: 200 }} gap={0.75}>
              <Typography variant="overline" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={passed ? "PASS" : "FAIL"}
                color={passed ? "success" : "error"}
                sx={{ borderRadius: 999, fontWeight: 700, px: 2, alignSelf: "flex-start" }}
              />
              <Typography variant="body2" color="text.secondary">
                Time used: {minutes}m {seconds.toString().padStart(2, "0")}s
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Navigator */}
      <Card variant="outlined" sx={{ borderRadius: 0, boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
        <CardContent>
          <Stack gap={1}>
            <Stack direction="row" gap={1}>
              <Chip size="small" icon={<CheckCircleIcon fontSize="small" />} label="Correct" color="success" variant="outlined" />
              <Chip size="small" icon={<CancelIcon fontSize="small" />} label="Wrong" color="error" variant="outlined" />
              <Chip size="small" icon={<RadioButtonUncheckedIcon fontSize="small" />} label="Not attempted" variant="outlined" />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {questions.map((q, idx) => {
                const selected = selectedAnswers[q.id];
                const correct = q.options.find((o) => o.isCorrect)?.id;
                const status = selected ? (selected === correct ? "correct" : "incorrect") : "unanswered";
                const color =
                  status === "correct" ? "success" : status === "incorrect" ? "error" : ("default" as const);
                const isActive = activeQuestionId ? activeQuestionId === q.id : idx === 0;
                return (
                  <Chip
                    key={q.id}
                    label={idx + 1}
                    clickable
                    onClick={() => scrollToQuestion(q.id)}
                    variant={isActive ? "filled" : "outlined"}
                    color={color === "default" ? "default" : color}
                    sx={{
                      borderRadius: 0,
                      minWidth: 38,
                      height: 38,
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Question list */}
      <Stack spacing={2}>
        {filteredQuestions.map((q) => {
          const selected = selectedAnswers[q.id];
          const correctOption = q.options.find((o) => o.isCorrect);
          const status = selected ? (selected === correctOption?.id ? "correct" : "incorrect") : "unanswered";
          const statusChip =
            status === "correct"
              ? { label: "Correct", color: "success" as const, icon: <CheckCircleIcon fontSize="small" /> }
              : status === "incorrect"
              ? { label: "Incorrect", color: "error" as const, icon: <CancelIcon fontSize="small" /> }
              : { label: "Not attempted", color: undefined, icon: <RadioButtonUncheckedIcon fontSize="small" /> };

          return (
            <Card
              key={q.id}
              id={`q-${q.id}`}
              variant="outlined"
              sx={{
                borderRadius: 0,
                borderColor: status === "correct" ? "success.light" : status === "incorrect" ? "error.light" : "divider",
                boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Stack gap={0.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Question {questions.indexOf(q) + 1}
                    </Typography>
                    <Typography fontWeight={700}>{q.text}</Typography>
                  </Stack>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Chip
                      size="small"
                      icon={statusChip.icon}
                      label={statusChip.label}
                      color={statusChip.color}
                      variant={statusChip.color ? "outlined" : "outlined"}
                    />
                  </Stack>
                </Stack>

                <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                  {q.imageUrl && (
                    <Box
                      component="img"
                      src={q.imageUrl}
                      alt="Question image"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 250,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        mb: 2,
                        mt: 1,
                      }}
                    />
                  )}
                  <Stack spacing={0.5}>
                    {q.options.map((o) => {
                      const isSelected = selected === o.id;
                      const optionIsCorrect = o.isCorrect;
                      const bg =
                        optionIsCorrect && isSelected
                          ? "success.main"
                          : optionIsCorrect
                          ? "success.light"
                          : isSelected
                          ? "error.light"
                          : "background.paper";

                      const color =
                        optionIsCorrect && isSelected
                          ? "common.white"
                          : optionIsCorrect
                          ? "success.main"
                          : isSelected
                          ? "common.white"
                          : "text.primary";

                      const icon =
                        optionIsCorrect ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : isSelected ? (
                          <CancelIcon fontSize="small" />
                        ) : (
                          <RadioButtonUncheckedIcon fontSize="small" />
                        );

                      return (
                        <Box
                          key={o.id}
                          sx={{
                            borderRadius: 0,
                            px: 1.5,
                            py: 1,
                            bgcolor: bg,
                            color,
                            border: "1px solid",
                            borderColor: optionIsCorrect
                              ? "success.light"
                              : isSelected
                              ? "error.light"
                              : "divider",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {icon}
                          <Typography
                            variant="body2"
                            fontWeight={isSelected || optionIsCorrect ? 700 : 500}
                          >
                            {o.text}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>

                  <Divider />

                  <Stack gap={0.5}>
                    <Stack direction="row" alignItems="center" gap={0.75}>
                      <InfoOutlinedIcon fontSize="small" color="info" />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Explanation
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {q.explanation || "Review why the correct option is right and what to watch for next time."}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Actions */}
      <Stack direction={{ xs: "column", md: "row" }} gap={1}>
        <Button
          variant="contained"
          sx={{ borderRadius: 0, textTransform: "none" }}
          onClick={() => {
            resetExam();
            navigate("/exam");
          }}
        >
          Retake Test
        </Button>
        <Button
          variant="outlined"
          sx={{ borderRadius: 0, textTransform: "none" }}
          onClick={() => setShowOnlyIncorrect(true)}
        >
          Review Only Incorrect Questions
        </Button>
        <Button
          variant="text"
          sx={{ borderRadius: 0, textTransform: "none" }}
          onClick={() => {
            resetExam();
            navigate("/");
          }}
        >
          Back to Dashboard
        </Button>
        <Button variant="text" disabled sx={{ borderRadius: 0, textTransform: "none" }}>
          Download Result
        </Button>
      </Stack>
    </Stack>
  );
}

