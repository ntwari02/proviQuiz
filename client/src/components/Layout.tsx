import { Box, Button, Container } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("proviquiz:cookieAccepted");
    if (saved === "true") {
      setShowCookieBanner(false);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem("proviquiz:cookieAccepted", "true");
    setShowCookieBanner(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {/* Subtle background like the reference dashboard */}
      <Box
        className="pointer-events-none absolute inset-0"
        sx={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(17,24,39,0.05), transparent 45%), radial-gradient(circle at 80% 20%, rgba(17,24,39,0.04), transparent 45%)",
        }}
      />

      <Box className="relative">
        <Header />

        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 2, sm: 3 },
            py: isHome ? 0 : { xs: 4, sm: 6 },
          }}
        >
          <Outlet />
        </Container>

        <Footer />
        <Toaster position="top-right" />

        {/* Cookie-like banner */}
        {showCookieBanner && (
          <Box className="fixed bottom-6 left-1/2 z-50 w-[min(720px,calc(100%-24px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur">
            <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-700 dark:text-slate-100">
              <p className="text-sm">This website uses cookies to improve your experience.</p>
              <Button variant="contained" size="medium" sx={{ borderRadius: 999, textTransform: "none" }} onClick={handleAcceptCookies}>
                Accept and close
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

