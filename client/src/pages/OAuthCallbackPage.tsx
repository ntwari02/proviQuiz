import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { writeAuthToken, writeStoredUser } from "../auth/authStorage";
import { meApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../api/http";

export function OAuthCallbackPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "error">("working");

  const tokenParam = search.get("token");
  const redirectParam = search.get("redirect");

  useEffect(() => {
    const token = tokenParam;
    const redirect = redirectParam || "/";

    if (!token) {
      setStatus("error");
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // Persist token first so axios picks it up
        writeAuthToken(token, true);

        const user = await meApi();
        if (!mounted) return;

        writeStoredUser(user);
        useAuthStore.getState().setAuth({ token, user }, true);

        navigate(redirect, { replace: true });
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        toast.error(getApiErrorMessage(err));
        setStatus("error");
      }
    })();

    return () => { mounted = false; };
  }, [navigate, tokenParam, redirectParam]);

  if (status === "error") {
    return (
      <AuthCard
        title="Sign-in failed"
        subtitle="We couldn’t complete Google sign-in."
        footer={
          <Button variant="contained" fullWidth onClick={() => navigate("/login", { replace: true })}>
            Back to login
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary">
          Try again or use email/password instead.
        </Typography>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Signing you in..." subtitle="Please wait a moment.">
      <Stack alignItems="center" spacing={2} py={2}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Completing Google sign-in.
        </Typography>
      </Stack>
    </AuthCard>
  );
}

