import { AppBar, Box, Button, Container, IconButton, Tooltip, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, useMediaQuery } from "@mui/material";
import { NavLink } from "react-router-dom";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useUiStore } from "../store/uiStore";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

const linkSx = {
  textTransform: "none",
  borderRadius: 999,
} as const;

export function Header() {
  const colorMode = useUiStore((s) => s.colorMode);
  const toggleColorMode = useUiStore((s) => s.toggleColorMode);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Start Exam", to: "/exam" },
    { label: "Demo", to: "/demo" },
  ];

  const authItems = token
    ? [{ label: "Logout", to: "#logout" }]
    : [
        { label: "Sign in", to: "/login" },
        { label: "Create account", to: "/register" },
      ];

  return (
    <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(10px)" }}>
      <Toolbar sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box component={NavLink} to="/" sx={{ textDecoration: "none", color: "inherit" }}>
              <Typography fontWeight={900} letterSpacing={-0.5}>
                PROVIQUIZ
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {!isMobile && (
                <>
                  {navItems.map((item) => (
                    <Button key={item.to} component={NavLink} to={item.to} variant={item.to === "/exam" ? "outlined" : "text"} sx={linkSx}>
                      {item.label}
                    </Button>
                  ))}

                  <Box sx={{ width: 10 }} />

                  {token && (
                    <Typography variant="body2" sx={{ px: 1.5, fontWeight: 800 }} noWrap>
                      {user?.name || user?.email || "Account"}
                    </Typography>
                  )}

                  {!token ? (
                    <>
                      <Button component={NavLink} to="/login" variant="text" sx={linkSx}>
                        Sign in
                      </Button>
                      <Button component={NavLink} to="/register" variant="contained" sx={linkSx}>
                        Create account
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      sx={linkSx}
                      onClick={() => {
                        logout();
                      }}
                    >
                      Logout
                    </Button>
                  )}
                </>
              )}

              <Tooltip title={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton
                  aria-label="Toggle color mode"
                  onClick={toggleColorMode}
                  sx={{ ml: 0.5, border: "1px solid", borderColor: "divider" }}
                >
                  {colorMode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
                </IconButton>
              </Tooltip>

              {isMobile && (
                <IconButton aria-label="Open navigation" onClick={() => setOpen(true)} sx={{ ml: 0.5 }}>
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Box>
        </Container>
      </Toolbar>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.5}>
          <Typography fontWeight={900}>PROVIQUIZ</Typography>
          <IconButton aria-label="Close navigation" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}

          {token && (
            <Box px={2} pt={1} pb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Signed in as
              </Typography>
              <Typography variant="body2" fontWeight={800} noWrap>
                {user?.name || user?.email || "Account"}
              </Typography>
            </Box>
          )}

          {authItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={item.to === "#logout" ? "button" : (NavLink as any)}
              to={item.to === "#logout" ? undefined : item.to}
              onClick={() => {
                setOpen(false);
                if (item.to === "#logout") logout();
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
}

