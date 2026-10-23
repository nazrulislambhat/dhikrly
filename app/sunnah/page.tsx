'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  HeartHandshake,
  MoonStar,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import { playCheck, playComplete } from '@/lib/sounds';
import {
  SUNNAH_ITEMS,
  SUNNAH_CATEGORIES,
  SUNNAH_STORAGE_KEY,
  SUNNAH_NOTIF_SETTINGS_KEY,
  DEFAULT_SUNNAH_NOTIFS,
  type SunnahItem,
  type SunnahCategory,
  type SunnahNotificationSettings,
} from '@/lib/sunnahData';
import { sunnahAudioEngine } from '@/lib/sunnahAudio';
import { fireNotification } from '@/components/NotificationSettings';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  Clock3,
  HeartHandshake,
  Sun,
  MoonStar,
  BookOpen,
  CalendarCheck,
};

export default function SunnahPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [activeCategory, setActiveCategory] = useState<SunnahCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Daily Completed Sunnahs: Record<id, boolean>
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  // Audio Notification Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSunnah, setCurrentSunnah] = useState<SunnahItem>(SUNNAH_ITEMS[0]);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [notificationTestSent, setNotificationTestSent] = useState(false);

  // Notification Settings
  const [notifSettings, setNotifSettings] = useState<SunnahNotificationSettings>(() =>
    load<SunnahNotificationSettings>(SUNNAH_NOTIF_SETTINGS_KEY, DEFAULT_SUNNAH_NOTIFS),
  );
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Load completed sunnahs for today
  useEffect(() => {
    const raw = load<Record<string, boolean>>(`${SUNNAH_STORAGE_KEY}${todayKey}`, {});
    setCompleted(raw);
  }, [todayKey]);

  // Connect Sunnah Audio Engine listener
  useEffect(() => {
    sunnahAudioEngine.setOnStateChange((playing, item) => {
      setIsPlaying(playing);
      if (item) setCurrentSunnah(item);
    });

    return () => {
      sunnahAudioEngine.stop();
    };
  }, []);

  // Audio visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = sunnahAudioEngine.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 36;
      const barWidth = canvas.width / barCount;

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * bufferLength);
          const val = dataArray[index] / 255;
          const barHeight = Math.max(4, val * canvas.height * 0.88);

          const x = i * barWidth;
          const y = (canvas.height - barHeight) / 2;

          ctx.fillStyle = dark
            ? `rgba(66, 201, 158, ${0.35 + val * 0.65})`
            : `rgba(22, 128, 90, ${0.4 + val * 0.6})`;

          ctx.beginPath();
          ctx.roundRect(x + 1, y, Math.max(2, barWidth - 2), barHeight, 4);
          ctx.fill();
        }
      } else {
        // Subtle resting idle pulse
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth;
          const idleH = 4 + Math.sin(Date.now() * 0.003 + i * 0.3) * 3;
          const y = (canvas.height - idleH) / 2;

          ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
          ctx.beginPath();
          ctx.roundRect(x + 1, y, Math.max(2, barWidth - 2), idleH, 3);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, dark]);

  const handleToggleCompleted = (id: string) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    save(`${SUNNAH_STORAGE_KEY}${todayKey}`, next);

    if (next[id]) {
      playCheck();
    }
  };

  const handlePlaySunnah = (item: SunnahItem) => {
    if (isPlaying && currentSunnah.id === item.id) {
      sunnahAudioEngine.pause();
    } else {
      setCurrentSunnah(item);
      sunnahAudioEngine.playSunnah(item);
    }
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      sunnahAudioEngine.pause();
    } else {
      sunnahAudioEngine.playSunnah(currentSunnah);
    }
  };

  const handleNextTrack = () => {
    const currentIndex = SUNNAH_ITEMS.findIndex((i) => i.id === currentSunnah.id);
    const nextIndex = (currentIndex + 1) % SUNNAH_ITEMS.length;
    const next = SUNNAH_ITEMS[nextIndex];
    setCurrentSunnah(next);
    if (isPlaying) {
      sunnahAudioEngine.playSunnah(next);
    }
  };

  const handlePrevTrack = () => {
    const currentIndex = SUNNAH_ITEMS.findIndex((i) => i.id === currentSunnah.id);
    const prevIndex = (currentIndex - 1 + SUNNAH_ITEMS.length) % SUNNAH_ITEMS.length;
    const prev = SUNNAH_ITEMS[prevIndex];
    setCurrentSunnah(prev);
    if (isPlaying) {
      sunnahAudioEngine.playSunnah(prev);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sunnahAudioEngine.setVolume(newVol);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    sunnahAudioEngine.setPlaybackRate(rate);
  };

  const handleLoopToggle = () => {
    const next = !isLooping;
    setIsLooping(next);
    sunnahAudioEngine.setRepeat(next);
  };

  const handleCopy = (item: SunnahItem) => {
    const text = `${item.title} (${item.titleAr})\n\n${item.arabicText || ''}\n\n${
      item.transliteration || ''
    }\n\n${item.translation || item.desc}\n\nVirtue: ${item.virtue}\nReference: ${item.reference}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveNotifSettings = (newSettings: SunnahNotificationSettings) => {
    setNotifSettings(newSettings);
    save(SUNNAH_NOTIF_SETTINGS_KEY, newSettings);
  };

  const handleTestNotification = async () => {
    setNotificationTestSent(true);
    playCheck();

    // Trigger browser notification
    await fireNotification(
      `Sunnah Reminder · ${currentSunnah.title} 🌙`,
      {
        body: `${currentSunnah.titleAr} · ${currentSunnah.virtue}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `dhikrly-sunnah-${currentSunnah.id}`,
        data: { url: '/sunnah' },
        vibrate: [120, 80, 120, 80, 240],
      },
    );

    // Also trigger audio player
    if (!isPlaying) {
      sunnahAudioEngine.playSunnah(currentSunnah);
    }

    setTimeout(() => setNotificationTestSent(false), 3000);
  };

  // Filtered items
  const filteredSunnahs = useMemo(() => {
    return SUNNAH_ITEMS.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.titleAr.includes(searchQuery) ||
        item.desc.toLowerCase().includes(q) ||
        item.virtue.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  // Overall Completion stats
  const totalCount = SUNNAH_ITEMS.length;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-xs`;

  return (
    <AppShell active="sunnah" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>REVIVE THE PROPHETIC TRADITION · إِحْيَاءُ السُّنَّةِ</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Daily Sunnah & Notification Player
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-2xl">
              Track authentic daily Sunnahs, listen to continuous prophetic supplications with
              lockscreen background audio, and configure scheduled reminders for Duḥā, Rawātib,
              and Tahajjud.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-emerald-500/10 transition-colors"
            >
              <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Notification Reminders</span>
            </button>
          </div>
        </header>

        {/* ── NOTIFICATION DRAWER / SCHEDULER PANEL ── */}
        {showNotifDrawer && (
          <section className={`${cardClass} mb-8 p-6 transition-all`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--app-line)]">
              <div>
                <h2 className="text-base font-extrabold text-[var(--app-ink)] flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sunnah Notification Scheduler</span>
                </h2>
                <p className="text-xs text-[var(--app-muted)]">
                  Receive timed gentle alerts with authentic hadiths and instant audio playback.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestNotification}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                  notificationTestSent
                    ? 'bg-emerald-600 text-white'
                    : 'border border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                }`}
              >
                <BellRing className="h-3.5 w-3.5" />
                <span>{notificationTestSent ? 'Notification Sent! ✓' : 'Test Live Notification'}</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: 'fajrEnabled',
                  label: 'Fajr Rawātib (Before Dawn)',
                  time: '05:30',
                  desc: '2 light units better than the entire world',
                },
                {
                  id: 'duhaEnabled',
                  label: 'Salāt ad-Duḥā (Forenoon)',
                  time: '09:00',
                  desc: 'Daily charity for all 360 joints',
                },
                {
                  id: 'dhuhrEnabled',
                  label: 'Dhuhr Rawātib (Midday)',
                  time: '12:45',
                  desc: '4 before & 2 after Dhuhr',
                },
                {
                  id: 'sleepEnabled',
                  label: 'Night Sleep Sunnahs',
                  time: '22:30',
                  desc: 'Wudu, 3 Quls in palms & Surah Al-Mulk',
                },
                {
                  id: 'fridayEnabled',
                  label: 'Friday Jumu‘ah Traditions',
                  time: 'Every Friday 08:30',
                  desc: 'Ghusl, Kahf, Salawāt & Hour of Response',
                },
                {
                  id: 'fastingEnabled',
                  label: 'Monday & Thursday Fasting',
                  time: 'Sun/Wed 20:30',
                  desc: 'Deeds presented to Allah while fasting',
                },
              ].map((notif) => {
                const key = notif.id as keyof SunnahNotificationSettings;
                const isEnabled = notifSettings[key];

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start justify-between rounded-2xl border p-4 transition-all ${
                      isEnabled
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-[var(--app-line)] bg-black/5 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold text-[var(--app-ink)]">{notif.label}</span>
                      <span className="block text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                        {notif.time}
                      </span>
                      <span className="block text-[10px] text-[var(--app-muted)] mt-1">{notif.desc}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveNotifSettings({ ...notifSettings, [key]: !isEnabled })}
                      className={`relative h-6 w-11 rounded-full transition-colors shrink-0 mt-0.5 ${
                        isEnabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                          isEnabled ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SUNNAH NOTIFICATION PLAYER (MASTER BAR) ── */}
        <section
          className={`relative mb-8 overflow-hidden rounded-3xl border border-[var(--app-line)] p-6 sm:p-7 shadow-md ${
            dark
              ? 'bg-gradient-to-br from-[#12332a] via-[#14231f] to-[#0e1916]'
              : 'bg-gradient-to-br from-[#e8f6ef] via-[#f2faf6] to-[#ffffff]'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Track Info */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleTogglePlayPause}
                aria-label={isPlaying ? 'Pause Sunnah recitation' : 'Play Sunnah recitation'}
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-800 text-white shadow-md hover:scale-105 active:scale-95 transition-all dark:bg-emerald-400 dark:text-emerald-950"
              >
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current ml-0.5" />}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isPlaying ? 'Now Playing in Background' : 'Prophetic Notification Player'}
                  </span>
                  <span className="text-[11px] text-[var(--app-muted)]">{currentSunnah.reference}</span>
                </div>

                <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-[var(--app-ink)] truncate">
                  {currentSunnah.audioTitle || currentSunnah.title}
                </h2>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold font-arabic" dir="rtl" lang="ar">
                  {currentSunnah.titleAr}
                </p>
              </div>
            </div>

            {/* Audio Wave Visualizer Canvas */}
            <div className="flex-1 max-w-sm hidden lg:block">
              <canvas
                ref={canvasRef}
                width={360}
                height={48}
                className="w-full h-12 rounded-xl"
              />
            </div>

            {/* Playback Controls & Speed/Volume */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-1">
                <button
                  type="button"
                  onClick={handlePrevTrack}
                  title="Previous Sunnah"
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNextTrack}
                  title="Next Sunnah"
                  className="px-2.5 py-1 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-stone-700 dark:text-stone-200"
                >
                  Skip Next
                </button>

                <button
                  type="button"
                  onClick={handleLoopToggle}
                  title="Toggle Repeat Loop"
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                    isLooping
                      ? 'bg-emerald-600 text-white'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Loop
                </button>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-1">
                {[0.8, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeedChange(rate)}
                    className={`rounded-xl px-2 py-1 text-[11px] font-bold transition-all ${
                      playbackRate === rate
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 px-3 py-1.5">
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-stone-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Currently loaded Sunnah Hadith & Virtue excerpt */}
          <div className="mt-4 pt-4 border-t border-[var(--app-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--app-muted)]">
            <span className="italic font-medium">
              {currentSunnah.hadith}
            </span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
              Virtue: {currentSunnah.virtue}
            </span>
          </div>
        </section>

        {/* ── DAILY SUNNAH REVIVAL PROGRESS & CATEGORY TABS ── */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                  Today’s Sunnah Revival
                </h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {completedCount} of {totalCount} Revived ({progressPct}%)
                </span>
              </div>
              <p className="text-xs text-[var(--app-muted)] mt-0.5">
                “Whoever revives a Sunnah from my Sunnah which has died out after me will have a reward equal to those who act upon it.” (Tirmidhi)
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCompleted({});
                save(`${SUNNAH_STORAGE_KEY}${todayKey}`, {});
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Today</span>
            </button>
          </div>

          <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden mb-6">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Category Tabs */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {SUNNAH_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.key;
                const CatIcon = CATEGORY_ICONS[cat.icon] || Sparkles;
                const count =
                  cat.key === 'all'
                    ? SUNNAH_ITEMS.length
                    : SUNNAH_ITEMS.filter((i) => i.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                        : 'border-[var(--app-line)] bg-black/5 text-[var(--app-muted)] hover:text-[var(--app-ink)] dark:bg-white/5'
                    }`}
                  >
                    <CatIcon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                    <span className="opacity-70 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Sunnahs by title, Arabic text, virtue, or Hadith reference…"
              className="w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 pl-10 pr-4 py-2.5 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
            />
          </div>
        </section>

        {/* ── SUNNAH CARDS LIST ── */}
        <section className="space-y-4 mb-8">
          {filteredSunnahs.map((item) => {
            const isDone = Boolean(completed[item.id]);
            const isSelectedTrack = currentSunnah.id === item.id;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className={`${cardClass} p-6 transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : isSelectedTrack
                      ? 'border-emerald-500/40'
                      : ''
                }`}
              >
                {/* Header: Title, Rakats & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(item.id)}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl border-2 transition-all mt-0.5 ${
                        isDone
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500'
                      }`}
                      aria-label={isDone ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as completed`}
                    >
                      {isDone && <Check className="h-4 w-4 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-[var(--app-ink)]">
                          {item.title}
                        </h4>
                        {item.rakats && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                            {item.rakats} Rak‘ahs
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold font-arabic mt-0.5" dir="rtl" lang="ar">
                        {item.titleAr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handlePlaySunnah(item)}
                      className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs ${
                        isSelectedTrack && isPlaying
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                          : 'border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200'
                      }`}
                    >
                      {isSelectedTrack && isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Playing</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Listen & Play</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      title="Copy text"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[var(--app-muted)] mb-3 leading-relaxed">
                  {item.desc}
                </p>

                {/* Vocalized Arabic text if applicable */}
                {item.arabicText && (
                  <div className="my-4 rounded-2xl bg-black/5 dark:bg-white/5 p-4 text-right">
                    <p className="font-arabic text-lg font-bold text-[var(--app-ink)] leading-loose select-text" dir="rtl" lang="ar">
                      {item.arabicText}
                    </p>
                    {item.transliteration && (
                      <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-200 italic text-left">
                        {item.transliteration}
                      </p>
                    )}
                    {item.translation && (
                      <p className="mt-1 text-xs text-[var(--app-ink)] text-left">
                        “{item.translation}”
                      </p>
                    )}
                  </div>
                )}

                {/* Hadith & Virtue Box */}
                <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-3.5 text-xs text-[var(--app-muted)] leading-relaxed">
                  <div className="flex items-start gap-1.5 mb-1">
                    <strong className="text-emerald-900 dark:text-emerald-200 font-bold block shrink-0">
                      Hadith:
                    </strong>
                    <span className="italic">{item.hadith}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--app-line)] text-[11px]">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      ✨ Virtue: {item.virtue}
                    </span>
                    <span className="opacity-80 font-medium">— {item.reference}</span>
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
