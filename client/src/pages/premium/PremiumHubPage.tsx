import { CircularProgress, Box } from "@mui/material";
import { useAuthStore } from "../../store/authStore";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";
import { PremiumDashboardPage } from "./PremiumDashboardPage";
import { PremiumUpgradePage } from "./PremiumUpgradePage";

export function PremiumHubPage() {
  const token = useAuthStore((s) => s.token);
  const { isPremium, isLoading } = usePremiumAccess();

  if (token && isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isPremium) return <PremiumDashboardPage />;
  return <PremiumUpgradePage />;
}
