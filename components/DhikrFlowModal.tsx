'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Check,
} from 'lucide-react';
import type { Dua } from '@/types';
import { speakArabicText, stopDuaAudio } from '@/lib/duaAudio';
import { playCheck, playComplete } from '@/lib/sounds';

interface DhikrFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  duas: Dua[];
  initialIndex?: number;
  checked: Record<string, boolean>;
  onToggle: (id: string, soundEnabled?: boolean) => void;
  dark: boolean;
  soundEnabled?: boolean;
}

export default function DhikrFlowModal({
  isOpen,
  onClose,
  duas,
  initialIndex = 0,
  checked,
  onToggle,
  dark,
  soundEnabled = true,
}: DhikrFlowModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [arabicFontSize, setArabicFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [isFinished, setIsFinished] = useState(false);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(0, Math.min(initialIndex, (duas.length || 1) - 1));
      setCurrentIndex(validIndex);
      setIsFinished(false);
    }
  }, [isOpen, initialIndex, duas.length]);

  const currentDua = duas[currentIndex] ?? null;

  const targetCount: number = useMemo(() => {
    if (!currentDua) return 1;
    return typeof currentDua.count === 'string'
      ? parseInt(currentDua.count, 10) || 1
      : typeof currentDua.count === 'number'
        ? currentDua.count
        : 1;
  }, [currentDua]);

  const isCurrentChecked = currentDua ? !!checked[currentDua.id] : false;
  const [tapCount, setTapCount] = useState<number>(isCurrentChecked ? targetCount : 0);

  // Sync tap count when switching dua or checked status changes
  useEffect(() => {
    if (currentDua) {
      setTapCount(checked[currentDua.id] ? targetCount : 0);
    }
  }, [currentDua, checked, targetCount]);

  // Stop any audio when switching duas or closing
  useEffect(() => {
    stopDuaAudio();
    setIsAudioPlaying(false);
  }, [currentIndex, isOpen]);

  const handleAudioToggle = useCallback(() => {
    if (!currentDua) return;
    if (isAudioPlaying) {
      stopDuaAudio();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      speakArabicText(currentDua.ar, {
        onEnd: () => setIsAudioPlaying(false),
        onError: () => setIsAudioPlaying(false),
      });
    }
  }, [currentDua, isAudioPlaying]);

  const handleNext = useCallback(() => {
    if (currentIndex < duas.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, duas.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFinished(false);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleTap = useCallback(() => {
    if (!currentDua) return;

    if (tapCount >= targetCount) {
      // If already finished this dua, tap advances to next
      handleNext();
      return;
    }

    const next = tapCount + 1;
    setTapCount(next);

    if (next >= targetCount) {
      if (soundEnabled) playComplete();
      if (!isCurrentChecked) {
        onToggle(currentDua.id, false);
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([30, 40, 50]);
        } catch {}
      }
      // Gentle auto-advance to next unfinished dua after brief celebratory pause
      const timeout = setTimeout(() => {
        handleNext();
      }, 550);
      return () => clearTimeout(timeout);
    } else {
      if (soundEnabled) playCheck();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {}
      }
    }
  }, [currentDua, tapCount, targetCount, soundEnabled, isCurrentChecked, onToggle, handleNext]);

  const handleResetCount = useCallback(() => {
    if (!currentDua) return;
    setTapCount(0);
    if (isCurrentChecked) {
      onToggle(currentDua.id, soundEnabled);
    }
  }, [currentDua, isCurrentChecked, onToggle, soundEnabled]);

  // Global keyboard shortcuts in Focus Mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTap, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const progressPct = targetCount > 0 ? Math.min(100, Math.round((tapCount / targetCount) * 100)) : 100;
  const totalCompletedInRoutine = duas.filter((d) => !!checked[d.id]).length;
  const routinePct = Math.round((totalCompletedInRoutine / (duas.length || 1)) * 100);

  const arabicSizeClasses =
    arabicFontSize === 'huge'
      ? 'text-3xl sm:text-4xl md:text-5xl leading-[2.6] sm:leading-[2.8]'
      : arabicFontSize === 'large'
        ? 'text-2xl sm:text-3xl md:text-4xl leading-[2.3] sm:leading-[2.5]'
        : 'text-xl sm:text-2xl md:text-3xl leading-[2.1] sm:leading-[2.3]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Khushū‘ Flow Recitation Sanctuary"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 backdrop-blur-2xl bg-canvas/95 text-ink animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Spiritual ambient aura in background */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-link/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex h-full sm:h-[92vh] sm:max-h-[900px] w-full max-w-4xl flex-col rounded-none sm:rounded-3xl border-0 sm:border border-border bg-surface shadow-2xl overflow-hidden">
        {/* ── Top Bar: Routine Header, Bead Strip & Quick Controls ── */}
        <header className="flex flex-col border-b border-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-light text-primary border border-primary/20 shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-primary truncate">
                  Khushū‘ Recitation Flow
                </h2>
                <p className="text-[11px] text-muted truncate">
                  {duas.length > 0
                    ? `Remembrance ${currentIndex + 1} of ${duas.length} · ${totalCompletedInRoutine} Completed (${routinePct}%)`
                    : 'Daily Adhkār'}
                </p>
              </div>
            </div>

            {/* Quick Actions (Audio, Font size, Close) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Transliteration toggle */}
              <button
                type="button"
                onClick={() => setShowTransliteration((s) => !s)}
                className={`hidden sm:inline-flex items-center rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  showTransliteration
                    ? 'border-primary/30 bg-primary-light text-primary'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
                title="Toggle Transliteration"
              >
                ABC
              </button>

              {/* Font Size Button */}
              <button
                type="button"
                onClick={() =>
                  setArabicFontSize((s) => (s === 'normal' ? 'large' : s === 'large' ? 'huge' : 'normal'))
                }
                className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface text-muted hover:text-ink text-xs font-bold transition-all cursor-pointer"
                title={`Font Size (${arabicFontSize})`}
              >
                A±
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface text-muted hover:text-ink hover:border-border transition-all cursor-pointer"
                title="Exit Khushū‘ Mode (Esc)"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Routine Progress Bead Indicator */}
          <div className="mt-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {duas.map((d, idx) => {
              const isDone = !!checked[d.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 flex-1 min-w-3 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-primary ring-2 ring-primary/30 h-2'
                      : isDone
                        ? 'bg-primary/80'
                        : 'bg-border/60 hover:bg-border'
                  }`}
                  title={`${idx + 1}. ${d.title} (${isDone ? 'Completed' : 'Pending'})`}
                />
              );
            })}
          </div>
        </header>

        {/* ── Main Interactive Content Area ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col justify-between">
          {isFinished ? (
            /* ── Celebration Routine Finished Screen ── */
            <div className="my-auto flex flex-col items-center justify-center text-center py-10 px-4 animate-in zoom-in-95 duration-300">
              <div className="relative mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-primary-light border-2 border-primary/30 text-primary shadow-xl">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
                <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-link text-white text-xs font-black shadow-md">
                  ★
                </span>
              </div>

              <h3 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Māshā’Allāh! Routine Completed
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
                You have journeyed through all remembrances in this sequence. May Allah accept your recitation, instill peace in your heart, and shower your day with barakah.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-2xl border border-primary/20 bg-primary-light px-4 py-2 text-xs font-bold text-primary">
                  <Check className="h-4 w-4" />
                  <span>{totalCompletedInRoutine} of {duas.length} Adhkār Complete</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIndex(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-2.5 text-xs font-bold text-ink hover:border-primary/40 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Recite Routine Again</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-primary-hover transition-all cursor-pointer"
                >
                  <span>Return to Adhkār</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : currentDua ? (
            /* ── Active Dua Focus View ── */
            <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
              {/* Category & Tags Strip */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-primary-light text-primary border border-primary/20">
                  {currentDua.category === 'quran' ? "Qur'ān" : 'Athkār'}
                </span>
                {currentDua.session.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted"
                  >
                    {s}
                  </span>
                ))}
                {currentDua.priority && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-link/30 bg-link-light px-3 py-1 text-[11px] font-bold text-link">
                    ★ Essential Protection
                  </span>
                )}
              </div>

              {/* Title & Reference */}
              <h1 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-center text-ink">
                {currentDua.title}
              </h1>

              {/* Audio Listen Pill */}
              <div className="mt-2 mb-5">
                <button
                  type="button"
                  onClick={handleAudioToggle}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isAudioPlaying
                      ? 'border-primary bg-primary text-white shadow-md animate-pulse'
                      : 'border-border bg-surface text-muted hover:text-ink hover:border-primary/40'
                  }`}
                >
                  {isAudioPlaying ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>Stop Pronunciation</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                      <span>Listen to Audio</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sacred Arabic Text Card with Calligraphy Accent */}
              <div
                onClick={handleTap}
                className="w-full rounded-3xl border border-border bg-surface/70 backdrop-blur-xs p-5 sm:p-8 text-center shadow-xs transition-all hover:border-primary/40 cursor-pointer select-none group"
                title="Tap anywhere to count"
              >
                <p
                  className={`font-quran text-ink font-normal ${arabicSizeClasses} transition-all duration-200`}
                  dir="rtl"
                  lang="ar"
                  translate="no"
                >
                  {currentDua.ar}
                </p>

                {/* Transliteration */}
                {showTransliteration && currentDua.transliteration && (
                  <p className="mt-4 text-xs sm:text-sm text-link font-medium italic leading-relaxed tracking-wide">
                    {currentDua.transliteration}
                  </p>
                )}

                {/* English Translation */}
                <p className="mt-4 text-xs sm:text-sm text-muted leading-relaxed font-normal border-t border-border/60 pt-4">
                  {currentDua.en}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Bottom Controls: Interactive Circular Rosary Disc & Navigation ── */}
        {!isFinished && currentDua && (
          <footer className="border-t border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 py-4 shrink-0 flex items-center justify-between gap-4">
            {/* Prev Dua Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-muted hover:text-ink disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous Remembrance (←)"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Giant Central Tap Disc */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleTap}
                className="tap-bounce group relative grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full border-2 border-primary/30 bg-primary-light shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Tap to count (Spacebar)"
                aria-label={`Count: ${tapCount} of ${targetCount}. Tap to count or press Spacebar`}
              >
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 -rotate-90 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    className="fill-none stroke-border/40 stroke-[7px]"
                    cx="50"
                    cy="50"
                    r="43"
                  />
                  <circle
                    className="fill-none stroke-primary stroke-[7px] [stroke-linecap:round] transition-all duration-300"
                    cx="50"
                    cy="50"
                    r="43"
                    strokeDasharray={270}
                    strokeDashoffset={270 - (270 * progressPct) / 100}
                  />
                </svg>

                <div className="text-center z-10 select-none">
                  <span className="block font-editorial text-2xl sm:text-3xl font-extrabold text-primary leading-none">
                    {tapCount}
                  </span>
                  <span className="block text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                    / {targetCount}×
                  </span>
                </div>
              </button>

              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                <span>Tap or press [Space]</span>
                {tapCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetCount}
                    className="underline hover:text-link transition-colors cursor-pointer"
                    title="Reset count"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Next Dua Button */}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-primary-hover transition-all cursor-pointer"
              title="Next Remembrance (→)"
            >
              <span className="hidden sm:inline">
                {currentIndex < duas.length - 1 ? 'Next' : 'Finish'}
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
