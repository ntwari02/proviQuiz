import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h4" fontWeight={900} letterSpacing={-0.5}>
        Page not found
      </Typography>
      <Typography color="text.secondary">The page you’re looking for doesn’t exist.</Typography>
      <Button onClick={() => navigate("/")} variant="contained" sx={{ borderRadius: 999, textTransform: "none" }}>
        Go home
      </Button>
    </Stack>
  );
}

