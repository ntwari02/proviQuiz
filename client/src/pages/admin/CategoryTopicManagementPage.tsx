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
  IconButton,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../api/http";
import {
  adminCategoriesApi,
  adminTopicsApi,
  adminRenameCategoryApi,
  adminRenameTopicApi,
  adminDeleteCategoryApi,
  adminDeleteTopicApi,
} from "../../api/adminApi";

type Category = {
  name: string;
  questionCount: number;
};

type Topic = {
  name: string;
  questionCount: number;
};

// Using API functions from adminApi

function CategoryManagement() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");

  const query = useQuery({ queryKey: ["admin", "categories"], queryFn: adminCategoriesApi });

  const renameMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) => adminRenameCategoryApi({ oldName, newName }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`Category renamed. ${data.updated} questions updated.`);
      setEditing(null);
      setNewName("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCategoryApi,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`Category removed. ${data.updated} questions updated.`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleRename = () => {
    if (!editing || !newName.trim()) return;
    if (newName.trim() === editing.name) {
      setEditing(null);
      setNewName("");
      return;
    }
    renameMutation.mutate({ oldName: editing.name, newName: newName.trim() });
  };

  const handleDelete = (name: string) => {
    if (confirm(`Remove category "${name}" from all questions?`)) {
      deleteMutation.mutate(name);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {query.isLoading && <Typography>Loading categories…</Typography>}
        {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

        {(query.data ?? []).map((cat) => (
          <Card key={cat.name}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={900}>{cat.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.questionCount} question{cat.questionCount !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Stack direction="row" gap={0.5}>
                  <IconButton size="small" onClick={() => { setEditing(cat); setNewName(cat.name); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(cat.name)} disabled={deleteMutation.isPending}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {query.data && query.data.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No categories found. Categories are created automatically when you assign them to questions.
          </Typography>
        )}
      </Stack>

      <Dialog open={!!editing} onClose={() => { setEditing(null); setNewName(""); }}>
        <DialogTitle>Rename Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Category Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditing(null); setNewName(""); }}>Cancel</Button>
          <Button variant="contained" onClick={handleRename} disabled={!newName.trim() || renameMutation.isPending}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TopicManagement() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Topic | null>(null);
  const [newName, setNewName] = useState("");

  const query = useQuery({ queryKey: ["admin", "topics"], queryFn: adminTopicsApi });

  const renameMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string; newName: string }) => adminRenameTopicApi({ oldName, newName }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "topics"] });
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`Topic renamed. ${data.updated} questions updated.`);
      setEditing(null);
      setNewName("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteTopicApi,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin", "topics"] });
      qc.invalidateQueries({ queryKey: ["admin", "questions"] });
      toast.success(`Topic removed. ${data.updated} questions updated.`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const handleRename = () => {
    if (!editing || !newName.trim()) return;
    if (newName.trim() === editing.name) {
      setEditing(null);
      setNewName("");
      return;
    }
    renameMutation.mutate({ oldName: editing.name, newName: newName.trim() });
  };

  const handleDelete = (name: string) => {
    if (confirm(`Remove topic "${name}" from all questions?`)) {
      deleteMutation.mutate(name);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {query.isLoading && <Typography>Loading topics…</Typography>}
        {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

        {(query.data ?? []).map((topic) => (
          <Card key={topic.name}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={900}>{topic.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.questionCount} question{topic.questionCount !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Stack direction="row" gap={0.5}>
                  <IconButton size="small" onClick={() => { setEditing(topic); setNewName(topic.name); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(topic.name)} disabled={deleteMutation.isPending}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {query.data && query.data.length === 0 && (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No topics found. Topics are created automatically when you assign them to questions.
          </Typography>
        )}
      </Stack>

      <Dialog open={!!editing} onClose={() => { setEditing(null); setNewName(""); }}>
        <DialogTitle>Rename Topic</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="New Topic Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditing(null); setNewName(""); }}>Cancel</Button>
          <Button variant="contained" onClick={handleRename} disabled={!newName.trim() || renameMutation.isPending}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function CategoryTopicManagementPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Category & Topic Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage categories and topics. Rename or remove them from all questions.
          </Typography>
        </Box>
      </Stack>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Categories" />
            <Tab label="Topics" />
          </Tabs>

          {tab === 0 && <CategoryManagement />}
          {tab === 1 && <TopicManagement />}
        </CardContent>
      </Card>
    </Box>
  );
}
