import { Box, Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { loginApi, startGoogleOAuth } from "../api/authApi";
import { getApiErrorMessage } from "../api/http";
import { AuthCard } from "../components/auth/AuthCard";
import { RHFTextField } from "../components/forms/RHFTextField";
import { RHFPasswordField } from "../components/auth/RHFPasswordField";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const redirectTo = search.get("redirect") || "/";
  const token = useAuthStore((s) => s.token);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
    mode: "onTouched",
  });

  const mutation = useMutation({ mutationFn: loginApi });

  async function onSubmit(values: FormValues) {
    try {
      const auth = await mutation.mutateAsync({ email: values.email, password: values.password });
      useAuthStore.getState().setAuth(auth, values.rememberMe);
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  // If you already have a token, push to home (avoid logging in again)
  if (token) {
    return (
      <AuthCard
        title="You’re already signed in"
        subtitle="Go back to the app."
        footer={
          <Button fullWidth variant="contained" onClick={() => navigate("/", { replace: true })}>
            Continue
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          If this is not your account, you can log out from the header.
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your PROVIQUIZ account."
      footer={
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Don’t have an account?{" "}
            <Typography component={RouterLink} to="/register" sx={{ fontWeight: 800, textDecoration: "none", color: "text.primary" }}>
              Create one
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            <Typography component={RouterLink} to="/forgot-password" sx={{ textDecoration: "none", color: "text.secondary" }}>
              Forgot password?
            </Typography>
          </Typography>
        </Stack>
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
              name="email"
              label="Email"
              autoComplete="email"
              fullWidth
            />

          <RHFPasswordField
              control={form.control}
              name="password"
              label="Password"
              autoComplete="current-password"
              disabled={mutation.isPending}
            />

            <Controller
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={(_, v) => field.onChange(v)} />}
                  label="Remember me"
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={mutation.isPending}
              sx={{ mt: 0.5 }}
            >
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </AuthCard>
  );
}

