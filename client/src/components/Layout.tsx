import { Alert, Box, Button, Container } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { unsyncedSessions } from "../offline/examOfflineStore";
import { syncOfflineExamSessions } from "../offline/syncExamSessions";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";
import { useExamStore } from "../store/examStore";
import { useBattleUiStore } from "../store/battleUiStore";

export function Layout() {
  const location = useLocation();
  const { useBottomNav, immersiveExam, isCompactPhone } = useDeviceAdapter();
  const examStatus = useExamStore((s) => s.status);
  const battleImmersive = useBattleUiStore((s) => s.immersive);
  const examActive = immersiveExam && location.pathname === "/exam" && examStatus === "in_progress";
  const playActive = examActive || (immersiveExam && battleImmersive);
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("proviquiz:cookieAccepted");
    if (saved === "true") {
      setShowCookieBanner(false);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine);
      void unsyncedSessions().then((rows) => setPending(rows.length)).catch(() => setPending(0));
    };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, [location.pathname]);

  const handleAcceptCookies = () => {
    localStorage.setItem("proviquiz:cookieAccepted", "true");
    setShowCookieBanner(false);
  };

  const showBottom = useBottomNav && !playActive;
  const showHeader = !playActive;
  const showFooter = !useBottomNav && !playActive;

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default", color: "text.primary" }}>
      <Box
        className="pointer-events-none absolute inset-0"
        sx={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(17,24,39,0.05), transparent 45%), radial-gradient(circle at 80% 20%, rgba(17,24,39,0.04), transparent 45%)",
        }}
      />

      <Box className="relative">
        {showHeader && <Header />}

        {!online && (
          <Alert severity="warning" sx={{ borderRadius: 0, fontSize: isCompactPhone ? 13 : undefined }}>
            Offline. Cached exams still work. Up to 5 sessions stay on this device.
          </Alert>
        )}
        {online && pending > 0 && (
          <Alert
            severity="info"
            sx={{ borderRadius: 0 }}
            action={
              <Button color="inherit" size="small" onClick={() => void syncOfflineExamSessions().then(() => void unsyncedSessions().then((r) => setPending(r.length)))}>
                Sync
              </Button>
            }
          >
            {pending} exam{pending === 1 ? "" : "s"} waiting to sync.
          </Alert>
        )}

        <Container
          maxWidth={playActive ? false : "lg"}
          sx={{
            px: playActive ? { xs: 1.25, sm: 2 } : { xs: 1.5, sm: 3 },
            py: playActive ? { xs: 1, sm: 2 } : { xs: 2.5, sm: 4, md: 5 },
            pb: showBottom ? "calc(72px + env(safe-area-inset-bottom))" : undefined,
            pt: playActive ? "max(8px, env(safe-area-inset-top))" : undefined,
          }}
        >
          <Outlet />
        </Container>

        {showFooter && <Footer />}
        {showBottom && <BottomNav />}
        <Toaster position="top-center" />

        {showCookieBanner && (
          <Box
            className="fixed left-1/2 z-50 w-[min(720px,calc(100%-16px))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/90 dark:bg-slate-900/95 p-4 shadow-lg backdrop-blur"
            sx={{ bottom: showBottom ? "calc(76px + env(safe-area-inset-bottom))" : 24 }}
          >
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
