'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  CircleDot,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Undo2,
  Volume2,
  VolumeX,
  Vibrate,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { playCheck, playComplete } from '@/lib/sounds';

interface DhikrPreset {
  id: string;
  name: string;
  nameAr: string;
  transliteration: string;
  meaning: string;
  defaultTarget: number;
}

const DHIKR_PRESETS: DhikrPreset[] = [
  {
    id: 'subhanallah',
    name: 'Subḥān Allāh',
    nameAr: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subḥānallāh',
    meaning: 'Glory be to Allah',
    defaultTarget: 33,
  },
  {
    id: 'alhamdulillah',
    name: 'Al-ḥamdu Lillāh',
    nameAr: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Al-ḥamdu lillāh',
    meaning: 'All praise is due to Allah',
    defaultTarget: 33,
  },
  {
    id: 'allahuakbar',
    name: 'Allāhu Akbar',
    nameAr: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allāhu Akbar',
    meaning: 'Allah is the Greatest',
    defaultTarget: 34,
  },
  {
    id: 'astaghfirullah',
    name: 'Astaghfirullāh',
    nameAr: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullāh',
    meaning: 'I seek Allah’s forgiveness',
    defaultTarget: 100,
  },
  {
    id: 'lailahaillallah',
    name: 'Lā Ilāha Illallāh',
    nameAr: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'Lā ilāha illallāh',
    meaning: 'There is no deity but Allah',
    defaultTarget: 100,
  },
  {
    id: 'salawat',
    name: 'Ṣalawāt ‘alā an-Nabī',
    nameAr: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allāhumma ṣalli ‘alā Muḥammad',
    meaning: 'O Allah, send blessings upon Muhammad',
    defaultTarget: 100,
  },
  {
    id: 'subhanallahi-wabihamdihi',
    name: 'Subḥānallāhi wa Bi-ḥamdihi',
    nameAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subḥānallāhi wa bi-ḥamdih',
    meaning: 'Glory be to Allah and His is the praise',
    defaultTarget: 100,
  },
  {
    id: 'free',
    name: 'Open Counter (No Target)',
    nameAr: 'ذِكْرٌ مُطْلَقٌ',
    transliteration: 'Dhikr Mutlaq',
    meaning: 'Free counting without target limit',
    defaultTarget: 0,
  },
];

const LIFETIME_STATS_KEY = 'dhikrly_tasbeeh_lifetime_v1';

export default function TasbeehPage() {
  const [dark, setDark] = useState<boolean>(false);

  const [activePreset, setActivePreset] = useState<DhikrPreset>(DHIKR_PRESETS[0]);
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [rounds, setRounds] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [completedCelebration, setCompletedCelebration] = useState<boolean>(false);

  // Auto-cycle routine: SubhanAllah 33 -> Alhamdulillah 33 -> Allahu Akbar 34
  const [sequenceMode, setSequenceMode] = useState<boolean>(false);
  const [sequenceStep, setSequenceStep] = useState<number>(0);

  // Lifetime counts
  const [lifetimeTotal, setLifetimeTotal] = useState<number>(0);

  useEffect(() => {
    const savedDark = load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark;
    setDark(savedDark);
    try {
      const stored = window.localStorage.getItem(LIFETIME_STATS_KEY);
      if (stored) setLifetimeTotal(parseInt(stored, 10) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Gentle tactile bead click synthesizer
  const playBeadClick = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 + Math.random() * 50, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  const handleIncrement = useCallback(() => {
    playBeadClick();

    if (vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore
      }
    }

    setHistory((prev) => [...prev.slice(-30), count]);
    const nextCount = count + 1;
    setCount(nextCount);

    const newLifetime = lifetimeTotal + 1;
    setLifetimeTotal(newLifetime);
    try {
      window.localStorage.setItem(LIFETIME_STATS_KEY, String(newLifetime));
    } catch {
      // Ignore
    }

    // Target completion check
    if (target > 0 && nextCount >= target) {
      playComplete();
      if (vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 50, 40, 50, 80]);
        } catch {
          // Ignore
        }
      }
      setRounds((r) => r + 1);
      setCompletedCelebration(true);
      setTimeout(() => setCompletedCelebration(false), 2500);

      if (sequenceMode) {
        // Step forward in post-salah routine
        if (sequenceStep === 0) {
          // Move from SubhanAllah -> Alhamdulillah
          setSequenceStep(1);
          setActivePreset(DHIKR_PRESETS[1]);
          setTarget(33);
          setCount(0);
        } else if (sequenceStep === 1) {
          // Move from Alhamdulillah -> Allahu Akbar
          setSequenceStep(2);
          setActivePreset(DHIKR_PRESETS[2]);
          setTarget(34);
          setCount(0);
        } else {
          // Completed full 100!
          setSequenceStep(0);
          setActivePreset(DHIKR_PRESETS[0]);
          setTarget(33);
          setCount(0);
        }
      } else {
        setCount(0);
      }
    }
  }, [count, target, lifetimeTotal, playBeadClick, vibrateEnabled, sequenceMode, sequenceStep]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCount(previous);
  }, [history]);

  const handleReset = useCallback(() => {
    setCount(0);
    setRounds(0);
    setHistory([]);
  }, []);

  const selectPreset = (preset: DhikrPreset) => {
    setActivePreset(preset);
    setTarget(preset.defaultTarget);
    setCount(0);
    setSequenceMode(false);
  };

  const startPostSalahSequence = () => {
    setSequenceMode(true);
    setSequenceStep(0);
    setActivePreset(DHIKR_PRESETS[0]);
    setTarget(33);
    setCount(0);
    setRounds(0);
  };

  // Keyboard navigation: Spacebar / Enter to count
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrement, handleUndo, handleReset]);

  // Circular SVG progress ring calculation
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = target > 0 ? Math.min(1, count / target) : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="tasbeeh" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className={`mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4 ${isFullScreen ? 'max-w-2xl' : ''}`}>
        {/* Header (hidden in full-screen mode) */}
        {!isFullScreen && (
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CircleDot className="h-3.5 w-3.5" />
                <span>DIGITAL TASBĪḤ & REMEMBRANCE</span>
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
                Tasbīḥ Counter
              </h1>
              <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
                A tactile, responsive digital counter for daily dhikr with haptic feedback, acoustic clicks, and post-ṣalāh auto sequence.
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startPostSalahSequence}
                className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                  sequenceMode
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-xs'
                    : 'border-[var(--app-line)] bg-[var(--app-surface)] hover:bg-emerald-500/10'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Post-Ṣalāh 100 Dhikr Routine</span>
              </button>
            </div>
          </header>
        )}

        {/* Preset Selector Bar */}
        {!isFullScreen && (
          <section className="mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {DHIKR_PRESETS.map((p) => {
                const isSelected = activePreset.id === p.id && !sequenceMode;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                        : 'border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.defaultTarget > 0 && (
                      <span className="opacity-70 text-[11px]">({p.defaultTarget}×)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Sequence Mode Banner */}
        {sequenceMode && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs">
                {sequenceStep + 1}/3
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--app-ink)]">
                  Post-Ṣalāh Sequence: Step {sequenceStep + 1}
                </p>
                <p className="text-[11px] text-[var(--app-muted)]">
                  {sequenceStep === 0 && '33× Subḥān Allāh (Glory be to Allah)'}
                  {sequenceStep === 1 && '33× Al-ḥamdu Lillāh (All praise to Allah)'}
                  {sequenceStep === 2 && '34× Allāhu Akbar (Allah is the Greatest)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSequenceMode(false)}
              className="text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline"
            >
              Exit Routine
            </button>
          </div>
        )}

        {/* Main Interactive Tasbeeh Bead Dial Hero */}
        <section className={`${cardClass} p-8 flex flex-col items-center justify-center relative overflow-hidden mb-8`}>
          {/* Top Control Bar */}
          <div className="w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-[var(--app-line)] text-stone-400'
                }`}
                title={soundEnabled ? 'Mute click sound' : 'Enable click sound'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setVibrateEnabled(!vibrateEnabled)}
                className={`p-2 rounded-xl border transition-colors ${
                  vibrateEnabled
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-[var(--app-line)] text-stone-400'
                }`}
                title={vibrateEnabled ? 'Disable haptics' : 'Enable haptics'}
              >
                <Vibrate className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs font-bold text-[var(--app-muted)]">
              {rounds} {rounds === 1 ? 'round' : 'rounds'} completed
            </span>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl border border-[var(--app-line)] text-stone-500 hover:text-stone-900 transition-colors"
              title="Toggle full screen immersion"
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Active Dhikr Title & Meaning */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--app-ink)] font-arabic" dir="rtl" lang="ar">
              {activePreset.nameAr}
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {activePreset.transliteration}
            </p>
            <p className="text-xs text-[var(--app-muted)] mt-0.5">
              “{activePreset.meaning}”
            </p>
          </div>

          {/* Giant Tactile Tap Circle Button */}
          <div className="relative my-5 select-none touch-manipulation">
            {/* SVG Circular Progress Ring */}
            <svg className="h-80 w-80 -rotate-90 transform drop-shadow-md" viewBox="0 0 260 260">
              {/* Background Track Ring */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                className="stroke-stone-200/80 dark:stroke-white/10"
                strokeWidth="8"
                fill="none"
              />
              {/* Animated Progress Ring */}
              {target > 0 && (
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-200 [stroke-linecap:round]"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  style={{
                    filter: progressRatio === 1 ? 'drop-shadow(0 0 8px rgba(52,211,153,0.8))' : 'none',
                  }}
                />
              )}
            </svg>

            {/* Inner Tap Circle Dial */}
            <button
              type="button"
              onClick={handleIncrement}
              className={`tap-bounce absolute inset-5 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 ${
                completedCelebration
                  ? 'bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 text-white animate-bounce shadow-amber-500/40'
                  : 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white hover:from-emerald-600 hover:to-teal-800 dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-600 dark:shadow-emerald-950/60'
              }`}
              aria-label="Tap to count dhikr (or press Spacebar)"
            >
              <span className="font-display text-6xl sm:text-7xl font-extrabold tracking-tight tabular-nums drop-shadow-sm">
                {count}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest opacity-80 font-bold">
                {target > 0 ? `of ${target}` : 'Free Count'}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                Tap anywhere or press Space
              </span>
            </button>
          </div>

          {/* Bottom Actions: Undo & Reset */}
          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs transition-colors hover:bg-black/5 disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" /> Undo tap
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-red-600 shadow-xs transition-colors hover:bg-red-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset count
            </button>
          </div>

          <p className="mt-4 text-[11px] text-[var(--app-muted)]">
            Tip: Press Spacebar or Enter on your keyboard to count rapidly
          </p>
        </section>

        {/* Target Presets & Lifetime Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Target Changer */}
          <div className={`${cardClass} p-5`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              Change Target Limit
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {[33, 99, 100, 1000].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    target === t
                      ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                      : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                  }`}
                >
                  {t}×
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTarget(0)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  target === 0
                    ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                    : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                }`}
              >
                No limit
              </button>
            </div>
          </div>

          {/* Lifetime Counter */}
          <div className={`${cardClass} p-5`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
              All-Time Dhikr Counted
            </span>
            <div suppressHydrationWarning className="mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {lifetimeTotal.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Saved locally on your device across all sessions
            </p>
          </div>

          {/* Virtues of Remembrance */}
          <div className={`${cardClass} p-5 flex flex-col justify-between`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Virtue of Dhikr
              </span>
              <p className="mt-2 text-xs text-[var(--app-ink)] italic leading-relaxed">
                “The comparison of the one who remembers Allah and the one who does not is like that of the living and the dead.”
              </p>
            </div>
            <span className="text-[10px] text-[var(--app-muted)] mt-2">— Sahih al-Bukhari (6407)</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
