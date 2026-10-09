'use client';

import Link from 'next/link';
import {
  Bell,
  BookOpen,
  Clock3,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import DUAS_JSON from '@/data/duas.json';
import type { Dua, CatEntry, Streak } from '@/types';
import AppShell from '@/components/AppShell';
import {
  load,
  save,
  SETTINGS_KEY,
  CUSTOM_DUAS_KEY,
  NOTIFICATION_KEY,
} from '@/lib/storage';
import { getHijriDate, getGregorianDate } from '@/lib/dates';
import { scheduleNotifications } from '@/components/NotificationSettings';
import type { NotifSettings } from '@/types';

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
import UpdateBanner from '@/components/UpdateBanner';
import TasbihCounter from '@/components/TasbihCounter';
import TiltCard from '@/components/TiltCard';
import { useChecked } from '@/hooks/useChecked';
import { useStreak } from '@/hooks/useStreak';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';

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

  /* ── Sync ── */
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
      // Apply today's remote checked state
      const todayRemote = data.checkedByDate[today];
      if (todayRemote) setChecked(todayRemote);
    },
    [today, setChecked],
  );

  // Called by Realtime when another device updates today's progress
  const handleRemoteCheckedUpdate = useCallback(
    (remoteChecked: Record<string, boolean>) => {
      setChecked(remoteChecked);
    },
    [setChecked],
  );

  const { status: syncStatus } = useSync({
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

  const prevDone = useRef(done);

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
      showToast('All duas completed. BarakAllahu feek.');
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

    // Re-schedule when user returns to the tab (handles mobile background suspension)
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
    reset();
    showToast('Reset. Begin again with Bismillah.');
  };

  const handleAddDua = useCallback(
    (dua: Dua) => {
      const updated = [...customDuas, dua];
      setCustomDuas(updated);
      save(CUSTOM_DUAS_KEY, updated);
      showToast(`"${dua.title}" added.`);
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
    ? 'min-h-screen bg-[#0d1715] text-stone-200'
    : 'min-h-screen bg-stone-50 text-stone-800';

  return (
    <div className={bg}>
      <AppShell active="adhkar" dark={dark} onToggleDark={() => setDark((value) => !value)}>
        <PWAProvider dark={dark} />
        <UpdateBanner dark={dark} />

      {/* Toast */}
      {toast !== null && (
        <div className="animate-fade-in fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 text-sm text-white shadow-xl">
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

      <div className="mx-auto w-full max-w-[82rem] px-4 py-5 pb-10 sm:px-6 sm:py-8 lg:px-10">
        {/* ── Header ── */}
        <header className="mb-8 grid gap-3 min-[900px]:grid-cols-[minmax(0,1fr)_auto] min-[900px]:items-center">
          {/* Top bar: Hijri date left, auth right */}
          <div className="mb-4 flex items-center justify-between min-[900px]:col-[2] min-[900px]:row-[1] min-[900px]:mb-0">
            <div className="text-xs font-semibold text-[var(--app-muted)]">
              {getHijriDate()}
            </div>

            {authLoading ? (
              <div
                className={`h-7 w-24 animate-pulse rounded-full ${dark ? 'bg-white/5' : 'bg-stone-100'}`}
              />
            ) : user ? (
              <UserMenu
                user={user}
                dark={dark}
                syncStatus={syncStatus}
                onSignOut={async () => {
                  await signOut();
                  showToast('Signed out.');
                }}
              />
            ) : (
              <button
                onClick={() => setActiveModal('auth')}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 ${
                  dark
                    ? 'border-emerald-400/30 text-emerald-200/80 hover:border-emerald-400/50 hover:text-emerald-200'
                    : 'border-emerald-600/30 text-emerald-800 hover:border-emerald-600 hover:text-emerald-900'
                }`}
              >
                ↑ Sync / Login
              </button>
            )}
          </div>

          {/* Title block */}
          <div className="text-left min-[900px]:col-[1] min-[900px]:row-[1]">
            <h1
              className={`font-sans text-[clamp(26px,4vw,36px)] font-bold tracking-tight ${dark ? 'text-stone-100' : 'text-stone-900'}`}
            >
              Make room for what matters.
            </h1>
            <p
              className={`mt-1 font-arabic text-xl ${dark ? 'text-amber-300/80' : 'text-amber-700'}`}
              dir="rtl"
              lang="ar"
              translate="no"
            >
              أَذْكَار يَوْمِيَّة
            </p>
            <p
              className={`mt-2 text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}
            >
              {getGregorianDate()} <span className="mx-1.5 text-amber-500">·</span> {getHijriDate()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-5 grid max-w-sm grid-cols-2 gap-2">
            {[
              {
                label: soundEnabled ? 'Sound' : 'Muted',
                Icon: soundEnabled ? Volume2 : VolumeX,
                onClick: () => setSoundEnabled((s) => !s),
                active: soundEnabled,
              },
              {
                label: 'Reminders',
                Icon: Bell,
                onClick: () => setActiveModal('notifications'),
              },
            ].map(({ label, Icon, onClick, active }) => (
              <button
                key={label}
                onClick={onClick}
                className={`inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
                  active === true
                    ? dark
                      ? 'border-emerald-400/30 text-emerald-300'
                      : 'border-emerald-700/20 bg-white text-emerald-800'
                    : dark
                      ? 'border-white/10 text-stone-400 hover:text-stone-200'
                      : 'border-[var(--app-line)] bg-white text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-4 grid gap-4 min-[900px]:grid-cols-[minmax(0,1.65fr)_minmax(14rem,0.8fr)] min-[900px]:items-stretch">
        <TiltCard className="h-full min-w-0">
        <section className={`relative flex min-h-48 items-center justify-between gap-4 overflow-hidden rounded-[1.35rem] border p-5 text-white shadow-xl sm:p-8 ${
          dark
            ? 'border-emerald-400/20 bg-[radial-gradient(circle_at_88%_15%,rgb(66_201_158/18%),transparent_40%),linear-gradient(120deg,#123a30,#145741_76%,#176d51)]'
            : 'border-emerald-900 bg-[radial-gradient(circle_at_88%_15%,rgb(125_236_193/25%),transparent_40%),linear-gradient(120deg,#075d46,#287750_75%,#47a276)]'
        }`} aria-label="Daily remembrance">
          <div className="relative z-10 max-w-lg">
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-emerald-50/75">
              TODAY&apos;S PRACTICE
            </p>
            <h2 className="mt-2 font-sans text-2xl font-bold sm:text-3xl">
              Small moments. Steady presence.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 opacity-75">
              {done} of {total} remembrances completed today. Keep going at your own pace.
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-10 right-16 hidden text-white/[0.12] sm:block" aria-hidden="true">
            <svg viewBox="0 0 180 150" className="h-40 w-48" fill="none">
              <path d="M30 132V73h120v59M24 132h132M41 72c0-22 18-40 49-40s49 18 49 40M90 32V15m-5 4h10M35 73V41l8-13 8 13v32m86 0V41l8-13 8 13v32M80 132V98a10 10 0 0 1 20 0v34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M68 73c0-12 10-22 22-22s22 10 22 22" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
          <div
            className="relative z-10 grid h-[5.6rem] w-[5.6rem] shrink-0 place-items-center sm:h-[6.25rem] sm:w-[6.25rem]"
            role="img"
            aria-label={`${pct}% complete`}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="fill-none stroke-white/20 stroke-[7px]" cx="50" cy="50" r="43" />
              <circle
                className="fill-none stroke-white stroke-[7px] [stroke-linecap:round]"
                cx="50"
                cy="50"
                r="43"
                style={{ strokeDasharray: `${pct * 2.7} 270` }}
              />
            </svg>
            <span className="grid justify-items-center"><strong className="text-base leading-tight">{pct}%</strong><small className="text-[9px] text-white/70">complete</small></span>
          </div>
        </section>
        </TiltCard>

        <section className="grid grid-cols-3 gap-2.5 min-[900px]:grid-cols-1" aria-label="Quick links">
          {[
            { href: '/salah', Icon: Clock3, title: 'Prayer', note: 'Times' },
            { href: '/quran', Icon: BookOpen, title: 'Qur’an', note: 'Read & listen' },
            { href: '#daily-adhkar', Icon: Sparkles, title: 'Adhkār', note: 'Daily duas' },
          ].map((item) => (
            <TiltCard key={item.href} className="h-full min-w-0" intensity={7}>
              <Link
                href={item.href}
                className={`grid h-full min-w-0 grid-cols-1 content-start items-center rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-3 no-underline transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg min-[900px]:grid-cols-[2.5rem_minmax(0,1fr)] min-[900px]:gap-x-3 min-[900px]:px-4 ${
                  dark ? 'bg-[#14211e]' : ''
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 min-[900px]:row-span-2" aria-hidden="true">
                  <item.Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold text-[var(--app-ink)] min-[900px]:mt-0">{item.title}</span>
                <span className="mt-0.5 text-[10px] text-[var(--app-muted)] min-[900px]:text-[11px]">{item.note}</span>
              </Link>
            </TiltCard>
          ))}
        </section>
        </div>

        <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_19rem] min-[1100px]:items-start">
          <section
            className="min-w-0"
            id="daily-adhkar"
            aria-label="Daily remembrances"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[var(--app-muted)]">YOUR COLLECTION</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Daily remembrances</h2>
              </div>
              <span className="shrink-0 pb-1 text-xs font-semibold text-[var(--app-muted)]">{done} of {total} complete</span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <label className="relative min-w-[12rem] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search remembrances"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search remembrances"
                className={`h-10 w-full rounded-xl border bg-[var(--app-surface)] pl-9 pr-4 text-xs outline-none transition-colors focus:border-emerald-500 ${
                  dark
                    ? 'border-white/[0.08] text-stone-200 placeholder-stone-600'
                    : 'border-[var(--app-line)] text-stone-700 placeholder-stone-400'
                }`}
              />
              </label>
              <button
                onClick={() => setPriOnly((p) => !p)}
                aria-pressed={priOnly}
                className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
                  priOnly
                    ? dark
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-amber-400/50 bg-amber-50 text-amber-700'
                    : dark
                      ? 'border-white/[0.08] text-stone-500 hover:text-stone-300'
                      : 'border-[var(--app-line)] bg-white text-stone-500 hover:text-stone-700'
                }`}
              >
                <Star className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Priority
              </button>
              <button
                onClick={() => setActiveModal('addDua')}
                className="min-h-10 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-xs font-bold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 dark:bg-[#14211e] dark:text-emerald-200"
              >
                <Plus className="mr-1 inline h-4 w-4" aria-hidden="true" /> Add Du&apos;ā
              </button>
              <button onClick={handleReset} className="min-h-10 rounded-xl border border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-50 dark:bg-[#14211e] dark:text-red-300">
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto px-0.5 py-1 scrollbar-none">
              {CATS.map(({ key, label }: CatEntry) => {
                const active = filter === key;
                const count = catCount(key);
                if (count === 0 && key !== 'all') return null;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl border border-[var(--app-line)] px-3 text-xs font-semibold ${
                      active
                        ? 'border-emerald-700 bg-emerald-800 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950'
                        : 'bg-[var(--app-surface)] text-[var(--app-muted)] dark:bg-[#14211e]'
                    }`}
                  >
                    {label}
                    <span className="text-[10px] tabular-nums opacity-70">{catDone(key)}/{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 min-[1100px]:grid-cols-2">
              {filtered.length === 0 && (
                <p className="col-span-full rounded-2xl border border-dashed border-[var(--app-line)] px-4 py-12 text-center text-sm text-[var(--app-muted)]">
                  No remembrances match your search.
                </p>
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

          <aside className="grid min-w-0 content-start gap-3 min-[1100px]:sticky min-[1100px]:top-5" aria-label="Your progress">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total" value={total} accent="gold" dark={dark} />
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
                accent="purple"
                dark={dark}
              />
            </div>

            <section className="grid gap-3 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 dark:bg-[#14211e]">
              <div className="flex items-center justify-between text-sm font-bold">
                <h2>Today&apos;s progress</h2>
                <span className="text-emerald-800 dark:text-emerald-200">{pct}%</span>
              </div>
              <ProgressBar pct={pct} dark={dark} />
              <p className="text-[11px] text-[var(--app-muted)]">{done} of {total} remembrances finished</p>
            </section>

            <div className="overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-1 dark:bg-[#14211e]">
              <WeeklyHistory dark={dark} total={total} streakBest={streak.best} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] dark:bg-[#14211e]">
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                aria-expanded={showHeatmap}
                className="flex min-h-12 w-full items-center justify-between px-4 text-xs font-bold"
              >
                <span>{showHeatmap ? 'Hide activity map' : 'View activity map'}</span>
                <span className="text-lg text-emerald-800 dark:text-emerald-200" aria-hidden="true">{showHeatmap ? '−' : '+'}</span>
              </button>
              {showHeatmap && <StreakHeatmap dark={dark} total={total} />}
            </div>

            <div>
              <TasbihCounter />
            </div>
          </aside>
        </div>
        {/* ── Footer ── */}
        <footer
          className={`mt-12 border-t pt-6 text-center ${dark ? 'border-white/[0.06]' : 'border-black/[0.04]'}`}
        >
          <p
            className={`font-arabic text-xl ${dark ? 'text-amber-400/30' : 'text-amber-600/30'}`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p
            className={`mt-2 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-700' : 'text-stone-400'}`}
          >
            {user
              ? `${syncStatus === 'synced' ? 'All changes synced' : syncStatus === 'syncing' ? 'Syncing changes…' : syncStatus === 'offline' ? 'Waiting for connection' : 'Sync failed; retrying'} · ${user.email}`
              : 'Progress saved locally'}
          </p>
          <div
            className={`mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-700' : 'text-stone-400'}`}
          >
            <a
              href="/about"
              className={`transition-colors ${dark ? 'hover:text-stone-500' : 'hover:text-stone-600'}`}
            >
              About
            </a>
            <a
              href="/privacy-policy"
              className={`transition-colors ${dark ? 'hover:text-stone-500' : 'hover:text-stone-600'}`}
            >
              Privacy
            </a>
            <a
              href="/terms"
              className={`transition-colors ${dark ? 'hover:text-stone-500' : 'hover:text-stone-600'}`}
            >
              Terms
            </a>
            <a
              href="/contact"
              className={`transition-colors ${dark ? 'hover:text-stone-500' : 'hover:text-stone-600'}`}
            >
              Contact
            </a>
          </div>
          <p
            className={`mt-3 text-[9px] ${dark ? 'text-stone-800' : 'text-stone-300'}`}
          >
            © {new Date().getFullYear()} Dhikrly
          </p>
        </footer>
      </div>
      </AppShell>
    </div>
  );
}
