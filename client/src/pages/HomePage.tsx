import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDeviceAdapter } from "../hooks/useDeviceAdapter";

export function HomePage() {
  const navigate = useNavigate();
  const { isPhone, isCompactPhone, hideHomeDecor } = useDeviceAdapter();
  const showDecor = !hideHomeDecor && !isPhone;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-160px)] items-stretch text-slate-900 dark:text-slate-100">
      <div
        className={
          isPhone
            ? "grid w-full grid-cols-1 items-start gap-6"
            : "grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2"
        }
      >
        <div className="space-y-4 sm:space-y-6">
          <p className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
            Prepare for Rwanda driving theory exam
          </p>

          <h1
            className={
              isCompactPhone
                ? "text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white"
                : "text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl"
            }
          >
            For all seasons
            <span
              className={
                isCompactPhone
                  ? "mt-1 block text-4xl font-extrabold text-slate-900 dark:text-slate-100"
                  : "block text-5xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-6xl"
              }
            >
              Any circumstances
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">
            Practice with timed mock exams, review explanations instantly, and track your progress until you’re ready.
          </p>

          <div className={isPhone ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-3"}>
            <Button
              variant="contained"
              size="large"
              fullWidth={isPhone}
              onClick={() => navigate("/exam")}
              sx={{ borderRadius: 999, textTransform: "none", px: 3, py: 1.2, minHeight: 48 }}
            >
              Start Exam
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth={isPhone}
              onClick={() => navigate("/premium/upgrade")}
              sx={{ borderRadius: 999, textTransform: "none", px: 3, py: 1.2, minHeight: 48 }}
            >
              See Premium
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-300 sm:gap-4">
            <div className="rounded-full bg-slate-900/5 px-3 py-1 dark:bg-slate-100/10">20 questions</div>
            <div className="rounded-full bg-slate-900/5 px-3 py-1 dark:bg-slate-100/10">20 minutes</div>
            {!isCompactPhone && (
              <div className="rounded-full bg-slate-900/5 px-3 py-1 dark:bg-slate-100/10">Instant review</div>
            )}
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Free mock stays 20 questions in 20 minutes. Premium adds live battles, weakness analysis, and smart practice.
          </p>
        </div>

        <div className={`relative w-full ${isCompactPhone ? "h-40" : isPhone ? "h-52" : "mt-6 h-64 lg:mt-0 lg:h-full"}`}>
          <div className="relative h-full w-full overflow-hidden rounded-xl lg:rounded-none">
            <video
              className="absolute inset-0 h-full w-full bg-slate-900 object-cover shadow-2xl"
              src="/A Person Driving a Car · Free Stock Video.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 to-slate-900/70" />

            {showDecor && (
              <>
                <div className="absolute left-6 top-6 w-[240px] animate-[float_6s_ease-in-out_infinite] rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur dark:bg-slate-900/90">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Today’s performance</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-50">16/20</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    Accuracy: <span className="font-semibold">80%</span>
                  </p>
                </div>

                <div className="absolute bottom-6 right-6 w-[280px] animate-[float_7.5s_ease-in-out_infinite] rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur [animation-delay:-1.2s] dark:bg-slate-900/90">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Weak area</p>
                  <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-50">Road signs</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full w-2/3 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-200">Practice recommended</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
