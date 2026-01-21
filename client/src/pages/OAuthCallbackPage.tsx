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

  useEffect(() => {
    const token = search.get("token");
    const redirect = search.get("redirect") || "/";

    if (!token) {
      setStatus("error");
      return;
    }

    (async () => {
      try {
        // Persist token first so axios picks it up
        writeAuthToken(token, true);

        const user = await meApi();
        writeStoredUser(user);
        useAuthStore.getState().setAuth({ token, user }, true);

        navigate(redirect, { replace: true });
      } catch (err) {
        console.error(err);
        toast.error(getApiErrorMessage(err));
        setStatus("error");
      }
    })();
  }, [navigate, search]);

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

