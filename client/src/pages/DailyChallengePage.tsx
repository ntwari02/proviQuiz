import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { dailyBoardApi, dailyChallengeApi, submitDailyChallengeApi } from "../api/challengeApi";
import { getApiErrorMessage } from "../api/http";
import { useAuthStore } from "../store/authStore";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";
import { usePremiumAccess } from "../hooks/usePremiumAccess";

const letters = ["a", "b", "c", "d"] as const;

export function DailyChallengePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();
  const { isPhone, isCompactPhone } = useDeviceAdapter();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});

  const q = useQuery({ queryKey: ["daily-challenge"], queryFn: dailyChallengeApi });
  const boardQ = useQuery({ queryKey: ["daily-board"], queryFn: dailyBoardApi });

  const submitM = useMutation({
    mutationFn: submitDailyChallengeApi,
    onSuccess: (data) => {
      qc.setQueryData(["daily-challenge"], data);
      void qc.invalidateQueries({ queryKey: ["daily-board"] });
      toast.success("Daily challenge saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const data = q.data;
  const questions = data?.questions ?? [];
  const current = questions[index];
  const answered = useMemo(() => Object.keys(picks).length, [picks]);

  if (!token) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={900}>
          Today’s national challenge
        </Typography>
        <Typography color="text.secondary">
          Everyone in Rwanda gets the same 5 questions today. Sign in to play, keep a streak, and see the board.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/login?redirect=/daily")} sx={{ alignSelf: "flex-start" }}>
          Sign in to play
        </Button>
      </Stack>
    );
  }

  if (q.isLoading) return <Typography>Loading today’s challenge…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;
  if (!data?.enabled) return <Typography>Daily challenge is turned off.</Typography>;

  if (data.completed) {
    return (
      <Stack spacing={2}>
        <Typography variant={isPhone ? "h5" : "h4"} fontWeight={900}>
          Today’s challenge
        </Typography>
        <Card sx={{ background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)", color: "#fff" }}>
          <CardContent>
            <Typography variant="overline">Your score</Typography>
            <Typography variant="h3" fontWeight={900}>
              {data.result?.correctCount}/{data.result?.total}
            </Typography>
            <Typography>{data.result?.scorePercent}% · streak {data.streak} day{data.streak === 1 ? "" : "s"}</Typography>
          </CardContent>
        </Card>
        {data.explanationsLocked && (
          <Card>
            <CardContent>
              <Typography fontWeight={800}>Unlock explanations</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Premium shows why each answer is correct, plus Analyse and live battles.
              </Typography>
              <Button component={RouterLink} to="/premium/upgrade" variant="contained" sx={{ mt: 2 }}>
                See Premium
              </Button>
            </CardContent>
          </Card>
        )}
        {questions.some((item) => item.correct) && (
          <Stack spacing={1.5}>
            {questions.map((item, i) => (
              <Card key={item.id}>
                <CardContent>
                  <Typography fontWeight={800}>
                    {i + 1}. {item.question}
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    Correct: {item.correct?.toUpperCase()}. {item.options[item.correct!]}
                  </Typography>
                  {item.explanation && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.explanation}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
        <Card>
          <CardContent>
            <Typography fontWeight={900} mb={1}>
              National board · {boardQ.data?.dateKey}
            </Typography>
            {(boardQ.data?.items ?? []).length === 0 && (
              <Typography color="text.secondary">Be first on the board today.</Typography>
            )}
            {(boardQ.data?.items ?? []).map((row) => (
              <Stack key={row.rank} direction="row" justifyContent="space-between" py={0.5}>
                <Typography>
                  {row.rank}. {row.name}
                </Typography>
                <Typography fontWeight={800}>
                  {row.correctCount}/{row.total}
                </Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
        {!isPremium && (
          <Button component={RouterLink} to="/premium/upgrade" variant="outlined">
            Compete in live battles
          </Button>
        )}
      </Stack>
    );
  }

  if (!current) return <Typography>No questions available today.</Typography>;

  return (
    <Stack spacing={2} sx={{ pb: 2 }}>
      <Box>
        <Chip label={data.dateKey} size="small" sx={{ mb: 1, fontWeight: 800 }} />
        <Typography variant={isCompactPhone ? "h5" : "h4"} fontWeight={900}>
          Today’s 5 · same for everyone
        </Typography>
        <Typography color="text.secondary">
          Streak {data.streak ?? 0} · finish to climb today’s national board
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={(answered / questions.length) * 100} sx={{ height: 8, borderRadius: 999 }} />
      <Card>
        <CardContent>
          <Typography fontWeight={800} sx={{ mb: 2 }}>
            {index + 1}. {current.question}
          </Typography>
          {current.imageUrl && (
            <Box component="img" src={current.imageUrl} alt="" sx={{ maxWidth: "100%", maxHeight: 180, mb: 2, display: "block", borderRadius: 2 }} />
          )}
          <RadioGroup
            value={picks[current.id] ?? ""}
            onChange={(_e, v) => setPicks((prev) => ({ ...prev, [current.id]: v }))}
          >
            <Stack spacing={1}>
              {letters.map((key) => (
                <Box
                  key={key}
                  sx={{
                    border: "1px solid",
                    borderColor: picks[current.id] === key ? "primary.main" : "divider",
                    borderRadius: 2,
                    px: 1.5,
                    minHeight: 48,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel value={key} control={<Radio />} label={`${key.toUpperCase()}. ${current.options[key]}`} sx={{ m: 0, width: "100%" }} />
                </Box>
              ))}
            </Stack>
          </RadioGroup>
        </CardContent>
      </Card>
      <Stack direction="row" gap={1}>
        <Button variant="outlined" disabled={index === 0} onClick={() => setIndex((i) => i - 1)} fullWidth={isPhone}>
          Prev
        </Button>
        {index < questions.length - 1 ? (
          <Button variant="contained" onClick={() => setIndex((i) => i + 1)} fullWidth={isPhone}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={submitM.isPending}
            onClick={() =>
              submitM.mutate(questions.map((item) => ({ questionId: item.id, selected: picks[item.id] ?? null })))
            }
            fullWidth={isPhone}
          >
            Submit today
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
