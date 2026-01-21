import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { forgotPasswordApi, type ForgotPasswordResponse } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthCard } from "../components/auth/AuthCard";
import { RHFTextField } from "../components/forms/RHFTextField";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const mutation = useMutation({ mutationFn: forgotPasswordApi });

  async function onSubmit(values: FormValues) {
    try {
      const res = await mutation.mutateAsync({ email: values.email });
      toast.success(res.message || "If that email exists, a reset token has been generated.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const data: ForgotPasswordResponse | undefined = mutation.data;

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We’ll generate a reset token (dev mode returns it)."
      footer={
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Remembered it?{" "}
          <Typography component={RouterLink} to="/login" sx={{ fontWeight: 800, textDecoration: "none", color: "text.primary" }}>
            Sign in
          </Typography>
        </Typography>
      }
    >
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <RHFTextField control={form.control} name="email" label="Email" autoComplete="email" fullWidth disabled={mutation.isPending} />
          <Button type="submit" fullWidth variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? "Generating…" : "Generate reset token"}
          </Button>

          {data?.resetToken && (
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Your reset token (dev):
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip label={data.resetToken} sx={{ maxWidth: "100%" }} />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(data.resetToken!);
                      toast.success("Token copied");
                    } catch {
                      toast.error("Could not copy token");
                    }
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="text"
                  component={RouterLink}
                  to={`/reset-password?token=${encodeURIComponent(data.resetToken)}`}
                >
                  Reset now
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    </AuthCard>
  );
}

