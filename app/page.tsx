'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DUAS_JSON from '@/data/duas.json';
import type { Dua, CatEntry } from '@/types';
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
import MissedDayRecovery from '@/components/MissedDayRecovery';
import ExportReport from '@/components/ExportReport';

import { useChecked } from '@/hooks/useChecked';
import { useStreak } from '@/hooks/useStreak';
import { useToast } from '@/hooks/useToast';
import PWAProvider from '@/components/PWAProvider';

/* ── Static data ── */
const BASE_DUAS = DUAS_JSON as Dua[];

const CATS: CatEntry[] = [
  { key: 'all', label: 'All' },
  { key: 'quran', label: "Qur'ān" },
  { key: 'athkar', label: 'Athkār' },
  { key: 'dua', label: "Du'ā" },
  { key: 'custom', label: 'Custom' },
];

/* ── Modal types ── */
type Modal = 'notifications' | 'addDua' | 'missedDay' | 'export' | null;

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DuasTracker() {
  /* Settings */
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  /* Custom duas */
  const [customDuas, setCustomDuas] = useState<Dua[]>(() =>
    load<Dua[]>(CUSTOM_DUAS_KEY, []),
  );
  const allDuas: Dua[] = [...BASE_DUAS, ...customDuas];

  /* Core hooks */
  const { checked, toggle, reset, done, pct, today } = useChecked(
    allDuas.length,
  );
  const streak = useStreak(done, allDuas.length);
  const { toast, showToast } = useToast();

  /* UI state */
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [priOnly, setPriOnly] = useState(false);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const prevDone = useRef(done);

  /* Dark mode persistence */
  useEffect(() => {
    save(SETTINGS_KEY, { dark });
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  /* Completion toast */
  useEffect(() => {
    if (
      done === allDuas.length &&
      allDuas.length > 0 &&
      prevDone.current < allDuas.length
    ) {
      showToast('All duas completed. BarakAllahu feek. 🌙');
    }
    prevDone.current = done;
  }, [done, allDuas.length, showToast]);

  /* Schedule notifications on load */
  useEffect(() => {
    const notifSettings = load<NotifSettings>(NOTIFICATION_KEY, {
      morningEnabled: false,
      morningTime: '06:00',
      eveningEnabled: false,
      eveningTime: '18:00',
    });
    scheduleNotifications(notifSettings);
  }, []);

  /* Show missed-day prompt once per session */
  const missedShown = useRef(false);
  useEffect(() => {
    if (missedShown.current) return;
    missedShown.current = true;
    // Small delay so app loads first
    setTimeout(() => setActiveModal('missedDay'), 800);
  }, []);

  /* Handlers */
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

  /* Derived */
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
    ? 'min-h-screen bg-[#0c1a2e] text-stone-200'
    : 'min-h-screen bg-stone-50 text-stone-800';
  const card = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-black/[0.07] shadow-sm';

  return (
    <div className={bg}>
      {/* PWA install prompt */}
      <PWAProvider dark={dark} />

      {/* Toast */}
      {toast !== null && (
        <div className="animate-fade-in fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full bg-emerald-600 px-6 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'notifications' && (
        <NotificationSettings
          dark={dark}
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
      {activeModal === 'missedDay' && (
        <MissedDayRecovery
          dark={dark}
          total={total}
          duaIds={allDuas.map((d) => d.id)}
          onClose={() => setActiveModal(null)}
          onRecover={() => {
            showToast('Day marked complete. JazakAllahu khairan.');
          }}
        />
      )}
      {activeModal === 'export' && (
        <ExportReport
          dark={dark}
          duas={allDuas}
          onClose={() => setActiveModal(null)}
        />
      )}

      <div className="mx-auto max-w-2xl px-4 py-8 pb-16">
        {/* Header */}
        <header className="mb-8 text-center">
          <div
            className={`mb-1 text-[11px] uppercase tracking-[0.18em] ${
              dark ? 'text-amber-400/60' : 'text-amber-600/70'
            }`}
          >
            {getHijriDate()}
          </div>
          <h1
            className={`font-serif text-[clamp(22px,4vw,32px)] font-normal tracking-wide ${
              dark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            Daily Adhkār &amp; Du&apos;ā
          </h1>
          <p
            className={`mt-1 font-arabic text-xl ${
              dark ? 'text-amber-400/45' : 'text-amber-600/50'
            }`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            أَذْكَار يَوْمِيَّة
          </p>
          <p
            className={`mt-2 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
          >
            {getGregorianDate()}
          </p>

          {/* Action row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                dark
                  ? 'border-white/10 text-stone-400 hover:text-stone-200'
                  : 'border-black/10 text-stone-400 hover:text-stone-600'
              }`}
            >
              {dark ? '☀ Light' : '☾ Dark'}
            </button>
            <button
              onClick={() => setActiveModal('notifications')}
              className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                dark
                  ? 'border-white/10 text-stone-400 hover:text-stone-200'
                  : 'border-black/10 text-stone-400 hover:text-stone-600'
              }`}
            >
              🔔 Reminders
            </button>
            <button
              onClick={() => setActiveModal('export')}
              className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                dark
                  ? 'border-white/10 text-stone-400 hover:text-stone-200'
                  : 'border-black/10 text-stone-400 hover:text-stone-600'
              }`}
            >
              ↓ Export
            </button>
            <button
              onClick={() => setActiveModal('missedDay')}
              className={`rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                dark
                  ? 'border-white/10 text-stone-400 hover:text-stone-200'
                  : 'border-black/10 text-stone-400 hover:text-stone-600'
              }`}
            >
              ↺ Missed Days
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-4 gap-2">
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

        {/* Progress bar */}
        <div className="mb-1">
          <ProgressBar pct={pct} dark={dark} />
        </div>
        <div
          className={`mb-5 flex justify-between text-[10px] ${
            dark ? 'text-stone-600' : 'text-stone-400'
          }`}
        >
          <span>{pct}% complete</span>
          <span>
            {done} / {total}
          </span>
        </div>

        {/* 7-day history */}
        <div className="mb-3">
          <WeeklyHistory dark={dark} total={total} streakBest={streak.best} />
        </div>

        {/* Heatmap toggle */}
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className={`mb-3 w-full rounded-xl border px-4 py-2.5 text-[11px] uppercase tracking-widest transition-all ${
            dark
              ? 'border-white/[0.07] text-stone-600 hover:text-stone-400'
              : 'border-black/[0.06] text-stone-400 hover:text-stone-600'
          }`}
        >
          {showHeatmap ? '▲ Hide Heatmap' : '▼ Show Heatmap'}
        </button>
        {showHeatmap && (
          <div className="mb-3">
            <StreakHeatmap dark={dark} total={total} />
          </div>
        )}

        {/* Controls */}
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`h-8 flex-1 rounded-full border bg-transparent px-4 text-xs outline-none transition-colors focus:border-amber-400/50 ${
              dark
                ? 'border-white/[0.08] text-stone-200 placeholder-stone-600'
                : 'border-black/[0.09] text-stone-700 placeholder-stone-400'
            }`}
          />
          <button
            onClick={() => setPriOnly((p) => !p)}
            className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
              priOnly
                ? dark
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                  : 'border-amber-400/50 bg-amber-50 text-amber-700'
                : dark
                  ? 'border-white/[0.08] text-stone-500 hover:text-stone-300'
                  : 'border-black/[0.08] text-stone-400 hover:text-stone-600'
            }`}
          >
            ★ Priority
          </button>
          <button
            onClick={() => setActiveModal('addDua')}
            className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
              dark
                ? 'border-amber-400/20 text-amber-400/70 hover:text-amber-400'
                : 'border-amber-400/40 text-amber-600 hover:text-amber-700'
            }`}
          >
            + Add Du&apos;ā
          </button>
          <button
            onClick={handleReset}
            className={`h-8 rounded-full border px-3 text-[11px] transition-all ${
              dark
                ? 'border-red-500/20 text-red-400/70 hover:text-red-400'
                : 'border-red-300/40 text-red-400 hover:text-red-600'
            }`}
          >
            ↺ Reset
          </button>
        </div>

        {/* Category tabs */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {CATS.map(({ key, label }: CatEntry) => {
            const active = filter === key;
            const count = catCount(key);
            if (count === 0 && key !== 'all') return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'rounded-full border px-3.5 py-1 font-serif text-[11px] tracking-wide transition-all',
                  active
                    ? dark
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                      : 'border-amber-400/50 bg-amber-50 text-amber-700'
                    : dark
                      ? 'border-white/[0.07] text-stone-500 hover:text-stone-300'
                      : 'border-black/[0.07] text-stone-400 hover:text-stone-600',
                ].join(' ')}
              >
                {label}
                <span
                  className={`ml-1.5 text-[9px] ${
                    active ? '' : dark ? 'text-stone-700' : 'text-stone-300'
                  }`}
                >
                  {catDone(key)}/{count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dua cards */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <p
              className={`py-12 text-center text-sm ${
                dark ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              No duas match your search.
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
            />
          ))}
        </div>

        {/* Footer */}
        <footer
          className={`mt-12 border-t pt-6 text-center ${
            dark ? 'border-white/[0.06]' : 'border-black/[0.06]'
          }`}
        >
          <p
            className={`font-arabic text-xl ${
              dark ? 'text-amber-400/30' : 'text-amber-600/30'
            }`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p
            className={`mt-2 text-[10px] uppercase tracking-widest ${
              dark ? 'text-stone-700' : 'text-stone-400'
            }`}
          >
            Progress saved locally
          </p>
        </footer>
      </div>
    </div>
  );
}
