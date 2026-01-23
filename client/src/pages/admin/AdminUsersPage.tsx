import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminUpdateUserRoleApi, adminUsersApi } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";

function toCsv(rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const query = useQuery({
    queryKey: ["admin", "users", { q, page, limit }],
    queryFn: () => adminUsersApi({ q: q.trim() || undefined, skip: page * limit, limit }),
  });

  const mutation = useMutation({
    mutationFn: adminUpdateUserRoleApi,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const exportRows = useMemo(
    () =>
      items.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name ?? "",
        role: u.role,
        createdAt: u.createdAt,
        hasGoogle: u.hasGoogle ? "yes" : "no",
      })),
    [items]
  );

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search, inspect, and manage user roles.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
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
            Export CSV (page)
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
              inputProps={{ "aria-label": "Search users" }}
            />
            <Stack direction="row" gap={1} justifyContent="flex-end">
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
              <Box key={u.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1.25}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900} noWrap>
                      {u.name || u.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email}
                    </Typography>
                    <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
                      <Chip size="small" label={`Role: ${u.role}`} variant="outlined" />
                      <Chip size="small" label={u.hasGoogle ? "Google linked" : "Password account"} variant="outlined" />
                    </Stack>
                  </Box>

                  <Stack direction="row" gap={1} alignItems="center">
                    <TextField
                      select
                      size="small"
                      label="Role"
                      value={u.role}
                      onChange={(e) => mutation.mutate({ userId: u.id, role: e.target.value as any })}
                      disabled={mutation.isPending}
                      sx={{ minWidth: 170 }}
                    >
                      <MenuItem value="student">student</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                      <MenuItem value="superadmin">superadmin</MenuItem>
                    </TextField>
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
    </Box>
  );
}

