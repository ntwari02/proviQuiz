
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowForwardRounded,
  AutoGraphRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  EmojiEventsRounded,
  LocalFireDepartmentRounded,
  MenuBookRounded,
  PlayArrowRounded,
  RouteRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import {
  dailyChallengeApi,
  setExamDateApi,
} from "../api/challengeApi";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";
import { useAuthStore } from "../store/authStore";
import { usePremiumAccess } from "../hooks/usePremiumAccess";

const C = {
  bg: "#080D16",
  surface: "#101825",
  surface2: "#141F2E",
  border: "rgba(148, 163, 184, 0.14)",
  text: "#F4F7FB",
  muted: "#94A3B8",
  teal: "#21D6B0",
  tealDark: "#0C8E7B",
  orange: "#FF922E",
  blue: "#42A5FF",
  green: "#37D99A",
};

function daysUntil(iso?: string | null) {
  if (!iso) return null;

  const exam = new Date(iso);
  if (Number.isNaN(exam.getTime())) return null;

  const now = new Date();
  const a = Date.UTC(
    exam.getFullYear(),
    exam.getMonth(),
    exam.getDate()
  );
  const b = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.ceil((a - b) / 86400000);
}

const panelSx = {
  bgcolor: C.surface,
  color: C.text,
  border: `1px solid ${C.border}`,
  borderRadius: "20px",
  boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        color: C.muted,
      }}
    >
      {children}
    </Typography>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        ...panelSx,
        p: { xs: 2, md: 2.5 },
        minWidth: 0,
        flex: 1,
        transition: "border-color .2s, transform .2s",
        "&:hover": {
          borderColor: `${color}70`,
          transform: "translateY(-3px)",
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        <Eyebrow>{label}</Eyebrow>
        <Box sx={{ color, display: "flex" }}>{icon}</Box>
      </Stack>

      <Typography
        sx={{
          fontSize: { xs: 29, md: 36 },
          fontWeight: 850,
          letterSpacing: "-1.5px",
          mt: 1.5,
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{ color: C.muted, fontSize: 12, mt: 1 }}
      >
        {detail}
      </Typography>
    </Box>
  );
}

function LearningTile({
  number,
  icon,
  label,
  title,
  body,
  action,
  accent,
  onClick,
}: {
  number: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
  action: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        ...panelSx,
        overflow: "hidden",
        position: "relative",
        minWidth: 0,
        transition: "transform .22s, border-color .22s",
        "&:hover": {
          transform: "translateY(-5px)",
          borderColor: `${accent}75`,
        },
        "&:hover .tile-arrow": {
          transform: "translateX(4px)",
        },
      }}
    >
      <Box sx={{ height: 3, bgcolor: accent }} />

      <CardContent
        sx={{
          p: { xs: 2.25, md: 2.75 },
          "&:last-child": { pb: { xs: 2.25, md: 2.75 } },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              color: accent,
              bgcolor: `${accent}15`,
              border: `1px solid ${accent}25`,
            }}
          >
            {icon}
          </Box>

          <Typography
            sx={{
              color: "rgba(148,163,184,.35)",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {number}
          </Typography>
        </Stack>

        <Eyebrow>{label}</Eyebrow>

        <Typography
          sx={{
            fontSize: 21,
            fontWeight: 800,
            mt: 1,
            letterSpacing: "-.5px",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            color: C.muted,
            fontSize: 13,
            lineHeight: 1.8,
            mt: 1,
            minHeight: 46,
          }}
        >
          {body}
        </Typography>

        <Button
          onClick={onClick}
          endIcon={
            <ArrowForwardRounded
              className="tile-arrow"
              sx={{ transition: "transform .2s" }}
            />
          }
          sx={{
            mt: 2.5,
            p: 0,
            minWidth: 0,
            color: accent,
            fontWeight: 800,
            textTransform: "none",
            "&:hover": { bgcolor: "transparent" },
          }}
        >
          {action}
        </Button>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  const { isPhone, isCompactPhone } = useDeviceAdapter();
  const token = useAuthStore((s) => s.token);
  const { isPremium } = usePremiumAccess();
  const qc = useQueryClient();

  const dailyQ = useQuery({
    queryKey: ["daily-challenge"],
    queryFn: dailyChallengeApi,
  });

  const [examInput, setExamInput] = useState("");

  const examM = useMutation({
    mutationFn: setExamDateApi,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["daily-challenge"],
      });
    },
  });

  const daily = dailyQ.data;
  const left = daysUntil(daily?.examDate);

  const countdown =
    left === null
      ? "—"
      : left < 0
        ? "Passed"
        : left === 0
          ? "Today"
          : `${left} days`;

  const nationalResult = daily?.result;
  const dailyScore =
    daily?.completed &&
    nationalResult?.total
      ? Math.round(
          (nationalResult.correctCount / nationalResult.total) * 100
        )
      : null;

  const streak = daily?.streak ?? 0;

  return (
    <Box
      sx={{
        color: C.text,
        minHeight: "100%",
        pb: { xs: 3, md: 5 },
        "& *": { boxSizing: "border-box" },
      }}
    >
      <Stack spacing={{ xs: 3, md: 4 }}>
        {/* PAGE INTRO */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Eyebrow>YOUR DRIVING JOURNEY</Eyebrow>

            <Typography
              sx={{
                fontSize: { xs: 27, md: 34 },
                fontWeight: 850,
                letterSpacing: "-1.3px",
                mt: 0.75,
              }}
            >
              Build skill. Earn confidence.
            </Typography>

            <Typography
              sx={{ color: C.muted, mt: 0.75, fontSize: 14 }}
            >
              Everything you need to prepare for the road ahead.
            </Typography>
          </Box>

          <Chip
            icon={
              <CheckCircleRounded
                sx={{ color: `${C.teal} !important` }}
              />
            }
            label="Rwanda driving theory"
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              color: C.text,
              bgcolor: C.surface,
              border: `1px solid ${C.border}`,
              height: 38,
              "& .MuiChip-label": { px: 1.25, fontWeight: 700 },
            }}
          />
        </Stack>

        {/* CINEMATIC HERO */}
        <Box
          sx={{
            position: "relative",
            isolation: "isolate",
            overflow: "hidden",
            borderRadius: { xs: "22px", md: "28px" },
            border: `1px solid rgba(45,212,191,.22)`,
            background:
              "linear-gradient(115deg, #0C1C2A 0%, #103C3B 55%, #10242F 100%)",
          }}
        >
          {!isCompactPhone && (
            <Box
              component="video"
              src="/A Person Driving a Car · Free Stock Video.mp4"
              autoPlay
              muted
              loop
              playsInline
              aria-label="Scenic driving footage"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: -2,
                opacity: 0.46,
              }}
            />
          )}

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: -1,
              background: {
                xs: "linear-gradient(100deg, rgba(5,17,28,.97), rgba(7,37,42,.88))",
                md: "linear-gradient(90deg, #081723 0%, rgba(8,28,39,.97) 43%, rgba(8,37,42,.48) 100%)",
              },
            }}
          />

          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5, md: 5 },
              maxWidth: 720,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ color: C.teal }}
            >
              <RouteRounded fontSize="small" />

              <Eyebrow>THE ROAD TO YOUR LICENCE</Eyebrow>
            </Stack>

            <Typography
              sx={{
                fontSize: {
                  xs: 36,
                  sm: 48,
                  md: 58,
                },
                fontWeight: 900,
                lineHeight: 1.04,
                letterSpacing: "-2.4px",
                mt: 2.5,
              }}
            >
              Pass with a habit,
              <Box component="span" display="block" color={C.teal}>
                not luck.
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "#C1D0DA",
                mt: 2,
                maxWidth: 480,
                lineHeight: 1.8,
                fontSize: { xs: 14, md: 16 },
              }}
            >
              Practice the theory. Understand the rules.
              Walk into your driving exam prepared.
            </Typography>

            <Stack
              direction="row"
              flexWrap="wrap"
              gap={1}
              sx={{ mt: 2.5 }}
            >
              {["20 questions", "20 minutes", "Free mock"].map((item) => (
                <Box
                  key={item}
                  sx={{
                    border: "1px solid rgba(255,255,255,.17)",
                    bgcolor: "rgba(255,255,255,.055)",
                    px: 1.5,
                    py: 0.8,
                    borderRadius: "8px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#DDE8ED",
                  }}
                >
                  {item}
                </Box>
              ))}
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1.5}
              sx={{ mt: 3.5 }}
            >
              <Button
                onClick={() => navigate("/exam")}
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                fullWidth={isPhone}
                sx={{
                  minHeight: 52,
                  px: 3,
                  borderRadius: "12px",
                  bgcolor: C.orange,
                  color: "#211306",
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: "0 8px 28px rgba(255,146,46,.18)",
                  "&:hover": {
                    bgcolor: "#FFAB50",
                    transform: "translateY(-1px)",
                  },
                  transition: "all .2s",
                }}
              >
                Start free mock
              </Button>

              <Button
                onClick={() =>
                  navigate(token ? "/daily" : "/register")
                }
                variant="outlined"
                fullWidth={isPhone}
                sx={{
                  minHeight: 52,
                  px: 3,
                  borderRadius: "12px",
                  borderColor: "rgba(255,255,255,.28)",
                  color: C.text,
                  fontWeight: 750,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: C.teal,
                    bgcolor: "rgba(33,214,176,.07)",
                  },
                }}
              >
                {token ? "Today's challenge" : "Create free account"}
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              position: "absolute",
              right: { md: 28 },
              bottom: { md: 28 },
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(8,17,28,.8)",
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              p: 1.5,
              backdropFilter: "blur(12px)",
            }}
          >
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "rgba(33,214,176,.12)",
                color: C.teal,
              }}
            >
              <MenuBookRounded />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                Small steps. Real progress.
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.muted }}>
                Practice every day.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* PERSONAL DASHBOARD */}
        {token && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.75 }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                Your dashboard
              </Typography>

              <Typography sx={{ color: C.muted, fontSize: 12 }}>
                YOUR ACTIVITY
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <Metric
                icon={<LocalFireDepartmentRounded />}
                label="Daily streak"
                value={`${streak}`}
                detail={`Best streak: ${daily?.longestStreak ?? 0} days`}
                color={C.orange}
              />

              <Metric
                icon={<CalendarMonthRounded />}
                label="Exam countdown"
                value={countdown}
                detail={
                  left !== null && left < 0
                    ? "Set a new exam date when ready"
                    : "Keep your preparation on track"
                }
                color={C.blue}
              />

              <Metric
                icon={<EmojiEventsRounded />}
                label="Today's result"
                value={
                  dailyScore !== null
                    ? `${dailyScore}%`
                    : daily?.completed
                      ? "Done"
                      : "Pending"
                }
                detail={
                  daily?.completed
                    ? `${nationalResult?.correctCount ?? 0} of ${nationalResult?.total ?? 0} correct`
                    : "Complete today's five questions"
                }
                color={C.teal}
              />
            </Box>

            {/* EXAM DATE */}
            <Card
              elevation={0}
              sx={{ ...panelSx, mt: 1.5 }}
            >
              <CardContent
                sx={{
                  p: { xs: 2, md: 2.5 },
                  "&:last-child": { pb: { xs: 2, md: 2.5 } },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Box>
                    <Typography fontWeight={800}>
                      Set your exam date
                    </Typography>
                    <Typography
                      sx={{ color: C.muted, fontSize: 13, mt: 0.5 }}
                    >
                      Give your preparation a target to work towards.
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    gap={1}
                    sx={{ width: { xs: "100%", sm: "auto" } }}
                  >
                    <TextField
                      type="date"
                      size="small"
                      value={examInput}
                      onChange={(e) => setExamInput(e.target.value)}
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          min: new Date().toLocaleDateString("en-CA"),
                        },
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        "& .MuiOutlinedInput-root": {
                          color: C.text,
                          borderRadius: "10px",
                          bgcolor: C.surface2,
                          "& fieldset": {
                            borderColor: C.border,
                          },
                        },
                        "& input::-webkit-calendar-picker-indicator": {
                          filter: "invert(1)",
                        },
                      }}
                    />

                    <Button
                      variant="contained"
                      disabled={!examInput || examM.isPending}
                      onClick={() => examM.mutate(examInput || null)}
                      sx={{
                        px: 2.5,
                        borderRadius: "10px",
                        bgcolor: C.teal,
                        color: "#05231F",
                        fontWeight: 850,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#58E8CA" },
                      }}
                    >
                      {examM.isPending ? "Saving..." : "Save"}
                    </Button>
                  </Stack>
                </Stack>

                {examM.isError && (
                  <Typography
                    role="alert"
                    sx={{ mt: 1.5, color: "#FF7B83", fontSize: 13 }}
                  >
                    Couldn't save your exam date. Please try again.
                  </Typography>
                )}

                {examM.isSuccess && (
                  <Typography
                    role="status"
                    sx={{ mt: 1.5, color: C.teal, fontSize: 13 }}
                  >
                    Exam date updated.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* LEARNING PATHS */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Eyebrow>CHOOSE YOUR NEXT MOVE</Eyebrow>
              <Typography
                sx={{
                  fontSize: { xs: 23, md: 28 },
                  fontWeight: 850,
                  letterSpacing: "-.8px",
                  mt: 0.75,
                }}
              >
                Train with purpose.
              </Typography>
            </Box>

            <Typography
              sx={{
                color: C.muted,
                fontSize: 12,
                display: { xs: "none", sm: "block" },
              }}
            >
              YOUR LEARNING PATH
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1.75,
            }}
          >
            <LearningTile
              number="01"
              icon={<PlayArrowRounded />}
              label="FREE · TIMED PRACTICE"
              title="Mock exam"
              body="20 questions. 20 minutes. Practise under exam conditions and build confidence."
              action="Start mock"
              accent={C.orange}
              onClick={() => navigate("/exam")}
            />

            <LearningTile
              number="02"
              icon={<LocalFireDepartmentRounded />}
              label="DAILY · BUILD A HABIT"
              title="Today's 5"
              body={
                daily?.completed
                  ? `Today's challenge is complete. You scored ${dailyScore ?? 0}%.`
                  : "Five shared questions every day. Keep showing up and build your streak."
              }
              action={
                daily?.completed
                  ? "View challenge"
                  : token
                    ? "Play today's 5"
                    : "Sign in to play"
              }
              accent={C.teal}
              onClick={() =>
                navigate(
                  token ? "/daily" : "/login?redirect=/daily"
                )
              }
            />

            <LearningTile
              number="03"
              icon={<WorkspacePremiumRounded />}
              label={isPremium ? "PREMIUM · UNLOCKED" : "LEVEL UP"}
              title={isPremium ? "Live battle" : "Premium tools"}
              body={
                isPremium
                  ? "Challenge another learner. Same exam, shared code, highest score wins."
                  : "Explore Analyse, smart practice, and battles. Check which tools are available to you."
              }
              action={isPremium ? "Open battle" : "Explore Premium"}
              accent={C.blue}
              onClick={() =>
                navigate(
                  isPremium ? "/premium/battle" : "/premium"
                )
              }
            />
          </Box>
        </Box>

        {/* CLOSING BRAND STRIP */}
        <Box
          sx={{
            borderTop: `1px solid ${C.border}`,
            pt: 2.5,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <AutoGraphRounded sx={{ color: C.teal }} />
              <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
                PROVQUIZ
              </Typography>
            </Stack>

            <Typography
              sx={{
                color: C.muted,
                fontSize: 11,
                textAlign: "right",
              }}
            >
              Learn the rules. Own the road.
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
