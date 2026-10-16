'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Footprints,
  Info,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { playCheck, playComplete } from '@/lib/sounds';
import {
  PILGRIMAGE_STEPS,
  TALBIYAH,
  TAWAF_DUA_YAMANI,
  SAFA_MARWAH_DUA,
  TAWAF_CIRCUITS_KEY,
  SAI_LAPS_KEY,
  type PilgrimageStep,
} from '@/lib/umrahData';
import {
  updateMediaMetadata,
  setMediaPlaybackState,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
  registerMediaActionHandlers,
} from '@/lib/mediaSession';

export default function UmrahPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  // Tawaf & Sa'i Live Counters
  const [tawafCircuit, setTawafCircuit] = useState(0);
  const [saiLap, setSaiLap] = useState(0);
  const [activeTab, setActiveTab] = useState<'guide' | 'tawaf' | 'sai'>('guide');

  // Talbiyah Audio Player State
  const [isTalbiyahPlaying, setIsTalbiyahPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const talbiyahTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Copied toast
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    setTawafCircuit(load<number>(TAWAF_CIRCUITS_KEY, 0));
    setSaiLap(load<number>(SAI_LAPS_KEY, 0));
  }, []);

  const handleIncrementTawaf = () => {
    if (tawafCircuit >= 7) {
      setTawafCircuit(0);
      save(TAWAF_CIRCUITS_KEY, 0);
      return;
    }
    const next = tawafCircuit + 1;
    setTawafCircuit(next);
    save(TAWAF_CIRCUITS_KEY, next);

    if (navigator.vibrate) {
      navigator.vibrate(next === 7 ? [150, 100, 250] : [80]);
    }

    if (next === 7) {
      playComplete();
    } else {
      playCheck();
    }
  };

  const handleResetTawaf = () => {
    setTawafCircuit(0);
    save(TAWAF_CIRCUITS_KEY, 0);
  };

  const handleIncrementSai = () => {
    if (saiLap >= 7) {
      setSaiLap(0);
      save(SAI_LAPS_KEY, 0);
      return;
    }
    const next = saiLap + 1;
    setSaiLap(next);
    save(SAI_LAPS_KEY, next);

    if (navigator.vibrate) {
      navigator.vibrate(next === 7 ? [150, 100, 250] : [80]);
    }

    if (next === 7) {
      playComplete();
    } else {
      playCheck();
    }
  };

  const handleResetSai = () => {
    setSaiLap(0);
    save(SAI_LAPS_KEY, 0);
  };

  const playTalbiyahAudio = () => {
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

      setIsTalbiyahPlaying(true);
      startBackgroundAudioKeepAlive();

      // Configure lockscreen & notification player
      updateMediaMetadata({
        title: 'Talbiyah (Labbayk Allāhumma Labbayk)',
        artist: 'Pilgrims Chanting · Sacred Makkah',
        album: 'Hajj & ‘Umrah Companion · Dhikrly',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      setMediaPlaybackState('playing');

      registerMediaActionHandlers({
        onPlay: playTalbiyahAudio,
        onPause: stopTalbiyahAudio,
        onStop: stopTalbiyahAudio,
      });

      // Procedural sacred harmonic chant melody
      const freqs = TALBIYAH.frequencies;
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.45);

        gain.gain.setValueAtTime(0, now + idx * 0.45);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.45 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.45 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.45);
        osc.stop(now + idx * 0.45 + 1.85);
      });

      // Voice recitation via speech synthesis if available
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(TALBIYAH.arabic);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }

      const totalDuration = freqs.length * 450 + 2000;

      if (talbiyahTimerRef.current) clearTimeout(talbiyahTimerRef.current);

      talbiyahTimerRef.current = setTimeout(() => {
        if (isLooping) {
          playTalbiyahAudio();
        } else {
          setIsTalbiyahPlaying(false);
          setMediaPlaybackState('none');
          stopBackgroundAudioKeepAlive();
        }
      }, totalDuration);
    } catch {
      // Audio fallback
    }
  };

  const stopTalbiyahAudio = () => {
    if (talbiyahTimerRef.current) clearTimeout(talbiyahTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTalbiyahPlaying(false);
    setMediaPlaybackState('none');
    stopBackgroundAudioKeepAlive();
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedText(true);
    playCheck();
    setTimeout(() => setCopiedText(false), 2000);
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-xs dark:bg-[#14211e]`;

  return (
    <AppShell active="umrah" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Compass className="h-3.5 w-3.5" />
              <span>THE SACRED PILGRIMAGE · مَنَاسِكُ الحَجِّ وَالعُمْرَةِ</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Hajj & ‘Umrah Pilgrim Companion
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-2xl">
              Your comprehensive, interactive companion for the sacred pilgrimage. Track your
              7-circuit Ṭawāf and 7-lap Sa‘ī with haptic counters, chant along with the Talbiyah
              player, and access authentic station du‘ās.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                if (isTalbiyahPlaying) {
                  stopTalbiyahAudio();
                } else {
                  playTalbiyahAudio();
                }
              }}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs transition-all ${
                isTalbiyahPlaying
                  ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                  : 'border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200'
              }`}
            >
              {isTalbiyahPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause Talbiyah</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play Talbiyah Chant</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── TALBIYAH BANNER & PLAYER ── */}
        <section
          className={`relative mb-8 overflow-hidden rounded-3xl border border-[var(--app-line)] p-6 sm:p-7 shadow-sm ${
            dark
              ? 'bg-gradient-to-br from-[#123329] via-[#142621] to-[#0d1815]'
              : 'bg-gradient-to-br from-[#e8f6ef] via-[#f4fbf7] to-[#ffffff]'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--app-line)]">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950">
                <Volume2 className="h-6 w-6" />
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  {isTalbiyahPlaying ? 'Chanting in Background' : 'The Sacred Anthem'}
                </span>
                <h2 className="text-base font-extrabold text-[var(--app-ink)]">
                  {TALBIYAH.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isLooping
                    ? 'bg-emerald-600 text-white'
                    : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                }`}
              >
                {isLooping ? 'Continuous Loop: ON' : 'Loop: OFF'}
              </button>

              <button
                type="button"
                onClick={() => copyText(TALBIYAH.arabic + '\n\n' + TALBIYAH.translation)}
                className="p-2 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                title="Copy Talbiyah"
              >
                {copiedText ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="my-5 text-right">
            <p
              className="font-arabic text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 leading-loose select-text"
              dir="rtl"
              lang="ar"
            >
              {TALBIYAH.arabic}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 italic text-left">
              {TALBIYAH.transliteration}
            </p>
            <p className="mt-1 text-xs text-[var(--app-ink)] text-left">
              “{TALBIYAH.translation}”
            </p>
          </div>
        </section>

        {/* ── TABS: GUIDE | LIVE TAWAF COUNTER | LIVE SA'I COUNTER ── */}
        <div className="mb-6 flex rounded-2xl border border-[var(--app-line)] p-1.5 bg-black/5 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'guide'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Step-by-Step Guide
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tawaf')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'tawaf'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Live Ṭawāf Counter (7)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sai')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'sai'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Live Sa‘ī Counter (7)
          </button>
        </div>

        {/* ── LIVE TAWAF COUNTER VIEW ── */}
        {activeTab === 'tawaf' && (
          <section className={`${cardClass} mb-8 p-6 text-center max-w-xl mx-auto`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Ṭawāf Around the Ka‘bah
              </span>
              <button
                type="button"
                onClick={handleResetTawaf}
                className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Giant Circular Circuit Tap Target */}
            <button
              type="button"
              onClick={handleIncrementTawaf}
              className="my-6 mx-auto grid h-52 w-52 place-items-center rounded-full border-8 border-emerald-500/30 bg-emerald-50 text-emerald-900 shadow-xl hover:scale-105 active:scale-95 transition-all dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              <div>
                <span className="text-6xl font-black">{tawafCircuit}</span>
                <span className="block text-sm font-extrabold uppercase tracking-widest mt-1 text-emerald-700 dark:text-emerald-400">
                  {tawafCircuit === 7 ? 'Completed! 🎉' : `Circuit ${tawafCircuit + 1} of 7`}
                </span>
                <span className="block text-[11px] text-[var(--app-muted)] mt-1">
                  Tap to advance
                </span>
              </div>
            </button>

            {/* Instruction for Current Circuit */}
            <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4 text-xs leading-relaxed text-left">
              {tawafCircuit < 3 ? (
                <p className="text-emerald-800 dark:text-emerald-300 font-bold">
                  ⚡ Circuits 1–3: Men uncover the right shoulder (Iḍṭibā‘) and walk with brisk,
                  short steps (Raml).
                </p>
              ) : tawafCircuit < 7 ? (
                <p className="text-[var(--app-ink)] font-bold">
                  🚶 Circuits 4–7: Walk at normal pace. Make constant personal du‘ā and istighfar.
                </p>
              ) : (
                <div className="text-center py-1">
                  <p className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                    Alhamdulillah! 7 circuits completed.
                  </p>
                  <p className="text-xs text-[var(--app-muted)] mt-1">
                    Cover both shoulders and proceed behind Maqām Ibrāhīm to pray 2 light rak‘ahs.
                  </p>
                </div>
              )}
            </div>

            {/* Essential Du'a for every circuit */}
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-left">
              <strong className="block text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                Between the Yemeni Corner (Rukn al-Yamani) & Black Stone:
              </strong>
              <p className="font-arabic text-lg font-bold text-right text-[var(--app-ink)] my-1" dir="rtl">
                {TAWAF_DUA_YAMANI.arabic}
              </p>
              <p className="italic text-emerald-900 dark:text-emerald-200 font-medium">
                {TAWAF_DUA_YAMANI.transliteration}
              </p>
              <p className="text-[var(--app-ink)] mt-0.5">“{TAWAF_DUA_YAMANI.translation}”</p>
            </div>
          </section>
        )}

        {/* ── LIVE SA'I COUNTER VIEW ── */}
        {activeTab === 'sai' && (
          <section className={`${cardClass} mb-8 p-6 text-center max-w-xl mx-auto`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Sa‘ī Between Safā and Marwah
              </span>
              <button
                type="button"
                onClick={handleResetSai}
                className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Giant Circular Lap Tap Target */}
            <button
              type="button"
              onClick={handleIncrementSai}
              className="my-6 mx-auto grid h-52 w-52 place-items-center rounded-full border-8 border-teal-500/30 bg-teal-50 text-teal-900 shadow-xl hover:scale-105 active:scale-95 transition-all dark:bg-teal-500/10 dark:text-teal-200"
            >
              <div>
                <span className="text-6xl font-black">{saiLap}</span>
                <span className="block text-sm font-extrabold uppercase tracking-widest mt-1 text-teal-700 dark:text-teal-400">
                  {saiLap === 7 ? 'Completed! 🎉' : `Lap ${saiLap + 1} of 7`}
                </span>
                <span className="block text-[11px] text-[var(--app-muted)] mt-1">
                  Tap to advance
                </span>
              </div>
            </button>

            {/* Direction indicator */}
            <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4 text-xs text-left">
              {saiLap < 7 ? (
                <div>
                  <span className="font-extrabold text-sm text-[var(--app-ink)] block">
                    Current Course: {saiLap % 2 === 0 ? 'Safā ➔ Marwah' : 'Marwah ➔ Safā'}
                  </span>
                  <p className="text-[var(--app-muted)] mt-1">
                    🟢 Green Pillar Corridor: Men jog gently with hastened pace between the green lights.
                  </p>
                </div>
              ) : (
                <div className="text-center py-1">
                  <p className="text-teal-700 dark:text-teal-300 font-extrabold text-sm">
                    Mabrooq! All 7 laps completed at Mount Marwah.
                  </p>
                  <p className="text-xs text-[var(--app-muted)] mt-1">
                    Now proceed to Halq (shaving) or Taqsir (hair trimming) to complete your ‘Umrah.
                  </p>
                </div>
              )}
            </div>

            {/* Du'a Atop Mount Safa / Marwah */}
            <div className="mt-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs text-left">
              <strong className="block text-teal-800 dark:text-teal-300 font-bold mb-1">
                Du‘ā Atop Safā and Marwah (Facing Ka‘bah):
              </strong>
              <p className="font-arabic text-base font-bold text-right text-[var(--app-ink)] my-1" dir="rtl">
                {SAFA_MARWAH_DUA.arabic}
              </p>
              <p className="text-[var(--app-ink)] mt-1">“{SAFA_MARWAH_DUA.translation}”</p>
            </div>
          </section>
        )}

        {/* ── STEP-BY-STEP COMPLETE PILGRIMAGE GUIDE ── */}
        {activeTab === 'guide' && (
          <section className="space-y-4 mb-8">
            {PILGRIMAGE_STEPS.map((step) => (
              <div key={step.id} className={`${cardClass} p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white font-black text-sm dark:bg-emerald-400 dark:text-emerald-950">
                      {step.number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold font-arabic mt-0.5" dir="rtl">
                        {step.titleAr}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[var(--app-muted)] self-start sm:self-auto">
                    <MapPin className="h-3 w-3" />
                    <span>{step.location}</span>
                  </span>
                </div>

                <p className="text-xs text-[var(--app-muted)] leading-relaxed mb-3">
                  {step.desc}
                </p>

                {/* Arabic Supplication if applicable */}
                {step.arabicText && (
                  <div className="my-3 rounded-2xl bg-black/5 dark:bg-white/5 p-4 text-right">
                    <p className="font-arabic text-lg font-bold text-[var(--app-ink)] leading-loose" dir="rtl">
                      {step.arabicText}
                    </p>
                    {step.transliteration && (
                      <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 italic text-left">
                        {step.transliteration}
                      </p>
                    )}
                    {step.translation && (
                      <p className="mt-1 text-xs text-[var(--app-ink)] text-left">
                        “{step.translation}”
                      </p>
                    )}
                  </div>
                )}

                {/* Virtue & Warning Alert */}
                <div className="pt-3 border-t border-[var(--app-line)] flex flex-col gap-2 text-xs">
                  <div className="flex items-start gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Virtue: {step.virtue}</span>
                  </div>

                  {step.ruleWarning && (
                    <div className="flex items-start gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-800 dark:text-amber-200 font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{step.ruleWarning}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
