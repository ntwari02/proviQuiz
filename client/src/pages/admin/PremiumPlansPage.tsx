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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  adminCreatePremiumPlanApi,
  adminDeletePremiumPlanApi,
  adminPremiumPlansApi,
  adminQuotaAnalyticsApi,
  adminUpdatePremiumPlanApi,
  type PremiumPlan,
} from "../../api/adminPremiumApi";
import { getApiErrorMessage } from "../../api/http";

const emptyPlan: Partial<PremiumPlan> = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "RWF",
  duration: 30,
  durationUnit: "days",
  examQuota: 100,
  examQuotaPeriod: "monthly",
  features: [],
  active: true,
  sortOrder: 0,
};

export function PremiumPlansPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PremiumPlan | null>(null);
  const [form, setForm] = useState<Partial<PremiumPlan>>(emptyPlan);

  const plansQ = useQuery({ queryKey: ["admin", "premium-plans"], queryFn: adminPremiumPlansApi });
  const analyticsQ = useQuery({ queryKey: ["admin", "quota-analytics"], queryFn: adminQuotaAnalyticsApi });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return adminUpdatePremiumPlanApi(editing._id, form);
      return adminCreatePremiumPlanApi(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "premium-plans"] });
      qc.invalidateQueries({ queryKey: ["admin", "quota-analytics"] });
      toast.success(editing ? "Plan updated" : "Plan created");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyPlan);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeletePremiumPlanApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "premium-plans"] });
      toast.success("Plan deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPlan);
    setDialogOpen(true);
  };

  const openEdit = (plan: PremiumPlan) => {
    setEditing(plan);
    setForm({ ...plan });
    setDialogOpen(true);
  };

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={3} gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={900}>Premium plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure pricing, duration, exam quotas, and features — no code changes needed.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 999 }}>
          New plan
        </Button>
      </Stack>

      {plansQ.isLoading && <Typography>Loading plans…</Typography>}
      {plansQ.isError && <Typography color="error">{getApiErrorMessage(plansQ.error)}</Typography>}

      <Stack spacing={2} mb={4}>
        {(plansQ.data ?? []).map((plan) => (
          <Card key={plan._id}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                    <Typography fontWeight={900}>{plan.name}</Typography>
                    <Chip size="small" label={plan.active ? "Active" : "Inactive"} color={plan.active ? "success" : "default"} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{plan.description || plan.slug}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {plan.price.toLocaleString()} {plan.currency} · {plan.duration} {plan.durationUnit}
                  </Typography>
                  <Typography variant="body2">
                    Exam limit:{" "}
                    {plan.examQuotaPeriod === "unlimited" ? "Unlimited" : `${plan.examQuota} / ${plan.examQuotaPeriod}`}
                  </Typography>
                </Box>
                <Stack direction="row" gap={1} alignSelf={{ xs: "flex-start", md: "center" }}>
                  <IconButton onClick={() => openEdit(plan)} aria-label="Edit plan"><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => deleteMutation.mutate(plan._id)} aria-label="Delete plan">
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Typography variant="h6" fontWeight={900} mb={2}>Quota analytics</Typography>
      <Stack spacing={1.5}>
        {(analyticsQ.data ?? []).map((row) => (
          <Card key={row.plan.id} variant="outlined">
            <CardContent>
              <Typography fontWeight={800}>{row.plan.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {row.activeSubscribers} subscribers · avg {row.avgPerUser} exams/user · high usage {row.highUsageUsers} · low usage {row.lowUsageUsers}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit plan" : "Create plan"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} fullWidth helperText="lowercase-with-dashes" />
            <TextField label="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <Stack direction="row" gap={2}>
              <TextField label="Price" type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} fullWidth />
              <TextField label="Currency" value={form.currency ?? "RWF"} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} fullWidth />
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField label="Duration" type="number" value={form.duration ?? 1} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Duration unit</InputLabel>
                <Select label="Duration unit" value={form.durationUnit ?? "days"} onChange={(e) => setForm({ ...form, durationUnit: e.target.value as PremiumPlan["durationUnit"] })}>
                  <MenuItem value="days">Days</MenuItem>
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField label="Exam quota" type="number" value={form.examQuota ?? 0} onChange={(e) => setForm({ ...form, examQuota: Number(e.target.value) })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Quota period</InputLabel>
                <Select label="Quota period" value={form.examQuotaPeriod ?? "monthly"} onChange={(e) => setForm({ ...form, examQuotaPeriod: e.target.value as PremiumPlan["examQuotaPeriod"] })}>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="subscription_period">Subscription period</MenuItem>
                  <MenuItem value="unlimited">Unlimited</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Features (comma-separated)"
              value={(form.features ?? []).join(", ")}
              onChange={(e) => setForm({ ...form, features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              fullWidth
            />
            <FormControlLabel control={<Switch checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />} label="Active" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
