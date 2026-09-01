import { useMediaQuery } from "@mui/material";

export type DeviceClass = "compact" | "comfortable" | "medium" | "expanded";

export function useDeviceAdapter() {
  const compact = useMediaQuery("(max-width:389.95px)");
  const phone = useMediaQuery("(max-width:599.95px)");
  const medium = useMediaQuery("(min-width:600px) and (max-width:899.95px)");
  const landscapePhone = useMediaQuery("(orientation: landscape) and (max-height: 500px)");
  const coarse = useMediaQuery("(pointer: coarse)");

  const deviceClass: DeviceClass = compact
    ? "compact"
    : phone
      ? "comfortable"
      : medium
        ? "medium"
        : "expanded";

  return {
    deviceClass,
    isPhone: phone,
    isCompactPhone: compact,
    isTablet: medium,
    isDesktop: !phone && !medium,
    useBottomNav: phone && !landscapePhone,
    immersiveExam: phone || landscapePhone,
    hideHomeDecor: compact,
    dense: compact || landscapePhone,
    touch: coarse,
    landscapePhone,
  };
}
