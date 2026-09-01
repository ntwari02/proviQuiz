import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { premiumSmartPracticeApi } from "../../api/premiumApi";
import { getApiErrorMessage } from "../../api/http";
import { useDeviceAdapter } from "../../hooks/useDeviceAdapter";

export function SmartPracticePage() {
  const { isPhone, isCompactPhone, useBottomNav } = useDeviceAdapter();
  const q = useQuery({
    queryKey: ["premium", "smart-practice"],
    queryFn: () => premiumSmartPracticeApi(15),
  });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (q.isLoading) return <Typography>Loading smart practice…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;

  const questions = q.data?.questions ?? [];
  const current = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  if (!questions.length) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={900}>Smart practice</Typography>
        <Typography>No questions available yet. Take a mock exam first so we can personalize practice.</Typography>
        <Button component={RouterLink} to="/exam" variant="contained" sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
          Start exam
        </Button>
      </Stack>
    );
  }

  if (done) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={900}>Practice complete</Typography>
        <Typography>
          {correctCount} / {questions.length} correct
        </Typography>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            sx={{ borderRadius: 999 }}
            onClick={() => {
              setIndex(0);
              setSelected("");
              setRevealed(false);
              setCorrectCount(0);
              void q.refetch();
            }}
          >
            New set
          </Button>
          <Button component={RouterLink} to="/premium/analyse" variant="outlined" sx={{ borderRadius: 999 }}>
            Analyse
          </Button>
        </Stack>
      </Stack>
    );
  }

  const letters = ["a", "b", "c", "d"] as const;

  return (
    <Stack spacing={isPhone ? 1.5 : 3} sx={{ pb: isPhone ? "calc(72px + env(safe-area-inset-bottom))" : 0 }}>
      <Box>
        <Typography variant={isCompactPhone ? "h5" : "h4"} fontWeight={900}>Smart practice</Typography>
        {!isCompactPhone && (
          <Typography color="text.secondary">
            Personalized from your mistakes and weak topics. Immediate feedback — not a timed exam.
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Question {index + 1} / {questions.length}
          {current?.topic ? ` · ${current.topic}` : ""}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography fontWeight={800} sx={{ mb: 2, fontSize: isCompactPhone ? "1rem" : undefined }}>{current!.question}</Typography>
          {current!.imageUrl && (
            <Box
              component="img"
              src={current!.imageUrl}
              alt=""
              sx={{ maxWidth: "100%", maxHeight: isCompactPhone ? 160 : 220, mb: 2, display: "block" }}
            />
          )}
          <RadioGroup
            value={selected}
            onChange={(_e, v) => {
              if (revealed) return;
              setSelected(v);
            }}
          >
            <Stack spacing={1}>
              {letters.map((key) => {
                const isCorrect = current!.correct === key;
                const isPicked = selected === key;
                let borderColor = "divider";
                if (revealed && isCorrect) borderColor = "success.main";
                else if (revealed && isPicked && !isCorrect) borderColor = "error.main";
                return (
                  <Box key={key} sx={{ border: "1px solid", borderColor, borderRadius: isPhone ? 2 : 2, px: 1.5, minHeight: 48, display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                      value={key}
                      control={<Radio disabled={revealed} />}
                      label={`${key.toUpperCase()}. ${current!.options[key]}`}
                      sx={{ width: "100%", m: 0, py: 0.75 }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </RadioGroup>

          {revealed && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {current!.explanation || "Review the correct option and try similar questions next."}
            </Typography>
          )}

          {!isPhone && (
          <Stack direction="row" gap={1} mt={2}>
            {!revealed ? (
              <Button
                variant="contained"
                disabled={!selected}
                sx={{ borderRadius: 999 }}
                onClick={() => {
                  if (selected === current!.correct) setCorrectCount((n) => n + 1);
                  setRevealed(true);
                }}
              >
                Check
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ borderRadius: 999 }}
                onClick={() => {
                  setIndex((i) => i + 1);
                  setSelected("");
                  setRevealed(false);
                }}
              >
                Next
              </Button>
            )}
          </Stack>
          )}
        </CardContent>
      </Card>

      {isPhone && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: useBottomNav ? "calc(56px + env(safe-area-inset-bottom))" : 0,
            zIndex: 11,
            px: 1.5,
            pt: 1,
            pb: 1,
            borderRadius: 0,
          }}
        >
          {!revealed ? (
            <Button
              fullWidth
              variant="contained"
              disabled={!selected}
              sx={{ minHeight: 44 }}
              onClick={() => {
                if (selected === current!.correct) setCorrectCount((n) => n + 1);
                setRevealed(true);
              }}
            >
              Check
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ minHeight: 44 }}
              onClick={() => {
                setIndex((i) => i + 1);
                setSelected("");
                setRevealed(false);
              }}
            >
              Next
            </Button>
          )}
        </Paper>
      )}
    </Stack>
  );
}
