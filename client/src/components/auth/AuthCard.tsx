import type { ReactNode } from "react";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        mx: "auto",
      }}
    >
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.3}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>{children}</Box>

          {footer && (
            <>
              <Divider sx={{ my: 3 }} />
              {footer}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

