import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api, getApiErrorMessage } from "../../api/http";
import { adminBulkImportQuestionsApi } from "../../api/adminApi";

type Question = {
  id?: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct: "a" | "b" | "c" | "d";
  explanation?: string;
  category?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  increment?: 1 | 2 | 3;
  status?: "draft" | "published";
};

async function getAllQuestions() {
  const res = await api.get<{ items: Question[]; total: number }>("/questions/all", { params: { limit: 10000 } });
  return res.data;
}

function parseCsv(csvText: string): Question[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV must have at least a header and one data row");

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const questions: Question[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    try {
      questions.push({
        question: row.Question || row.question || "",
        options: {
          a: row.A || row.a || "",
          b: row.B || row.b || "",
          c: row.C || row.c || "",
          d: row.D || row.d || "",
        },
        correct: (row.Correct || row.correct || "a").toLowerCase() as "a" | "b" | "c" | "d",
        explanation: row.Explanation || row.explanation || undefined,
        category: row.Category || row.category || undefined,
        topic: row.Topic || row.topic || undefined,
        difficulty: (row.Difficulty || row.difficulty || "medium") as "easy" | "medium" | "hard",
        increment: row.Increment || row.increment ? Number(row.Increment || row.increment) as 1 | 2 | 3 : undefined,
        status: (row.Status || row.status || "draft") as "draft" | "published",
      });
    } catch (err) {
      console.warn("Skipping invalid row", row, err);
    }
  }

  return questions;
}

export function BulkImportExportPage() {
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const allQuestionsQuery = useQuery({
    queryKey: ["admin", "all-questions-export"],
    queryFn: getAllQuestions,
  });

  const importMutation = useMutation({
    mutationFn: adminBulkImportQuestionsApi,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`${data.inserted} questions imported successfully`);
      setImportOpen(false);
      setCsvText("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleExport = () => {
    const questions = allQuestionsQuery.data?.items ?? [];
    if (questions.length === 0) {
      toast.error("No questions to export");
      return;
    }

    const csv = [
      ["ID", "Question", "A", "B", "C", "D", "Correct", "Explanation", "Category", "Topic", "Difficulty", "Increment", "Status"],
      ...questions.map((q) => [
        q.id || "",
        q.question,
        q.options.a,
        q.options.b,
        q.options.c,
        q.options.d,
        q.correct.toUpperCase(),
        q.explanation || "",
        q.category || "",
        q.topic || "",
        q.difficulty || "medium",
        q.increment || "",
        q.status || "draft",
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
    toast.success("Questions exported to CSV");
  };

  const handleImport = () => {
    try {
      const questions = parseCsv(csvText);
      if (questions.length === 0) {
        toast.error("No valid questions found in CSV");
        return;
      }
      importMutation.mutate(questions);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Bulk Import & Export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import questions from CSV or export all questions to CSV.
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={900} mb={1}>Export Questions</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Export all questions to a CSV file for backup or editing.
            </Typography>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              disabled={allQuestionsQuery.isLoading || (allQuestionsQuery.data?.items ?? []).length === 0}
              fullWidth
            >
              Export All Questions ({allQuestionsQuery.data?.items.length || 0})
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={900} mb={1}>Import Questions</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Import questions from a CSV file. Format: ID,Question,A,B,C,D,Correct,Explanation,Category,Topic,Difficulty,Increment,Status
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => setImportOpen(true)}
              fullWidth
            >
              Import from CSV
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={importOpen} onClose={() => { setImportOpen(false); setCsvText(""); }} maxWidth="md" fullWidth>
        <DialogTitle>Import Questions from CSV</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              CSV format: ID,Question,A,B,C,D,Correct,Explanation,Category,Topic,Difficulty,Increment,Status
              <br />
              Headers are optional. Paste your CSV data below.
            </Alert>
            <TextField
              multiline
              rows={10}
              fullWidth
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste CSV data here..."
              sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportOpen(false); setCsvText(""); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!csvText.trim() || importMutation.isPending}
          >
            {importMutation.isPending ? "Importing…" : "Import"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
