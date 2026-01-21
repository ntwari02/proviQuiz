import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex items-center text-slate-900 dark:text-slate-100">
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-6">
          <p className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300">
            Prepare for Rwanda driving theory exam
          </p>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            For all seasons
            <span className="block text-5xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-6xl">
              Any circumstances
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">
            Practice with timed mock exams, review explanations instantly, and track your progress until you’re ready.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/exam")}
              sx={{ borderRadius: 999, textTransform: "none", px: 3, py: 1.2 }}
            >
              Start Exam
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/demo")}
              sx={{ borderRadius: 999, textTransform: "none", px: 3, py: 1.2 }}
            >
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-300">
            <div className="rounded-full bg-slate-900/5 dark:bg-slate-100/10 px-3 py-1">20 questions</div>
            <div className="rounded-full bg-slate-900/5 dark:bg-slate-100/10 px-3 py-1">20 minutes</div>
            <div className="rounded-full bg-slate-900/5 dark:bg-slate-100/10 px-3 py-1">Instant review</div>
          </div>
        </div>

        {/* Right */}
        <div className="relative">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-2xl" />
            <div className="absolute inset-2 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10" />

            {/* Floating cards */}
            <div className="absolute left-6 top-6 w-[240px] animate-[float_6s_ease-in-out_infinite] rounded-2xl bg-white/90 dark:bg-slate-900/90 p-4 shadow-xl backdrop-blur">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Today’s performance</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-50">16/20</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                Accuracy: <span className="font-semibold">80%</span>
              </p>
            </div>

            <div className="absolute bottom-6 right-6 w-[280px] animate-[float_7.5s_ease-in-out_infinite] rounded-2xl bg-white/90 dark:bg-slate-900/90 p-4 shadow-xl backdrop-blur [animation-delay:-1.2s]">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Weak area</p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-50">Road signs</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-2/3 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-200">Practice recommended</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

