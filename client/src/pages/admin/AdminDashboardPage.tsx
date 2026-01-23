import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link as RouterLink } from "react-router-dom";
import { adminExamsApi, adminOverviewApi, type AdminOverviewEnhanced } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: adminOverviewApi }) as ReturnType<typeof useQuery<AdminOverviewEnhanced>>;
  const recentExams = useQuery({
    queryKey: ["admin", "exams", { page: 0, limit: 5 }],
    queryFn: () => adminExamsApi({ skip: 0, limit: 5 }),
  });

  if (q.isLoading) return <Typography>Loading admin overview…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;

  const data = q.data!;
  const last = data.trend?.[data.trend.length - 1];

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing={-0.6}>
            Admin dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Global platform metrics and operations.
          </Typography>
        </Box>
        <Chip label="Admin only" variant="outlined" />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "repeat(12, 1fr)" },
          gap: 2,
        }}
      >
        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 1", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Users
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {data.userCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 1", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Questions (active)
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {data.questionCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 1", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Exams submitted
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {data.examCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 1", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pass Rate
              </Typography>
              <Typography variant="h4" fontWeight={900} color="success.main">
                {pct((data as any).passRate || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 1", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active Exam Configs
              </Typography>
              <Typography variant="h4" fontWeight={900}>
                {(data as any).activeExamConfigs || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 12" } }}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} mb={1.5}>
                <Box>
                  <Typography fontWeight={900}>Last 14 days</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exam volume and average accuracy per day.
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Latest: {last ? `${dayjs(last.date).format("MMM D")} · ${last.exams} exams · ${pct(last.accuracy)}` : "—"}
                </Typography>
              </Stack>

              {/* Lightweight “chart”: compact bar list (no extra deps) */}
              <Stack spacing={1}>
                {(data.trend ?? []).slice(-14).map((t) => (
                  <Stack key={t.date} direction="row" alignItems="center" gap={1.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 64 }}>
                      {dayjs(t.date).format("MMM D")}
                    </Typography>
                    <Box sx={{ flex: 1, height: 10, borderRadius: 999, bgcolor: "rgba(148,163,184,0.25)", overflow: "hidden" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.min(100, (t.exams / Math.max(1, Math.max(...(data.trend ?? []).map((x) => x.exams)))) * 100)}%`,
                          bgcolor: "text.primary",
                          opacity: 0.85,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 70, textAlign: "right" }}>
                      {t.exams} · {pct(t.accuracy)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 12" } }}>
          <Card>
            <CardContent>
              <Typography fontWeight={900} mb={1.5}>Questions by Increment</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {((data as any).questionsByIncrement || []).map((inc: any) => (
                  <Box key={inc.increment} sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="caption" color="text.secondary">Increment {inc.increment}</Typography>
                    <Typography variant="h6" fontWeight={900}>
                      {inc.total} total • {inc.published} published
                    </Typography>
                  </Box>
                ))}
                {(!(data as any).questionsByIncrement || (data as any).questionsByIncrement.length === 0) && (
                  <Typography variant="body2" color="text.secondary">No questions assigned to increments yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 5" } }}>
          <Card>
            <CardContent>
              <Typography fontWeight={900} mb={0.5}>
                Quick actions
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Jump into operations.
              </Typography>
              <Stack spacing={1.25}>
                <Button component={RouterLink} to="/admin/users" variant="contained">
                  Manage users
                </Button>
                <Button component={RouterLink} to="/admin/questions" variant="outlined">
                  Review question bank
                </Button>
                <Button component={RouterLink} to="/admin/exams" variant="outlined">
                  View recent exams
                </Button>
                <Button component={RouterLink} to="/admin/analytics" variant="outlined">
                  View analytics
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 7" } }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                  <Typography fontWeight={900}>Recent exams</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Latest submissions across all users.
                  </Typography>
                </Box>
                <Button component={RouterLink} to="/admin/exams" variant="text">
                  See all
                </Button>
              </Stack>

              {recentExams.isLoading && <Typography>Loading…</Typography>}
              {recentExams.isError && <Typography color="error">{getApiErrorMessage(recentExams.error)}</Typography>}

              <Stack spacing={1.25}>
                {(recentExams.data?.items ?? []).map((e) => {
                  const accuracy = e.totalQuestions > 0 ? e.score / e.totalQuestions : 0;
                  return (
                    <Box key={e.id} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.5}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap>
                            {e.user?.name || e.user?.email || "Unknown user"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {dayjs(e.createdAt).format("MMM D, h:mm A")} · {e.mode}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={900}>
                          {e.score}/{e.totalQuestions} ({Math.round(accuracy * 100)}%)
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

