import { Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { premiumAnalyseApi } from "../../api/premiumApi";
import { getApiErrorMessage } from "../../api/http";
import { useDeviceAdapter } from "../../hooks/useDeviceAdapter";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function AnalysePage() {
  const { isPhone, isCompactPhone } = useDeviceAdapter();
  const q = useQuery({ queryKey: ["premium", "analyse"], queryFn: premiumAnalyseApi });

  if (q.isLoading) return <Typography>Loading analysis…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;

  const data = q.data!;
  const t = data.totals;

  const stats = [
    ["Exams", t.examCount],
    ["Accuracy", pct(t.accuracy)],
    ["Correct", t.correctAnswers],
    ["Wrong", t.wrongAnswers],
  ] as const;

  return (
    <Stack spacing={isCompactPhone ? 2 : 3}>
      <Box>
        <Typography variant={isCompactPhone ? "h5" : "h4"} fontWeight={900}>Analyse</Typography>
        {!isCompactPhone && (
          <Typography color="text.secondary">Understand your weaknesses and what to study next.</Typography>
        )}
      </Box>

      {isPhone ? (
        <Card>
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="overline" color="text.secondary">Readiness</Typography>
                <Typography variant="h4" fontWeight={900} lineHeight={1}>{data.readiness.score}</Typography>
              </Box>
              <Chip label={data.readiness.bandLabel} color="primary" sx={{ fontWeight: 800 }} />
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">ProviQuiz Readiness Score</Typography>
            <Typography variant="h3" fontWeight={900}>{data.readiness.score}</Typography>
            <Chip label={data.readiness.bandLabel} color="primary" sx={{ mt: 1, fontWeight: 800 }} />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, maxWidth: 560 }}>
              {data.readiness.disclaimer}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={{ border: "2px solid", borderColor: "primary.main" }}>
        <CardContent>
          <Typography variant="overline" fontWeight={800}>Your next move</Typography>
          <Typography variant={isCompactPhone ? "subtitle1" : "h6"} fontWeight={900} sx={{ mt: 0.5 }}>
            {data.nextMove.topic}
          </Typography>
          {data.nextMove.mastery > 0 && (
            <Typography variant="body2" color="text.secondary">Mastery: {data.nextMove.mastery}%</Typography>
          )}
          <Typography sx={{ mt: 1 }}>{data.nextMove.recommended}</Typography>
          <Button
            component={RouterLink}
            to={data.nextMove.cta === "START EXAM" ? "/exam" : "/premium/practice"}
            variant="contained"
            fullWidth={isPhone}
            sx={{ mt: 2, borderRadius: 999, minHeight: 44 }}
          >
            {data.nextMove.cta}
          </Button>
        </CardContent>
      </Card>

      {isPhone ? (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, mx: -0.5, px: 0.5 }}>
          {stats.map(([label, value]) => (
            <Card key={String(label)} sx={{ minWidth: 108, flexShrink: 0 }}>
              <CardContent sx={{ py: 1.25, px: 1.5 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h6" fontWeight={900}>{value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {stats.map(([label, value]) => (
            <Card key={String(label)}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={900}>{value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography fontWeight={900} mb={1}>Performance trend</Typography>
          {data.recent.length === 0 ? (
            <Typography color="text.secondary">No saved exams yet. Take a mock exam while signed in.</Typography>
          ) : (
            <Stack spacing={1}>
              {data.recent.map((e) => (
                <Stack key={e.id} direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="body2">{new Date(e.createdAt).toLocaleDateString()} · {e.score}/{e.totalQuestions}</Typography>
                  <Typography variant="body2" fontWeight={700}>{pct(e.accuracy)}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography fontWeight={900} mb={2}>Topic mastery</Typography>
          {data.topics.length === 0 ? (
            <Typography color="text.secondary">Topic mastery appears after exams are saved with categorized questions.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {data.topics.map((topic) => (
                <Box key={topic.topic}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography fontWeight={700}>{topic.topic}</Typography>
                    <Typography variant="body2">{topic.mastery}% · {topic.status}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={topic.mastery} sx={{ height: 8, borderRadius: 999, mt: 0.5 }} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography fontWeight={900} mb={1}>Weak topics</Typography>
            {data.weakTopics.length === 0 && <Typography color="text.secondary">Not enough data yet.</Typography>}
            {data.weakTopics.map((w) => (
              <Typography key={w.topic} variant="body2">{w.topic} · {w.mastery}%</Typography>
            ))}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography fontWeight={900} mb={1}>Strong topics</Typography>
            {data.strongTopics.length === 0 && <Typography color="text.secondary">Not enough data yet.</Typography>}
            {data.strongTopics.map((w) => (
              <Typography key={w.topic} variant="body2">{w.topic} · {w.mastery}%</Typography>
            ))}
          </CardContent>
        </Card>
      </Stack>

      <Stack direction={isPhone ? "column" : "row"} gap={1} flexWrap="wrap">
        <Button component={RouterLink} to="/premium/mistakes" variant="outlined" fullWidth={isPhone} sx={{ borderRadius: 999, minHeight: 44 }}>My mistakes</Button>
        <Button component={RouterLink} to="/exam" variant="contained" fullWidth={isPhone} sx={{ borderRadius: 999, minHeight: 44 }}>Retake exam</Button>
        {!isCompactPhone && (
          <Button component={RouterLink} to="/premium" variant="text" sx={{ borderRadius: 999 }}>Dashboard</Button>
        )}
      </Stack>
    </Stack>
  );
}
