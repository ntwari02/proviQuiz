import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { dailyChallengeApi, setExamDateApi } from "../api/challengeApi";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";
import { useAuthStore } from "../store/authStore";
import { usePremiumAccess } from "../hooks/usePremiumAccess";

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const exam = new Date(iso);
  const now = new Date();
  const a = Date.UTC(exam.getFullYear(), exam.getMonth(), exam.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((a - b) / 86400000);
}

export function HomePage() {
  const navigate = useNavigate();
  const { isPhone, isCompactPhone, hideHomeDecor } = useDeviceAdapter();
  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();
  const qc = useQueryClient();
  const dailyQ = useQuery({ queryKey: ["daily-challenge"], queryFn: dailyChallengeApi });
  const [examInput, setExamInput] = useState("");

  const examM = useMutation({
    mutationFn: setExamDateApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["daily-challenge"] }),
  });

  const daily = dailyQ.data;
  const left = daysUntil(daily?.examDate);
  const showDecor = !hideHomeDecor && !isPhone;

  return (
    <Stack spacing={isPhone ? 2.5 : 4} sx={{ pb: 2 }}>
      <Card
        sx={{
          overflow: "hidden",
          background: "linear-gradient(120deg, #042f2e 0%, #0f766e 48%, #134e4a 100%)",
          color: "#f8fafc",
          border: "none",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 5 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} gap={3} alignItems={{ lg: "center" }}>
            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ letterSpacing: 1.4, opacity: 0.85 }}>
                Rwanda driving theory
              </Typography>
              <Typography variant={isCompactPhone ? "h4" : "h3"} fontWeight={900} letterSpacing={-0.8}>
                Pass with a habit,
                <Box component="span" display="block">
                  not luck.
                </Box>
              </Typography>
              <Typography sx={{ maxWidth: 520, opacity: 0.92 }}>
                Free mock is still 20 questions in 20 minutes. Come back every day for the national 5, then go Premium for battles and Analyse.
              </Typography>
              <Stack direction={isPhone ? "column" : "row"} gap={1.25} pt={1}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth={isPhone}
                  onClick={() => navigate("/exam")}
                  sx={{ bgcolor: "#fff", color: "#042f2e", fontWeight: 800, "&:hover": { bgcolor: "#ecfdf5" } }}
                >
                  Start free mock
                </Button>
                <Button
                  variant="outlined"
                  fullWidth={isPhone}
                  onClick={() => navigate(token ? "/daily" : "/login?redirect=/daily")}
                  sx={{ borderColor: "rgba(255,255,255,0.55)", color: "#fff" }}
                >
                  Today’s challenge
                </Button>
              </Stack>
            </Stack>
            {!isCompactPhone && (
              <Box sx={{ flex: 1, minHeight: isPhone ? 160 : 240, position: "relative", borderRadius: 3, overflow: "hidden" }}>
                <Box
                  component="video"
                  src="/A Person Driving a Car · Free Stock Video.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                {showDecor && (
                  <Box sx={{ position: "absolute", left: 16, bottom: 16, bgcolor: "rgba(15,23,42,0.78)", p: 2, borderRadius: 2, width: 200 }}>
                    <Typography variant="caption">Today’s challenge</Typography>
                    <Typography fontWeight={900}>5 shared questions</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {token && (
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline">Streak</Typography>
              <Typography variant="h4" fontWeight={900}>
                {daily?.streak ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Best {daily?.longestStreak ?? 0} · play today’s 5 to keep it
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline">Exam day</Typography>
              <Typography variant="h4" fontWeight={900}>
                {left === null ? "—" : left < 0 ? "Done" : left === 0 ? "Today" : `${left}d`}
              </Typography>
              {token && (
                <Stack direction="row" gap={1} mt={1} alignItems="center">
                  <TextField
                    type="date"
                    size="small"
                    value={examInput}
                    onChange={(e) => setExamInput(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button size="small" onClick={() => examM.mutate(examInput || null)}>
                    Set
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, cursor: "pointer" }} onClick={() => navigate("/daily")}>
            <CardContent>
              <Typography variant="overline">National 5</Typography>
              <Typography variant="h6" fontWeight={900}>
                {daily?.completed ? `${daily.result?.correctCount}/${daily.result?.total} today` : "Not played yet"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Same questions for every learner today
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {[
          { title: "Timed mock", body: "20 questions · 20 minutes. Unchanged for everyone.", to: "/exam", cta: "Start" },
          { title: "Daily 5", body: "A national habit. Streak + today’s board.", to: token ? "/daily" : "/login?redirect=/daily", cta: "Play" },
          {
            title: isPremium ? "Live battle" : "Go Premium",
            body: isPremium ? "Share a code. Same exam. Highest score wins." : "Battles, Analyse, and smart practice from mistakes.",
            to: isPremium ? "/premium/battle" : "/premium/upgrade",
            cta: isPremium ? "Battle" : "See plans",
          },
        ].map((item) => (
          <Card key={item.title} variant="outlined">
            <CardContent>
              <Typography fontWeight={900}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: 44 }}>
                {item.body}
              </Typography>
              <Button onClick={() => navigate(item.to)} sx={{ mt: 1.5 }} variant="text">
                {item.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
