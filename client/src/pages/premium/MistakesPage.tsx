import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { premiumMistakesApi } from "../../api/premiumApi";
import { getApiErrorMessage } from "../../api/http";

export function MistakesPage() {
  const q = useQuery({ queryKey: ["premium", "mistakes"], queryFn: premiumMistakesApi });

  if (q.isLoading) return <Typography>Loading mistakes…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;

  const items = q.data?.items ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={900}>My mistakes</Typography>
        <Typography color="text.secondary">Questions you have answered incorrectly in saved exams.</Typography>
      </Box>

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <Typography>No mistakes recorded yet. Complete a mock exam while signed in.</Typography>
            <Button component={RouterLink} to="/exam" variant="contained" sx={{ mt: 2, borderRadius: 999 }}>
              Start exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.questionId} variant="outlined">
            <CardContent>
              <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
                <Chip size="small" label={item.topic ?? "Topic"} />
                <Chip size="small" label={`Missed ${item.missedCount}×`} color="error" variant="outlined" />
              </Stack>
              <Typography fontWeight={800}>{item.question ?? `Question #${item.questionId}`}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your answer: {item.lastSelected ?? "—"} · Correct: {item.correct}
              </Typography>
              {item.explanation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {item.explanation}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Button component={RouterLink} to="/premium/analyse" variant="outlined" sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
        Back to Analyse
      </Button>
    </Stack>
  );
}
