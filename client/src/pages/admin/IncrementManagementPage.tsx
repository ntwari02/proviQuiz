import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  Tabs,
  Tab,
  Checkbox,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../api/http";
import {
  adminIncrementQuestionsApi,
  adminIncrementStatsApi,
  adminAssignQuestionsApi,
  adminLockIncrementApi,
} from "../../api/adminApi";
import { api } from "../../api/http";

type Question = {
  id: number;
  question: string;
  category?: string;
  topic?: string;
  status?: "draft" | "published";
  increment?: 1 | 2 | 3;
};

// Using API functions from adminApi

async function getAllQuestions() {
  const res = await api.get<{ items: Question[]; total: number }>("/questions/all", { params: { limit: 1000 } });
  return res.data.items;
}

function IncrementTab({ increment }: { increment: 1 | 2 | 3 }) {
  const qc = useQueryClient();
  const [locked, setLocked] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const questionsQuery = useQuery({
    queryKey: ["admin", "increments", increment, "questions"],
    queryFn: () => adminIncrementQuestionsApi(increment),
  });

  const allQuestionsQuery = useQuery({
    queryKey: ["admin", "all-questions"],
    queryFn: getAllQuestions,
    enabled: assignDialogOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (questionIds: number[]) => adminAssignQuestionsApi({ increment, questionIds }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "increments"] });
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`${data.updated} questions assigned to Increment ${increment}`);
      setAssignDialogOpen(false);
      setSelectedQuestionIds([]);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });


  const lockMutation = useMutation({
    mutationFn: (locked: boolean) => adminLockIncrementApi({ increment, locked }),
    onSuccess: (data) => {
      setLocked(data.locked);
      toast.success(data.locked ? `Increment ${increment} locked` : `Increment ${increment} unlocked`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const questions = questionsQuery.data ?? [];

  const handleAssign = () => {
    if (selectedQuestionIds.length === 0) {
      toast.error("Select at least one question");
      return;
    }
    assignMutation.mutate(selectedQuestionIds);
  };

  const handleToggleQuestion = (id: number) => {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    const available = (allQuestionsQuery.data ?? []).filter((q) => q.increment === undefined || q.increment !== increment).map((q) => q.id);
    setSelectedQuestionIds(available);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Increment {increment}</Typography>
        <Stack direction="row" gap={1}>
          <FormControlLabel
            control={<Switch checked={locked} onChange={(e) => lockMutation.mutate(e.target.checked)} disabled={lockMutation.isPending} />}
            label={locked ? "Locked" : "Unlocked"}
          />
          <Button variant="outlined" onClick={() => setAssignDialogOpen(true)} disabled={locked}>
            Assign Questions
          </Button>
        </Stack>
      </Stack>

      {questionsQuery.isLoading && <Typography>Loading questions…</Typography>}
      {questionsQuery.isError && <Typography color="error">{getApiErrorMessage(questionsQuery.error)}</Typography>}

      {locked && (
        <Card sx={{ mb: 2, bgcolor: "warning.light" }}>
          <CardContent>
            <Stack direction="row" alignItems="center" gap={1}>
              <LockIcon />
              <Typography>This increment is locked and read-only.</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack spacing={1.5}>
        {questions.map((q) => (
          <Card key={q.id}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1}>
                <DragIndicatorIcon sx={{ color: "text.secondary", cursor: "grab" }} />
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" mb={0.5} flexWrap="wrap">
                    <Typography fontWeight={900}>#{q.id}</Typography>
                    {q.status && (
                      <Chip size="small" label={q.status} color={q.status === "published" ? "success" : "default"} />
                    )}
                    {q.category && <Chip size="small" label={q.category} variant="outlined" />}
                    {q.topic && <Chip size="small" label={q.topic} variant="outlined" />}
                  </Stack>
                  <Typography variant="body2">{q.question}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No questions assigned to this increment yet.
          </Typography>
        )}
      </Stack>

      <Dialog open={assignDialogOpen} onClose={() => { setAssignDialogOpen(false); setSelectedQuestionIds([]); }} maxWidth="md" fullWidth>
        <DialogTitle>Assign Questions to Increment {increment}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1, maxHeight: 400, overflow: "auto" }}>
            {allQuestionsQuery.isLoading && <Typography>Loading questions…</Typography>}
            {(allQuestionsQuery.data ?? [])
              .filter((q) => q.increment === undefined || q.increment !== increment)
              .map((q) => (
                <FormControlLabel
                  key={q.id}
                  control={
                    <Checkbox checked={selectedQuestionIds.includes(q.id)} onChange={() => handleToggleQuestion(q.id)} />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        #{q.id} {q.question.substring(0, 60)}...
                      </Typography>
                      <Stack direction="row" gap={0.5} mt={0.5}>
                        {q.category && <Chip size="small" label={q.category} />}
                        {q.increment && <Chip size="small" label={`Inc ${q.increment}`} />}
                      </Stack>
                    </Box>
                  }
                />
              ))}
          </Stack>
          <Stack direction="row" gap={1} mt={2}>
            <Button size="small" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="small" onClick={() => setSelectedQuestionIds([])}>
              Clear Selection
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssignDialogOpen(false); setSelectedQuestionIds([]); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={selectedQuestionIds.length === 0 || assignMutation.isPending}
          >
            Assign ({selectedQuestionIds.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function IncrementManagementPage() {
  const [tab, setTab] = useState(0);

  const statsQuery = useQuery({ queryKey: ["admin", "increments", "stats"], queryFn: adminIncrementStatsApi });

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Increment Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage questions by increment. Assign, reorder, and lock increments.
          </Typography>
        </Box>
      </Stack>

      {statsQuery.data && (
        <Stack direction="row" spacing={2} mb={3}>
          {statsQuery.data.map((stat) => (
            <Card key={stat.increment} sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={900}>
                  Increment {stat.increment}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: {stat.total} • Published: {stat.published} • Draft: {stat.draft}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Increment 1" />
            <Tab label="Increment 2" />
            <Tab label="Increment 3" />
          </Tabs>

          {tab === 0 && <IncrementTab increment={1} />}
          {tab === 1 && <IncrementTab increment={2} />}
          {tab === 2 && <IncrementTab increment={3} />}
        </CardContent>
      </Card>
    </Box>
  );
}
