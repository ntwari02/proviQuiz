import { Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
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
import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const drawerWidth = 260;

export function AdminLayout() {
  const [open, setOpen] = useState(false);

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
    <Box sx={{ display: "flex", gap: 0 }}>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton aria-label="Open admin navigation" onClick={() => setOpen(true)} sx={{ position: "fixed", bottom: 18, right: 18, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <MenuIcon />
        </IconButton>
        <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: drawerWidth } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Drawer
          variant="permanent"
          PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box", borderRight: "1px solid", borderColor: "divider" } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: `${drawerWidth}px` } }}>
        <Box sx={{ width: "100%", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

