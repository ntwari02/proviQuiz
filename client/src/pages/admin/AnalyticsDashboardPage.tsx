import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsOverviewApi } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function AnalyticsDashboardPage() {
  const query = useQuery({ queryKey: ["admin", "analytics", "overview"], queryFn: adminAnalyticsOverviewApi });

  if (query.isLoading) return <Typography>Loading analytics…</Typography>;
  if (query.isError) return <Typography color="error">{getApiErrorMessage(query.error)}</Typography>;

  const data = query.data!;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive exam statistics, pass/fail rates, and performance insights.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => query.refetch()} disabled={query.isFetching}>
          Refresh
        </Button>
      </Stack>

      <Stack spacing={2} mb={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total Exams</Typography>
              <Typography variant="h4" fontWeight={900}>{data.totalExams}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Passed</Typography>
              <Typography variant="h4" fontWeight={900} color="success.main">{data.passed}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Failed</Typography>
              <Typography variant="h4" fontWeight={900} color="error.main">{data.failed}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Pass Rate</Typography>
              <Typography variant="h4" fontWeight={900}>{pct(data.passRate)}</Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={900} mb={2}>Average Accuracy</Typography>
            <Typography variant="h3" fontWeight={900}>{pct(data.averageAccuracy)}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={900} mb={2}>Average Performance by Increment</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Increment</strong></TableCell>
                  <TableCell align="right"><strong>Average Accuracy</strong></TableCell>
                  <TableCell align="right"><strong>Total Questions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.averageByIncrement.map((inc) => (
                  <TableRow key={inc.increment}>
                    <TableCell>Increment {inc.increment}</TableCell>
                    <TableCell align="right">{pct(inc.averageAccuracy)}</TableCell>
                    <TableCell align="right">{inc.totalQuestions}</TableCell>
                  </TableRow>
                ))}
                {data.averageByIncrement.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" color="text.secondary">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={900} mb={2}>Most Failed Questions</Typography>
          <Stack spacing={1.5}>
            {data.mostFailedQuestions.slice(0, 20).map((q, idx) => (
              <Box key={q.questionId} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" gap={1} alignItems="center" mb={0.5} flexWrap="wrap">
                      <Typography fontWeight={900}>#{idx + 1}</Typography>
                      <Chip size="small" label={`Missed ${q.missedCount} times`} color="error" />
                      {q.increment && <Chip size="small" label={`Inc ${q.increment}`} variant="outlined" />}
                      {q.category && <Chip size="small" label={q.category} variant="outlined" />}
                    </Stack>
                    <Typography variant="body2">{q.question || `Question ID: ${q.questionId}`}</Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
            {data.mostFailedQuestions.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={2}>No failed questions data yet.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
