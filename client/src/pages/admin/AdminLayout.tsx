import { Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, Menu, MenuItem, Tooltip, Grow, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import CategoryIcon from "@mui/icons-material/Category";
import LayersIcon from "@mui/icons-material/Layers";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";

const drawerWidth = 260;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const colorMode = useUiStore((s) => s.colorMode);
  const toggleColorMode = useUiStore((s) => s.toggleColorMode);

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    setUserMenuAnchor(null);
    logout();
  };

  const items = useMemo(
    () => [
      { label: "Overview", to: "/admin", icon: <DashboardOutlinedIcon /> },
      { label: "Users", to: "/admin/users", icon: <PeopleOutlineIcon /> },
      { label: "Exams", to: "/admin/exams", icon: <ReceiptLongOutlinedIcon /> },
      { label: "Questions", to: "/admin/questions", icon: <QuizOutlinedIcon /> },
      { label: "Categories & Topics", to: "/admin/categories", icon: <CategoryIcon /> },
      { label: "Increments", to: "/admin/increments", icon: <LayersIcon /> },
      { label: "Exam Config", to: "/admin/exam-config", icon: <AssignmentIcon /> },
      { label: "Analytics", to: "/admin/analytics", icon: <AnalyticsIcon /> },
      { label: "Bulk Import/Export", to: "/admin/bulk", icon: <FileUploadIcon /> },
      { label: "Settings", to: "/admin/settings", icon: <SettingsIcon /> },
    ],
    []
  );

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 2 }}>
        <Typography fontWeight={900}>Admin</Typography>
      </Toolbar>
      <Divider />
      <List>
        {items.map((i) => (
          <ListItemButton key={i.to} component={NavLink} to={i.to} onClick={() => setOpen(false)}>
            <ListItemIcon>{i.icon}</ListItemIcon>
            <ListItemText primary={i.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: "flex", 
        minHeight: "100vh", 
        width: "100%", 
        overflow: "hidden", 
        position: "relative",
        "& footer": {
          display: "none !important"
        }
      }}
    >
      {/* Sidebar - Mobile Drawer */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Drawer 
          anchor="left"
          open={open} 
          onClose={() => setOpen(false)} 
          PaperProps={{ sx: { width: drawerWidth } }}
          ModalProps={{
            keepMounted: true,
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Fixed Sidebar - Desktop */}
      <Box sx={{ display: { xs: "none", md: "block" }, position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 1200 }}>
        <Drawer
          variant="permanent"
          PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box", borderRight: "1px solid", borderColor: "divider" } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content area - starts exactly where sidebar ends, fills to page end */}
      <Box 
        sx={{ 
          flex: 1, 
          minWidth: 0, 
          ml: { xs: 0, md: `${drawerWidth}px` }, 
          display: "flex", 
          flexDirection: "column",
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh"
        }}
      >
        {/* Header - starts from sidebar end, spans full remaining width */}
        <AppBar 
          position="sticky" 
          elevation={0} 
          color="transparent" 
          sx={{ 
            backdropFilter: "blur(10px)", 
            zIndex: 1100,
            width: "100%"
          }}
        >
          <Toolbar sx={{ borderBottom: "1px solid", borderColor: "divider", px: { xs: 2, sm: 3 } }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} width="100%">
              <Box display="flex" alignItems="center" gap={1}>
                {/* Menu icon for mobile - shows sidebar */}
                <IconButton
                  aria-label="Open admin navigation"
                  onClick={() => setOpen(true)}
                  sx={{ display: { xs: "block", md: "none" }, mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
                <Box component={NavLink} to="/" sx={{ textDecoration: "none", color: "inherit" }}>
                  <Typography fontWeight={900} letterSpacing={-0.5}>
                    PROVIQUIZ
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Tooltip title={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                  <IconButton
                    aria-label="Toggle color mode"
                    onClick={toggleColorMode}
                    sx={{ border: "1px solid", borderColor: "divider" }}
                  >
                    {colorMode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
                  </IconButton>
                </Tooltip>
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
                  <MenuItem component={NavLink} to="/admin" onClick={() => setUserMenuAnchor(null)}>
                    Admin
                  </MenuItem>
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
                      logout();
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
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content - full width from sidebar end to page end, no footer */}
        <Box 
          component="main"
          sx={{ 
            flex: 1, 
            width: "100%", 
            px: { xs: 2, md: 3 }, 
            py: { xs: 2, md: 3 },
            overflow: "auto",
            bgcolor: "background.default",
            minHeight: 0, // Allow flex child to shrink
            "& footer": {
              display: "none !important" // Hide any footer that might appear
            }
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Toaster position="top-right" />
    </Box>
  );
}

