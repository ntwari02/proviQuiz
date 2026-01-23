import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../api/http";
import { api } from "../../api/http";

type Question = {
  id: number;
  question: string;
  category?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  isDeleted?: boolean;
};

async function listQuestions(limit: number, skip: number) {
  const res = await api.get<{ items: Question[]; total: number }>("/questions/all", { params: { limit, skip } });
  return res.data;
}

export function AdminQuestionsPage() {
  const limit = 50;
  const skip = 0;

  const q = useQuery({
    queryKey: ["admin", "questions", { limit, skip }],
    queryFn: () => listQuestions(limit, skip),
  });

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Questions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse question bank (admin create/update/delete UI can be added next).
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => q.refetch()} disabled={q.isFetching}>
          Refresh
        </Button>
      </Stack>

      <Card>
        <CardContent>
          {q.isLoading && <Typography>Loading questions…</Typography>}
          {q.isError && <Typography color="error">{getApiErrorMessage(q.error)}</Typography>}

          <Stack spacing={1.25}>
            {(q.data?.items ?? []).slice(0, 50).map((it) => (
              <Box key={it.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography fontWeight={900}>
                  #{it.id} · {it.category || "uncategorized"} · {it.difficulty || "medium"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {it.question}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

