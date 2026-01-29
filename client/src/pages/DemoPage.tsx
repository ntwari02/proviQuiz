import { Card, CardContent, Stack, Typography } from "@mui/material";

export function DemoPage() {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4" fontWeight={900} letterSpacing={-0.5}>
          Demo
        </Typography>
        <Typography color="text.secondary">Quick preview of how the quiz experience will look.</Typography>
      </div>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={800}>Sample questions (placeholder)</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            When you see a stop sign, what must you do?
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

