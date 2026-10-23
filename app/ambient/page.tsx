'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bird,
  BookOpen,
  Brain,
  Check,
  CloudRain,
  Headphones,
  Landmark,
  Moon,
  MoonStar,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trees,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import {
  updateMediaMetadata,
  setMediaPlaybackState,
  registerMediaActionHandlers,
} from '@/lib/mediaSession';
import {
  ambientEngine,
  AMBIENT_PRESETS,
  AMBIENT_TRACKS,
  type AmbientPreset,
  type AmbientTrackConfig,
  type AmbientTrackId,
} from '@/lib/ambientAudio';

const ICON_MAP = {
  CloudRain,
  Bird,
  Moon,
  Waves,
  Sparkles,
  Wind,
  Brain,
  Landmark,
  MoonStar,
  BookOpen,
  Trees,
};

const TIMER_PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m (Focus)', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
];

export default function AmbientPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [volumes, setVolumes] = useState<Record<AmbientTrackId, number>>(() => {
    const initial: Record<string, number> = {};
    AMBIENT_TRACKS.forEach((t) => {
      initial[t.id] = 0;
    });
    return initial as Record<AmbientTrackId, number>;
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Focus timer state
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerTotal, setTimerTotal] = useState<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Breathing & Dhikr Pacing guide
  const [breathingActive, setBreathingActive] = useState(true);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  // Canvas visualizer
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Audio visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = ambientEngine.getAnalyser();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 32;
        const barWidth = (width / barCount) * 0.7;
        const gap = (width / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i % bufferLength] / 255;
          const barHeight = Math.max(3, val * height * 0.9);
          const x = i * (barWidth + gap) + gap / 2;
          const y = (height - barHeight) / 2;

          // Gradient color: emerald to gold
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, dark ? '#34d399' : '#059669');
          grad.addColorStop(1, dark ? '#10b981' : '#047857');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 4);
          ctx.fill();
        }
      } else {
        // Idle gentle waveform
        ctx.strokeStyle = dark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const midY = height / 2;
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, dark]);

  // Handle Focus Timer countdown
  useEffect(() => {
    if (timerRemaining === null) return;

    if (timerRemaining <= 0) {
      // Completed timer!
      ambientEngine.playGong();
      handlePause();
      setTimerRemaining(null);
      setTimerTotal(null);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRemaining]);

  // Breathing guide cycle: 4s inhale, 2s hold, 4s exhale
  useEffect(() => {
    if (!breathingActive) return;

    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 10;
      if (step < 4) {
        setBreathPhase('inhale');
      } else if (step < 6) {
        setBreathPhase('hold');
      } else {
        setBreathPhase('exhale');
        if (step === 9) setBreathCount((c) => c + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive]);

  const handleStartAudio = async () => {
    await ambientEngine.resume();
    ambientEngine.setMasterVolume(masterVolume);

    // If no tracks have volume, load first preset
    const activeCount = Object.values(volumes).filter((v) => v > 0).length;
    if (activeCount === 0) {
      applyPreset(AMBIENT_PRESETS[0]);
    } else {
      Object.entries(volumes).forEach(([id, vol]) => {
        ambientEngine.setTrackVolume(id as AmbientTrackId, vol);
      });
    }
    setIsPlaying(true);

    const presetName = activePreset
      ? AMBIENT_PRESETS.find((p) => p.id === activePreset)?.name
      : 'Islamic Soundscape';

    updateMediaMetadata({
      title: presetName || 'Ambient Focus',
      artist: 'Dhikrly Islamic Soundscapes',
      album: 'Meditation & Focus · 100% Offline',
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    setMediaPlaybackState('playing');

    registerMediaActionHandlers({
      onPlay: () => handleStartAudio(),
      onPause: () => handlePause(),
      onStop: () => handlePause(),
    });
  };

  const handlePause = () => {
    ambientEngine.stopAll();
    setIsPlaying(false);
    setMediaPlaybackState('paused');
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handleStartAudio();
    }
  };

  const handleMasterVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    ambientEngine.setMasterVolume(newVol);
  };

  const handleTrackVolumeChange = async (id: AmbientTrackId, newVol: number) => {
    setVolumes((prev) => ({ ...prev, [id]: newVol }));
    setActivePreset(null);

    if (!isPlaying && newVol > 0) {
      await ambientEngine.resume();
      ambientEngine.setMasterVolume(masterVolume);
      setIsPlaying(true);
    }

    ambientEngine.setTrackVolume(id, newVol);
  };

  const applyPreset = async (preset: AmbientPreset) => {
    setActivePreset(preset.id);
    await ambientEngine.resume();
    ambientEngine.setMasterVolume(masterVolume);

    const nextVolumes: Record<AmbientTrackId, number> = { ...volumes };
    AMBIENT_TRACKS.forEach((t) => {
      const vol = preset.tracks[t.id] ?? 0;
      nextVolumes[t.id] = vol;
      ambientEngine.setTrackVolume(t.id, vol);
    });

    setVolumes(nextVolumes);
    setIsPlaying(true);
  };

  const startTimer = (seconds: number) => {
    setTimerRemaining(seconds);
    setTimerTotal(seconds);
    if (!isPlaying) handleStartAudio();
  };

  const cancelTimer = () => {
    setTimerRemaining(null);
    setTimerTotal(null);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm transition-all`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="ambient" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Headphones className="h-3.5 w-3.5" />
              <span>ISLAMIC AMBIENT SOUNDSCAPES</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Ambient & Dhikr Focus
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Calming acoustic soundscapes synthesized in real-time. Designed for deep Khushū‘, Qur’an recitation, Tahajjud, and tranquil contemplation.
            </p>
          </div>

          {/* Arabic Ayah */}
          <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-4 text-right">
            <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200" dir="rtl" lang="ar">
              أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ
            </p>
            <p className="text-xs text-[var(--app-muted)]">
              “Unquestionably, by the remembrance of Allah hearts are assured.” (13:28)
            </p>
          </div>
        </header>

        {/* Master Audio Control & Visualizer Hero */}
        <section className={`${cardClass} mb-8 p-6 relative overflow-hidden`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Visualizer & Status */}
            <div className="flex-1 w-full flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full transition-colors ${
                    isPlaying
                      ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse'
                      : 'bg-stone-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--app-ink)]">
                  {isPlaying ? 'Soundscape Active' : 'Soundscape Inactive'}
                </span>
                {activePreset && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Preset: {AMBIENT_PRESETS.find((p) => p.id === activePreset)?.name}
                  </span>
                )}
              </div>

              {/* Live Canvas Visualizer */}
              <div className="w-full h-16 rounded-2xl bg-black/5 dark:bg-black/30 overflow-hidden flex items-center justify-center p-2">
                <canvas ref={canvasRef} width={480} height={54} className="w-full h-full" />
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
              <button
                type="button"
                onClick={togglePlay}
                className={`flex h-16 min-w-44 items-center justify-center gap-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                  isPlaying
                    ? 'bg-emerald-800 text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25'
                }`}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                <span className="text-base">{isPlaying ? 'Pause All' : 'Start Focus'}</span>
              </button>

              {/* Master Volume */}
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-3 shadow-xs">
                {masterVolume === 0 ? (
                  <VolumeX className="h-4 w-4 text-[var(--app-muted)]" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--app-muted)] uppercase tracking-wider">
                    Master Volume ({Math.round(masterVolume * 100)}%)
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={masterVolume}
                    onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                    className="h-1.5 w-28 accent-emerald-600 cursor-pointer rounded-lg bg-stone-200 dark:bg-stone-700"
                    aria-label="Master volume"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Atmosphere Presets */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--app-ink)]">
              Curated Atmosphere Presets
            </h2>
            <span className="text-xs text-[var(--app-muted)]">Instant multi-track balance</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {AMBIENT_PRESETS.map((preset) => {
              const PresetIcon = ICON_MAP[preset.icon as keyof typeof ICON_MAP] || Sparkles;
              const isSelected = activePreset === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-[var(--app-line)] bg-[var(--app-surface)] hover:border-emerald-500/30 hover:bg-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                      <PresetIcon className="h-4 w-4" />
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <strong className="text-xs font-bold text-[var(--app-ink)]">{preset.name}</strong>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium" dir="rtl" lang="ar">
                    {preset.nameAr}
                  </span>
                  <p className="mt-1 text-[10px] text-[var(--app-muted)] line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Multi-track Soundboard */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--app-ink)]">
              Individual Sound Generators
            </h2>
            <button
              type="button"
              onClick={() => {
                const mutedVolumes: Record<string, number> = {};
                AMBIENT_TRACKS.forEach((t) => {
                  mutedVolumes[t.id] = 0;
                  ambientEngine.setTrackVolume(t.id, 0);
                });
                setVolumes(mutedVolumes as Record<AmbientTrackId, number>);
                setActivePreset(null);
              }}
              className="text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)] flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Mute all tracks
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AMBIENT_TRACKS.map((track) => {
              const TrackIcon = ICON_MAP[track.icon as keyof typeof ICON_MAP] || Sparkles;
              const volume = volumes[track.id] ?? 0;
              const isActive = volume > 0;

              return (
                <div
                  key={track.id}
                  className={`${cardClass} p-5 flex flex-col justify-between ${
                    isActive ? 'border-emerald-500/40 shadow-xs' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-2xl transition-colors ${
                          isActive
                            ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-sm'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--app-muted)]'
                        }`}
                      >
                        <TrackIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--app-ink)]">{track.name}</h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium" dir="rtl" lang="ar">
                          {track.nameAr}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTrackVolumeChange(track.id, isActive ? 0 : track.defaultVolume)}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold border transition-colors ${
                        isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                          : 'border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                      }`}
                    >
                      {isActive ? `${Math.round(volume * 100)}%` : 'Off'}
                    </button>
                  </div>

                  <p className="text-xs text-[var(--app-muted)] mb-4 leading-relaxed">
                    {track.description}
                  </p>

                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--app-line)]">
                    <VolumeX
                      className={`h-3.5 w-3.5 cursor-pointer ${
                        volume === 0 ? 'text-[var(--app-ink)] font-bold' : 'text-[var(--app-muted)]'
                      }`}
                      onClick={() => handleTrackVolumeChange(track.id, 0)}
                    />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={volume}
                      onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                      className="h-1.5 flex-1 accent-emerald-600 cursor-pointer rounded-lg bg-stone-200 dark:bg-stone-700"
                      aria-label={`${track.name} volume`}
                    />
                    <Volume2
                      className={`h-3.5 w-3.5 cursor-pointer ${
                        volume > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--app-muted)]'
                      }`}
                      onClick={() => handleTrackVolumeChange(track.id, track.defaultVolume)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Breathing / Dhikr Pacer & Focus Timer Dual Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Guided Dhikr Pacing Orb */}
          <section className={`${cardClass} p-6 flex flex-col items-center justify-between`}>
            <div className="w-full flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--app-ink)]">Dhikr Breathing Pacer</h2>
                <p className="text-xs text-[var(--app-muted)]">Rhythmic breath for heart presence (Hudūr)</p>
              </div>
              <button
                type="button"
                onClick={() => setBreathingActive(!breathingActive)}
                className={`text-xs px-3 py-1 rounded-xl font-bold border transition-colors ${
                  breathingActive
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-[var(--app-line)] text-[var(--app-muted)]'
                }`}
              >
                {breathingActive ? 'Active' : 'Paused'}
              </button>
            </div>

            {/* Glowing Orb Animation */}
            <div className="relative my-6 grid place-items-center h-48 w-48">
              <div
                className={`absolute inset-0 rounded-full bg-emerald-400/20 dark:bg-emerald-500/20 transition-all duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'scale-110 opacity-80'
                    : breathPhase === 'hold'
                    ? 'scale-105 opacity-90'
                    : 'scale-75 opacity-40'
                }`}
              />
              <div
                className={`grid h-36 w-36 place-items-center rounded-full border-2 border-emerald-500/40 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl transition-all duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'scale-105 shadow-emerald-500/50'
                    : breathPhase === 'hold'
                    ? 'scale-100 shadow-emerald-500/40 ring-4 ring-emerald-300/30'
                    : 'scale-90 shadow-emerald-900/30'
                }`}
              >
                <div className="text-center">
                  <span className="block text-xs uppercase tracking-wider opacity-85">
                    {breathPhase === 'inhale' && 'Inhale'}
                    {breathPhase === 'hold' && 'Hold'}
                    {breathPhase === 'exhale' && 'Exhale'}
                  </span>
                  <span className="block text-base font-extrabold mt-0.5">
                    {breathPhase === 'inhale' && 'سُبْحَانَ اللَّهِ'}
                    {breathPhase === 'hold' && 'الْحَمْدُ لِلَّهِ'}
                    {breathPhase === 'exhale' && 'اللَّهُ أَكْبَرُ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs text-[var(--app-muted)]">
                {breathCount} completed cycles · Inhale SubhanAllah, hold Alhamdulillah, exhale Allahu Akbar
              </span>
            </div>
          </section>

          {/* Focus & Sleep Timer */}
          <section className={`${cardClass} p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                <h2 className="text-sm font-bold text-[var(--app-ink)]">Focus & Sleep Timer</h2>
              </div>
              <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                Set a duration for your reading or meditation session. A soothing singing bowl gong will chime when time expires.
              </p>

              {/* Active countdown display */}
              {timerRemaining !== null ? (
                <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-900 dark:text-emerald-200">
                    {formatTimer(timerRemaining)}
                  </span>
                  <span className="block text-xs text-[var(--app-muted)] mt-1">
                    Remaining before peaceful stop
                  </span>
                  <button
                    type="button"
                    onClick={cancelTimer}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-bold text-[var(--app-ink)] shadow-xs"
                  >
                    Cancel Timer
                  </button>
                </div>
              ) : (
                <div className="my-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIMER_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => startTimer(p.seconds)}
                      className="rounded-xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 py-3 text-xs font-bold text-[var(--app-ink)] transition-colors hover:border-emerald-500 hover:bg-emerald-500/10"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-3 text-xs text-[var(--app-muted)] leading-relaxed">
              <strong className="text-[var(--app-ink)]">Tip:</strong> The sound generator runs entirely in your browser using procedural Web Audio synthesis — completely free of buffering, external downloads, and mobile data consumption.
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
