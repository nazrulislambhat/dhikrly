'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  Check,
  Volume2,
  VolumeX,
  Copy,
  CheckCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Type,
  Maximize2,
} from 'lucide-react';
import type { Dua } from '@/types';
import { speakArabicText, stopDuaAudio } from '@/lib/duaAudio';
import { playCheck, playComplete } from '@/lib/sounds';

interface DuaCardProps {
  dua: Dua;
  checked: boolean;
  onToggle: (id: string, soundEnabled?: boolean) => void;
  onDelete?: (id: string) => void;
  onOpenFocus?: (dua: Dua) => void;
  dark: boolean;
  soundEnabled?: boolean;
}

export default function DuaCard({
  dua,
  checked,
  onToggle,
  onDelete,
  onOpenFocus,
  dark,
  soundEnabled = true,
}: DuaCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [arabicFontSize, setArabicFontSize] = useState<'normal' | 'large' | 'huge'>('normal');

  const targetCount: number =
    typeof dua.count === 'string'
      ? parseInt(dua.count, 10) || 1
      : typeof dua.count === 'number'
        ? dua.count
        : 1;
  const [tapCount, setTapCount] = useState<number>(checked ? targetCount : 0);

  // Sync tapCount if parent checked state changes
  useEffect(() => {
    if (checked) {
      setTapCount(targetCount);
    } else {
      setTapCount(0);
    }
  }, [checked, targetCount]);

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopDuaAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakArabicText(dua.ar, {
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const textToCopy = `${dua.title}\n\n${dua.ar}\n\n${dua.transliteration}\n\n"${dua.en}"\n\n— via Dhikrly`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard fail
    }
  };

  const cycleFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArabicFontSize((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'huge' : 'normal'));
  };

  // Repetition Tap Bead Handler
  const handleBeadTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checked) {
      // If already checked, unchecking
      onToggle(dua.id, soundEnabled);
      setTapCount(0);
      return;
    }

    const nextCount = tapCount + 1;
    if (nextCount >= targetCount) {
      setTapCount(targetCount);
      if (soundEnabled) playComplete();
      onToggle(dua.id, false); // already played complete sound
      if ('vibrate' in navigator) {
        try { navigator.vibrate([30, 50, 30]); } catch {}
      }
    } else {
      setTapCount(nextCount);
      if (soundEnabled) playCheck();
      if ('vibrate' in navigator) {
        try { navigator.vibrate(15); } catch {}
      }
    }
  };

  const arabicSizeClasses =
    arabicFontSize === 'huge'
      ? 'text-2xl sm:text-3xl leading-[2.8] sm:leading-[3.0]'
      : arabicFontSize === 'large'
        ? 'text-xl sm:text-2xl leading-[2.6] sm:leading-[2.8]'
        : 'text-lg sm:text-xl leading-[2.4] sm:leading-[2.6]';

  return (
    <article
      className={`group relative rounded-3xl border transition-all duration-300 hover:shadow-xl ${
        checked
          ? dark
            ? 'border-primary/40 bg-gradient-to-b from-primary/15 to-surface shadow-sm'
            : 'border-primary/30 bg-gradient-to-b from-primary-subtle to-white shadow-sm'
          : dark
            ? 'border-white/[0.08] bg-surface/90 hover:border-primary/40'
            : 'border-border bg-white hover:border-primary/40 shadow-xs'
      }`}
    >
      {/* Decorative top accent highlight for priority or completed */}
      {dua.priority && (
        <div
          className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-gradient-to-r from-link via-primary to-link opacity-80"
          aria-hidden="true"
        />
      )}

      {/* Card Header: Category, Tags, Audio, Size, Copy, Actions */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-3">
        {/* Left: Tags & Badges */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Category Pill */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-primary-light text-primary border border-primary/20"
          >
            {dua.category === 'quran'
              ? "Qur'ān"
              : dua.category === 'athkar'
                ? 'Athkār'
                : "Du'ā"}
          </span>

          {/* Session Badges (Morning, Evening, etc.) */}
          {dua.session.map((s) => (
            <span
              key={s}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                dark
                  ? 'bg-white/[0.06] text-muted'
                  : 'bg-surface-hover text-muted'
              }`}
            >
              {s}
            </span>
          ))}

          {/* Target Count Indicator */}
          {targetCount > 1 && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                checked
                  ? 'bg-primary-light text-primary'
                  : 'bg-link-light text-link'
              }`}
            >
              <span>{checked ? `${targetCount}× done` : `${tapCount}/${targetCount}×`}</span>
            </span>
          )}

          {dua.custom && (
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 border border-purple-500/20">
              Custom
            </span>
          )}
        </div>

        {/* Right: Quick Tool Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {dua.priority && (
            <span
              title="Priority Remembrance"
              className="grid h-7 w-7 place-items-center rounded-lg text-link"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
            </span>
          )}

          {/* Arabic Font Size Adjuster */}
          <button
            type="button"
            onClick={cycleFontSize}
            title={`Adjust Arabic font size (current: ${arabicFontSize})`}
            aria-label={`Adjust Arabic font size (current: ${arabicFontSize})`}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-ink hover:border-primary/40 text-xs font-bold transition-all cursor-pointer"
          >
            <span className="text-[11px] font-serif">A±</span>
          </button>

          {/* Audio Recitation Player */}
          <button
            type="button"
            onClick={handleAudio}
            title={isPlaying ? 'Stop recitation' : 'Listen to authentic recitation'}
            aria-label={isPlaying ? 'Stop recitation' : 'Listen to authentic recitation'}
            className={`flex h-7 items-center justify-center gap-1 rounded-lg border px-2 transition-all cursor-pointer ${
              isPlaying
                ? 'border-primary bg-primary text-primary-fg shadow-sm'
                : 'border-border bg-surface text-muted hover:text-primary hover:border-primary/40'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="flex items-center gap-0.5">
                  <span className="h-2 w-0.5 bg-current animate-soundwave-1" />
                  <span className="h-3 w-0.5 bg-current animate-soundwave-2" />
                  <span className="h-2 w-0.5 bg-current animate-soundwave-3" />
                </span>
              </>
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Copy Text */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? 'Copied to clipboard!' : 'Copy remembrance'}
            aria-label={copied ? 'Copied to clipboard' : 'Copy remembrance'}
            className={`grid h-7 w-7 place-items-center rounded-lg border transition-all cursor-pointer ${
              copied
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border bg-surface text-muted hover:text-ink hover:border-primary/40'
            }`}
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Full-Screen Khushū‘ Mode */}
          {onOpenFocus && (
            <button
              type="button"
              onClick={() => onOpenFocus(dua)}
              title="Open in Khushū‘ Full-Screen Reciter"
              aria-label="Open in Khushū‘ Full-Screen Reciter"
              className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Custom Dua Delete */}
          {dua.custom && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(dua.id)}
              aria-label="Delete custom remembrance"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Titles Block */}
      <div className="px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-black/[0.04] dark:border-white/[0.05]">
          <h3
            className={`font-display text-base sm:text-lg font-bold tracking-tight transition-colors ${
              checked ? 'text-primary' : 'text-ink'
            }`}
          >
            {dua.title}
          </h3>
          {dua.titleAr && (
            <span
              className="font-arabic text-sm text-muted"
              dir="rtl"
            >
              {dua.titleAr}
            </span>
          )}
        </div>
      </div>

      {/* Sacred Scripture Body */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Arabic Calligraphy Container */}
        <div
          className={`rounded-2xl p-4 sm:p-5 transition-colors ${
            dark
              ? 'bg-black/30 border border-white/[0.04]'
              : 'bg-primary/5 border border-primary/10'
          }`}
        >
          <p
            className={`font-quran text-right font-normal select-text ${arabicSizeClasses} ${
              checked ? 'text-primary' : 'text-ink'
            }`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            {dua.ar}
          </p>
        </div>

        {/* Translation & Transliteration Details */}
        {expanded && (
          <div className="space-y-2 pt-1">
            {dua.transliteration && (
              <p className="font-serif text-xs sm:text-[13px] leading-relaxed italic text-primary/85">
                {dua.transliteration}
              </p>
            )}

            {dua.en && (
              <p className="text-xs sm:text-[13px] leading-relaxed text-muted">
                &ldquo;{dua.en}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Completion & Interactive Repetition Bead Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 pb-4 pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
        {/* Expand/Collapse details toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Less' : 'Meaning & Pronunciation'}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Interactive Actions Group */}
        <div className="flex items-center gap-2">
          {/* Interactive Repetition Bead Counter (if targetCount > 1) */}
          {targetCount > 1 && !checked && (
            <button
              type="button"
              onClick={handleBeadTap}
              title={`Tap to count (${tapCount}/${targetCount})`}
              aria-label={`Tap to count (${tapCount} of ${targetCount})`}
              className="tap-bounce inline-flex items-center gap-1.5 rounded-xl border border-link/40 bg-link-light text-link hover:text-link-hover px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-link/20 text-[10px] font-extrabold text-link">
                {tapCount}
              </span>
              <span>Tap Bead ({targetCount - tapCount} left)</span>
            </button>
          )}

          {/* Completion Action Button */}
          <button
            type="button"
            onClick={() => onToggle(dua.id, soundEnabled)}
            aria-label={checked ? 'Completed. Click to undo.' : 'Mark complete'}
            className={`tap-bounce inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              checked
                ? dark
                  ? 'bg-primary-light text-primary border border-primary/45 hover:bg-primary-light'
                  : 'bg-primary text-white hover:bg-primary-hover'
                : dark
                  ? 'border border-primary/35 bg-primary-subtle text-primary hover:bg-primary-light'
                  : 'border border-primary/25 bg-primary-subtle text-primary hover:bg-primary-light'
            }`}
          >
            {checked ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full border border-current">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                </span>
                <span>{targetCount > 1 ? 'Complete All' : 'Mark Done'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
