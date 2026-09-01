import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { premiumPaywallApi, premiumPlansPublicApi } from "../../api/premiumApi";
import { useAuthStore } from "../../store/authStore";
import { useDeviceAdapter } from "../../hooks/useDeviceAdapter";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";

const SHOWCASE = [
  {
    icon: <WhatshotOutlinedIcon />,
    title: "National daily 5",
    body: "The same five questions for every learner in Rwanda today. Streaks and a live board — free once you sign in.",
  },
  {
    icon: <GroupsOutlinedIcon />,
    title: "Live battles",
    body: "Share a code. Everyone sits the same exam at once. Highest score wins — 1v1 or a whole group.",
  },
  {
    icon: <InsightsOutlinedIcon />,
    title: "Analyse that tells you what to do",
    body: "Readiness score, weak topics, and one next move after every saved mock.",
  },
  {
    icon: <FitnessCenterOutlinedIcon />,
    title: "Smart practice",
    body: "Questions pulled from your mistakes — not another random paper.",
  },
  {
    icon: <BoltOutlinedIcon />,
    title: "The mock you already trust",
    body: "Free still means 20 questions / 20 minutes. Premium coaches you between those exams.",
  },
];

export function PremiumUpgradePage() {
  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();
  const { isPhone, isCompactPhone } = useDeviceAdapter();
  const paywallQ = useQuery({ queryKey: ["premium", "paywall"], queryFn: premiumPaywallApi });
  const plansQ = useQuery({ queryKey: ["premium", "plans-public"], queryFn: premiumPlansPublicApi });

  const paywall = paywallQ.data?.paywall;
  const plans = plansQ.data ?? [];
  const featured = paywall?.featuredPlanSlug;
  const freeList = paywall?.freeList?.length
    ? paywall.freeList
    : ["Timed 20-question mock", "Instant results", "Works offline (up to 5 packs)"];
  const premiumList = paywall?.premiumList?.length
    ? paywall.premiumList
    : ["Live battles", "Analyse & readiness", "Smart practice from mistakes"];
  const proof = paywall?.socialProof?.length
    ? paywall.socialProof
    : SHOWCASE.map((s) => s.body);

  const ctaTo = !token ? "/login" : isPremium ? "/premium" : "/premium";
  const ctaLabel = paywall?.ctaLabel ?? "Upgrade to Premium";

  return (
    <Stack spacing={isPhone ? 2.5 : 4} sx={{ pb: 4 }}>
      <Box
        sx={{
          borderRadius: isPhone ? 3 : 4,
          p: { xs: 2.5, md: 5 },
          color: "primary.contrastText",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #0f766e 100%)",
        }}
      >
        <Chip
          label="Premium"
          size="small"
          sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "inherit", fontWeight: 800, mb: 1.5 }}
        />
        <Typography variant={isCompactPhone ? "h5" : "h3"} fontWeight={900} letterSpacing={-0.6}>
          {paywall?.headline ?? "Unlock your full preparation"}
        </Typography>
        <Typography sx={{ mt: 1, maxWidth: 640, opacity: 0.92 }}>
          {paywall?.subheadline ??
            "Compete live, see your weak topics, and practice the questions that actually cost you marks."}
        </Typography>
        <Stack direction={isPhone ? "column" : "row"} gap={1.5} mt={3}>
          <Button
            component={RouterLink}
            to={ctaTo}
            variant="contained"
            color="secondary"
            fullWidth={isPhone}
            sx={{ borderRadius: 999, minHeight: 48, fontWeight: 800 }}
          >
            {token ? (isPremium ? "Open Premium" : ctaLabel) : "Sign in to upgrade"}
          </Button>
          <Button
            component={RouterLink}
            to="/exam"
            variant="outlined"
            fullWidth={isPhone}
            sx={{
              borderRadius: 999,
              minHeight: 48,
              color: "inherit",
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            Keep the free mock
          </Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={900} mb={1}>
          {paywall?.storyHeadline ?? "Why learners upgrade"}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          {SHOWCASE.map((item) => (
            <Card key={item.title} variant="outlined">
              <CardContent>
                <Box sx={{ color: "primary.main", mb: 1 }}>{item.icon}</Box>
                <Typography fontWeight={900}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.body}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} gap={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="overline">Free</Typography>
            <Typography fontWeight={900} mb={1}>
              Start today
            </Typography>
            {freeList.map((item) => (
              <Stack key={item} direction="row" gap={1} alignItems="flex-start" mb={0.75}>
                <CheckCircleOutlineIcon fontSize="small" color="success" />
                <Typography variant="body2">{item}</Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, border: "2px solid", borderColor: "primary.main" }}>
          <CardContent>
            <Typography variant="overline" color="primary">
              Premium
            </Typography>
            <Typography fontWeight={900} mb={1}>
              Pass with a plan
            </Typography>
            {(paywall?.bulletPoints?.length ? paywall.bulletPoints : premiumList).map((item) => (
              <Stack key={item} direction="row" gap={1} alignItems="flex-start" mb={0.75}>
                <CheckCircleOutlineIcon fontSize="small" color="primary" />
                <Typography variant="body2">{item}</Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Stack>

      {plans.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={900} mb={1.5}>
            Plans
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(plans.length, 3)}, 1fr)` },
              gap: 1.5,
            }}
          >
            {plans.map((p) => {
              const highlight = featured ? p.slug === featured : p.slug === "monthly";
              return (
                <Card
                  key={p.id}
                  variant="outlined"
                  sx={{
                    borderWidth: highlight ? 2 : 1,
                    borderColor: highlight ? "primary.main" : "divider",
                  }}
                >
                  <CardContent>
                    {highlight && (
                      <Chip label="Most chosen" size="small" color="primary" sx={{ mb: 1, fontWeight: 800 }} />
                    )}
                    <Typography fontWeight={900}>{p.name}</Typography>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
                      {p.price.toLocaleString()} {p.currency}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.duration} {p.durationUnit}
                      {p.examQuotaPeriod === "unlimited"
                        ? " · Unlimited exams"
                        : ` · ${p.examQuota} exams / ${p.examQuotaPeriod}`}
                    </Typography>
                    {p.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {p.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {proof.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: isPhone ? "auto" : "visible",
            flexWrap: isPhone ? "nowrap" : "wrap",
            pb: 0.5,
          }}
        >
          {proof.map((quote) => (
            <Card key={quote} sx={{ minWidth: isPhone ? 260 : 280, flex: isPhone ? "0 0 auto" : "1 1 280px" }}>
              <CardContent>
                <Typography variant="body2">“{quote}”</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography fontWeight={900}>How to get Premium</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {paywall?.requestHint ??
              "Premium is granted by an admin or auto-école. Sign in, then ask them to activate a plan for your account."}
          </Typography>
          <Button
            component={RouterLink}
            to={token ? "/premium" : "/register"}
            variant="contained"
            sx={{ mt: 2, borderRadius: 999, minHeight: 44 }}
            fullWidth={isPhone}
          >
            {token ? ctaLabel : "Create a free account"}
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
