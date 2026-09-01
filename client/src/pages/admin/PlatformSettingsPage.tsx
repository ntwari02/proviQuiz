import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  adminPlatformSettingsApi,
  adminUpdatePlatformSettingsApi,
  type PlatformSettings,
} from "../../api/adminPremiumApi";
import { getApiErrorMessage } from "../../api/http";

const FEATURE_LABELS: Record<string, string> = {
  analyse: "Analyse",
  learn: "Learn",
  smartPractice: "Smart Practice",
  roadSignAcademy: "Road Sign Academy",
  scenarioLearning: "Scenario Learning",
  spacedRepetition: "Spaced Repetition",
  learningJourney: "Learning Journey",
  myMistakes: "My Mistakes",
  autoEcole: "Auto-école",
  battle: "Battle & Compete",
  leaderboard: "Leaderboards",
};

export function PlatformSettingsPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "platform-settings"], queryFn: adminPlatformSettingsApi });

  const form = useForm<PlatformSettings>();

  useEffect(() => {
    if (query.data) form.reset(query.data);
  }, [query.data, form]);

  const mutation = useMutation({
    mutationFn: adminUpdatePlatformSettingsApi,
    onSuccess: (data) => {
      qc.setQueryData(["admin", "platform-settings"], data);
      toast.success("Platform settings saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (query.isLoading) return <Typography>Loading platform settings…</Typography>;
  if (query.isError) return <Typography color="error">{getApiErrorMessage(query.error)}</Typography>;

  const onSubmit = (values: PlatformSettings) => mutation.mutate(values);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={3} gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={900}>Platform settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure readiness, battles, leaderboards, smart practice, paywall, and feature flags without deploying code.
          </Typography>
        </Box>
        <Chip label="Admin configurable" variant="outlined" />
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes here affect Premium features globally. The free exam experience is not modified by these settings.
      </Alert>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {/* Paywall */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Paywall messaging</Typography>
              <Stack spacing={2}>
                <TextField label="Headline" {...form.register("paywall.headline")} fullWidth />
                <TextField label="Subheadline" {...form.register("paywall.subheadline")} fullWidth multiline rows={2} />
                <TextField
                  label="Bullet points (one per line)"
                  value={(form.watch("paywall.bulletPoints") ?? []).join("\n")}
                  onChange={(e) => form.setValue("paywall.bulletPoints", e.target.value.split("\n").filter(Boolean))}
                  fullWidth
                  multiline
                  rows={6}
                />
                <TextField label="CTA label" {...form.register("paywall.ctaLabel")} fullWidth />
                <TextField label="Story headline" {...form.register("paywall.storyHeadline")} fullWidth />
                <TextField label="How to get Premium (hint)" {...form.register("paywall.requestHint")} fullWidth multiline rows={2} />
                <TextField label="Featured plan slug" {...form.register("paywall.featuredPlanSlug")} fullWidth helperText="Must match a plan slug, e.g. monthly" />
                <TextField
                  label="Social proof (one per line)"
                  value={(form.watch("paywall.socialProof") ?? []).join("\n")}
                  onChange={(e) => form.setValue("paywall.socialProof", e.target.value.split("\n").filter(Boolean))}
                  fullWidth
                  multiline
                  rows={4}
                />
                <TextField
                  label="Free column (one per line)"
                  value={(form.watch("paywall.freeList") ?? []).join("\n")}
                  onChange={(e) => form.setValue("paywall.freeList", e.target.value.split("\n").filter(Boolean))}
                  fullWidth
                  multiline
                  rows={4}
                />
                <TextField
                  label="Premium column (one per line)"
                  value={(form.watch("paywall.premiumList") ?? []).join("\n")}
                  onChange={(e) => form.setValue("paywall.premiumList", e.target.value.split("\n").filter(Boolean))}
                  fullWidth
                  multiline
                  rows={4}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Premium feature flags */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Premium feature toggles</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        checked={Boolean(form.watch(`premiumFeatures.${key}` as any))}
                        onChange={(e) => form.setValue(`premiumFeatures.${key}` as any, e.target.checked)}
                      />
                    }
                    label={label}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Readiness */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Readiness score formula (%)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} gap={2} flexWrap="wrap">
                <TextField label="Recent performance" type="number" {...form.register("readiness.recentPerformanceWeight", { valueAsNumber: true })} />
                <TextField label="Topic mastery" type="number" {...form.register("readiness.topicMasteryWeight", { valueAsNumber: true })} />
                <TextField label="Consistency" type="number" {...form.register("readiness.consistencyWeight", { valueAsNumber: true })} />
                <TextField label="Mistake recovery" type="number" {...form.register("readiness.mistakeRecoveryWeight", { valueAsNumber: true })} />
                <TextField label="Mock performance" type="number" {...form.register("readiness.mockPerformanceWeight", { valueAsNumber: true })} />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={800} mb={1}>Band thresholds (max score for band)</Typography>
              <Stack direction="row" gap={2} flexWrap="wrap">
                <TextField label="Beginner max" type="number" {...form.register("readiness.bandBeginnerMax", { valueAsNumber: true })} />
                <TextField label="Learning max" type="number" {...form.register("readiness.bandLearningMax", { valueAsNumber: true })} />
                <TextField label="Improving max" type="number" {...form.register("readiness.bandImprovingMax", { valueAsNumber: true })} />
                <TextField label="Strong max" type="number" {...form.register("readiness.bandStrongMax", { valueAsNumber: true })} />
              </Stack>
            </CardContent>
          </Card>

          {/* Battle */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Battle & competition</Typography>
              <FormControlLabel control={<Switch {...form.register("battle.enabled")} checked={form.watch("battle.enabled")} />} label="Battles enabled" />
              <Stack direction={{ xs: "column", sm: "row" }} gap={2} flexWrap="wrap" mt={2}>
                <TextField label="Max battles / day" type="number" {...form.register("battle.maxBattlesPerDay", { valueAsNumber: true })} />
                <TextField label="Default questions" type="number" {...form.register("battle.defaultQuestionCount", { valueAsNumber: true })} />
                <TextField label="Min questions for ranking" type="number" {...form.register("battle.minQuestionsForRanking", { valueAsNumber: true })} />
                <TextField label="Challenge expiry (hours)" type="number" {...form.register("battle.challengeExpiryHours", { valueAsNumber: true })} />
                <TextField label="Points correct" type="number" {...form.register("battle.pointsCorrect", { valueAsNumber: true })} />
                <TextField label="Speed bonus" type="number" {...form.register("battle.pointsSpeedBonus", { valueAsNumber: true })} />
                <TextField label="Max players (group)" type="number" {...form.register("battle.maxPlayers", { valueAsNumber: true })} />
                <TextField label="Min players to start" type="number" {...form.register("battle.minPlayers", { valueAsNumber: true })} />
                <TextField label="Battle duration (seconds)" type="number" {...form.register("battle.durationSeconds", { valueAsNumber: true })} />
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>
                <FormControlLabel control={<Switch {...form.register("battle.quickDuelEnabled")} checked={form.watch("battle.quickDuelEnabled")} />} label="Quick Duel" />
                <FormControlLabel control={<Switch {...form.register("battle.friendChallengeEnabled")} checked={form.watch("battle.friendChallengeEnabled")} />} label="Friend Challenge" />
                <FormControlLabel control={<Switch {...form.register("battle.topicBattleEnabled")} checked={form.watch("battle.topicBattleEnabled")} />} label="Topic Battle" />
                <FormControlLabel control={<Switch {...form.register("battle.weeklyArenaEnabled")} checked={form.watch("battle.weeklyArenaEnabled")} />} label="Weekly Arena" />
                <FormControlLabel control={<Switch checked={Boolean(form.watch("battle.groupEnabled"))} onChange={(e) => form.setValue("battle.groupEnabled", e.target.checked)} />} label="Group battles" />
                <FormControlLabel control={<Switch {...form.register("battle.consumeExamQuota")} checked={form.watch("battle.consumeExamQuota")} />} label="Battles consume exam quota" />
              </Stack>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Leaderboards</Typography>
              <FormControlLabel control={<Switch {...form.register("leaderboard.enabled")} checked={form.watch("leaderboard.enabled")} />} label="Leaderboards enabled" />
              <FormControlLabel control={<Switch {...form.register("leaderboard.optInRequired")} checked={form.watch("leaderboard.optInRequired")} />} label="Opt-in required" />
              <Stack direction="row" gap={2} flexWrap="wrap" mt={2}>
                <TextField label="Improvement weight %" type="number" {...form.register("leaderboard.improvementWeight", { valueAsNumber: true })} />
                <TextField label="Mastery weight %" type="number" {...form.register("leaderboard.masteryWeight", { valueAsNumber: true })} />
                <TextField label="Consistency weight %" type="number" {...form.register("leaderboard.consistencyWeight", { valueAsNumber: true })} />
                <TextField label="Max points / day" type="number" {...form.register("leaderboard.maxPointsPerDay", { valueAsNumber: true })} />
              </Stack>
            </CardContent>
          </Card>

          {/* Smart practice + mastery bands */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Smart practice & mastery</Typography>
              <Stack direction="row" gap={2} flexWrap="wrap">
                <TextField label="Mistake weight" type="number" {...form.register("smartPracticeMistakeWeight", { valueAsNumber: true })} />
                <TextField label="Weak topic weight" type="number" {...form.register("smartPracticeWeakTopicWeight", { valueAsNumber: true })} />
                <TextField label="New question weight" type="number" {...form.register("smartPracticeNewQuestionWeight", { valueAsNumber: true })} />
                <TextField label="Mastered weight" type="number" {...form.register("smartPracticeMasteredWeight", { valueAsNumber: true })} />
                <TextField label="Daily plan max (min)" type="number" {...form.register("dailyPlanMaxMinutes", { valueAsNumber: true })} />
              </Stack>
            </CardContent>
          </Card>

          {/* Daily challenge */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>National daily challenge</Typography>
              <FormControlLabel control={<Switch checked={Boolean(form.watch("dailyChallenge.enabled"))} onChange={(e) => form.setValue("dailyChallenge.enabled", e.target.checked)} />} label="Enabled" />
              <FormControlLabel control={<Switch checked={Boolean(form.watch("dailyChallenge.explanationsPremiumOnly"))} onChange={(e) => form.setValue("dailyChallenge.explanationsPremiumOnly", e.target.checked)} />} label="Explanations Premium-only" />
              <FormControlLabel control={<Switch checked={Boolean(form.watch("dailyChallenge.boardEnabled"))} onChange={(e) => form.setValue("dailyChallenge.boardEnabled", e.target.checked)} />} label="National board" />
              <TextField sx={{ mt: 2 }} label="Questions per day" type="number" {...form.register("dailyChallenge.questionCount", { valueAsNumber: true })} />
            </CardContent>
          </Card>

          {/* Gamification */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900} mb={2}>Gamification</Typography>
              <FormControlLabel control={<Switch {...form.register("gamification.enabled")} checked={form.watch("gamification.enabled")} />} label="Gamification enabled" />
              <FormControlLabel control={<Switch {...form.register("gamification.streakEnabled")} checked={form.watch("gamification.streakEnabled")} />} label="Streaks" />
              <FormControlLabel control={<Switch {...form.register("gamification.achievementsEnabled")} checked={form.watch("gamification.achievementsEnabled")} />} label="Achievements" />
            </CardContent>
          </Card>

          <Button type="submit" variant="contained" disabled={mutation.isPending} sx={{ alignSelf: "flex-start", borderRadius: 999 }}>
            Save platform settings
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
