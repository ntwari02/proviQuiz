import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { adminGetSettingsApi, adminUpdateSettingsApi, type SystemSettings } from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/http";
import toast from "react-hot-toast";

type SystemSettingsForm = SystemSettings;

export function SystemSettingsPage() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminGetSettingsApi,
  });

  const form = useForm<SystemSettingsForm>({
    values: query.data ?? {
      systemName: "PROVIQUIZ",
      logoUrl: "",
      examRules: "",
      passingCriteria: 60,
      questionRandomization: true,
      maintenanceMode: false,
      maintenanceMessage: "",
    },
  });

  const mutation = useMutation({
    mutationFn: adminUpdateSettingsApi,
    onSuccess: (data) => {
      qc.setQueryData(["admin", "settings"], data);
      toast.success("Settings saved");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err));
    },
  });

  const onSubmit = (values: SystemSettingsForm) => {
    mutation.mutate(values);
  };

  const watchingMaintenance = form.watch("maintenanceMode");
  const watchingSystemName = form.watch("systemName");
  const watchingLogoUrl = form.watch("logoUrl");

  if (query.isLoading) {
    return <Typography>Loading settings…</Typography>;
  }

  if (query.isError) {
    return (
      <Typography color="error">
        {getApiErrorMessage(query.error)}
      </Typography>
    );
  }

  const data = query.data!;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={900}>
            System settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control global branding, default exam behavior, and maintenance mode.
          </Typography>
        </Box>
        <Chip label="Admin only" variant="outlined" />
      </Stack>

      {data.maintenanceMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Maintenance mode is currently <strong>enabled</strong>. Students may see a maintenance message instead of
          normal access.
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          {/* Branding */}
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                gap={3}
                alignItems={{ md: "flex-start" }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={900} mb={1}>
                    Branding
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Update the system name and logo as they appear in the header and admin areas.
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="System name"
                      fullWidth
                      {...form.register("systemName", { required: true })}
                    />
                    <TextField
                      label="Logo URL (optional)"
                      fullWidth
                      type="url"
                      helperText="Public image URL. Leave empty to use text logo only."
                      {...form.register("logoUrl")}
                    />
                  </Stack>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

                <Box
                  sx={{
                    flexBasis: 260,
                    flexShrink: 0,
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    p: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Live preview
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    {watchingLogoUrl ? (
                      <Box
                        component="img"
                        src={watchingLogoUrl}
                        alt="Logo preview"
                        sx={{ width: 40, height: 40, borderRadius: 1, objectFit: "contain", border: "1px solid", borderColor: "divider" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: "primary.main",
                          display: "grid",
                          placeItems: "center",
                          color: "primary.contrastText",
                          fontWeight: 900,
                          fontSize: 18,
                        }}
                      >
                        {(watchingSystemName || "P").charAt(0).toUpperCase()}
                      </Box>
                    )}
                    <Box>
                      <Typography fontWeight={900}>
                        {watchingSystemName || "PROVIQUIZ"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Student & Admin portal
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Exam defaults */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={1}>
                Exam defaults
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Configure default passing criteria and question randomization behavior.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Default passing criteria (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  {...form.register("passingCriteria", { valueAsNumber: true })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.watch("questionRandomization") ?? true}
                      onChange={(e) => form.setValue("questionRandomization", e.target.checked)}
                    />
                  }
                  label="Enable question randomization by default"
                />
                <TextField
                  label="Default exam rules / instructions (optional)"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="These rules can be shown before a user starts an exam."
                  {...form.register("examRules")}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Maintenance mode */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={1}>
                Maintenance mode
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Temporarily restrict access to the platform while you perform updates.
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      color="warning"
                      checked={watchingMaintenance ?? false}
                      onChange={(e) => form.setValue("maintenanceMode", e.target.checked)}
                    />
                  }
                  label="Enable maintenance mode"
                />
                <TextField
                  label="Maintenance message"
                  fullWidth
                  multiline
                  rows={3}
                  disabled={!watchingMaintenance}
                  placeholder="Message to show to users while maintenance mode is enabled."
                  {...form.register("maintenanceMessage")}
                />

                {watchingMaintenance && (
                  <Alert severity="info">
                    This is how the maintenance notice might look to students:{" "}
                    <strong>{form.watch("maintenanceMessage") || "The system is temporarily under maintenance. Please try again later."}</strong>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Meta & actions */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Last updated:{" "}
                {data.updatedAt ? dayjs(data.updatedAt).format("MMM D, YYYY HH:mm") : "Not available"}
              </Typography>
            </Box>
            <Stack direction="row" gap={1}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => form.reset(data)}
                disabled={mutation.isPending}
              >
                Reset
              </Button>
              <Button type="submit" variant="contained" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}

