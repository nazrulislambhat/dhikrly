'use client';

import Link from 'next/link';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Clock3,
  Coffee,
  Compass,
  Flame,
  HeartHandshake,
  Headphones,
  Landmark,
  LineChart,
  MoonStar,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import DUAS_JSON from '@/data/duas.json';
import type { Dua, CatEntry, Streak, NotifSettings } from '@/types';
import AppShell from '@/components/AppShell';
import {
  load,
  save,
  STORAGE_KEY,
  SETTINGS_KEY,
  CUSTOM_DUAS_KEY,
  NOTIFICATION_KEY,
} from '@/lib/storage';
import { getHijriDate, getGregorianDate } from '@/lib/dates';
import { scheduleNotifications } from '@/components/NotificationSettings';
import { playCheck } from '@/lib/sounds';

import DuaCard from '@/components/DuaCard';
import ProgressBar from '@/components/ProgressBar';
import StatCard from '@/components/StatCard';
import WeeklyHistory from '@/components/WeeklyHistory';
import StreakHeatmap from '@/components/StreakHeatmap';
import NotificationSettings from '@/components/NotificationSettings';
import AddDuaModal from '@/components/AddDuaModal';
import AuthModal from '@/components/AuthModal';
import DhikrFlowModal from '@/components/DhikrFlowModal';
import UserMenu from '@/components/UserMenu';
import PWAProvider from '@/components/PWAProvider';
import DailyTodoWidget from '@/components/DailyTodoWidget';
import JumuahBanner from '@/components/JumuahBanner';
import { useChecked } from '@/hooks/useChecked';
import { useStreak } from '@/hooks/useStreak';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { loadSalah } from '@/lib/salahStorage';
import { calculatePrayerTimes, getCurrentAndNextPrayer, formatTime } from '@/lib/prayerTimes';
import type { SalahSettings } from '@/types/salah';

/* ── Static data ── */
const BASE_DUAS = DUAS_JSON as Dua[];

const CATS: CatEntry[] = [
  { key: 'all', label: 'All' },
  { key: 'quran', label: "Qur'ān" },
  { key: 'athkar', label: 'Athkār' },
  { key: 'dua', label: "Du'ā" },
  { key: 'custom', label: 'Custom' },
];

const CELESTIAL_PHASES = [
  { id: 'fajr', periodId: 'morning', label: 'Dawn & Morning', icon: '🌅', filterTarget: 'athkar', hours: 'Fajr to Midday' },
  { id: 'duha', periodId: 'midday', label: 'Midday Renewal', icon: '☀️', filterTarget: 'all', hours: 'Dhuhr Window' },
  { id: 'asr', periodId: 'evening', label: 'Evening Adhkār', icon: '🌤️', filterTarget: 'athkar', hours: '‘Asr to Maghrib' },
  { id: 'night', periodId: 'evening', label: 'Sleep & Night', icon: '🌙', filterTarget: 'athkar', hours: 'Night Routine' },
  { id: 'tahajjud', periodId: 'tahajjud', label: 'Tahajjud Sanctuary', icon: '🌌', filterTarget: 'all', hours: 'Third of Night' },
] as const;

type Modal = 'notifications' | 'addDua' | 'missedDay' | 'auth' | null;

/* ─────────────────────────────────────────────
    MAIN COMPONENT
  ───────────────────────────────────────────── */
export default function DuasTracker() {
  /* ── Settings ── */
  const [mounted, setMounted] = useState<boolean>(false);
  const [dark, setDark] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const isLoaded = useRef<boolean>(false);

  /* ── Custom duas ── */
  const [customDuas, setCustomDuas] = useState<Dua[]>([]);
  const allDuas = useMemo<Dua[]>(
    () => [...BASE_DUAS, ...customDuas],
    [customDuas],
  );

  /* ── Core hooks ── */
  const {
    checked,
    setChecked,
    toggle,
    reset,
    done,
    pct,
    today,
    localRevision,
  } = useChecked(allDuas.length);
  const streak = useStreak(done, allDuas.length);
  const { toast, showToast } = useToast();

  /* ── Auth ── */
  const { user, loading: authLoading, signOut } = useAuth();

  const handlePullComplete = useCallback(
    (data: {
      checkedByDate: Record<string, Record<string, boolean>>;
      customDuas: Dua[];
      streak: Streak;
    }) => {
      if (data.customDuas.length > 0) {
        setCustomDuas(data.customDuas);
        save(CUSTOM_DUAS_KEY, data.customDuas);
      }

      // Merge remote 365-day history into local storage without dropping past dates
      const localAll = load<Record<string, Record<string, boolean>>>(STORAGE_KEY, {});
      const mergedByDate: Record<string, Record<string, boolean>> = {
        ...data.checkedByDate,
        ...localAll,
      };

      // Apply today's remote checked state
      const todayRemote = data.checkedByDate[today];
      if (todayRemote) {
        const resolvedToday = {
          ...todayRemote,
          ...(localRevision.current > 0 ? checked : {}),
        };
        mergedByDate[today] = resolvedToday;
        setChecked(resolvedToday);
      }
      save(STORAGE_KEY, mergedByDate);

      // Apply remote streak if available
      if (data.streak && streak.setStreak) {
        streak.setStreak(data.streak);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dhikrly:adhkar-updated'));
      }
    },
    [today, checked, localRevision, setChecked, streak],
  );

  // Called by Realtime when another device updates today's progress
  const handleRemoteCheckedUpdate = useCallback(
    (remoteChecked: Record<string, boolean>) => {
      setChecked(remoteChecked);
    },
    [setChecked],
  );

  const {
    status: syncStatus,
    manualSync,
    lastSyncedAt,
  } = useSync({
    user,
    today,
    checked,
    localRevision,
    customDuas,
    streak,
    onPullComplete: handlePullComplete,
    onRemoteCheckedUpdate: handleRemoteCheckedUpdate,
  });

  /* ── UI state ── */
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [priOnly, setPriOnly] = useState(false);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string; timeStr: string } | null>(null);

  const prevDone = useRef(done);

  /* ── Load Next Prayer Time if Location is Set ── */
  useEffect(() => {
    try {
      const salahSettings = loadSalah<SalahSettings | null>('salah_settings_v1', null);
      if (salahSettings?.location) {
        calculatePrayerTimes(
          salahSettings.location,
          new Date(),
          salahSettings.calcMethod ?? 'Karachi',
          salahSettings.asrMethod ?? 'Standard',
        ).then((times) => {
          const { next, nextTime } = getCurrentAndNextPrayer(times, new Date());
          const capitalized = next.charAt(0).toUpperCase() + next.slice(1);
          setNextPrayerInfo({
            name: capitalized,
            timeStr: formatTime(nextTime, salahSettings.location?.timezone),
          });
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  /* ── Mount effect: Load saved preferences safely on client ── */
  useEffect(() => {
    setMounted(true);
    const saved = load<{ dark: boolean; sound: boolean }>(SETTINGS_KEY, {
      dark: false,
      sound: true,
    });
    setDark(saved.dark);
    setSoundEnabled(saved.sound ?? true);
    const custom = load<Dua[]>(CUSTOM_DUAS_KEY, []);
    if (custom.length > 0) setCustomDuas(custom);
    isLoaded.current = true;
  }, []);

  /* ── Contextual Time-of-Day Spiritual Atmosphere ── */
  const timeGreeting = useMemo(() => {
    const hour = mounted ? new Date().getHours() : 12;
    if (hour < 5) {
      return {
        period: 'tahajjud',
        arabic: 'قِيَامُ اللَّيْلِ وَالسَّكِينَة',
        title: 'Night of Intimacy & Tahajjud',
        desc: 'The third of the night: a sacred time when supplications find immediate answer.',
        cta: 'Begin Night Adhkār',
        filterTarget: 'all',
        gradient: dark
          ? 'from-[#0d1310] via-[#131d18] to-[#0a0f0d]'
          : 'from-[#063327] via-[#084534] to-[#0a4e3c]',
      };
    }
    if (hour < 12) {
      return {
        period: 'morning',
        arabic: 'صَبَاحُ الخَيْرِ وَالبَرَكَة',
        title: 'Morning of Grace & Barakah',
        desc: 'Begin your day with authentic morning protection, gratitude, and tranquil presence.',
        cta: 'Start Morning Adhkār',
        filterTarget: 'athkar',
        gradient: dark
          ? 'from-[#0e1713] via-[#16231c] to-[#0b110e]'
          : 'from-[#064e3b] via-[#065f46] to-[#0d6e53]',
      };
    }
    if (hour < 17) {
      return {
        period: 'midday',
        arabic: 'سَكِينَةُ الظَّهِيرَة',
        title: 'Midday Calm & Focus',
        desc: 'Pause amidst daily routines to re-center your heart on what truly matters.',
        cta: 'Continue Daily Adhkār',
        filterTarget: 'all',
        gradient: dark
          ? 'from-[#0f1713] via-[#15241d] to-[#0b120f]'
          : 'from-[#075340] via-[#09664f] to-[#085a46]',
      };
    }
    if (hour < 21) {
      return {
        period: 'evening',
        arabic: 'مَسَاءُ الحِمَايَةِ وَالأَمَان',
        title: 'Evening Protection & Peace',
        desc: 'Wind down your day with the evening fortress athkār and authentic prophetic supplications.',
        cta: 'Start Evening Adhkār',
        filterTarget: 'athkar',
        gradient: dark
          ? 'from-[#111614] via-[#18211b] to-[#0c100e]'
          : 'from-[#084c3b] via-[#0d5945] to-[#126852]',
      };
    }
    return {
      period: 'night',
      arabic: 'لَيْلَةٌ مُبَارَكَة',
      title: 'Night of Peace & Gratitude',
      desc: 'Reflect upon the day’s blessings and entrust your night and sleep to the Almighty.',
      cta: 'Read Bedtime Du‘ās',
      filterTarget: 'athkar',
      gradient: dark
        ? 'from-[#0c100e] via-[#111714] to-[#080c0a]'
        : 'from-[#063b2d] via-[#074b3a] to-[#063327]',
    };
  }, [dark]);

  /* ── Dark mode + sound persistence ── */
  useEffect(() => {
    if (!isLoaded.current) return;
    save(SETTINGS_KEY, { dark, sound: soundEnabled });
    document.documentElement.classList.toggle('dark', dark);
  }, [dark, soundEnabled]);

  /* ── Completion toast ── */
  useEffect(() => {
    if (
      done === allDuas.length &&
      allDuas.length > 0 &&
      prevDone.current < allDuas.length
    ) {
      showToast('All daily duas completed. Māshā’Allāh, BarakAllahu feek!');
    }
    prevDone.current = done;
  }, [done, allDuas.length, showToast]);

  /* ── Schedule notifications + re-check on tab focus ── */
  useEffect(() => {
    const s = load<NotifSettings>(NOTIFICATION_KEY, {
      morningEnabled: false,
      morningTime: '06:00',
      eveningEnabled: false,
      eveningTime: '18:00',
    });
    scheduleNotifications(s);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const latest = load<NotifSettings>(NOTIFICATION_KEY, {
          morningEnabled: false,
          morningTime: '06:00',
          eveningEnabled: false,
          eveningTime: '18:00',
        });
        scheduleNotifications(latest);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  /* ── Handlers ── */
  const handleReset = () => {
    if (window.confirm('Reset all completed remembrances for today?')) {
      reset();
      showToast('Reset completed. Begin again with Bismillah.');
    }
  };

  const handleAddDua = useCallback(
    (dua: Dua) => {
      const updated = [...customDuas, dua];
      setCustomDuas(updated);
      save(CUSTOM_DUAS_KEY, updated);
      showToast(`"${dua.title}" added to your collection.`);
    },
    [customDuas, showToast],
  );

  const handleDeleteDua = useCallback(
    (id: string) => {
      const updated = customDuas.filter((d) => d.id !== id);
      setCustomDuas(updated);
      save(CUSTOM_DUAS_KEY, updated);
      showToast("Custom du'ā removed.");
    },
    [customDuas, showToast],
  );

  /* ── Derived counts ── */
  const total = allDuas.length;
  const pending = total - done;

  const catCount = (cat: string): number =>
    cat === 'all' ? total : allDuas.filter((d) => d.category === cat).length;

  const catDone = (cat: string): number =>
    cat === 'all'
      ? done
      : allDuas.filter((d) => d.category === cat && checked[d.id]).length;

  const filtered: Dua[] = allDuas.filter((d) => {
    if (filter !== 'all' && d.category !== filter) return false;
    if (priOnly && !d.priority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.titleAr.includes(search) ||
        d.en.toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ── Khushū‘ Focus Recitation Flow State ── */
  const [focusFlowOpen, setFocusFlowOpen] = useState(false);
  const [focusInitialIndex, setFocusInitialIndex] = useState(0);

  const handleStartFocusFlow = useCallback(
    (targetDua?: Dua) => {
      const activeList = filtered.length > 0 ? filtered : allDuas;
      if (targetDua) {
        const idx = activeList.findIndex((d) => d.id === targetDua.id);
        setFocusInitialIndex(idx >= 0 ? idx : 0);
      } else {
        const firstUnchecked = activeList.findIndex((d) => !checked[d.id]);
        setFocusInitialIndex(firstUnchecked >= 0 ? firstUnchecked : 0);
      }
      setFocusFlowOpen(true);
    },
    [filtered, allDuas, checked],
  );

  const bg = 'min-h-screen bg-canvas text-ink antialiased selection:bg-primary/20';

  return (
    <div className={bg}>
      <AppShell active="adhkar" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <PWAProvider dark={dark} />

        {/* Toast */}
        {toast !== null && (
          <div className="animate-fade-in fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full border border-emerald-400/40 bg-emerald-700/95 px-6 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
            {toast}
          </div>
        )}

        {/* Modals */}
        {activeModal === 'auth' && (
          <AuthModal dark={dark} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'notifications' && (
          <NotificationSettings
            dark={dark}
            userId={user?.id ?? null}
            onClose={() => setActiveModal(null)}
          />
        )}
        {activeModal === 'addDua' && (
          <AddDuaModal
            dark={dark}
            onAdd={handleAddDua}
            onClose={() => setActiveModal(null)}
          />
        )}

        {/* Khushū‘ Focus Flow Recitation Modal */}
        <DhikrFlowModal
          isOpen={focusFlowOpen}
          onClose={() => setFocusFlowOpen(false)}
          duas={filtered.length > 0 ? filtered : allDuas}
          initialIndex={focusInitialIndex}
          checked={checked}
          onToggle={toggle}
          dark={dark}
          soundEnabled={soundEnabled}
        />

        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-4 sm:px-4 sm:py-6">
          {/* Jumu'ah Mode Banner (Active on Fridays or preview) */}
          <JumuahBanner dark={dark} />

          {/* ── Top Context Bar ── */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Left: Date & Prayer Capsule */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                suppressHydrationWarning
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold backdrop-blur-md ${
                  dark
                    ? 'border-white/[0.08] bg-white/[0.04] text-stone-300'
                    : 'border-stone-200/90 bg-white/90 text-stone-700 shadow-xs'
                }`}
              >
                <span className="text-amber-500 dark:text-amber-400">🌙</span>
                <span suppressHydrationWarning>{getHijriDate()}</span>
                <span className="opacity-40">•</span>
                <span suppressHydrationWarning className="text-[11px] font-medium opacity-80">{getGregorianDate()}</span>
              </div>

              {nextPrayerInfo && (
                <Link
                  href="/salah"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold no-underline transition-all hover:scale-105 ${
                    dark
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-emerald-600/20 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <Clock3 className="h-3 w-3" />
                  <span>Next: {nextPrayerInfo.name} at {nextPrayerInfo.timeStr}</span>
                </Link>
              )}
            </div>

            {/* Right: Quick Controls (Sound, Reminders, Auth/Sync) */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled((s) => {
                    const nextVal = !s;
                    if (nextVal) playCheck();
                    return nextVal;
                  });
                }}
                title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
                aria-label={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
                  soundEnabled
                    ? dark
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-emerald-600/30 bg-emerald-50 text-emerald-800'
                    : dark
                      ? 'border-white/10 bg-white/5 text-stone-400'
                      : 'border-stone-200 bg-white text-stone-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('notifications')}
                title="Notification Reminders"
                aria-label="Notification Reminders"
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
                  dark
                    ? 'border-white/10 bg-white/5 text-stone-300 hover:text-white'
                    : 'border-stone-200 bg-white text-stone-600 hover:text-stone-900 shadow-xs'
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reminders</span>
              </button>

              {authLoading ? (
                <div className="h-8 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
              ) : user ? (
                <UserMenu
                  user={user}
                  dark={dark}
                  syncStatus={syncStatus}
                  onManualSync={manualSync}
                  lastSyncedAt={lastSyncedAt}
                  onSignOut={async () => {
                    await signOut();
                    showToast('Signed out.');
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveModal('auth')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary px-3.5 text-xs font-bold text-white transition-all hover:bg-primary-hover shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>Sync / Login</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Hero Sanctuary Dashboard ── */}
          <div className="mb-8">
            <section
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-9 text-white shadow-2xl transition-all ${
                dark
                  ? `border-emerald-500/25 bg-gradient-to-br ${timeGreeting.gradient}`
                  : `border-emerald-800 bg-gradient-to-br ${timeGreeting.gradient}`
              }`}
              aria-label="Daily Remembrance Sanctuary"
            >
              {/* Subtle Ambient Islamic Geometric Motif */}
              <div
                className="pointer-events-none absolute -bottom-10 right-8 hidden lg:block opacity-10 select-none"
                aria-hidden="true"
              >
                <svg viewBox="0 0 200 200" className="h-56 w-56" fill="none">
                  {/* Islamic 8-Point Rosette & Arch */}
                  <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <path
                    d="M100 10 L125 75 L190 100 L125 125 L100 190 L75 125 L10 100 L75 75 Z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M36 36 L164 36 L164 164 L36 164 Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    transform="rotate(45 100 100)"
                  />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Inspiring Headline & Context */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>{timeGreeting.title}</span>
                  </div>

                  <h1 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                    Make room for what matters.
                  </h1>

                  <p
                    className="mt-1 font-quran text-xl sm:text-2xl text-emerald-200/90 font-normal"
                    dir="rtl"
                    lang="ar"
                    translate="no"
                  >
                    أَذْكَار يَوْمِيَّة · {timeGreeting.arabic}
                  </p>

                  <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-md">
                    {done === total && total > 0
                      ? 'Alḥamdulillāh! All daily remembrances completed today. May Allah accept your devotion and bless your time.'
                      : done > 0
                        ? `${done} of ${total} remembrances completed. Steadiness over speed — take each sacred moment with presence.`
                        : timeGreeting.desc}
                  </p>

                  {/* Highlights Bar: Streak + Quick Action CTA */}
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    {/* Primary Khushū‘ Flow Recitation Button */}
                    <button
                      type="button"
                      onClick={() => handleStartFocusFlow()}
                      className="tap-bounce inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-stone-900 shadow-lg hover:bg-white/90 transition-all cursor-pointer"
                      title="Enter full-screen focused recitation sanctuary"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-700 animate-spin-slow" />
                      <span>Start Khushū‘ Flow</span>
                    </button>

                    {/* Guided Category Filter CTA Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (timeGreeting.filterTarget && timeGreeting.filterTarget !== 'all') {
                          setFilter(timeGreeting.filterTarget);
                        }
                        const el = document.getElementById('daily-adhkar');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="tap-bounce inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <span>
                        {done === total && total > 0
                          ? 'Review Adhkār'
                          : timeGreeting.cta}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="inline-flex items-center gap-1.5 rounded-2xl border border-link/30 bg-link-light px-3 py-2 text-xs font-bold text-link">
                      <Flame className="h-4 w-4 text-link fill-link/30" />
                      <span>{streak.current}d Streak</span>
                      <span className="opacity-60 font-normal text-[10px]">• Best: {streak.best}d</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{done} / {total} Done</span>
                    </div>
                  </div>

                  {/* Celestial Spiritual Horizon: 5 Stations of the Day */}
                  <div className="mt-5 w-full pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-white/90 font-bold uppercase tracking-widest text-[10px]">
                      <Compass className="h-3.5 w-3.5 text-amber-300" />
                      <span>Sacred Day Rhythm</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {CELESTIAL_PHASES.map((phase) => {
                        const isActive = timeGreeting.period === phase.periodId;
                        return (
                          <button
                            key={phase.id}
                            type="button"
                            onClick={() => {
                              setFilter(phase.filterTarget);
                              const el = document.getElementById('daily-adhkar');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-white text-stone-900 shadow-md ring-2 ring-white/60 font-extrabold scale-105'
                                : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                            }`}
                            title={`${phase.label} (${phase.hours})`}
                          >
                            <span>{phase.icon}</span>
                            <span>{phase.label}</span>
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Circular Radial Progress Dial */}
                <div className="flex items-center gap-5 shrink-0 self-center md:self-auto">
                  <div
                    className="relative grid h-28 w-28 place-items-center sm:h-32 sm:w-32"
                    role="img"
                    aria-label={`${pct}% complete`}
                    suppressHydrationWarning
                  >
                    <svg className="absolute inset-0 -rotate-90 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                      <circle
                        className="fill-none stroke-white/15 stroke-[7px]"
                        cx="50"
                        cy="50"
                        r="42"
                      />
                      <circle
                        suppressHydrationWarning
                        className={`fill-none stroke-[7px] [stroke-linecap:round] transition-all duration-700 ease-out ${
                          pct === 100
                            ? 'stroke-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                            : 'stroke-emerald-300'
                        }`}
                        cx="50"
                        cy="50"
                        r="42"
                        style={{
                          strokeDasharray: '264',
                          strokeDashoffset: `${264 - (264 * pct) / 100}`,
                        }}
                      />
                    </svg>
                    <div className="grid justify-items-center text-center">
                      <strong suppressHydrationWarning className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {pct}%
                      </strong>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100/75">
                        {pct === 100 ? 'Completed' : 'Today'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── 4 Daily Spiritual Pillars Hub ── */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                href: '#daily-adhkar',
                Icon: Sparkles,
                title: 'Daily Adhkār',
                desc: `${done} of ${total} finished`,
                badge: pct === 100 ? '100% Done' : `${pending} left`,
                active: true,
              },
              {
                href: '/salah',
                Icon: Clock3,
                title: 'Ṣalāh Times',
                desc: nextPrayerInfo ? `Next: ${nextPrayerInfo.name} ${nextPrayerInfo.timeStr}` : 'Prayer schedule',
                badge: 'Azan alerts',
                active: false,
              },
              {
                href: '/quran',
                Icon: BookOpen,
                title: 'Noble Qur’an',
                desc: 'Read & listen',
                badge: '114 Surahs',
                active: false,
              },
              {
                href: '/tasbeeh',
                Icon: CircleDot,
                title: 'Tasbīḥ Counter',
                desc: 'Digital subḥah',
                badge: 'Post-Salah',
                active: false,
              },
            ].map((pillar) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className={`group flex items-center gap-3 rounded-2xl border p-3.5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  pillar.active
                    ? 'border-primary/40 bg-primary-light text-primary shadow-xs'
                    : dark
                      ? 'border-white/[0.08] bg-surface/90 hover:border-primary/30 text-ink'
                      : 'border-border bg-white hover:border-primary/30 text-ink shadow-xs'
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                    pillar.active
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-primary-subtle text-primary'
                  }`}
                >
                  <pillar.Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-extrabold leading-tight">{pillar.title}</div>
                  <div className="truncate text-[10px] text-muted mt-0.5">
                    {pillar.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Main Two-Column Layout (Remembrances + Companion Rail) ── */}
          <div className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_20rem] min-[1100px]:items-start">
            {/* Left: Remembrances Collection */}
            <section
              className="min-w-0"
              id="daily-adhkar"
              aria-label="Daily Remembrances Collection"
            >
              {/* Collection Header */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-ink)]">
                    Daily Remembrances
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Authentic athkār and prophetic supplications for daily barakah
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    suppressHydrationWarning
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300"
                  >
                    <span>{done} of {total} Completed</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset today's checks"
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-stone-200 dark:border-white/10 px-2 text-[11px] font-semibold text-stone-500 hover:text-red-600 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Toolbar: Search, Filters & Actions */}
              <div className="mb-5 space-y-3">
                {/* Search Bar + Priority + Add Dua */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="relative min-w-[14rem] flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      placeholder="Search remembrances by title, meaning or Arabic..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label="Search remembrances"
                      className="h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-9 text-xs text-ink placeholder-muted outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </label>

                  <button
                    type="button"
                    onClick={() => setPriOnly((p) => !p)}
                    aria-pressed={priOnly}
                    className={`tap-bounce inline-flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold transition-all ${
                      priOnly
                        ? 'border-link/50 bg-link-light text-link shadow-xs'
                        : 'border-border bg-surface text-muted hover:text-ink shadow-xs'
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${priOnly ? 'fill-current text-amber-500' : 'text-stone-400'}`}
                      aria-hidden="true"
                    />
                    <span>Priority</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveModal('addDua')}
                    className="tap-bounce inline-flex h-11 items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary-light px-4 text-xs font-bold text-primary transition hover:bg-primary/20 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Custom</span>
                  </button>
                </div>

                {/* Category Filter Chips */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATS.map(({ key, label }: CatEntry) => {
                    const active = filter === key;
                    const count = catCount(key);
                    if (count === 0 && key !== 'all') return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        aria-pressed={active}
                        className={`tap-bounce inline-flex min-h-8 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all ${
                          active
                            ? 'bg-primary text-white shadow-sm'
                            : 'border border-border bg-surface text-muted hover:text-ink shadow-xs'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-mono ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-black/5 dark:bg-white/10 text-muted'
                          }`}
                        >
                          {catDone(key)}/{count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dua Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-dashed border-stone-300 dark:border-white/10 p-12 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-stone-400" />
                    <h3 className="mt-2 text-sm font-bold text-[var(--app-ink)]">
                      No remembrances found
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      Try searching with a different term or clear your active filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                        setPriOnly(false);
                      }}
                      className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {filtered.map((d: Dua) => (
                  <DuaCard
                    key={d.id}
                    dua={d}
                    checked={!!checked[d.id]}
                    onToggle={toggle}
                    onDelete={d.custom ? handleDeleteDua : undefined}
                    onOpenFocus={() => handleStartFocusFlow(d)}
                    dark={dark}
                    soundEnabled={soundEnabled}
                  />
                ))}
              </div>
            </section>

            {/* Right: Companion Sidebar Rail */}
            <aside
              className="grid min-w-0 content-start gap-4 min-[1100px]:sticky min-[1100px]:top-24"
              aria-label="Your Spiritual Companion"
            >
              {/* 4 Stat Cards in 2x2 Grid */}
              <div suppressHydrationWarning className="grid grid-cols-2 gap-2.5">
                <StatCard label="Total" value={total} accent="green" dark={dark} />
                <StatCard label="Done" value={done} accent="green" dark={dark} />
                <StatCard
                  label="Pending"
                  value={pending}
                  accent={pending > 0 ? 'amber' : 'green'}
                  dark={dark}
                />
                <StatCard
                  label="Streak"
                  value={`${streak.current}d`}
                  accent="gold"
                  dark={dark}
                />
              </div>

              {/* Today's Progress Card */}
              <section
                className="rounded-3xl border border-border bg-surface/90 backdrop-blur-md p-5 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[var(--app-ink)]">Today&apos;s Devotion Goal</span>
                  <span
                    suppressHydrationWarning
                    className="font-mono text-sm text-emerald-700 dark:text-emerald-300 font-extrabold"
                  >
                    {pct}%
                  </span>
                </div>
                <div className="my-3">
                  <ProgressBar pct={pct} dark={dark} />
                </div>
                {/* Milestone indicators */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-2">
                  <span>Start</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span className={pct === 100 ? 'text-amber-500 font-bold' : ''}>100%</span>
                </div>
                <p
                  suppressHydrationWarning
                  className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed"
                >
                  {done === total && total > 0
                    ? '✨ All daily duas finished. BarakAllahu feek!'
                    : `${done} of ${total} finished · ${pending} remaining for today`}
                </p>
              </section>

              {/* Weekly Consistency Bar Chart */}
              <WeeklyHistory dark={dark} total={total} streakBest={streak.best} />

              {/* Daily Spiritual Checklist */}
              <div>
                <DailyTodoWidget />
              </div>

              {/* Activity Heatmap Accordion */}
              <div
                className="overflow-hidden rounded-3xl border border-border bg-surface/90 shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setShowHeatmap((v) => !v)}
                  aria-expanded={showHeatmap}
                  className="flex min-h-12 w-full items-center justify-between px-4 text-xs font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{showHeatmap ? 'Hide 365-Day Activity Map' : 'View 365-Day Activity Map'}</span>
                  <span
                    className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                    aria-hidden="true"
                  >
                    {showHeatmap ? '−' : '+'}
                  </span>
                </button>
                {showHeatmap && (
                  <div className="p-3 border-t border-[var(--app-line)]">
                    <StreakHeatmap dark={dark} total={total} />
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* ── Footer ── */}
          <footer className="mt-16 border-t border-border pt-8 pb-12 text-center">
            <p
              className="font-arabic text-2xl text-primary/85"
              dir="rtl"
              lang="ar"
              translate="no"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <p className="mt-3 text-xs uppercase tracking-widest text-muted">
              {user
                ? `${
                    syncStatus === 'synced'
                      ? 'All changes synced with your account'
                      : syncStatus === 'syncing'
                        ? 'Syncing changes…'
                        : syncStatus === 'offline'
                          ? 'Saved locally · Waiting for connection'
                          : 'Sync retry in progress'
                  } · ${user.email}`
                : 'Progress saved securely in your browser'}
            </p>

            {/* Support & Reviews Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.producthunt.com/products/dhikrly/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-dhikrly"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block overflow-hidden rounded-[10px] shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1353959&theme=light"
                  alt="Dhikrly - Adhkār, Qur’an & Ṣalāh | Product Hunt"
                  style={{ width: '250px', height: '54px' }}
                  width="250"
                  height="54"
                />
              </a>

              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Support Dhikrly"
                className="inline-flex h-[54px] items-center gap-2 rounded-2xl border border-amber-400/40 bg-[#FFDD00] px-5 text-xs font-black text-amber-950 no-underline shadow-sm transition-all hover:scale-105 hover:bg-[#ffe234] active:scale-95"
              >
                <Coffee className="h-4 w-4 text-amber-900" />
                <span>Support Dhikrly</span>
              </a>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-muted">
              <Link href="/about" className="transition-colors hover:text-ink">
                About
              </Link>
              <Link href="/privacy-policy" className="transition-colors hover:text-ink">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-ink">
                Terms of Use
              </Link>
              <Link href="/tech" className="transition-colors hover:text-ink">
                Tech Stack & APIs
              </Link>
              <Link href="/contact" className="transition-colors hover:text-ink">
                Contact
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted">
              © {new Date().getFullYear()} Dhikrly — Made for the Ummah
            </p>
          </footer>
        </div>
      </AppShell>
    </div>
  );
}
