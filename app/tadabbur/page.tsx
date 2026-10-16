'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  Compass,
  Copy,
  Heart,
  HelpCircle,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';
import { playCheck } from '@/lib/sounds';
import {
  SITUATIONAL_DUAS,
  EMOTION_TAGS,
  type SituationalDua,
  type EmotionCategory,
} from '@/lib/situationsData';
import {
  updateMediaMetadata,
  setMediaPlaybackState,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
  registerMediaActionHandlers,
} from '@/lib/mediaSession';

export default function TadabburPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [selectedCategory, setSelectedCategory] = useState<EmotionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio Playback State
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const handleCopy = (dua: SituationalDua) => {
    const text = `${dua.title}\n\n${dua.arabicText}\n\n${dua.transliteration}\n\n“${dua.translation}”\n\nVirtue: ${dua.virtue}\nSource: ${dua.hadithReference}`;
    navigator.clipboard.writeText(text);
    setCopiedId(dua.id);
    playCheck();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const playDuaAudio = (dua: SituationalDua) => {
    if (activeAudioId === dua.id) {
      stopAudio();
      return;
    }

    try {
      if (typeof window === 'undefined') return;

      if (!audioCtxRef.current) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtxClass();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      setActiveAudioId(dua.id);
      startBackgroundAudioKeepAlive();

      // Configure MediaSession for lockscreen
      updateMediaMetadata({
        title: dua.title,
        artist: `${dua.emotionLabel} · ${dua.hadithReference}`,
        album: 'Prophetic Situational Du‘ās · Dhikrly',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      setMediaPlaybackState('playing');

      registerMediaActionHandlers({
        onPlay: () => playDuaAudio(dua),
        onPause: stopAudio,
        onStop: stopAudio,
      });

      // Harmonic sacred melody
      const freqs = dua.frequencies;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.35);

        gain.gain.setValueAtTime(0, now + idx * 0.35);
        gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.35 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.35);
        osc.stop(now + idx * 0.35 + 1.55);
      });

      // Also speak the Arabic supplication if supported
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(dua.arabicText);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.82;
        window.speechSynthesis.speak(utterance);
      }

      const totalDurationMs = freqs.length * 350 + 1600;

      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      audioTimerRef.current = setTimeout(() => {
        setActiveAudioId(null);
        setMediaPlaybackState('none');
        stopBackgroundAudioKeepAlive();
      }, totalDurationMs);
    } catch {
      // Audio fallback
    }
  };

  const stopAudio = () => {
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveAudioId(null);
    setMediaPlaybackState('none');
    stopBackgroundAudioKeepAlive();
  };

  const filteredDuas = useMemo(() => {
    return SITUATIONAL_DUAS.filter((dua) => {
      if (selectedCategory !== 'all' && dua.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        dua.title.toLowerCase().includes(q) ||
        dua.emotionLabel.toLowerCase().includes(q) ||
        dua.translation.toLowerCase().includes(q) ||
        dua.transliteration.toLowerCase().includes(q) ||
        dua.context.toLowerCase().includes(q) ||
        dua.arabicText.includes(searchQuery)
      );
    });
  }, [selectedCategory, searchQuery]);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-xs dark:bg-[#14211e]`;

  return (
    <AppShell active="tadabbur" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>DAILY TADABBUR & SITUATION-BASED DU‘Ā FINDER</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
            What is your heart carrying today?
          </h1>
          <p className="mt-1 text-sm text-[var(--app-muted)] max-w-2xl">
            Filter authentic prophetic supplications by your current emotional state or life moment.
            Find instant solace, hear the audio recitation, and read practical Sunnah action steps.
          </p>
        </header>

        {/* ── DAILY TADABBUR SPOTLIGHT BANNER ── */}
        <section
          className={`mb-8 overflow-hidden rounded-3xl border border-[var(--app-line)] p-6 sm:p-7 shadow-sm ${
            dark
              ? 'bg-gradient-to-br from-[#123329] via-[#142621] to-[#0d1815]'
              : 'bg-gradient-to-br from-[#eafaf1] via-[#f4fbf7] to-[#ffffff]'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Today’s Spiritual Contemplation (Tadabbur)</span>
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-[var(--app-ink)]">
                “When you ask, ask Allah; when you seek help, seek help from Allah.”
              </h2>
              <p className="mt-1 text-xs text-[var(--app-muted)] max-w-2xl leading-relaxed">
                Remember that no sadness lasts forever, and no trial is placed upon you except that
                the cure, ease, and divine compensation have already been authored.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const random =
                  SITUATIONAL_DUAS[Math.floor(Math.random() * SITUATIONAL_DUAS.length)];
                playDuaAudio(random);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:scale-105 active:scale-95 transition-all dark:bg-emerald-400 dark:text-emerald-950 shrink-0 self-start md:self-auto"
            >
              <Volume2 className="h-4 w-4" />
              <span>Surprise Du‘ā Audio</span>
            </button>
          </div>
        </section>

        {/* ── MOOD & SITUATION CHIPS ── */}
        <section className="mb-6">
          <span className="text-xs font-bold text-[var(--app-ink)] block mb-2">
            Select Your State or Situation:
          </span>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {EMOTION_TAGS.map((tag) => {
                const isSelected = selectedCategory === tag.key;
                const count =
                  tag.key === 'all'
                    ? SITUATIONAL_DUAS.length
                    : SITUATIONAL_DUAS.filter((d) => d.category === tag.key).length;

                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => setSelectedCategory(tag.key)}
                    className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                        : 'border-[var(--app-line)] bg-black/5 text-[var(--app-muted)] hover:text-[var(--app-ink)] dark:bg-white/5'
                    }`}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SEARCH INPUT ── */}
        <div className="mb-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, symptoms, or situation (e.g. debt, sadness, exam, headache, fear)…"
            className="w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 pl-10 pr-4 py-2.5 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
          />
        </div>

        {/* ── SITUATIONAL DU‘A CARDS ── */}
        <section className="space-y-4 mb-8">
          {filteredDuas.map((dua) => {
            const isPlaying = activeAudioId === dua.id;
            const isCopied = copiedId === dua.id;

            return (
              <div
                key={dua.id}
                className={`${cardClass} p-6 transition-all ${
                  isPlaying ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                }`}
              >
                {/* Top: Mood Badge & Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      <span>{dua.emotionEmoji}</span>
                      <span>{dua.emotionLabel}</span>
                    </span>
                    <span className="text-xs text-[var(--app-muted)] font-medium">
                      {dua.hadithReference}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playDuaAudio(dua)}
                      className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                        isPlaying
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                          : 'border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Listen & Recite</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(dua)}
                      className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      title="Copy du‘ā"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-[var(--app-ink)] mb-2">
                  {dua.title}
                </h3>

                <p className="text-xs text-[var(--app-muted)] italic mb-4 leading-relaxed">
                  📜 Background Context: {dua.context}
                </p>

                {/* Arabic Text Block */}
                <div className="my-4 rounded-2xl bg-black/5 dark:bg-white/5 p-4 text-right">
                  <p
                    className="font-arabic text-xl sm:text-2xl font-bold text-[var(--app-ink)] leading-loose select-text"
                    dir="rtl"
                    lang="ar"
                  >
                    {dua.arabicText}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 italic text-left leading-relaxed">
                    {dua.transliteration}
                  </p>
                  <p className="mt-2 text-xs text-[var(--app-ink)] text-left leading-relaxed">
                    “{dua.translation}”
                  </p>
                </div>

                {/* Virtue & Action Tip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--app-line)] text-xs">
                  <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-3">
                    <strong className="block text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                      ✨ Promised Virtue:
                    </strong>
                    <span className="text-[var(--app-muted)]">{dua.virtue}</span>
                  </div>

                  <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-3">
                    <strong className="block text-[var(--app-ink)] font-bold mb-1">
                      💡 Sunnah Practical Tip:
                    </strong>
                    <span className="text-[var(--app-muted)]">{dua.actionTip}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
