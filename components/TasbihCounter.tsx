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
    <div className="mx-auto flex w-full flex-col items-center gap-5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-5 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--app-ink)]">
          Tasbih Counter
        </h2>
        <span className="text-xs text-[var(--app-muted)]">
          {rounds} {rounds === 1 ? 'round' : 'rounds'} completed
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTarget(t)}
            aria-pressed={target === t}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              target === t
                ? 'bg-primary text-white'
                : 'border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            {t}×
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTarget(null)}
          aria-pressed={target === null}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            target === null
              ? 'bg-primary text-white'
              : 'border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          No target
        </button>
      </div>

      <form onSubmit={handleCustomTarget} className="flex w-full items-center gap-2">
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
          className="min-w-0 flex-1 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-primary/30 bg-primary-light px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          Set target
        </button>
      </form>

      <button
        type="button"
        onClick={increment}
        aria-label={`Count dhikr${target === null ? `, ${count}` : `, ${count} of ${target}`}`}
        className="relative flex h-48 w-48 sm:h-52 sm:w-52 select-none items-center justify-center rounded-full bg-primary-subtle text-ink shadow-inner transition-transform active:scale-95"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-primary/20"
          />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-primary transition-all duration-200"
            style={{
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">{count}</span>
          <span className="mt-1 text-xs text-primary/80">
            {target === null ? 'count' : `of ${target}`}
          </span>
        </div>
      </button>

      <p
        className={`-mt-2 text-xs font-semibold text-primary ${
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
          className="text-xs font-semibold text-[var(--app-muted)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo last
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={count === 0}
          className="text-xs font-semibold text-[var(--app-muted)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
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
