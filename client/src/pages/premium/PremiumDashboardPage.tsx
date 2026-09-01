import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";
import { premiumAnalyseApi } from "../../api/premiumApi";

export function PremiumDashboardPage() {
  const { isPremium, quota, plan, isLoading } = usePremiumAccess();
  const analyseQ = useQuery({
    queryKey: ["premium", "analyse"],
    queryFn: premiumAnalyseApi,
    enabled: isPremium,
  });

  if (isLoading) return <Typography>Loading…</Typography>;
  if (!isPremium) return <Navigate to="/premium/upgrade" replace />;

  const next = analyseQ.data?.nextMove;
  const readiness = analyseQ.data?.readiness;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={900}>Premium dashboard</Typography>
        <Typography color="text.secondary">Exam → Analyse → Battle → Practice</Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Plan</Typography>
            <Typography variant="h6" fontWeight={900}>{plan?.name ?? "Premium"}</Typography>
            <Typography variant="body2" color="text.secondary">
              Expires {plan?.expiresAt ? new Date(plan.expiresAt).toLocaleDateString() : "—"}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Readiness</Typography>
            <Typography variant="h6" fontWeight={900}>{readiness ? `${readiness.score} · ${readiness.bandLabel}` : "—"}</Typography>
          </CardContent>
        </Card>

        {quota?.applies && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">Exam usage ({quota.periodLabel})</Typography>
              {quota.unlimited ? (
                <Typography variant="h6" fontWeight={900}>Unlimited exams</Typography>
              ) : (
                <>
                  <Typography variant="h6" fontWeight={900}>{quota.used} / {quota.limit} used</Typography>
                  <Typography variant="body2" color="success.main" fontWeight={700}>{quota.remaining} remaining</Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Stack>

      {next && (
        <Card>
          <CardContent>
            <Typography variant="overline" fontWeight={800}>Next move</Typography>
            <Typography variant="h6" fontWeight={900}>{next.topic}</Typography>
            <Typography sx={{ mt: 0.5 }}>{next.recommended}</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
              <Button component={RouterLink} to="/premium/analyse" variant="contained" sx={{ borderRadius: 999 }}>Analyse</Button>
              <Button component={RouterLink} to="/premium/practice" variant="contained" color="secondary" sx={{ borderRadius: 999 }}>Smart practice</Button>
              <Button component={RouterLink} to="/premium/battle" variant="contained" sx={{ borderRadius: 999 }}>Live battle</Button>
              <Button component={RouterLink} to="/premium/mistakes" variant="outlined" sx={{ borderRadius: 999 }}>My mistakes</Button>
              <Button component={RouterLink} to="/exam" variant="outlined" sx={{ borderRadius: 999 }}>Take mock exam</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
