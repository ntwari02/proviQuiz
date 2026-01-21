import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CssBaseline } from "@mui/material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { BrowserRouter } from "react-router-dom"
import { useUiStore } from "./store/uiStore"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuthStore } from "./store/authStore"

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const colorMode = useUiStore((s) => s.colorMode);

  useEffect(() => {
    // Keep Tailwind `dark:` classes in sync with app color mode (not OS setting)
    document.documentElement.classList.toggle("dark", colorMode === "dark");
  }, [colorMode]);

  const theme = useMemo(() => {
    const isDark = colorMode === "dark";

    return createTheme({
      palette: {
        mode: colorMode,
        primary: { main: isDark ? "#E5E7EB" : "#111827" }, // light text on dark, dark text on light
        secondary: { main: isDark ? "#9CA3AF" : "#6B7280" },
        background: isDark
          ? { default: "#020617", paper: "#020617" }
          : { default: "#F6F6F2", paper: "#FFFFFF" },
        text: isDark
          ? { primary: "#F9FAFB", secondary: "#D1D5DB" }
          : { primary: "#111827", secondary: "#4B5563" },
        divider: isDark ? "rgba(148,163,184,0.6)" : "rgba(17,24,39,0.12)",
        success: { main: "#16A34A" },
        warning: { main: "#F59E0B" },
        error: { main: "#DC2626" },
      },
        typography: { fontFamily: '"Times New Roman", Times, serif' },
        shape: { borderRadius: 14 },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isDark ? "#020617" : "#F6F6F2",
              color: isDark ? "#F9FAFB" : "#111827",
            },
            "*:focus-visible": {
              outline: "3px solid rgba(59, 130, 246, 0.75)",
              outlineOffset: 2,
              borderRadius: 10,
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: isDark ? "rgba(15,23,42,0.96)" : "rgba(248,250,252,0.9)",
              color: isDark ? "#F9FAFB" : "#111827",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: isDark ? "#020617" : "#FFFFFF",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              border: isDark ? "1px solid rgba(148,163,184,0.5)" : "1px solid rgba(17,24,39,0.10)",
              boxShadow: isDark
                ? "0 16px 40px rgba(0,0,0,0.65)"
                : "0 10px 30px rgba(17,24,39,0.06)",
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 999,
              textTransform: "none",
              boxShadow: "none",
              minHeight: 44,
            },
            containedPrimary: {
              backgroundColor: isDark ? "#E5E7EB" : "#111827",
              color: isDark ? "#020617" : "#F9FAFB",
              "&:hover": {
                backgroundColor: isDark ? "#F9FAFB" : "#020617",
              },
            },
            outlinedPrimary: {
              borderColor: isDark ? "#E5E7EB" : "#111827",
              color: isDark ? "#E5E7EB" : "#111827",
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: 999 },
          },
        },
      },
    });
  }, [colorMode]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

function AuthBootstrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthBootstrapper>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthBootstrapper>
      </QueryClientProvider>
    </AppThemeProvider>
  </StrictMode>,
)
