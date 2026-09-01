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
  Paper,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { EXAM_DURATION_SECONDS } from "../data/mockQuestions";
import { startExamFromApi, ExamQuotaExceededError, type StartExamOptions } from "../api/examApi";
import { persistExamResult } from "../api/examSubmit";
import { saveExamPack, takeOldestExamPack, peekExamPackCount } from "../offline/examOfflineStore";
import { syncOfflineExamSessions } from "../offline/syncExamSessions";
import type { Question } from "../types/exam";
import { useExamStore } from "../store/examStore";
import { usePremiumAccess } from "../hooks/usePremiumAccess";
import type { ExamStatus } from "../types/exam";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";

const TOTAL_QUESTIONS = 433;

function formatTime(seconds: number): string {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamPage() {
  const navigate = useNavigate();
  const { isPremium, quota, refetch: refetchPremium } = usePremiumAccess();
  const { isPhone, isTablet, isCompactPhone, immersiveExam } = useDeviceAdapter();

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
  const [offlinePacks, setOfflinePacks] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    void peekExamPackCount().then(setOfflinePacks).catch(() => setOfflinePacks(0));
    void syncOfflineExamSessions();
  }, []);
  const finishingRef = useRef(false);

  const finishAndGoToResults = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    submitExam();
    const state = useExamStore.getState();
    if (state.result && state.questions.length > 0 && state.startedAt) {
      await persistExamResult({
        questions: state.questions,
        selectedAnswers: state.selectedAnswers,
        startedAt: state.startedAt,
        finishedAt: state.result.finishedAt,
      }).then((outcome) => {
        if (outcome?.status === "queued") {
          toast(
            outcome.droppedOldest
              ? `Saved offline (max 5). Oldest queued exam was replaced.`
              : "No connection — exam saved on this device (up to 5). It will sync when you are back online.",
            { duration: 5000 }
          );
        }
      });
      void refetchPremium();
    }
    navigate("/results");
  };

  useEffect(() => {
    if (status !== "in_progress" || !startedAt) return;

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const rem = Math.max(0, durationSeconds - elapsedSeconds);

      setRemaining(rem);

      if (rem <= 0 && status === "in_progress") {
        void finishAndGoToResults();
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [status, startedAt, durationSeconds, navigate]);

  const currentQuestion = useMemo(
    () => (questions.length > 0 ? questions[currentIndex] : null),
    [questions, currentIndex],
  );

  const totalQuestions = questions.length;

  const handleStart = async () => {
    try {
      setStarting(true);
      setStartError(null);
      const options: StartExamOptions = {
        rangeStart: 1,
        rangeEnd: TOTAL_QUESTIONS,
        imageFilter: "all",
      };
      const { questions: loaded } = await startExamFromApi(options);
      if (!loaded.length) {
        setStartError("No questions available. Please try again later.");
        toast.error("No questions available.");
        return;
      }
      await saveExamPack(loaded).catch(() => {});
      void peekExamPackCount().then(setOfflinePacks).catch(() => {});
      startExam(loaded, EXAM_DURATION_SECONDS);
      finishingRef.current = false;
      void refetchPremium();
      toast.success("Exam started");
    } catch (err) {
      console.error(err);
      if (err instanceof ExamQuotaExceededError) {
        setStartError(err.message);
        toast.error(err.message);
        void refetchPremium();
        return;
      }
      const pack = await takeOldestExamPack().catch(() => null);
      if (pack?.questions && Array.isArray(pack.questions) && pack.questions.length) {
        startExam(pack.questions as Question[], EXAM_DURATION_SECONDS);
        finishingRef.current = false;
        toast.success("Offline exam started from a saved session pack");
        void peekExamPackCount().then(setOfflinePacks).catch(() => {});
        return;
      }
      setStartError("Failed to start exam. Check your connection and try again.");
      toast.error("Failed to start exam.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = () => {
    toast.success("Exam submitted");
    void finishAndGoToResults();
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
          {offlinePacks > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Offline packs saved: {offlinePacks}/5 — you can start an exam without internet.
            </Typography>
          )}
          {isPremium && quota?.applies && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {quota.unlimited
                ? "Premium: Unlimited exams"
                : `Premium exam quota: ${quota.remaining} of ${quota.limit} remaining ${quota.periodLabel}`}
            </Typography>
          )}
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 0 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={2}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={800}>Ready to begin?</Typography>
                <Typography variant="body2" color="text.secondary">
                  You will have 20 minutes to answer all questions. Your score will be shown at the end.
                </Typography>
                {startError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {startError}
                  </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Question range
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You will practice from the full set of {TOTAL_QUESTIONS} questions.
                  </Typography>
                </Box>
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
    <Box
      sx={{
        display: "flex",
        flexDirection: isTablet ? "row" : "column",
        gap: isTablet ? 2 : 1.5,
        pb: immersiveExam ? "calc(72px + env(safe-area-inset-bottom))" : 0,
      }}
    >
      <Stack spacing={isCompactPhone ? 1.5 : 3} sx={{ flex: 1, minWidth: 0 }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: immersiveExam ? 2 : 0,
          position: "sticky",
          top: immersiveExam ? 0 : { xs: 8, sm: 12 },
          zIndex: 5,
          backdropFilter: "blur(10px)",
          bgcolor: "background.paper",
        }}
      >
        <CardContent sx={{ py: isCompactPhone ? 0.5 : 0.75, px: { xs: 1.25, sm: 2 } }}>
          <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="center">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant={isCompactPhone ? "subtitle1" : "h6"} fontWeight={900} noWrap>
                {currentIndex + 1} / {totalQuestions}
              </Typography>
              {!isCompactPhone && (
                <Typography variant="body2" color="text.secondary">
                  {answeredCount} answered • {Math.round(completionPct)}% complete
                </Typography>
              )}
              <LinearProgress
                aria-label="Exam progress"
                variant="determinate"
                value={Math.min(100, Math.max(0, completionPct))}
                sx={{ mt: 0.75, height: isCompactPhone ? 4 : 6, borderRadius: 999 }}
              />
            </Box>

            <Stack direction="row" gap={1} alignItems="center">
              <Box
                sx={{
                  position: "relative",
                  width: isCompactPhone ? 40 : 44,
                  height: isCompactPhone ? 40 : 44,
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
                    size={isCompactPhone ? 40 : 44}
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
                  <Typography variant="caption" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums", fontSize: isCompactPhone ? 10 : 12 }}>
                    {formatTime(remaining)}
                  </Typography>
                </Box>
              </Box>

              {!immersiveExam && (
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ px: 2.5, py: 1.1 }}
                  onClick={handleSubmit}
                  aria-label="Submit exam"
                >
                  Submit
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: immersiveExam ? 2 : 0 }}>
        <CardContent sx={{ px: { xs: 1.5, sm: 2 } }}>
          <Typography component="h2" variant={isCompactPhone ? "subtitle1" : "h6"} fontWeight={900} sx={{ mb: 1, letterSpacing: 0.2, lineHeight: 1.35 }}>
            {currentQuestion.text}
          </Typography>

          {currentQuestion.imageUrl && (
            <Box
              component="img"
              src={currentQuestion.imageUrl}
              alt="Question image"
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                maxHeight: isCompactPhone ? 160 : isPhone ? 200 : 250,
                display: "block",
                objectFit: "contain",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                mb: 2,
                mt: 1,
              }}
            />
          )}

          <RadioGroup
            value={selectedAnswers[currentQuestion.id] ?? ""}
            onChange={(_e, value) => selectAnswer(currentQuestion.id, value)}
            aria-label="Answer choices"
          >
            <Stack spacing={1.25}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                const letter = option.id.toUpperCase();

                return (
                  <Box
                    key={option.id}
                    sx={{
                      borderRadius: isPhone ? 2 : 999,
                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "divider",
                      bgcolor: isSelected ? "primary.main" : "transparent",
                      color: isSelected ? "primary.contrastText" : "text.primary",
                      px: 1.5,
                      py: 0.5,
                      minHeight: 48,
                      display: "flex",
                      alignItems: "center",
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
                          fontSize: isCompactPhone ? "0.9rem" : undefined,
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

      {!isTablet && !immersiveExam && (
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} alignItems="center">
        <Box sx={{ width: "100%", overflowX: "auto", py: 0.5 }}>
        <Stack direction="row" flexWrap={isPhone ? "nowrap" : "wrap"} gap={0.75}>
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
        </Box>

        <Stack direction="row" gap={1} sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
          <Button
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: "none", minHeight: 44 }}
            disabled={currentIndex === 0}
            onClick={() => goToQuestion(currentIndex - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            sx={{ borderRadius: 999, textTransform: "none", minHeight: 44 }}
            disabled={currentIndex === Math.max(totalQuestions - 1, 0)}
            onClick={() => goToQuestion(currentIndex + 1)}
          >
            Next
          </Button>
        </Stack>
      </Stack>
      )}
      </Stack>

      {isTablet && (
        <Card variant="outlined" sx={{ width: 220, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 12 }}>
          <CardContent>
            <Typography variant="caption" fontWeight={800}>Questions</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5, mt: 1 }}>
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
                    sx={{ justifyContent: "center" }}
                  />
                );
              })}
            </Box>
            <Stack gap={1} mt={2}>
              <Button variant="outlined" disabled={currentIndex === 0} onClick={() => goToQuestion(currentIndex - 1)}>Previous</Button>
              <Button variant="outlined" disabled={currentIndex === Math.max(totalQuestions - 1, 0)} onClick={() => goToQuestion(currentIndex + 1)}>Next</Button>
              <Button variant="contained" color="secondary" onClick={handleSubmit}>Submit</Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {immersiveExam && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 12,
            px: 1.5,
            pt: 1,
            pb: "calc(10px + env(safe-area-inset-bottom))",
            display: "flex",
            gap: 1,
            borderRadius: 0,
          }}
        >
          <Button fullWidth variant="outlined" disabled={currentIndex === 0} onClick={() => goToQuestion(currentIndex - 1)} sx={{ minHeight: 44 }}>
            Prev
          </Button>
          <Button fullWidth variant="outlined" disabled={currentIndex === Math.max(totalQuestions - 1, 0)} onClick={() => goToQuestion(currentIndex + 1)} sx={{ minHeight: 44 }}>
            Next
          </Button>
          <Button fullWidth variant="contained" color="secondary" onClick={handleSubmit} sx={{ minHeight: 44 }}>
            Submit
          </Button>
        </Paper>
      )}
    </Box>
  );
}

