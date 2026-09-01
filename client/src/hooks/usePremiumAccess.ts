import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { premiumStatusApi } from "../api/premiumApi";

export function usePremiumAccess() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ["premium", "status", user?.id],
    queryFn: premiumStatusApi,
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const access = query.data?.access;
  const quota = query.data?.quota ?? null;

  return {
    ...query,
    access,
    quota,
    tier: access?.tier ?? "free",
    isPremium: access?.isPremium ?? false,
    isFree: !access?.isPremium,
    plan: access?.plan,
  };
}
