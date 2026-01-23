import { Box, Button, Stack, Typography } from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthCard } from "../components/auth/AuthCard";
import { RHFTextField } from "../components/forms/RHFTextField";
import { RHFPasswordField } from "../components/auth/RHFPasswordField";
import { PasswordStrength } from "../components/auth/PasswordStrength";

const schema = z
  .object({
    token: z.string().min(10, "Paste the reset token"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((v) => /[a-z]/.test(v), "Add a lowercase letter")
      .refine((v) => /[A-Z]/.test(v), "Add an uppercase letter")
      .refine((v) => /\d/.test(v), "Add a number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const tokenFromUrl = search.get("token") ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: tokenFromUrl, newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const newPassword = useWatch({ control: form.control, name: "newPassword" }) ?? "";

  const mutation = useMutation({ mutationFn: resetPasswordApi });

  async function onSubmit(values: FormValues) {
    try {
      const res = await mutation.mutateAsync({ token: values.token, newPassword: values.newPassword });
      toast.success(res.message || "Password updated.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Paste your reset token and choose a new password."
      footer={
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Need a token?{" "}
          <Typography component={RouterLink} to="/forgot-password" sx={{ fontWeight: 800, textDecoration: "none", color: "text.primary" }}>
            Generate one
          </Typography>
        </Typography>
      }
    >
      <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <RHFTextField
            control={form.control}
            name="token"
            label="Reset token"
            fullWidth
            disabled={mutation.isPending}
          />

          <RHFPasswordField
            control={form.control}
            name="newPassword"
            label="New password"
            autoComplete="new-password"
            disabled={mutation.isPending}
          />

          <PasswordStrength password={newPassword} />

          <RHFPasswordField
            control={form.control}
            name="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            disabled={mutation.isPending}
            showCapsLockHint={false}
          />

          <Button type="submit" fullWidth variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating…" : "Update password"}
          </Button>
        </Stack>
      </Box>
    </AuthCard>
  );
}

