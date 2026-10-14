'use client';

import { useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface SlideToFinishProps {
  completed: boolean;
  dark: boolean;
  label: string;
  completedLabel: string;
  onFinish: () => void;
}

const FINISH_THRESHOLD = 88;
const KNOB_SIZE = 38;

export default function SlideToFinish({
  completed,
  dark,
  label,
  completedLabel,
  onFinish,
}: SlideToFinishProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const pointerId = useRef<number | null>(null);

  const updateFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const max = Math.max(0, rect.width - KNOB_SIZE - 8);
    setMaxOffset(max);
    const offset = Math.max(0, Math.min(max, clientX - rect.left - 4 - KNOB_SIZE / 2));
    const value = max === 0 ? 0 : Math.round((offset / max) * 100);
    setProgress(value);
    return value;
  };

  const finishOrReset = (value: number) => {
    pointerId.current = null;
    if (value >= FINISH_THRESHOLD) onFinish();
    setProgress(0);
  };

  if (completed) {
    return (
      <button
        type="button"
        onClick={onFinish}
        aria-label={`${completedLabel}. Tap to undo.`}
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition active:scale-[0.99] ${
          dark
            ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
            : 'border-emerald-700/15 bg-emerald-50 text-emerald-800'
        }`}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        <span>{completedLabel} · Tap to undo</span>
      </button>
    );
  }

  const increment = (amount: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect) setMaxOffset(Math.max(0, rect.width - KNOB_SIZE - 8));
    const next = Math.max(0, Math.min(100, progress + amount));
    setProgress(next);
    if (next >= FINISH_THRESHOLD) finishOrReset(next);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={progress > 0 ? `${progress}% slid` : 'Slide right to finish'}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (pointerId.current === event.pointerId) updateFromPointer(event.clientX);
      }}
      onPointerUp={(event) => {
        if (pointerId.current !== event.pointerId) return;
        finishOrReset(updateFromPointer(event.clientX));
      }}
      onPointerCancel={() => finishOrReset(0)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          increment(20);
        } else if (event.key === 'ArrowLeft' || event.key === 'Home') {
          event.preventDefault();
          setProgress(0);
        } else if (event.key === 'End' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onFinish();
          setProgress(0);
        }
      }}
      className={`relative flex h-12 w-full cursor-grab touch-pan-y select-none items-center justify-center overflow-hidden rounded-xl border px-12 text-xs font-semibold outline-none transition active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        dark
          ? 'border-white/10 bg-white/[0.04] text-stone-300'
          : 'border-stone-200 bg-stone-50 text-stone-600'
      }`}
    >
      <span className="pointer-events-none relative z-10">{label}</span>
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 rounded-xl transition-[width] ${
          dark ? 'bg-emerald-300/10' : 'bg-emerald-700/[0.07]'
        }`}
        style={{ width: `${Math.min(100, progress)}%` }}
      />
      <span
        aria-hidden="true"
        className={`absolute top-1 grid h-[38px] w-[38px] place-items-center rounded-lg shadow-sm transition-colors ${
          dark ? 'bg-emerald-300 text-emerald-950' : 'bg-emerald-800 text-white'
        }`}
        style={{ left: `${maxOffset * progress / 100 + 4}px` }}
      >
        {progress >= FINISH_THRESHOLD
          ? <Check className="h-4 w-4" />
          : <ChevronRight className="h-4 w-4" />}
      </span>
    </div>
  );
}
