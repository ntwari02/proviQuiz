import { AppBar, Box, Button, Container, IconButton, Tooltip, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, useMediaQuery, Menu, MenuItem, Divider, Grow, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { NavLink } from "react-router-dom";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
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
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    setUserMenuAnchor(null);
    logout();
  };

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Start Exam", to: "/exam" },
    { label: "Demo", to: "/demo" },
  ];

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

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
            {/* Left: logo */}
            <Box component={NavLink} to="/" sx={{ textDecoration: "none", color: "inherit" }}>
              <Typography fontWeight={900} letterSpacing={-0.5}>
                PROVIQUIZ
              </Typography>
            </Box>

            {/* Center: main navigation (desktop only) */}
            {!isMobile && (
              <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1, justifyContent: "center" }}>
                {navItems.map((item) => (
                  <Button
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    variant={item.to === "/exam" ? "outlined" : "text"}
                    sx={linkSx}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Right: user, auth actions, theme, mobile menu */}
            <Box display="flex" alignItems="center" gap={1}>
              {!isMobile &&
                (!token ? (
                  <>
                    <Button component={NavLink} to="/login" variant="text" sx={linkSx}>
                      Sign in
                    </Button>
                    <Button component={NavLink} to="/register" variant="contained" sx={linkSx}>
                      Create account
                    </Button>
                  </>
                ) : (
                  <>
                    <Tooltip title="User menu">
                      <IconButton
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        sx={{ border: "1px solid", borderColor: "divider" }}
                      >
                        <AccountCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={() => setUserMenuAnchor(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                      TransitionComponent={Grow}
                      TransitionProps={{ timeout: 200 }}
                      PaperProps={{
                        sx: {
                          minWidth: 280,
                          maxWidth: 320,
                          mt: 1,
                          borderRadius: 0,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          overflow: "hidden",
                          "& .MuiMenuItem-root": {
                            px: 2.5,
                            py: 1.25,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              bgcolor: "action.hover",
                              transform: "translateX(4px)",
                            },
                            "&:disabled": {
                              opacity: 1,
                              "&:hover": {
                                transform: "none",
                              },
                            },
                          },
                          "& .MuiDivider-root": {
                            my: 0.5,
                          },
                        },
                      }}
                    >
                      <MenuItem component={NavLink} to="/" onClick={() => setUserMenuAnchor(null)}>
                        Home
                      </MenuItem>
                      <MenuItem component={NavLink} to="/exam" onClick={() => setUserMenuAnchor(null)}>
                        Start Exam
                      </MenuItem>
                      <MenuItem component={NavLink} to="/demo" onClick={() => setUserMenuAnchor(null)}>
                        Demo
                      </MenuItem>
                      {isAdmin && (
                        <MenuItem component={NavLink} to="/admin" onClick={() => setUserMenuAnchor(null)}>
                          Admin
                        </MenuItem>
                      )}
                      <Divider />
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {user?.name || user?.email || "Account"}
                        </Typography>
                      </MenuItem>
                      <MenuItem disabled>
                        <Typography variant="caption" color="text.secondary">
                          Role: {user?.role || "N/A"}
                        </Typography>
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={() => {
                          setUserMenuAnchor(null);
                          setLogoutDialogOpen(true);
                        }}
                        sx={{
                          "&:hover": {
                            bgcolor: "error.light",
                            color: "error.contrastText",
                          },
                        }}
                      >
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ))}

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
                if (item.to === "#logout") setLogoutDialogOpen(true);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title" sx={{ fontWeight: 700 }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to logout? You will need to sign in again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleLogoutConfirm} variant="contained" color="error" sx={{ textTransform: "none" }} autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

