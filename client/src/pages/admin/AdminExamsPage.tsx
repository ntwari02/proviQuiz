import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { adminExamsApi } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";

function fmtDuration(seconds: number) {
  const s = Math.max(0, seconds | 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function AdminExamsPage() {
  const [page, setPage] = useState(0);
  const limit = 25;

  const query = useQuery({
    queryKey: ["admin", "exams", { page, limit }],
    queryFn: () => adminExamsApi({ skip: page * limit, limit }),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Exams
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent submissions across all users.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => query.refetch()} disabled={query.isFetching}>
          Refresh
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {query.isLoading && <Typography>Loading exams…</Typography>}
          {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

          <Stack spacing={1.5}>
            {items.map((e) => {
              const accuracy = e.totalQuestions > 0 ? e.score / e.totalQuestions : 0;
              return (
                <Box key={e.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.25}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>
                        {e.user?.name || e.user?.email || "Unknown user"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {dayjs(e.createdAt).format("MMM D, YYYY h:mm A")} · {e.mode} · {fmtDuration(e.durationSeconds)}
                      </Typography>
                    </Box>
                    <Typography fontWeight={900}>
                      {e.score}/{e.totalQuestions} ({Math.round(accuracy * 100)}%)
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
            <Typography variant="caption" color="text.secondary">
              Showing {items.length} of {total}
            </Typography>
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0 || query.isFetching}>
                Prev
              </Button>
              <Button variant="outlined" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1 || query.isFetching}>
                Next
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

