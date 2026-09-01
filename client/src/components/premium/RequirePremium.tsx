import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { usePremiumAccess } from "../../hooks/usePremiumAccess";
import { PaywallCard } from "./PaywallCard";

export function RequirePremium({
  children,
  redirectToPaywall = true,
}: {
  children: ReactNode;
  redirectToPaywall?: boolean;
}) {
  const location = useLocation();
  const { isPremium, isLoading, isError } = usePremiumAccess();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !isPremium) {
    if (redirectToPaywall) {
      return <Navigate to="/premium/upgrade" state={{ from: location.pathname }} replace />;
    }
    return <PaywallCard />;
  }

  return <>{children}</>;
}
