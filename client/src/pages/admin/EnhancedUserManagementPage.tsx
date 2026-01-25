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
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
  Tabs,
  Tab,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddIcon from "@mui/icons-material/Add";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, InputLabel, Select } from "@mui/material";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  adminUsersApi,
  adminUpdateUserRoleApi,
  adminActivateUserApi,
  adminBanUserApi,
  adminResetUserPasswordApi,
  adminUserProgressApi,
  adminUserExamsApi,
  adminCreateUserApi,
  type AdminUserEnhanced,
} from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";
import dayjs from "dayjs";

function toCsv(rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

function UserDetailsDialog({ user, open, onClose }: { user: AdminUserEnhanced | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const [newPassword, setNewPassword] = useState("");

  const progressQuery = useQuery({
    queryKey: ["admin", "users", user?.id, "progress"],
    queryFn: () => adminUserProgressApi(user!.id),
    enabled: open && !!user && tab === 1,
  });

  const examsQuery = useQuery({
    queryKey: ["admin", "users", user?.id, "exams"],
    queryFn: () => adminUserExamsApi(user!.id, 50),
    enabled: open && !!user && tab === 2,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => adminResetUserPasswordApi({ userId: user!.id, newPassword }),
    onSuccess: () => {
      toast.success("Password reset successfully");
      setNewPassword("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{user.name || user.email}</Typography>
          <Stack direction="row" gap={0.5}>
            {user.banned && <Chip size="small" label="Banned" color="error" />}
            {user.active === false && <Chip size="small" label="Inactive" color="warning" />}
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Details" />
          <Tab label="Progress" />
          <Tab label="Exam History" />
          <Tab label="Actions" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={2}>
            <Typography><strong>Email:</strong> {user.email}</Typography>
            {user.name && <Typography><strong>Name:</strong> {user.name}</Typography>}
            <Typography><strong>Role:</strong> {user.role}</Typography>
            <Typography><strong>Account Type:</strong> {user.hasGoogle ? "Google Sign-In" : "Password"}</Typography>
            <Typography><strong>Created:</strong> {dayjs(user.createdAt).format("MMM D, YYYY")}</Typography>
            {user.banned && (
              <>
                <Typography color="error"><strong>Banned:</strong> Yes</Typography>
                {user.bannedReason && <Typography color="error"><strong>Reason:</strong> {user.bannedReason}</Typography>}
                {user.bannedAt && <Typography color="error"><strong>Banned At:</strong> {dayjs(user.bannedAt).format("MMM D, YYYY")}</Typography>}
              </>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Box>
            {progressQuery.isLoading && <Typography>Loading progress…</Typography>}
            {progressQuery.isError && <Typography color="error">{getApiErrorMessage(progressQuery.error)}</Typography>}
            {progressQuery.data && (
              <Stack spacing={2}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={900}>Overall Stats</Typography>
                    <Stack direction="row" spacing={3} mt={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Exams</Typography>
                        <Typography variant="h5" fontWeight={900}>{progressQuery.data.totalExams}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total Questions</Typography>
                        <Typography variant="h5" fontWeight={900}>{progressQuery.data.totalQuestions}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Average Accuracy</Typography>
                        <Typography variant="h5" fontWeight={900}>{Math.round(progressQuery.data.averageAccuracy * 100)}%</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
                <Typography variant="h6" fontWeight={900}>Recent Exams</Typography>
                <Stack spacing={1}>
                  {progressQuery.data.recentExams.map((exam) => (
                    <Box key={exam.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">{exam.score}/{exam.totalQuestions} ({Math.round(exam.accuracy * 100)}%)</Typography>
                        <Typography variant="caption" color="text.secondary">{dayjs(exam.createdAt).format("MMM D, YYYY")}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            )}
          </Box>
        )}

        {tab === 2 && (
          <Box>
            {examsQuery.isLoading && <Typography>Loading exam history…</Typography>}
            {examsQuery.isError && <Typography color="error">{getApiErrorMessage(examsQuery.error)}</Typography>}
            {examsQuery.data && (
              <Stack spacing={1}>
                {examsQuery.data.map((exam) => {
                  const accuracy = exam.totalQuestions > 0 ? exam.score / exam.totalQuestions : 0;
                  return (
                    <Box key={exam.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {exam.score}/{exam.totalQuestions} ({Math.round(accuracy * 100)}%)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {exam.mode} • {Math.floor(exam.durationSeconds / 60)}m {exam.durationSeconds % 60}s
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(exam.createdAt).format("MMM D, YYYY h:mm A")}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
                {examsQuery.data.length === 0 && <Typography color="text.secondary">No exam attempts yet.</Typography>}
              </Stack>
            )}
          </Box>
        )}

        {tab === 3 && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Reset Password</Typography>
              <Stack direction="row" gap={1}>
                <TextField
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  size="small"
                  fullWidth
                  disabled={user.hasGoogle}
                />
                <Button
                  variant="outlined"
                  startIcon={<LockResetIcon />}
                  onClick={() => resetPasswordMutation.mutate()}
                  disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending || user.hasGoogle}
                >
                  Reset
                </Button>
              </Stack>
              {user.hasGoogle && <Typography variant="caption" color="text.secondary">User uses Google Sign-In</Typography>}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["student", "admin", "superadmin"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "student",
    },
  });

  const createMutation = useMutation({
    mutationFn: adminCreateUserApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User created successfully");
      form.reset();
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onSubmit = (values: CreateUserFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              {...form.register("email")}
              label="Email"
              type="email"
              fullWidth
              required
              error={!!form.formState.errors.email}
              helperText={form.formState.errors.email?.message}
            />
            <TextField
              {...form.register("password")}
              label="Password"
              type="password"
              fullWidth
              required
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
            />
            <TextField
              {...form.register("name")}
              label="Name (optional)"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select {...field} label="Role">
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function EnhancedUserManagementPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserEnhanced | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const limit = 25;

  const query = useQuery({
    queryKey: ["admin", "users", { q, page, limit }],
    queryFn: () => adminUsersApi({ q: q.trim() || undefined, skip: page * limit, limit }),
  });

  const roleMutation = useMutation({
    mutationFn: adminUpdateUserRoleApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const activateMutation = useMutation({
    mutationFn: adminActivateUserApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User status updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const banMutation = useMutation({
    mutationFn: adminBanUserApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User ban status updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const items = (query.data?.items ?? []) as AdminUserEnhanced[];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const exportRows = items.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    role: u.role,
    active: u.active ?? true,
    banned: u.banned ?? false,
    createdAt: u.createdAt,
    hasGoogle: u.hasGoogle ? "yes" : "no",
  }));

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users: activate/deactivate, ban, reset passwords, view progress.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateUserOpen(true)}>
            Create User
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const csv = toCsv(exportRows);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `proviquiz-users-page-${page + 1}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={exportRows.length === 0}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ xs: "stretch", md: "center" }} mb={2}>
            <TextField
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Search by email or name…"
              fullWidth
            />
            <Stack direction="row" gap={1}>
              <Button variant="outlined" onClick={() => query.refetch()} disabled={query.isFetching}>
                Refresh
              </Button>
              <Button variant="text" onClick={() => { setQ(""); setPage(0); }} disabled={!q}>
                Clear
              </Button>
            </Stack>
          </Stack>

          {query.isLoading && <Typography>Loading users…</Typography>}
          {query.isError && <Typography color="error">{getApiErrorMessage(query.error)}</Typography>}

          <Stack spacing={1.5}>
            {items.map((u) => (
              <Box key={u.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" gap={1} alignItems="center" mb={0.5} flexWrap="wrap">
                      <Typography fontWeight={900}>{u.name || u.email}</Typography>
                      {u.banned && <Chip size="small" label="Banned" color="error" />}
                      {u.active === false && <Chip size="small" label="Inactive" color="warning" />}
                      <Chip size="small" label={u.role} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email}
                    </Typography>
                  </Box>

                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={u.active ?? true}
                          onChange={(e) => activateMutation.mutate({ userId: u.id, active: e.target.checked })}
                          disabled={activateMutation.isPending}
                          size="small"
                        />
                      }
                      label="Active"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={u.banned ?? false}
                          onChange={(e) => banMutation.mutate({ userId: u.id, banned: e.target.checked, reason: e.target.checked ? "Banned by admin" : undefined })}
                          disabled={banMutation.isPending}
                          size="small"
                          color="error"
                        />
                      }
                      label="Ban"
                    />
                    <TextField
                      select
                      size="small"
                      label="Role"
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value as any })}
                      disabled={roleMutation.isPending}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="student">student</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                      <MenuItem value="superadmin">superadmin</MenuItem>
                    </TextField>
                    <IconButton size="small" onClick={() => { setSelectedUser(u); setDetailsOpen(true); }}>
                      <VisibilityIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
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

      <UserDetailsDialog user={selectedUser} open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelectedUser(null); }} />
      <CreateUserDialog open={createUserOpen} onClose={() => setCreateUserOpen(false)} />
    </Box>
  );
}
