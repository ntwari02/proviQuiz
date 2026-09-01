import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { usePremiumAccess } from "../hooks/usePremiumAccess";
import { useAuthStore } from "../store/authStore";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();

  const items = isPremium
    ? [
        { label: "Home", to: "/", icon: <HomeOutlinedIcon /> },
        { label: "Exam", to: "/exam", icon: <QuizOutlinedIcon /> },
        { label: "Analyse", to: "/premium/analyse", icon: <InsightsOutlinedIcon /> },
        { label: "Battle", to: "/premium/battle", icon: <EmojiEventsOutlinedIcon /> },
        { label: "You", to: "/premium", icon: <WorkspacePremiumOutlinedIcon /> },
      ]
    : [
        { label: "Home", to: "/", icon: <HomeOutlinedIcon /> },
        { label: "Exam", to: "/exam", icon: <QuizOutlinedIcon /> },
        { label: token ? "Upgrade" : "Demo", to: token ? "/premium/upgrade" : "/demo", icon: <WorkspacePremiumOutlinedIcon /> },
      ];

  const value = items.find((i) =>
    i.to === "/" ? location.pathname === "/" : location.pathname.startsWith(i.to)
  )?.to ?? false;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pb: "env(safe-area-inset-bottom)",
        borderRadius: 0,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_e, to) => navigate(to)}
        sx={{
          minHeight: 56,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            px: 0.5,
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.65rem",
            fontWeight: 700,
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.to} value={item.to} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
