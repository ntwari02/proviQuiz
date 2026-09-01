import { Box, Button, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { premiumPaywallApi, premiumPlansPublicApi } from "../../api/premiumApi";

export function PaywallCard() {
  const paywallQ = useQuery({ queryKey: ["premium", "paywall"], queryFn: premiumPaywallApi });
  const plansQ = useQuery({ queryKey: ["premium", "plans-public"], queryFn: premiumPlansPublicApi });

  const paywall = paywallQ.data?.paywall;
  const plans = plansQ.data ?? [];

  return (
    <Card variant="outlined" sx={{ maxWidth: 720, mx: "auto", borderRadius: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={900}>
            {paywall?.headline ?? "UNLOCK YOUR FULL PREPARATION"}
          </Typography>
          <Typography color="text.secondary">
            {paywall?.subheadline ?? "Upgrade to Premium for analysis, learning, battles, and readiness tracking."}
          </Typography>

          <List dense>
            {(paywall?.bulletPoints ?? []).map((item) => (
              <ListItem key={item} disableGutters>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutlineIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>

          {plans.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={800} mb={1}>
                Available plans
              </Typography>
              <Stack spacing={1}>
                {plans.map((p) => (
                  <Box
                    key={p.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Typography fontWeight={800}>{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.price.toLocaleString()} {p.currency} · {p.duration} {p.durationUnit}
                      {p.examQuotaPeriod === "unlimited"
                        ? " · Unlimited exams"
                        : ` · ${p.examQuota} exams/${p.examQuotaPeriod}`}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Contact your admin or driving school to activate Premium. Payment integration coming soon.
          </Typography>

          <Button component={RouterLink} to="/premium/upgrade" variant="contained" sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
            {paywall?.ctaLabel ?? "Upgrade to Premium"}
          </Button>
          <Button component={RouterLink} to="/exam" variant="text" sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
            Continue with free mock
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
