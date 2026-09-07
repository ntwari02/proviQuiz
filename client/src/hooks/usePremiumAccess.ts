import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { premiumStatusApi } from "../api/premiumApi";

function isStaffRole(role?: string) {
  return role === "admin" || role === "superadmin";
}

export function usePremiumAccess() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const staff = isStaffRole(user?.role);

  const query = useQuery({
    queryKey: ["premium", "status", user?.id],
    queryFn: premiumStatusApi,
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });

  const access = query.data?.access;
  const quota = query.data?.quota ?? null;
  const isPremium = staff || Boolean(access?.isPremium);

  return {
    ...query,
    access,
    quota,
    tier: staff ? "premium" : access?.tier ?? "free",
    isPremium,
    isFree: !isPremium,
    isStaff: staff,
    plan: staff
      ? {
          name: "Staff access",
          slug: "staff",
          examQuota: 0,
          examQuotaPeriod: "unlimited",
          features: [],
          expiresAt: "",
          id: "staff",
        }
      : access?.plan,
  };
}
