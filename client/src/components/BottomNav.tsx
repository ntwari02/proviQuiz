
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Typography,
} from "@mui/material";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";

import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";

import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

import { useLocation, useNavigate } from "react-router-dom";
import { usePremiumAccess } from "../hooks/usePremiumAccess";
import { useAuthStore } from "../store/authStore";

const NAV = {
  background: "#0B111B",
  surface: "#121B28",
  border: "rgba(148, 163, 184, 0.13)",
  active: "#36E0BB",
  inactive: "#8795A8",
  text: "#F5F8FC",
};

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();

  const pathname = location.pathname;

  const items = isPremium
    ? [
        {
          label: "Home",
          to: "/",
          icon: <HomeOutlinedIcon />,
          activeIcon: <HomeRoundedIcon />,
        },
        {
          label: "Exam",
          to: "/exam",
          icon: <QuizOutlinedIcon />,
          activeIcon: <QuizRoundedIcon />,
        },
        {
          label: "Daily",
          to: "/daily",
          icon: <LocalFireDepartmentOutlinedIcon />,
          activeIcon: <LocalFireDepartmentRoundedIcon />,
        },
        {
          label: "Battle",
          to: "/premium/battle",
          icon: <EmojiEventsOutlinedIcon />,
          activeIcon: <EmojiEventsRoundedIcon />,
        },
        {
          label: "You",
          to: "/premium",
          icon: <WorkspacePremiumOutlinedIcon />,
          activeIcon: <WorkspacePremiumRoundedIcon />,
        },
      ]
    : [
        {
          label: "Home",
          to: "/",
          icon: <HomeOutlinedIcon />,
          activeIcon: <HomeRoundedIcon />,
        },
        {
          label: "Exam",
          to: "/exam",
          icon: <QuizOutlinedIcon />,
          activeIcon: <QuizRoundedIcon />,
        },
        {
          label: "Daily",
          to: "/daily",
          icon: <LocalFireDepartmentOutlinedIcon />,
          activeIcon: <LocalFireDepartmentRoundedIcon />,
        },
        {
          label: token ? "Premium" : "Sign in",
          to: token ? "/premium" : "/login",
          icon: token ? (
            <WorkspacePremiumOutlinedIcon />
          ) : (
            <LoginRoundedIcon />
          ),
          activeIcon: <WorkspacePremiumRoundedIcon />,
        },
      ];

  const activeItem = [...items]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) =>
      item.to === "/"
        ? pathname === "/"
        : pathname === item.to ||
          pathname.startsWith(`${item.to}/`)
    );

  const value = activeItem?.to ?? false;

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        left: { xs: 10, sm: 20, md: "50%" },
        right: { xs: 10, sm: 20, md: "auto" },
        bottom: {
          xs: "calc(9px + env(safe-area-inset-bottom, 0px))",
          md: 18,
        },
        width: { xs: "auto", md: 560 },
        transform: { md: "translateX(-50%)" },
        zIndex: 1200,

        overflow: "hidden",
        borderRadius: { xs: "21px", md: "24px" },
        background: "rgba(11, 17, 27, 0.94)",
        border: `1px solid ${NAV.border}`,

        boxShadow:
          "0 12px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.035)",

        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "12%",
          right: "12%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(54,224,187,0.22), transparent)",
          pointerEvents: "none",
        },
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_event, to) => {
          if (to && to !== pathname) navigate(to);
        }}
        sx={{
          height: { xs: 69, sm: 74 },
          background: "transparent",
          px: { xs: 0.4, sm: 1 },
          gap: { xs: 0, sm: 0.5 },

          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            minHeight: 0,
            flex: "1 1 0",
            maxWidth: "none",
            height: "100%",
            p: "9px 2px 7px",
            color: NAV.inactive,
            position: "relative",
            transition: "color .2s ease",
            overflow: "hidden",

            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "27%",
              right: "27%",
              height: "2px",
              borderRadius: "0 0 4px 4px",
              background: NAV.active,
              transform: "scaleX(0)",
              opacity: 0,
              transition: "transform .22s ease, opacity .22s ease",
            },

            "&.Mui-selected": {
              color: NAV.active,
            },

            "&.Mui-selected::before": {
              transform: "scaleX(1)",
              opacity: 1,
            },

            "&:hover": {
              color: NAV.text,
              background: "rgba(255,255,255,0.025)",
            },

            "& .MuiBottomNavigationAction-label": {
              fontSize: "10px",
              fontWeight: 650,
              letterSpacing: "0.15px",
              lineHeight: 1.2,
              mt: "5px",
              opacity: 0.85,
              transition: "all .2s ease",
            },

            "& .MuiBottomNavigationAction-label.Mui-selected": {
              fontSize: "10px",
              fontWeight: 800,
              opacity: 1,
            },

            "& .MuiSvgIcon-root": {
              fontSize: 23,
              transition: "transform .2s ease",
            },

            "&.Mui-selected .MuiSvgIcon-root": {
              transform: "translateY(-1px)",
              filter: "drop-shadow(0 0 7px rgba(54,224,187,0.15))",
            },
          },
        }}
      >
        {items.map((item) => {
          const selected = value === item.to;

          return (
            <BottomNavigationAction
              key={item.to}
              value={item.to}
              label={item.label}
              icon={selected ? item.activeIcon : item.icon}
              aria-label={item.label}
              showLabel
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
