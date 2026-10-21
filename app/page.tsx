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

type Modal = 'notifications' | 'addDua' | 'missedDay' | 'auth' | null;

/* ─────────────────────────────────────────────
    MAIN COMPONENT
  ───────────────────────────────────────────── */
export default function DuasTracker() {
  /* ── Settings ── */
  const [dark, setDark] = useState<boolean>(
    () =>
      load<{ dark: boolean; sound: boolean }>(SETTINGS_KEY, {
        dark: false,
        sound: true,
      }).dark,
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () =>
      load<{ dark: boolean; sound: boolean }>(SETTINGS_KEY, {
        dark: false,
        sound: true,
      }).sound ?? true,
  );

  /* ── Custom duas ── */
  const [customDuas, setCustomDuas] = useState<Dua[]>(() =>
    load<Dua[]>(CUSTOM_DUAS_KEY, []),
  );
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

  /* ── Contextual Time-of-Day Greeting ── */
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return {
        arabic: 'صَبَاحُ الخَيْر',
        title: 'Morning of Grace & Barakah',
        desc: 'Begin your day with conscious remembrance and quiet presence.',
      };
    }
    if (hour < 17) {
      return {
        arabic: 'مَسَاءُ الخَيْر',
        title: 'Midday Peace & Focus',
        desc: 'Pause amidst daily routines to re-center your heart on what matters.',
      };
    }
    if (hour < 21) {
      return {
        arabic: 'مَسَاءُ السَّكِينَة',
        title: 'Evening Reflection & Calm',
        desc: 'Wind down your day with the evening athkār and protection duas.',
      };
    }
    return {
      arabic: 'لَيْلَةٌ مُبَارَكَة',
      title: 'Night of Peace & Gratitude',
      desc: 'Reflect upon the day’s blessings and entrust your night to Allah.',
    };
  }, []);

  /* ── Dark mode + sound persistence ── */
  useEffect(() => {
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

  const bg = dark
    ? 'min-h-screen bg-[#091411] text-stone-200 antialiased selection:bg-emerald-500/30'
    : 'min-h-screen bg-[#f8faf9] text-stone-800 antialiased selection:bg-emerald-500/20';

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
                <span>{getHijriDate()}</span>
                <span className="opacity-40">•</span>
                <span className="text-[11px] font-medium opacity-80">{getGregorianDate()}</span>
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
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                    dark
                      ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : 'border-emerald-700/30 bg-emerald-800 text-white shadow-xs hover:bg-emerald-700'
                  }`}
                >
                  <span>Sync / Login</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Hero Sanctuary Dashboard ── */}
          <div className="mb-8">
            <section
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 text-white shadow-2xl transition-all ${
                dark
                  ? 'border-emerald-500/25 bg-[radial-gradient(ellipse_at_85%_20%,rgb(66_201_158/18%),transparent_55%),linear-gradient(135deg,#0a2720,#0d382c_65%,#08201a)]'
                  : 'border-emerald-800 bg-[radial-gradient(ellipse_at_85%_20%,rgb(125_236_193/28%),transparent_55%),linear-gradient(135deg,#064e3b,#086049_65%,#0f765e)]'
              }`}
              aria-label="Daily Remembrance Sanctuary"
            >
              {/* Subtle Ambient Islamic Geometric Accent */}
              <div
                className="pointer-events-none absolute -bottom-10 right-10 hidden lg:block opacity-15"
                aria-hidden="true"
              >
                <svg viewBox="0 0 180 150" className="h-44 w-52" fill="none">
                  <path
                    d="M30 132V73h120v59M24 132h132M41 72c0-22 18-40 49-40s49 18 49 40M90 32V15m-5 4h10M35 73V41l8-13 8 13v32m86 0V41l8-13 8 13v32M80 132V98a10 10 0 0 1 20 0v34"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M68 73c0-12 10-22 22-22s22 10 22 22" stroke="currentColor" strokeWidth="3" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Inspiring Headline & Context */}
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>{timeGreeting.title}</span>
                  </div>

                  <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    Make room for what matters.
                  </h1>

                  <p
                    className="mt-1 font-arabic text-xl sm:text-2xl text-emerald-200/90 font-normal"
                    dir="rtl"
                    lang="ar"
                    translate="no"
                  >
                    أَذْكَار يَوْمِيَّة · {timeGreeting.arabic}
                  </p>

                  <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-md">
                    {done === total && total > 0
                      ? 'Alḥamdulillāh! All daily remembrances completed today. May Allah accept your devotion.'
                      : done > 0
                        ? `${done} of ${total} remembrances completed today. Steadiness over speed — keep going at your own pace.`
                        : timeGreeting.desc}
                  </p>

                  {/* Highlights Bar: Streak + Quick Actions */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200">
                      <Flame className="h-4 w-4 text-amber-300 fill-amber-300/30" />
                      <span>{streak.current}d Streak</span>
                      <span className="opacity-60 font-normal text-[10px]">• Best: {streak.best}d</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{done} / {total} Done</span>
                    </div>
                  </div>
                </div>

                {/* Right: Circular Radial Progress Ring */}
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
                        className="fill-none stroke-emerald-300 stroke-[7px] [stroke-linecap:round] transition-all duration-700 ease-out"
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
                      <strong suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {pct}%
                      </strong>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-100/75">
                        Complete
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
                desc: `${done} of ${total} done`,
                active: true,
              },
              {
                href: '/salah',
                Icon: Clock3,
                title: 'Ṣalāh Times',
                desc: nextPrayerInfo ? `Next: ${nextPrayerInfo.name}` : 'Prayer schedule',
                active: false,
              },
              {
                href: '/quran',
                Icon: BookOpen,
                title: 'Noble Qur’an',
                desc: 'Read & listen',
                active: false,
              },
              {
                href: '/tasbeeh',
                Icon: CircleDot,
                title: 'Tasbīḥ Counter',
                desc: 'Digital subḥah',
                active: false,
              },
            ].map((pillar) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className={`group flex items-center gap-3 rounded-2xl border p-3.5 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  pillar.active
                    ? dark
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-xs'
                      : 'border-emerald-700/30 bg-emerald-50/80 text-emerald-900 shadow-xs'
                    : dark
                      ? 'border-white/[0.08] bg-[#111e1a]/90 hover:border-emerald-500/30 text-stone-200'
                      : 'border-stone-200/90 bg-white hover:border-emerald-500/30 text-stone-800 shadow-xs'
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                    pillar.active
                      ? dark
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-800 text-white'
                      : dark
                        ? 'bg-white/5 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <pillar.Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold leading-tight">{pillar.title}</div>
                  <div className="truncate text-[10px] text-stone-400 dark:text-stone-400 mt-0.5">
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
                      className={`h-10 w-full rounded-2xl border pl-10 pr-9 text-xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                        dark
                          ? 'border-white/[0.08] bg-[#111e1a] text-stone-100 placeholder-stone-500'
                          : 'border-stone-200 bg-white text-stone-800 placeholder-stone-400 shadow-xs'
                      }`}
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
                    className={`inline-flex h-10 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold transition-all active:scale-95 ${
                      priOnly
                        ? 'border-amber-400/50 bg-amber-400/15 text-amber-700 dark:text-amber-300'
                        : dark
                          ? 'border-white/[0.08] bg-[#111e1a] text-stone-400 hover:text-stone-200'
                          : 'border-stone-200 bg-white text-stone-600 hover:text-stone-900 shadow-xs'
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
                    className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-emerald-600/30 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
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
                        className={`inline-flex min-h-8 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all ${
                          active
                            ? 'bg-emerald-800 text-white dark:bg-emerald-500 dark:text-emerald-950 shadow-xs'
                            : dark
                              ? 'border border-white/[0.08] bg-[#111e1a] text-stone-400 hover:text-stone-200'
                              : 'border border-stone-200 bg-white text-stone-600 hover:text-stone-900 shadow-xs'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                            active
                              ? 'bg-white/20 text-white dark:bg-black/20 dark:text-emerald-950'
                              : dark
                                ? 'bg-white/5 text-stone-400'
                                : 'bg-stone-100 text-stone-500'
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
                      className="mt-4 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950"
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
                className={`rounded-2xl border p-4.5 transition-all ${
                  dark
                    ? 'border-white/[0.08] bg-[#111e1a]/90 backdrop-blur-md'
                    : 'border-stone-200/90 bg-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[var(--app-ink)]">Today&apos;s Goal</span>
                  <span
                    suppressHydrationWarning
                    className="font-mono text-sm text-emerald-700 dark:text-emerald-300 font-bold"
                  >
                    {pct}%
                  </span>
                </div>
                <div className="my-2.5">
                  <ProgressBar pct={pct} dark={dark} />
                </div>
                <p
                  suppressHydrationWarning
                  className="text-[11px] text-stone-500 dark:text-stone-400"
                >
                  {done === total && total > 0
                    ? '✨ All daily duas finished. BarakAllahu feek!'
                    : `${done} of ${total} finished · ${pending} remaining`}
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
                className={`overflow-hidden rounded-2xl border transition-all ${
                  dark ? 'border-white/[0.08] bg-[#111e1a]/90' : 'border-stone-200/90 bg-white shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowHeatmap((v) => !v)}
                  aria-expanded={showHeatmap}
                  className="flex min-h-12 w-full items-center justify-between px-4 text-xs font-bold text-[var(--app-ink)]"
                >
                  <span>{showHeatmap ? 'Hide 365-Day Activity Map' : 'View 365-Day Activity Map'}</span>
                  <span
                    className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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
          <footer
            className={`mt-16 border-t pt-8 pb-12 text-center ${
              dark ? 'border-white/[0.06]' : 'border-stone-200/70'
            }`}
          >
            <p
              className={`font-arabic text-2xl ${
                dark ? 'text-emerald-400/30' : 'text-emerald-700/30'
              }`}
              dir="rtl"
              lang="ar"
              translate="no"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <p
              className={`mt-3 text-[10px] uppercase tracking-widest ${
                dark ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
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

            {/* Buy Me A Coffee Pill */}
            <div className="mt-5 flex justify-center">
              <a
                href="https://buymeacoffee.com/nazrulislambhat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buy me a coffee - Support Dhikrly"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold no-underline transition-all hover:scale-105 active:scale-95 ${
                  dark
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/50'
                    : 'border-amber-400/50 bg-[#FFDD00]/25 text-amber-950 hover:bg-[#FFDD00]/40 hover:border-amber-500/60 shadow-xs'
                }`}
              >
                <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Support Dhikrly · Buy me a coffee</span>
              </a>
            </div>

            {/* Navigation Links */}
            <div
              className={`mt-6 flex flex-wrap items-center justify-center gap-5 text-[11px] font-semibold ${
                dark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              <Link
                href="/about"
                className={`transition-colors ${dark ? 'hover:text-emerald-300' : 'hover:text-emerald-800'}`}
              >
                About
              </Link>
              <Link
                href="/privacy-policy"
                className={`transition-colors ${dark ? 'hover:text-emerald-300' : 'hover:text-emerald-800'}`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={`transition-colors ${dark ? 'hover:text-emerald-300' : 'hover:text-emerald-800'}`}
              >
                Terms of Use
              </Link>
              <Link
                href="/tech"
                className={`transition-colors ${dark ? 'hover:text-emerald-300' : 'hover:text-emerald-800'}`}
              >
                Tech Stack & APIs
              </Link>
              <Link
                href="/contact"
                className={`transition-colors ${dark ? 'hover:text-emerald-300' : 'hover:text-emerald-800'}`}
              >
                Contact
              </Link>
            </div>

            <p className={`mt-4 text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
              © {new Date().getFullYear()} Dhikrly — Made for the Ummah
            </p>
          </footer>
        </div>
      </AppShell>
    </div>
  );
}
