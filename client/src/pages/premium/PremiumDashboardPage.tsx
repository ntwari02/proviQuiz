import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";
import { premiumAnalyseApi } from "../../api/premiumApi";
import { FeatureTile, PageIntro, StatBlock } from "../../components/ui/FeatureTile";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";

export function PremiumDashboardPage() {
  const { quota, plan, isStaff, isPremium } = usePremiumAccess();
  const analyseQ = useQuery({
    queryKey: ["premium", "analyse"],
    queryFn: premiumAnalyseApi,
    enabled: isPremium,
    retry: false,
  });

  const next = analyseQ.data?.nextMove;
  const readiness = analyseQ.data?.readiness;
  const score = readiness?.score ?? 0;
  const scoreTone = score >= 80 ? "ok" : score >= 50 ? "warn" : score > 0 ? "bad" : "neutral";

  return (
    <Stack spacing={3}>
      <PageIntro
        title={isStaff ? "Staff Premium" : "Your Premium home"}
        subtitle={isStaff ? "Admin accounts get full Premium on a free login — no grant required." : "Analyse first, then practice the weak spots. Battles are optional."}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        <StatBlock
          label="Plan"
          value={plan?.name ?? "Premium"}
          hint={
            isStaff
              ? "Included with admin"
              : plan?.expiresAt
                ? `Until ${new Date(plan.expiresAt).toLocaleDateString()}`
                : "Active"
          }
        />
        <StatBlock
          label="Readiness"
          value={readiness ? `${readiness.score}` : analyseQ.isError ? "—" : "…"}
          hint={readiness?.bandLabel ?? (analyseQ.isError ? "Could not load analysis" : "After a saved exam")}
          emphasize={scoreTone}
        />
        <StatBlock
          label="Exam quota"
          value={
            !quota?.applies || quota.unlimited
              ? "Unlimited"
              : `${quota.remaining} left`
          }
          hint={quota?.applies && !quota.unlimited ? `${quota.used}/${quota.limit} ${quota.periodLabel}` : "No cap on this account"}
          emphasize={!quota?.applies || quota.unlimited || (quota?.remaining ?? 0) > 2 ? "ok" : "warn"}
        />
      </Box>

      {next && (
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 4,
            bgcolor: "#0f766e",
            color: "#f8fafc",
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.8 }}>
            Next move
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
            {next.topic}
          </Typography>
          <Typography sx={{ mt: 1, opacity: 0.9, maxWidth: 640 }}>{next.recommended}</Typography>
          <Button
            component={RouterLink}
            to={next.cta === "START EXAM" ? "/exam" : "/premium/practice"}
            sx={{ mt: 2, bgcolor: "#fff", color: "#0f766e", fontWeight: 800, "&:hover": { bgcolor: "#ecfdf5" } }}
          >
            {next.cta}
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        <FeatureTile
          tone="ink"
          icon={<InsightsOutlinedIcon />}
          kicker="Understand"
          title="Analyse"
          body="Weak topics, readiness, and what to study next — not another wall of identical cards."
          action="Open Analyse"
          to="/premium/analyse"
        />
        <FeatureTile
          tone="mint"
          icon={<FitnessCenterOutlinedIcon />}
          kicker="Improve"
          title="Smart practice"
          body="Questions from your mistakes. Immediate feedback, not a timed mock."
          action="Practice"
          to="/premium/practice"
        />
        <FeatureTile
          tone="brand"
          icon={<EmojiEventsOutlinedIcon />}
          kicker="Compete"
          title="Live battle"
          body="Share a code. Same exam. Highest score wins."
          action="Create battle"
          to="/premium/battle"
        />
        <FeatureTile
          tone="rose"
          icon={<ReportProblemOutlinedIcon />}
          kicker="Repair"
          title="My mistakes"
          body="Replay the questions you keep missing."
          action="Review"
          to="/premium/mistakes"
        />
      </Box>

      <Button component={RouterLink} to="/exam" startIcon={<QuizOutlinedIcon />} variant="text" sx={{ alignSelf: "flex-start" }}>
        Take the free 20-question mock
      </Button>
    </Stack>
  );
}
