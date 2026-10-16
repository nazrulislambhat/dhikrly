'use client';

import { useState } from 'react';
import { Repeat2, X, Play, RotateCcw, Sparkles } from 'lucide-react';

interface QuranLoopModalProps {
  dark: boolean;
  isOpen: boolean;
  onClose: () => void;
  surahNumber: number;
  surahName: string;
  totalVerses: number;
  activeAyah: number | null;
  repeatCountTarget: number;
  onSetRepeatCountTarget: (count: number) => void;
  rangeLoopActive: boolean;
  rangeStartAyah: number;
  rangeEndAyah: number;
  rangeLoopTarget: number;
  onStartRangeLoop: (start: number, end: number, loopTarget: number) => void;
  onStopRangeLoop: () => void;
}

const REPEAT_OPTIONS = [
  { label: 'Off (1×)', value: 1 },
  { label: '3×', value: 3 },
  { label: '5×', value: 5 },
  { label: '10×', value: 10 },
  { label: '∞ Loop', value: -1 },
];

export default function QuranLoopModal({
  dark,
  isOpen,
  onClose,
  surahNumber,
  surahName,
  totalVerses,
  activeAyah,
  repeatCountTarget,
  onSetRepeatCountTarget,
  rangeLoopActive,
  rangeStartAyah,
  rangeEndAyah,
  rangeLoopTarget,
  onStartRangeLoop,
  onStopRangeLoop,
}: QuranLoopModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'range'>(rangeLoopActive ? 'range' : 'single');
  const [startInput, setStartInput] = useState<number>(rangeStartAyah || activeAyah || 1);
  const [endInput, setEndInput] = useState<number>(rangeEndAyah || Math.min(totalVerses, (activeAyah || 1) + 4));
  const [selectedRangeTarget, setSelectedRangeTarget] = useState<number>(rangeLoopTarget || 3);

  if (!isOpen) return null;

  const overlay = dark ? 'bg-black/60 backdrop-blur-sm' : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'border-white/10 bg-[#14211e] text-stone-100 shadow-2xl'
    : 'border-stone-200 bg-white text-stone-900 shadow-xl';
  const card = dark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50';

  const handleStartRange = () => {
    const s = Math.max(1, Math.min(startInput, totalVerses));
    const e = Math.max(s, Math.min(endInput, totalVerses));
    onStartRangeLoop(s, e, selectedRangeTarget);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-md rounded-3xl border p-6 ${panel} relative`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--app-line)]">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <Repeat2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Audio Looping & Repeat</h2>
              <p className="text-xs text-[var(--app-muted)]">
                {surahName} (Surah {surahNumber} · {totalVerses} Ayahs)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-[var(--app-line)] p-1 bg-black/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'single'
                ? 'bg-[var(--app-surface)] text-emerald-800 dark:text-emerald-200 shadow-sm'
                : 'text-[var(--app-muted)]'
            }`}
          >
            Single Ayah Repeat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('range')}
            className={`rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'range'
                ? 'bg-[var(--app-surface)] text-emerald-800 dark:text-emerald-200 shadow-sm'
                : 'text-[var(--app-muted)]'
            }`}
          >
            Verse Range Loop
          </button>
        </div>

        {/* Tab 1: Single Ayah Repeat */}
        {activeTab === 'single' && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[var(--app-muted)]">
              Repeats each verse a set number of times for deep listening and auditory memorization.
            </p>

            <div className="grid grid-cols-5 gap-1.5">
              {REPEAT_OPTIONS.map((opt) => {
                const isSelected = repeatCountTarget === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSetRepeatCountTarget(opt.value);
                      if (rangeLoopActive) onStopRangeLoop();
                    }}
                    className={`rounded-xl border py-3 text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                        : `${card} text-[var(--app-ink)] hover:border-emerald-500/40`
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className={`rounded-2xl border p-4 ${card} text-xs text-[var(--app-muted)] flex items-start gap-2.5`}>
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>
                Tip: Set to <strong>3×</strong> or <strong>5×</strong> while following the Arabic script to memorize new passages faster.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Verse Range Loop */}
        {activeTab === 'range' && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[var(--app-muted)]">
              Specify a verse interval (e.g. Ayah 1 to 5) and loop it continuously until memorized.
            </p>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                  From Ayah
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalVerses}
                  value={startInput}
                  onChange={(e) => setStartInput(Math.max(1, Math.min(totalVerses, Number(e.target.value))))}
                  className="w-full rounded-xl border border-[var(--app-line)] bg-transparent p-2.5 text-center text-sm font-bold tabular-nums outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-1">
                  To Ayah
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalVerses}
                  value={endInput}
                  onChange={(e) => setEndInput(Math.max(1, Math.min(totalVerses, Number(e.target.value))))}
                  className="w-full rounded-xl border border-[var(--app-line)] bg-transparent p-2.5 text-center text-sm font-bold tabular-nums outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Range repetition times */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)] mb-2">
                Loop Repetitions
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {REPEAT_OPTIONS.map((opt) => {
                  const isSelected = selectedRangeTarget === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRangeTarget(opt.value)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all text-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500'
                          : `${card} text-[var(--app-ink)] hover:border-emerald-500/40`
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStartInput(1);
                  setEndInput(Math.min(5, totalVerses));
                }}
                className="rounded-lg border border-[var(--app-line)] px-2.5 py-1 text-[11px] font-medium hover:bg-black/5 dark:hover:bg-white/5"
              >
                Ayahs 1–{Math.min(5, totalVerses)}
              </button>
              {totalVerses >= 10 && (
                <button
                  type="button"
                  onClick={() => {
                    setStartInput(1);
                    setEndInput(10);
                  }}
                  className="rounded-lg border border-[var(--app-line)] px-2.5 py-1 text-[11px] font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Ayahs 1–10
                </button>
              )}
              {activeAyah && (
                <button
                  type="button"
                  onClick={() => {
                    setStartInput(activeAyah);
                    setEndInput(Math.min(totalVerses, activeAyah + 4));
                  }}
                  className="rounded-lg border border-[var(--app-line)] px-2.5 py-1 text-[11px] font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Current + 4 Ayahs
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleStartRange}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 transition-all"
              >
                <Play className="h-4 w-4" />
                <span>Start Range Loop ({startInput} to {endInput})</span>
              </button>

              {rangeLoopActive && (
                <button
                  type="button"
                  onClick={() => {
                    onStopRangeLoop();
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Stop Loop</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
