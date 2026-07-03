"use client";

import { useTasbihCounter, type TasbihTarget } from "@/hooks/useTasbihCounter";

const TARGETS: TasbihTarget[] = [33, 99, 100];
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TasbihCounter() {
  const { count, target, rounds, justCompleted, increment, reset, setTarget } =
    useTasbihCounter();

  const progress = Math.min(count / target, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Tasbih Counter
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {rounds} {rounds === 1 ? "round" : "rounds"} completed
        </span>
      </div>

      <div className="flex gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              target === t
                ? "bg-emerald-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {t}×
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={increment}
        aria-label={`Count dhikr, ${count} of ${target}`}
        className="relative flex h-56 w-56 select-none items-center justify-center rounded-full bg-emerald-50 text-emerald-900 shadow-inner transition-transform active:scale-95 dark:bg-emerald-950/40 dark:text-emerald-50"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-emerald-100 dark:stroke-emerald-900/40"
          />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`stroke-emerald-600 transition-all duration-200 dark:stroke-emerald-400 ${
              justCompleted ? "opacity-0" : "opacity-100"
            }`}
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>

        <div className="flex flex-col items-center">
          <span className="text-5xl font-bold tabular-nums">
            {justCompleted ? target : count}
          </span>
          <span className="mt-1 text-sm text-emerald-700/70 dark:text-emerald-200/60">
            of {target}
          </span>
        </div>
      </button>

      <p
        className={`-mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 ${
          justCompleted ? "visible" : "invisible"
        }`}
        aria-live="polite"
      >
        Round complete — masha&apos;Allah
      </p>

      <button
        type="button"
        onClick={reset}
        className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
      >
        Reset count
      </button>
    </div>
  );
}
