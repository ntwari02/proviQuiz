import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { adminGetSettingsApi, adminUpdateSettingsApi, type SystemSettings } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";

export function SystemSettingsPage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({ queryKey: ["admin", "settings"], queryFn: adminGetSettingsApi });

  const form = useForm<SystemSettings>({
    defaultValues: query.data || {
      systemName: "PROVIQUIZ",
      passingCriteria: 60,
      questionRandomization: true,
      maintenanceMode: false,
    },
  });

  // Update form when data loads
  if (query.data) {
    const currentValues = form.getValues();
    if (!currentValues.systemName || currentValues.systemName === "PROVIQUIZ") {
      form.reset(query.data);
    }
  }

  const saveMutation = useMutation({
    mutationFn: adminUpdateSettingsApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved");
      setSaving(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setSaving(false);
    },
  });

  const onSubmit = (data: SystemSettings) => {
    setSaving(true);
    saveMutation.mutate(data);
  };

  if (query.isLoading) return <Typography>Loading settings…</Typography>;
  if (query.isError) return <Typography color="error">{getApiErrorMessage(query.error)}</Typography>;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure global system settings, branding, and exam rules.
          </Typography>
        </Box>
      </Stack>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Branding</Typography>
              <Stack spacing={2}>
                <TextField
                  {...form.register("systemName")}
                  label="System Name"
                  fullWidth
                />
                <TextField
                  {...form.register("logoUrl")}
                  label="Logo URL (optional)"
                  fullWidth
                  type="url"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Exam Configuration</Typography>
              <Stack spacing={2}>
                <TextField
                  {...form.register("examRules")}
                  label="Exam Rules (optional)"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Enter exam rules and instructions..."
                />
                <TextField
                  {...form.register("passingCriteria", { valueAsNumber: true })}
                  label="Default Passing Criteria (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.watch("questionRandomization") ?? true}
                      onChange={(e) => form.setValue("questionRandomization", e.target.checked)}
                    />
                  }
                  label="Enable Question Randomization by Default"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Maintenance Mode</Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.watch("maintenanceMode") ?? false}
                      onChange={(e) => form.setValue("maintenanceMode", e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Enable Maintenance Mode"
                />
                <TextField
                  {...form.register("maintenanceMessage")}
                  label="Maintenance Message (optional)"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Message to show to users during maintenance..."
                  disabled={!form.watch("maintenanceMode")}
                />
              </Stack>
            </CardContent>
          </Card>

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={() => form.reset(query.data)} disabled={saving}>
              Reset
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}
