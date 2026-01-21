import { Box, LinearProgress, Typography } from "@mui/material";

function scorePassword(pw: string) {
  const password = pw ?? "";
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // normalize 0..5 -> 0..4-ish buckets for UI
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrength({ password }: { password: string }) {
  const level = password ? scorePassword(password) : 0;
  const pct = level === 0 ? 0 : (level / 4) * 100;
  const label = labels[level];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Typography variant="caption" color="text.secondary">
          Password strength
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label || "—"}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: "rgba(148,163,184,0.25)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            bgcolor:
              level <= 1 ? "#DC2626" : level === 2 ? "#F59E0B" : level === 3 ? "#2563EB" : "#16A34A",
          },
        }}
      />
    </Box>
  );
}

