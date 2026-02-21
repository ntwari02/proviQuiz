import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

export function Footer() {
  return (
    <Box component="footer" sx={{ mt: 8 }}>
      <Divider />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography fontWeight={800}>PROVIQUIZ</Typography>
            <Typography variant="body2" color="text.secondary">
              Practice Rwanda driving theory exam with timed mock tests and instant review.
            </Typography>
          </Box>

          <Stack direction="row" gap={2} flexWrap="wrap">
            <Link component={NavLink} to="/" underline="hover" color="inherit">
              Home
            </Link>
            <a
  href="https://t.me/ProviQuiz_bot"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-5 right-5 z-50
             flex items-center gap-2
             px-4 py-3 rounded-full
             bg-[#229ED9] hover:bg-[#1b8fc6]
             text-white font-semibold
             shadow-2xl
             transition-all duration-200
             hover:scale-110"
>
  💬 Telegram
</a>
            <Link component={NavLink} to="/exam" underline="hover" color="inherit">
              Exam
            </Link>
            <Link component={NavLink} to="/demo" underline="hover" color="inherit">
              Demo
            </Link>
          </Stack>
        </Stack>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} PROVIQUIZ. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

