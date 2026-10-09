'use client';

import type { FormEvent } from 'react';
import { useTasbihCounter, type TasbihTarget } from '@/hooks/useTasbihCounter';

const TARGETS: TasbihTarget[] = [33, 99, 100, 1000];
const MAX_CUSTOM_TARGET = 100_000;
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TasbihCounter() {
  const {
    count,
    target,
    rounds,
    justCompleted,
    canUndo,
    storageError,
    increment,
    undo,
    reset,
    setTarget,
  } = useTasbihCounter();

  const progress = target === null ? 0 : Math.min(count / target, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const handleCustomTarget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get('target'));
    if (Number.isInteger(value) && value > 0 && value <= MAX_CUSTOM_TARGET) {
      setTarget(value);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 rounded-3xl p-6 shadow-sm ring-2 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Tasbih Counter
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {rounds} {rounds === 1 ? 'round' : 'rounds'} completed
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            aria-pressed={target === t}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              target === t
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {t}×
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTarget(null)}
          aria-pressed={target === null}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            target === null
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
        >
          No target
        </button>
      </div>

      <form onSubmit={handleCustomTarget} className="flex items-center gap-2">
        <label htmlFor="tasbih-target" className="sr-only">Custom target</label>
        <input
          id="tasbih-target"
          name="target"
          type="number"
          min={1}
          max={MAX_CUSTOM_TARGET}
          step={1}
          required
          placeholder="Custom target"
          className="w-32 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          Set target
        </button>
      </form>

      <button
        type="button"
        onClick={increment}
        aria-label={`Count dhikr${target === null ? `, ${count}` : `, ${count} of ${target}`}`}
        className="relative flex h-54 w-54 select-none items-center justify-center rounded-full bg-emerald-50 text-emerald-900 shadow-inner transition-transform active:scale-95 dark:bg-emerald-950/40 dark:text-emerald-50"
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
            className="stroke-emerald-600 transition-all duration-200 dark:stroke-emerald-400"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>

        <div className="flex flex-col items-center">
          <span className="text-xl font-bold tabular-nums">{count}</span>
          <span className="mt-1 text-sm text-emerald-700/70 dark:text-emerald-200/60">
            {target === null ? 'count' : `of ${target}`}
          </span>
        </div>
      </button>

      <p
        className={`-mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 ${
          justCompleted ? 'visible' : 'invisible'
        }`}
        aria-live="polite"
      >
        Target reached — masha&apos;Allah
      </p>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400"
        >
          Undo last
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={count === 0}
          className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400"
        >
          Reset count
        </button>
      </div>
      {storageError && (
        <p role="alert" className="text-center text-xs text-red-700 dark:text-red-300">
          {storageError}
        </p>
      )}
    </div>
  );
}
