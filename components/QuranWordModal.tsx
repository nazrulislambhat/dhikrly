'use client';

import { useState } from 'react';
import { Volume2, X, BookOpen, Sparkles } from 'lucide-react';
import { playWordAudio, type QuranWord } from '@/lib/quranWbw';

interface QuranWordModalProps {
  dark: boolean;
  word: QuranWord | null;
  surahNumber: number;
  ayahNumber: number;
  onClose: () => void;
}

export default function QuranWordModal({
  dark,
  word,
  surahNumber,
  ayahNumber,
  onClose,
}: QuranWordModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!word) return null;

  const handlePlay = () => {
    setIsPlaying(true);
    playWordAudio(word.audioUrl, word.text);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const overlay = dark ? 'bg-black/60 backdrop-blur-sm' : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'border-white/10 bg-[#14211e] text-stone-100 shadow-2xl'
    : 'border-stone-200 bg-white text-stone-900 shadow-xl';

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-sm rounded-3xl border p-6 ${panel} relative text-center`}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close word details"
          className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ayah Location Chip */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-4">
          <BookOpen className="h-3 w-3" />
          <span>
            Surah {surahNumber}:{ayahNumber} · Word {word.position}
          </span>
        </div>

        {/* Big Arabic Word Display */}
        <div className="my-2 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--app-line)]">
          <p className="font-arabic text-4xl sm:text-5xl font-bold leading-relaxed text-emerald-900 dark:text-emerald-200">
            {word.text}
          </p>
        </div>

        {/* Transliteration */}
        {word.transliteration && (
          <p className="mt-2 text-sm italic font-medium text-[var(--app-muted)]">
            “{word.transliteration}”
          </p>
        )}

        {/* English Translation */}
        <div className="mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
            Word Translation
          </span>
          <p className="mt-0.5 text-lg font-extrabold text-[var(--app-ink)]">
            {word.translation || '—'}
          </p>
        </div>

        {/* Isolated Audio Pronunciation Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handlePlay}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 ${
              isPlaying
                ? 'bg-emerald-600 text-white animate-pulse'
                : 'bg-emerald-800 text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300'
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>Hear Pronunciation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
