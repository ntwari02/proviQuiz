import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

export type TileTone = "brand" | "ink" | "sand" | "mint" | "rose";

const TONES: Record<TileTone, { bg: string; fg: string; muted: string }> = {
  brand: { bg: "#0f766e", fg: "#f8fafc", muted: "rgba(248,250,252,0.82)" },
  ink: { bg: "#0f172a", fg: "#f8fafc", muted: "rgba(248,250,252,0.75)" },
  sand: { bg: "#f4efe6", fg: "#1c1917", muted: "#57534e" },
  mint: { bg: "#ecfdf5", fg: "#064e3b", muted: "#047857" },
  rose: { bg: "#fff1f2", fg: "#881337", muted: "#9f1239" },
};

export function FeatureTile({
  tone = "sand",
  kicker,
  title,
  body,
  action,
  to,
  icon,
}: {
  tone?: TileTone;
  kicker?: string;
  title: string;
  body: string;
  action?: string;
  to?: string;
  icon?: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        bgcolor: c.bg,
        color: c.fg,
        border: "none",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
        {icon && <Box sx={{ mb: 1.25, opacity: 0.9 }}>{icon}</Box>}
        {kicker && (
          <Typography variant="overline" sx={{ color: c.muted, letterSpacing: 1.2 }}>
            {kicker}
          </Typography>
        )}
        <Typography fontWeight={800} sx={{ fontSize: "1.15rem", lineHeight: 1.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.75, color: c.muted, flex: 1 }}>
          {body}
        </Typography>
        {action && to && (
          <Button
            component={RouterLink}
            to={to}
            sx={{
              mt: 2,
              alignSelf: "flex-start",
              color: c.fg,
              borderColor: c.muted,
              minHeight: 40,
            }}
            variant="outlined"
          >
            {action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function StatBlock({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: "ok" | "warn" | "bad" | "neutral";
}) {
  const color =
    emphasize === "ok"
      ? "success.main"
      : emphasize === "warn"
        ? "warning.main"
        : emphasize === "bad"
          ? "error.main"
          : "text.primary";
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack spacing={0.5} mb={1}>
      <Typography variant="h4" fontWeight={800} letterSpacing={-0.6}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" maxWidth={560}>
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}
