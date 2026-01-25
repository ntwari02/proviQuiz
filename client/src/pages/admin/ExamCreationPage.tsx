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
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiErrorMessage } from "../../api/http";
import {
  adminExamConfigsApi,
  adminCreateExamConfigApi,
  adminUpdateExamConfigApi,
  adminDeleteExamConfigApi,
  adminPreviewExamConfigApi,
  type ExamConfig,
} from "../../api/adminApi";

const examConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  increments: z.array(z.union([z.literal(1), z.literal(2), z.literal(3)])).min(1, "Select at least one increment"),
  questionCount: z.number().int().positive("Question count must be positive"),
  timeLimitMinutes: z.number().int().positive().optional(),
  passMarkPercent: z.number().int().min(0).max(100),
  randomizeQuestions: z.boolean().optional(),
  randomizeAnswers: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

type ExamConfigFormValues = z.infer<typeof examConfigSchema>;

// Using API functions from adminApi

function ExamConfigFormDialog({
  open,
  onClose,
  config,
}: {
  open: boolean;
  onClose: () => void;
  config?: ExamConfig | null;
}) {
  const qc = useQueryClient();
  const form = useForm<ExamConfigFormValues>({
    resolver: zodResolver(examConfigSchema),
    defaultValues: config
      ? {
          name: config.name,
          description: config.description || "",
          increments: config.increments as (1 | 2 | 3)[],
          questionCount: config.questionCount,
          timeLimitMinutes: config.timeLimitMinutes,
          passMarkPercent: config.passMarkPercent,
          randomizeQuestions: config.randomizeQuestions ?? true,
          randomizeAnswers: config.randomizeAnswers ?? true,
          enabled: config.enabled ?? true,
        }
      : {
          name: "",
          description: "",
          increments: [],
          questionCount: 20,
          timeLimitMinutes: undefined,
          passMarkPercent: 60,
          randomizeQuestions: true,
          randomizeAnswers: true,
          enabled: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: adminCreateExamConfigApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-configs"] });
      toast.success("Exam configuration created");
      onClose();
      form.reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ExamConfigFormValues>) => adminUpdateExamConfigApi({ id: config!._id, data: data as Partial<ExamConfig> }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-configs"] });
      toast.success("Exam configuration updated");
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onSubmit = (values: ExamConfigFormValues) => {
    if (config) {
      updateMutation.mutate(values);
    } else {
      // Convert form values to API format (increments is already number[])
      createMutation.mutate({
        name: values.name,
        description: values.description,
        increments: values.increments,
        questionCount: values.questionCount,
        timeLimitMinutes: values.timeLimitMinutes,
        passMarkPercent: values.passMarkPercent,
        randomizeQuestions: values.randomizeQuestions,
        randomizeAnswers: values.randomizeAnswers,
        enabled: values.enabled,
      });
    }
  };

  const selectedIncrements = form.watch("increments");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>{config ? "Edit Exam Configuration" : "Create Exam Configuration"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              {...form.register("name")}
              label="Exam Name"
              fullWidth
              error={!!form.formState.errors.name}
              helperText={form.formState.errors.name?.message}
            />

            <TextField
              {...form.register("description")}
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth error={!!form.formState.errors.increments}>
              <InputLabel>Select Increments</InputLabel>
              <Controller
                control={form.control}
                name="increments"
                render={({ field }) => (
                  <Select
                    multiple
                    label="Select Increments"
                    value={field.value.map(String)}
                    onChange={(e) => {
                      const values = Array.isArray(e.target.value) 
                        ? e.target.value.map(Number).filter((v): v is 1 | 2 | 3 => [1, 2, 3].includes(v))
                        : [];
                      field.onChange(values);
                    }}
                    renderValue={(selected) => selected.map((v) => `Increment ${v}`).join(", ")}
                  >
                    <MenuItem value="1">
                      <Checkbox checked={selectedIncrements.includes(1)} />
                      Increment 1
                    </MenuItem>
                    <MenuItem value="2">
                      <Checkbox checked={selectedIncrements.includes(2)} />
                      Increment 2
                    </MenuItem>
                    <MenuItem value="3">
                      <Checkbox checked={selectedIncrements.includes(3)} />
                      Increment 3
                    </MenuItem>
                  </Select>
                )}
              />
              {form.formState.errors.increments && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {form.formState.errors.increments.message}
                </Typography>
              )}
            </FormControl>

            <TextField
              {...form.register("questionCount", { valueAsNumber: true })}
              label="Number of Questions"
              type="number"
              fullWidth
              error={!!form.formState.errors.questionCount}
              helperText={form.formState.errors.questionCount?.message}
            />

            <TextField
              {...form.register("timeLimitMinutes", { valueAsNumber: true })}
              label="Time Limit (minutes, optional)"
              type="number"
              fullWidth
            />

            <TextField
              {...form.register("passMarkPercent", { valueAsNumber: true })}
              label="Pass Mark (%)"
              type="number"
              fullWidth
              error={!!form.formState.errors.passMarkPercent}
              helperText={form.formState.errors.passMarkPercent?.message}
            />

            <FormControlLabel
              control={
                <Controller
                  control={form.control}
                  name="randomizeQuestions"
                  render={({ field }) => <Switch {...field} checked={field.value ?? true} />}
                />
              }
              label="Randomize Questions"
            />

            <FormControlLabel
              control={
                <Controller
                  control={form.control}
                  name="randomizeAnswers"
                  render={({ field }) => <Switch {...field} checked={field.value ?? true} />}
                />
              }
              label="Randomize Answer Options"
            />

            <FormControlLabel
              control={
                <Controller
                  control={form.control}
                  name="enabled"
                  render={({ field }) => <Switch {...field} checked={field.value ?? true} />}
                />
              }
              label="Enabled"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {config ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function ExamCreationPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ExamConfig | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const query = useQuery({ queryKey: ["admin", "exam-configs"], queryFn: adminExamConfigsApi });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteExamConfigApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-configs"] });
      toast.success("Exam configuration deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleEdit = (config: ExamConfig) => {
    setEditingConfig(config);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this exam configuration?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = async (config: ExamConfig) => {
    const data = await adminPreviewExamConfigApi(config._id);
    setPreviewData(data);
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Exam Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage exam templates with specific increments, question counts, and settings.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingConfig(null); setFormOpen(true); }}>
          Create Exam
        </Button>
      </Stack>

      {query.isLoading && <Typography>Loading exam configurations…</Typography>}
      {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

      <Stack spacing={2}>
        {(query.data ?? []).map((config) => (
          <Card key={config._id}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" mb={1} flexWrap="wrap">
                    <Typography variant="h6" fontWeight={900}>
                      {config.name}
                    </Typography>
                    {config.enabled ? (
                      <Chip size="small" label="Enabled" color="success" />
                    ) : (
                      <Chip size="small" label="Disabled" />
                    )}
                  </Stack>
                  {config.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {config.description}
                    </Typography>
                  )}
                  <Stack direction="row" gap={1} flexWrap="wrap" mt={1}>
                    <Chip size="small" label={`Increments: ${config.increments.join(", ")}`} variant="outlined" />
                    <Chip size="small" label={`${config.questionCount} questions`} variant="outlined" />
                    {config.timeLimitMinutes && (
                      <Chip size="small" label={`${config.timeLimitMinutes} min`} variant="outlined" />
                    )}
                    <Chip size="small" label={`Pass: ${config.passMarkPercent}%`} variant="outlined" />
                    {config.randomizeQuestions && <Chip size="small" label="Randomized" variant="outlined" />}
                  </Stack>
                </Box>
                <Stack direction="row" gap={0.5}>
                  <IconButton size="small" onClick={() => handlePreview(config)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(config)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(config._id)} disabled={deleteMutation.isPending}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {query.data && query.data.length === 0 && (
          <Card>
            <CardContent>
              <Typography color="text.secondary" textAlign="center" py={4}>
                No exam configurations yet. Create one to get started.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <ExamConfigFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditingConfig(null); }} config={editingConfig} />

      {previewData && (
        <Dialog open={!!previewData} onClose={() => { setPreviewData(null); }} maxWidth="md" fullWidth>
          <DialogTitle>Preview: {previewData.config.name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Total Available Questions:</strong> {previewData.totalAvailable}
              </Typography>
              <Typography variant="body2">
                <strong>Will Include:</strong> {previewData.previewQuestions} questions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sample questions that would be included:
              </Typography>
              <Stack spacing={1}>
                {previewData.questions.slice(0, 10).map((q: any) => (
                  <Box key={q.id} sx={{ p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                    <Typography variant="body2">
                      #{q.id} • Inc {q.increment} • {q.category || "No category"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {q.question.substring(0, 80)}...
                    </Typography>
                  </Box>
                ))}
                {previewData.questions.length > 10 && (
                  <Typography variant="caption" color="text.secondary">
                    ... and {previewData.questions.length - 10} more
                  </Typography>
                )}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setPreviewData(null); }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
