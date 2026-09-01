import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createBattleApi, joinBattleApi } from "../../api/battleApi";
import { premiumPaywallApi } from "../../api/premiumApi";
import { getApiErrorMessage } from "../../api/http";
import { useDeviceAdapter } from "../../hooks/useDeviceAdapter";

export function BattleHubPage() {
  const navigate = useNavigate();
  const { isPhone } = useDeviceAdapter();
  const [code, setCode] = useState("");
  const paywall = useQuery({ queryKey: ["premium", "paywall"], queryFn: premiumPaywallApi });
  const battle = paywall.data?.battle;

  const createM = useMutation({
    mutationFn: createBattleApi,
    onSuccess: (room) => navigate(`/premium/battle/${room.code}`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const joinM = useMutation({
    mutationFn: joinBattleApi,
    onSuccess: (room) => navigate(`/premium/battle/${room.code}`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Stack spacing={isPhone ? 2 : 3}>
      <Box>
        <Typography variant={isPhone ? "h5" : "h4"} fontWeight={900}>
          Live battle
        </Typography>
        <Typography color="text.secondary">
          Share one exam with friends. Same questions, live progress, highest score wins.
        </Typography>
      </Box>

      <Stack direction={isPhone ? "column" : "row"} gap={2}>
        {battle?.quickDuelEnabled !== false && (
          <Card sx={{ flex: 1, border: "2px solid", borderColor: "primary.main" }}>
            <CardContent>
              <Typography variant="overline" fontWeight={800}>
                1v1 duel
              </Typography>
              <Typography fontWeight={900} sx={{ mt: 0.5 }}>
                Two players, one winner
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {battle?.defaultQuestionCount ?? 10} questions · {Math.round((battle?.durationSeconds ?? 600) / 60)} min
              </Typography>
              <Button
                fullWidth={isPhone}
                variant="contained"
                sx={{ mt: 2, borderRadius: 999, minHeight: 44 }}
                disabled={createM.isPending}
                onClick={() => createM.mutate("duel")}
              >
                Create duel
              </Button>
            </CardContent>
          </Card>
        )}

        {battle?.groupEnabled !== false && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="overline" fontWeight={800}>
                Group exam
              </Typography>
              <Typography fontWeight={900} sx={{ mt: 0.5 }}>
                Up to {battle?.maxPlayers ?? 8} learners
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Perfect for a class or study circle. Ranked by score and speed.
              </Typography>
              <Button
                fullWidth={isPhone}
                variant="outlined"
                sx={{ mt: 2, borderRadius: 999, minHeight: 44 }}
                disabled={createM.isPending}
                onClick={() => createM.mutate("group")}
              >
                Create group
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Typography fontWeight={900}>Join with a code</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ask your friend for the 6-character room code.
          </Typography>
          <Stack direction={isPhone ? "column" : "row"} gap={1}>
            <TextField
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              inputProps={{ maxLength: 6, style: { letterSpacing: 4, fontWeight: 800, textTransform: "uppercase" } }}
              fullWidth
            />
            <Button
              variant="contained"
              sx={{ borderRadius: 999, minHeight: 48, px: 3 }}
              disabled={code.trim().length < 4 || joinM.isPending}
              onClick={() => joinM.mutate(code.trim())}
            >
              Join
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
