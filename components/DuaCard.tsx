'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import type { Dua } from '@/types';
import { speakArabicText, stopDuaAudio } from '@/lib/duaAudio';

interface DuaCardProps {
  dua: Dua;
  checked: boolean;
  onToggle: (id: string, soundEnabled?: boolean) => void;
  onDelete?: (id: string) => void;
  dark: boolean;
  soundEnabled?: boolean;
}

export default function DuaCard({
  dua,
  checked,
  onToggle,
  onDelete,
  dark,
  soundEnabled = true,
}: DuaCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

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

  return (
    <article
      className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-lg ${
        checked
          ? dark
            ? 'border-emerald-500/30 bg-emerald-950/20 shadow-xs'
            : 'border-emerald-500/30 bg-emerald-50/40 shadow-xs'
          : dark
            ? 'border-white/[0.08] bg-[#111e1a]/90 hover:border-emerald-500/30'
            : 'border-stone-200/90 bg-white hover:border-emerald-500/30'
      }`}
    >
      {/* Decorative top accent line for priority */}
      {dua.priority && (
        <div
          className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-amber-400/80 via-emerald-400/80 to-amber-400/80"
          aria-hidden="true"
        />
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-3">
        {/* Left: Tags & Badges */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Category Pill */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              dark
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-600/15'
            }`}
          >
            {dua.category === 'quran'
              ? "Qur'ān"
              : dua.category === 'athkar'
                ? 'Athkār'
                : "Du'ā"}
          </span>

          {/* Session Badges */}
          {dua.session.map((s) => (
            <span
              key={s}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                dark
                  ? 'bg-white/[0.06] text-stone-300'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {s}
            </span>
          ))}

          {/* Repetition Target */}
          {dua.count && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                dark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              • {dua.count}
            </span>
          )}

          {dua.custom && (
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
              Custom
            </span>
          )}
        </div>

        {/* Right: Actions (Star, Audio, Copy, Delete) */}
        <div className="flex items-center gap-1 shrink-0">
          {dua.priority && (
            <span
              title="Priority Remembrance"
              className="grid h-7 w-7 place-items-center rounded-lg text-amber-500"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
            </span>
          )}

          {/* Audio Recitation */}
          <button
            type="button"
            onClick={handleAudio}
            title={isPlaying ? 'Stop recitation' : 'Listen to Arabic pronunciation'}
            aria-label={isPlaying ? 'Stop recitation' : 'Listen to Arabic pronunciation'}
            className={`grid h-7 w-7 place-items-center rounded-lg border transition-all ${
              isPlaying
                ? 'border-emerald-500 bg-emerald-500 text-white animate-pulse'
                : dark
                  ? 'border-white/10 bg-white/5 text-stone-400 hover:text-emerald-300 hover:border-emerald-500/40'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-emerald-800 hover:border-emerald-500/40'
            }`}
          >
            {isPlaying ? (
              <VolumeX className="h-3.5 w-3.5" />
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
            className={`grid h-7 w-7 place-items-center rounded-lg border transition-all ${
              copied
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : dark
                  ? 'border-white/10 bg-white/5 text-stone-400 hover:text-stone-200'
                  : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-800'
            }`}
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Custom Dua Delete */}
          {dua.custom && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(dua.id)}
              aria-label="Delete custom remembrance"
              className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Titles Block */}
      <div className="px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
          <h3
            className={`font-serif text-base sm:text-lg font-bold tracking-tight ${
              checked
                ? dark
                  ? 'text-emerald-300'
                  : 'text-emerald-800'
                : dark
                  ? 'text-stone-100'
                  : 'text-stone-900'
            }`}
          >
            {dua.title}
          </h3>
          {dua.titleAr && (
            <span
              className="font-arabic text-sm text-stone-500 dark:text-stone-400"
              dir="rtl"
            >
              {dua.titleAr}
            </span>
          )}
        </div>
      </div>

      {/* Sacred Scripture Body */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Arabic Calligraphy */}
        <div
          className={`rounded-2xl p-4 sm:p-5 transition-colors ${
            dark
              ? 'bg-black/20 border border-white/[0.04]'
              : 'bg-emerald-950/[0.02] border border-emerald-900/[0.05]'
          }`}
        >
          <p
            className={`font-arabic text-right text-xl sm:text-2xl font-normal leading-[2.4] sm:leading-[2.6] select-text ${
              checked
                ? dark
                  ? 'text-emerald-200/90'
                  : 'text-emerald-950'
                : dark
                  ? 'text-stone-100'
                  : 'text-stone-900'
            }`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            {dua.ar}
          </p>
        </div>

        {/* Translation & Transliteration */}
        {expanded && (
          <div className="space-y-2 pt-1">
            {/* Transliteration */}
            {dua.transliteration && (
              <p
                className={`font-serif text-xs sm:text-[13px] leading-relaxed italic ${
                  dark ? 'text-emerald-300/80' : 'text-emerald-800/85'
                }`}
              >
                {dua.transliteration}
              </p>
            )}

            {/* English Translation */}
            {dua.en && (
              <p
                className={`text-xs sm:text-[13px] leading-relaxed ${
                  dark ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                &ldquo;{dua.en}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Completion Bar & Interactive Trigger */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pb-4 pt-1">
        {/* Expand/Collapse details toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
            dark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>{expanded ? 'Less' : 'Meaning & Pronunciation'}</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Completion Action Button */}
        <button
          type="button"
          onClick={() => onToggle(dua.id, soundEnabled)}
          aria-label={checked ? 'Completed. Click to undo.' : 'Mark complete'}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
            checked
              ? dark
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
              : dark
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                : 'border border-emerald-700/20 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-700/40'
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
              <span>Mark Done</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
