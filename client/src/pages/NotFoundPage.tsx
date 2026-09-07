import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>
        Page not found
      </Typography>
      <Typography color="text.secondary">
        That link is missing. Premium lives at /premium — it is not a separate website.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
        <Button onClick={() => navigate("/")} variant="contained">
          Home
        </Button>
        <Button onClick={() => navigate("/exam")} variant="outlined">
          Start exam
        </Button>
        <Button onClick={() => navigate("/premium")} variant="outlined">
          Premium
        </Button>
      </Stack>
    </Stack>
  );
}
