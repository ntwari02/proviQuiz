import { Box, Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { registerApi, startGoogleOAuth } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthCard } from "../components/auth/AuthCard";
import { RHFTextField } from "../components/forms/RHFTextField";
import { RHFPasswordField } from "../components/auth/RHFPasswordField";
import { PasswordStrength } from "../components/auth/PasswordStrength";
import { useAuthStore } from "../store/authStore";

const schema = z
  .object({
    name: z.string().trim().optional(),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((v) => /[a-z]/.test(v), "Add a lowercase letter")
      .refine((v) => /[A-Z]/.test(v), "Add an uppercase letter")
      .refine((v) => /\d/.test(v), "Add a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
    rememberMe: z.boolean().default(true),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const redirectTo = search.get("redirect") || "/";
  const token = useAuthStore((s) => s.token);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false, rememberMe: true },
    mode: "onTouched",
  });

  const password = useWatch({ control: form.control, name: "password" }) ?? "";

  const mutation = useMutation({ mutationFn: registerApi });

  async function onSubmit(values: FormValues) {
    try {
      const auth = await mutation.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name?.trim() ? values.name.trim() : undefined,
      });
      useAuthStore.getState().setAuth(auth, values.rememberMe);
      toast.success("Account created!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (token) {
    return (
      <AuthCard
        title="You’re already signed in"
        subtitle="Log out to create a new account."
        footer={
          <Button fullWidth variant="contained" onClick={() => navigate("/", { replace: true })}>
            Continue
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          If you want a different account, log out first.
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Get started in under a minute."
      footer={
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Already have an account?{" "}
          <Typography component={RouterLink} to="/login" sx={{ fontWeight: 800, textDecoration: "none", color: "text.primary" }}>
            Sign in
          </Typography>
        </Typography>
      }
    >
      <Stack spacing={2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={() => startGoogleOAuth(redirectTo)}
          sx={{ borderRadius: 999 }}
        >
          Continue with Google
        </Button>

        <Divider>or</Divider>

        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <RHFTextField
              control={form.control}
              name="name"
              label="Name (optional)"
              autoComplete="name"
              fullWidth
              disabled={mutation.isPending}
            />

            <RHFTextField
              control={form.control}
              name="email"
              label="Email"
              autoComplete="email"
              fullWidth
              disabled={mutation.isPending}
            />

            <RHFPasswordField<FormValues>
              control={form.control}
              name="password"
              label="Password"
              autoComplete="new-password"
              disabled={mutation.isPending}
            />

            <PasswordStrength password={password} />

            <RHFPasswordField<FormValues>
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              disabled={mutation.isPending}
              showCapsLockHint={false}
            />

            <Controller
              control={form.control}
              name="acceptTerms"
              render={({ field, fieldState }) => (
                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                    label="I agree to the Terms and Privacy Policy"
                  />
                  {fieldState.error?.message && (
                    <Typography variant="caption" color="error">
                      {fieldState.error.message}
                    </Typography>
                  )}
                </Stack>
              )}
            />

            <Controller
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                  label="Keep me signed in"
                />
              )}
            />

            <Button type="submit" fullWidth variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create account"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </AuthCard>
  );
}

