import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";
import { PremiumUpgradePage } from "../../pages/premium/PremiumUpgradePage";

export function RequirePremium({
  children,
  redirectToPaywall = true,
}: {
  children: ReactNode;
  redirectToPaywall?: boolean;
}) {
  const location = useLocation();
  const { isPremium, isLoading, isStaff } = usePremiumAccess();

  if (isStaff || isPremium) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (redirectToPaywall) {
    return <Navigate to="/premium" state={{ from: location.pathname }} replace />;
  }
  return <PremiumUpgradePage />;
}
