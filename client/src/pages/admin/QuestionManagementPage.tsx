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
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, getApiErrorMessage } from "../../api/http";

type Question = {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct: "a" | "b" | "c" | "d";
  explanation?: string;
  category?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  increment?: 1 | 2 | 3;
  status?: "draft" | "published";
  imageUrl?: string;
  isDeleted?: boolean;
};

const questionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  options: z.object({
    a: z.string().min(1, "Option A is required"),
    b: z.string().min(1, "Option B is required"),
    c: z.string().min(1, "Option C is required"),
    d: z.string().min(1, "Option D is required"),
  }),
  correct: z.enum(["a", "b", "c", "d"]),
  explanation: z.string().optional(),
  category: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  increment: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  imageUrl: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

async function listQuestions(params: { limit: number; skip: number; q?: string; category?: string; increment?: number; status?: string }) {
  const res = await api.get<{ items: Question[]; total: number }>("/questions/all", { params });
  return res.data;
}

async function createQuestion(data: QuestionFormValues) {
  const res = await api.post<Question>("/questions", data);
  return res.data;
}

async function updateQuestion(id: number, data: Partial<QuestionFormValues>) {
  try {
    const res = await api.put<Question>(`/questions/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error("Update error:", error.response?.data || error.message);
    console.error("Data being sent:", data);
    throw error;
  }
}

async function deleteQuestion(id: number) {
  const res = await api.delete<{ message: string; id: number }>(`/questions/${id}`);
  return res.data;
}

function QuestionFormDialog({
  open,
  onClose,
  question,
}: {
  open: boolean;
  onClose: () => void;
  question?: Question | null;
}) {
  const qc = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
      options: { a: "", b: "", c: "", d: "" },
      correct: "a",
      explanation: "",
      category: "",
      topic: "",
      difficulty: "medium",
      increment: undefined,
      status: "draft",
      imageUrl: "",
    },
  });

  // Reset form when question changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaults: QuestionFormValues = {
        question: question?.question || "",
        options: question?.options || { a: "", b: "", c: "", d: "" },
        correct: (question?.correct as "a" | "b" | "c" | "d") || "a",
        explanation: question?.explanation || "",
        category: question?.category || "",
        topic: question?.topic || "",
        difficulty: (question?.difficulty as "easy" | "medium" | "hard") || "medium",
        increment: question?.increment as 1 | 2 | 3 | undefined,
        status: (question?.status as "draft" | "published") || "draft",
        imageUrl: question?.imageUrl || "",
      };
      form.reset(defaults);
      setImagePreview(question?.imageUrl || null);
      setImageFile(null);
    }
  }, [question?.id, open, form]);

  const createMutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success("Question created");
      onClose();
      form.reset();
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<QuestionFormValues>) => updateQuestion(question!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success("Question updated");
      onClose();
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 50MB - server now accepts this)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image size must be less than 50MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      form.setValue("imageUrl", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const onSubmit = (values: QuestionFormValues) => {
    // Clean up the data before sending
    const cleanedData: any = {
      question: values.question,
      options: values.options,
      correct: values.correct,
    };

    // Add optional fields only if they have values
    if (values.explanation && values.explanation.trim() !== "") {
      cleanedData.explanation = values.explanation;
    }
    if (values.category && values.category.trim() !== "") {
      cleanedData.category = values.category;
    }
    if (values.topic && values.topic.trim() !== "") {
      cleanedData.topic = values.topic;
    }
    if (values.difficulty) {
      cleanedData.difficulty = values.difficulty;
    }
    if (values.increment !== undefined) {
      cleanedData.increment = values.increment;
    }
    if (values.status) {
      cleanedData.status = values.status;
    }

    if (question) {
      // For updates, explicitly set imageUrl to null if it was removed (empty string)
      if (!values.imageUrl || values.imageUrl.trim() === "") {
        cleanedData.imageUrl = null;
      } else {
        cleanedData.imageUrl = values.imageUrl;
      }
      updateMutation.mutate(cleanedData);
    } else {
      // For new questions, only include imageUrl if it has a value
      if (values.imageUrl && values.imageUrl.trim() !== "") {
        cleanedData.imageUrl = values.imageUrl;
      }
      createMutation.mutate(cleanedData as QuestionFormValues);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>{question ? "Edit Question" : "Add New Question"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              {...form.register("question")}
              label="Question Text"
              fullWidth
              multiline
              rows={3}
              error={!!form.formState.errors.question}
              helperText={form.formState.errors.question?.message}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                {...form.register("options.a")}
                label="Option A"
                fullWidth
                error={!!form.formState.errors.options?.a}
                helperText={form.formState.errors.options?.a?.message}
              />
              <TextField
                {...form.register("options.b")}
                label="Option B"
                fullWidth
                error={!!form.formState.errors.options?.b}
                helperText={form.formState.errors.options?.b?.message}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                {...form.register("options.c")}
                label="Option C"
                fullWidth
                error={!!form.formState.errors.options?.c}
                helperText={form.formState.errors.options?.c?.message}
              />
              <TextField
                {...form.register("options.d")}
                label="Option D"
                fullWidth
                error={!!form.formState.errors.options?.d}
                helperText={form.formState.errors.options?.d?.message}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Correct Answer</InputLabel>
              <Controller
                control={form.control}
                name="correct"
                render={({ field }) => (
                  <Select {...field} label="Correct Answer">
                    <MenuItem value="a">A</MenuItem>
                    <MenuItem value="b">B</MenuItem>
                    <MenuItem value="c">C</MenuItem>
                    <MenuItem value="d">D</MenuItem>
                  </Select>
                )}
              />
            </FormControl>

            <TextField
              {...form.register("explanation")}
              label="Explanation (optional)"
              fullWidth
              multiline
              rows={2}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Question Image (optional)
              </Typography>
              <Stack spacing={2}>
                {imagePreview ? (
                  <Box>
                    <Box sx={{ position: "relative", display: "inline-block", mb: 1 }}>
                      <Box
                        component="img"
                        src={imagePreview}
                        alt="Preview"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 300,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={handleRemoveImage}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: "error.main",
                          color: "white",
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Click remove to change image
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageFileSelect}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        sx={{ py: 2 }}
                      >
                        Upload Image
                      </Button>
                    </label>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Supported formats: JPG, PNG, GIF (max 5MB)
                    </Typography>
                  </Box>
                )}
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Or enter image URL"
                      fullWidth
                      placeholder="https://example.com/image.jpg"
                      error={!!form.formState.errors.imageUrl}
                      helperText={form.formState.errors.imageUrl?.message || "Leave empty if uploading a file"}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setImageFile(null);
                        } else if (!imageFile) {
                          setImagePreview(null);
                        }
                      }}
                    />
                  )}
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={2}>
              <TextField
                {...form.register("category")}
                label="Category"
                fullWidth
              />
              <TextField
                {...form.register("topic")}
                label="Topic"
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Controller
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <Select {...field} label="Difficulty">
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Increment</InputLabel>
                <Controller
                  control={form.control}
                  name="increment"
                  render={({ field }) => (
                    <Select {...field} label="Increment">
                      <MenuItem value={undefined}>None</MenuItem>
                      <MenuItem value={1}>Increment 1</MenuItem>
                      <MenuItem value={2}>Increment 2</MenuItem>
                      <MenuItem value={3}>Increment 3</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select {...field} label="Status">
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="published">Published</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {question ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function QuestionManagementPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [incrementFilter, setIncrementFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const limit = 50;

  const query = useQuery({
    queryKey: ["admin", "questions", { page, limit, searchQuery, categoryFilter, incrementFilter, statusFilter }],
    queryFn: () =>
      listQuestions({
        skip: page * limit,
        limit,
        q: searchQuery.trim() || undefined,
        category: categoryFilter || undefined,
        increment: typeof incrementFilter === "number" ? incrementFilter : undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success("Question deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Question", "A", "B", "C", "D", "Correct", "Category", "Topic", "Increment", "Status"],
      ...items.map((q) => [
        q.id,
        q.question,
        q.options.a,
        q.options.b,
        q.options.c,
        q.options.d,
        q.correct.toUpperCase(),
        q.category || "",
        q.topic || "",
        q.increment || "",
        q.status || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `questions-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Questions exported");
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Question Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, delete, and manage questions with increments and status.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => toast("Bulk import coming soon", { icon: "ℹ️" })}>
            Import
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={items.length === 0}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingQuestion(null); setFormOpen(true); }}>
            Add Question
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Search questions"
              placeholder="Search by question text, options, category, or topic..."
              value={searchQuery}
              onChange={(e) => {
                setPage(0);
                setSearchQuery(e.target.value);
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Filter by Category"
                value={categoryFilter}
                onChange={(e) => {
                  setPage(0);
                  setCategoryFilter(e.target.value);
                }}
                fullWidth
              />
            <FormControl fullWidth>
              <InputLabel>Increment</InputLabel>
              <Select
                value={incrementFilter === "" ? "" : String(incrementFilter)}
                onChange={(e) => {
                  setPage(0);
                  setIncrementFilter(e.target.value === "" ? "" : Number(e.target.value));
                }}
                label="Increment"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">Increment 1</MenuItem>
                <MenuItem value="2">Increment 2</MenuItem>
                <MenuItem value="3">Increment 3</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setPage(0);
                  setStatusFilter(e.target.value);
                }}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>
              <Button variant="outlined" onClick={() => { setSearchQuery(""); setCategoryFilter(""); setIncrementFilter(""); setStatusFilter(""); setPage(0); }}>
                Clear Filters
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {query.isLoading && <Typography>Loading questions…</Typography>}
          {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

          <Stack spacing={1.5}>
            {items.map((q) => (
              <Box key={q.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" gap={1} alignItems="center" mb={1} flexWrap="wrap">
                      <Typography fontWeight={900}>#{q.id}</Typography>
                      {q.increment && <Chip size="small" label={`Increment ${q.increment}`} />}
                      {q.status && (
                        <Chip
                          size="small"
                          label={q.status}
                          color={q.status === "published" ? "success" : "default"}
                        />
                      )}
                      {q.category && <Chip size="small" label={q.category} variant="outlined" />}
                      {q.difficulty && <Chip size="small" label={q.difficulty} variant="outlined" />}
                    </Stack>
                    <Typography variant="body1" fontWeight={600} mb={0.5}>
                      {q.question}
                    </Typography>
                    {q.imageUrl && (
                      <Box
                        component="img"
                        src={q.imageUrl}
                        alt="Question image"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 200,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          mb: 1,
                        }}
                      />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      A: {q.options.a} • B: {q.options.b} • C: {q.options.c} • D: {q.options.d}
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={700} sx={{ mt: 0.5, display: "block" }}>
                      Correct: {q.correct.toUpperCase()}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={0.5}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setViewingQuestion(q)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(q)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(q.id)} disabled={deleteMutation.isPending}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} flexWrap="wrap" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {page * limit + 1} - {Math.min(page * limit + items.length, total)} of {total} questions
            </Typography>
            <Stack direction="row" gap={1} alignItems="center">
              <Button 
                variant="outlined" 
                onClick={() => setPage((p) => Math.max(0, p - 1))} 
                disabled={page <= 0 || query.isFetching}
                size="small"
              >
                Previous
              </Button>
              <Typography variant="body2" sx={{ px: 2, minWidth: 100, textAlign: "center" }}>
                Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit + items.length >= total || query.isFetching}
                size="small"
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <QuestionFormDialog 
        key={editingQuestion?.id ?? "new"}
        open={formOpen} 
        onClose={() => { setFormOpen(false); setEditingQuestion(null); }} 
        question={editingQuestion} 
      />

      {viewingQuestion && (
        <Dialog open={!!viewingQuestion} onClose={() => setViewingQuestion(null)} maxWidth="md" fullWidth>
          <DialogTitle>Question #{viewingQuestion.id}</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography variant="body1" fontWeight={700}>{viewingQuestion.question}</Typography>
              {viewingQuestion.imageUrl && (
                <Box
                  component="img"
                  src={viewingQuestion.imageUrl}
                  alt="Question image"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              )}
              <Stack spacing={1}>
                <Typography variant="body2"><strong>A:</strong> {viewingQuestion.options.a}</Typography>
                <Typography variant="body2"><strong>B:</strong> {viewingQuestion.options.b}</Typography>
                <Typography variant="body2"><strong>C:</strong> {viewingQuestion.options.c}</Typography>
                <Typography variant="body2"><strong>D:</strong> {viewingQuestion.options.d}</Typography>
              </Stack>
              <Typography variant="body2" color="success.main"><strong>Correct Answer:</strong> {viewingQuestion.correct.toUpperCase()}</Typography>
              {viewingQuestion.explanation && <Typography variant="body2"><strong>Explanation:</strong> {viewingQuestion.explanation}</Typography>}
              <Stack direction="row" gap={1} flexWrap="wrap">
                {viewingQuestion.category && <Chip label={`Category: ${viewingQuestion.category}`} />}
                {viewingQuestion.topic && <Chip label={`Topic: ${viewingQuestion.topic}`} />}
                {viewingQuestion.increment && <Chip label={`Increment: ${viewingQuestion.increment}`} />}
                {viewingQuestion.status && <Chip label={`Status: ${viewingQuestion.status}`} />}
                {viewingQuestion.difficulty && <Chip label={`Difficulty: ${viewingQuestion.difficulty}`} />}
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewingQuestion(null)}>Close</Button>
            <Button variant="contained" onClick={() => { setViewingQuestion(null); handleEdit(viewingQuestion); }}>
              Edit
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
