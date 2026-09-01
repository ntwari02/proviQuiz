import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  answerBattleApi,
  finishBattleApi,
  getBattleApi,
  startBattleApi,
  type BattleRoom,
} from "../../api/battleApi";
import { getApiErrorMessage } from "../../api/http";
import { useDeviceAdapter } from "../../hooks/useDeviceAdapter";
import { useBattleUiStore } from "../../store/battleUiStore";

function formatTime(seconds: number) {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function PlayerList({ room }: { room: BattleRoom }) {
  return (
    <Stack spacing={1}>
      {room.players.map((p, i) => (
        <Stack key={p.userId} direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography fontWeight={p.isYou ? 900 : 600} noWrap>
            {i + 1}. {p.name}
            {p.isHost ? " · host" : ""}
            {p.isYou ? " · you" : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {room.status === "finished" || p.finished
              ? `${p.score ?? 0} pts · ${p.correctCount ?? 0} correct`
              : `${p.answeredCount}/${room.questionCount}`}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function BattleRoomPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isPhone, isCompactPhone } = useDeviceAdapter();
  const setImmersive = useBattleUiStore((s) => s.setImmersive);
  const [index, setIndex] = useState(0);

  const q = useQuery({
    queryKey: ["battle", code],
    queryFn: () => getBattleApi(code),
    enabled: Boolean(code),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "lobby" || status === "in_progress") return 2000;
      return false;
    },
  });

  const room = q.data;

  useEffect(() => {
    setImmersive(room?.status === "in_progress" && !room.youFinished);
    return () => setImmersive(false);
  }, [room?.status, room?.youFinished, setImmersive]);

  useEffect(() => {
    if (room?.status === "in_progress" && room.remainingSeconds <= 0 && !room.youFinished) {
      void finishBattleApi(code).then((data) => qc.setQueryData(["battle", code], data));
    }
  }, [room?.remainingSeconds, room?.status, room?.youFinished, code, qc]);

  const startM = useMutation({
    mutationFn: () => startBattleApi(code),
    onSuccess: (data) => {
      qc.setQueryData(["battle", code], data);
      setIndex(0);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const finishM = useMutation({
    mutationFn: () => finishBattleApi(code),
    onSuccess: (data) => qc.setQueryData(["battle", code], data),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const current = room?.questions[index];
  const selected = current ? room?.yourAnswers[String(current.id)] : "";
  const answeredCount = useMemo(() => Object.keys(room?.yourAnswers ?? {}).length, [room?.yourAnswers]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code ?? code);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (q.isLoading) return <Typography>Loading battle…</Typography>;
  if (q.isError) return <Typography color="error">{getApiErrorMessage(q.error)}</Typography>;
  if (!room) return null;

  if (room.status === "lobby") {
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant={isPhone ? "h5" : "h4"} fontWeight={900}>
            {room.mode === "group" ? "Group lobby" : "Duel lobby"}
          </Typography>
          <Typography color="text.secondary">Share this code. Everyone gets the same questions when you start.</Typography>
        </Box>
        <Card>
          <CardContent>
            <Stack direction={isPhone ? "column" : "row"} justifyContent="space-between" gap={2} alignItems={{ sm: "center" }}>
              <Box>
                <Typography variant="overline">Room code</Typography>
                <Typography variant="h3" fontWeight={900} letterSpacing={4}>
                  {room.code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {room.players.length}/{room.maxPlayers} players · {room.questionCount} questions
                </Typography>
              </Box>
              <Stack direction="row" gap={1}>
                <Button variant="outlined" onClick={() => void copyCode()} sx={{ borderRadius: 999, minHeight: 44 }}>
                  Copy code
                </Button>
                {room.isHost && (
                  <Button
                    variant="contained"
                    disabled={startM.isPending}
                    onClick={() => startM.mutate()}
                    sx={{ borderRadius: 999, minHeight: 44 }}
                  >
                    Start
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography fontWeight={900} mb={1}>
              Waiting
            </Typography>
            <PlayerList room={room} />
            {!room.isHost && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Waiting for the host to start…
              </Typography>
            )}
          </CardContent>
        </Card>
        <Button onClick={() => navigate("/premium/battle")} sx={{ alignSelf: "flex-start" }}>
          Leave lobby
        </Button>
      </Stack>
    );
  }

  if (room.status === "finished" || room.youFinished) {
    const youWon = room.winner?.userId === room.players.find((p) => p.isYou)?.userId;
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant={isPhone ? "h5" : "h4"} fontWeight={900}>
            {youWon ? "You won" : "Battle results"}
          </Typography>
          {room.winner && (
            <Typography color="text.secondary">
              Winner: {room.winner.name} · {room.winner.score ?? 0} pts
            </Typography>
          )}
        </Box>
        <Card sx={{ border: "2px solid", borderColor: "primary.main" }}>
          <CardContent>
            <PlayerList room={room} />
          </CardContent>
        </Card>
        <Stack direction={isPhone ? "column" : "row"} gap={1}>
          {!room.youFinished && room.status === "in_progress" && (
            <Button variant="contained" onClick={() => finishM.mutate()} sx={{ borderRadius: 999 }}>
              Submit my answers
            </Button>
          )}
          <Button variant="contained" onClick={() => navigate("/premium/battle")} sx={{ borderRadius: 999, minHeight: 44 }}>
            New battle
          </Button>
          <Button variant="outlined" onClick={() => navigate("/premium/analyse")} sx={{ borderRadius: 999, minHeight: 44 }}>
            Analyse
          </Button>
        </Stack>
      </Stack>
    );
  }

  if (!current) {
    return (
      <Stack spacing={2}>
        <CircularProgress />
        <Typography>Preparing questions…</Typography>
      </Stack>
    );
  }

  const letters = ["a", "b", "c", "d"] as const;

  return (
    <Box sx={{ pb: isPhone ? "calc(72px + env(safe-area-inset-bottom))" : 0 }}>
      <Stack spacing={isCompactPhone ? 1.5 : 2}>
        <Card variant="outlined" sx={{ borderRadius: isPhone ? 2 : 0 }}>
          <CardContent sx={{ py: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={900} noWrap>
                  {index + 1} / {room.questions.length}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(answeredCount / room.questions.length) * 100}
                  sx={{ mt: 0.75, height: 6, borderRadius: 999 }}
                />
              </Box>
              <Chip label={formatTime(room.remainingSeconds)} color={room.remainingSeconds <= 30 ? "error" : "default"} />
            </Stack>
          </CardContent>
        </Card>

        {!isCompactPhone && (
          <Card>
            <CardContent sx={{ py: 1 }}>
              <PlayerList room={room} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography fontWeight={800} sx={{ mb: 2, fontSize: isCompactPhone ? "1rem" : undefined }}>
              {current.question}
            </Typography>
            {current.imageUrl && (
              <Box
                component="img"
                src={current.imageUrl}
                alt=""
                sx={{ maxWidth: "100%", maxHeight: isCompactPhone ? 150 : 220, mb: 2, display: "block" }}
              />
            )}
            <RadioGroup
              value={selected ?? ""}
              onChange={(_e, value) => {
                void answerBattleApi(code, current.id, value)
                  .then((data) => qc.setQueryData(["battle", code], data))
                  .catch((err) => toast.error(getApiErrorMessage(err)));
              }}
            >
              <Stack spacing={1}>
                {letters.map((key) => (
                  <Box
                    key={key}
                    sx={{
                      border: "1px solid",
                      borderColor: selected === key ? "primary.main" : "divider",
                      bgcolor: selected === key ? "primary.main" : "transparent",
                      color: selected === key ? "primary.contrastText" : "text.primary",
                      borderRadius: 2,
                      px: 1.5,
                      minHeight: 48,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FormControlLabel
                      value={key}
                      control={
                        <Radio
                          sx={{
                            color: selected === key ? "primary.contrastText" : "primary.main",
                            "&.Mui-checked": { color: selected === key ? "primary.contrastText" : "primary.main" },
                          }}
                        />
                      }
                      label={`${key.toUpperCase()}. ${current.options[key]}`}
                      sx={{ width: "100%", m: 0 }}
                    />
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </CardContent>
        </Card>
      </Stack>

      <Paper
        elevation={isPhone ? 8 : 0}
        sx={
          isPhone
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 12,
                px: 1.5,
                pt: 1,
                pb: "calc(10px + env(safe-area-inset-bottom))",
                display: "flex",
                gap: 1,
                borderRadius: 0,
              }
            : { display: "flex", gap: 1, mt: 2 }
        }
      >
        <Button
          fullWidth={isPhone}
          variant="outlined"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          sx={{ minHeight: 44 }}
        >
          Prev
        </Button>
        <Button
          fullWidth={isPhone}
          variant="outlined"
          disabled={index >= room.questions.length - 1}
          onClick={() => setIndex((i) => Math.min(room.questions.length - 1, i + 1))}
          sx={{ minHeight: 44 }}
        >
          Next
        </Button>
        <Button fullWidth={isPhone} variant="contained" color="secondary" onClick={() => finishM.mutate()} sx={{ minHeight: 44 }}>
          Finish
        </Button>
      </Paper>
    </Box>
  );
}
