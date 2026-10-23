'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Minus,
  MoonStar,
  Plus,
  RotateCcw,
  Sparkles,
  Sunrise,
  Sunset,
  Target,
  Trophy,
  Wand2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, SETTINGS_KEY } from '@/lib/storage';
import {
  getQadaState,
  saveQadaState,
  type QadaPrayerName,
  type QadaState,
} from '@/lib/qadaStorage';

interface PrayerMeta {
  key: QadaPrayerName;
  name: string;
  arabicName: string;
  rakats: number;
  icon: any;
  color: string;
}

const PRAYER_LIST: PrayerMeta[] = [
  { key: 'fajr', name: 'Fajr', arabicName: 'الفَجْر', rakats: 2, icon: Sunrise, color: 'text-amber-500' },
  { key: 'dhuhr', name: 'Dhuhr', arabicName: 'الظُّهْر', rakats: 4, icon: Clock, color: 'text-emerald-500' },
  { key: 'asr', name: '‘Asr', arabicName: 'العَصْر', rakats: 4, icon: Sunset, color: 'text-amber-600' },
  { key: 'maghrib', name: 'Maghrib', arabicName: 'المَغْرِب', rakats: 3, icon: Sunset, color: 'text-rose-500' },
  { key: 'isha', name: '‘Ishā', arabicName: 'العِشَاء', rakats: 4, icon: MoonStar, color: 'text-indigo-500' },
  { key: 'witr', name: 'Witr Wājib', arabicName: 'الوِتْر', rakats: 3, icon: Sparkles, color: 'text-purple-500' },
];

export default function QadaPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [state, setState] = useState<QadaState>(() => getQadaState());
  const [showWizard, setShowWizard] = useState(false);
  const [wizardYears, setWizardYears] = useState(1);
  const [wizardMonths, setWizardMonths] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const handleUpdate = () => setState(getQadaState());
    window.addEventListener('dhikrly:qada-updated', handleUpdate);
    return () => window.removeEventListener('dhikrly:qada-updated', handleUpdate);
  }, []);

  const totalRemaining = useMemo(() => {
    return state.fajr + state.dhuhr + state.asr + state.maghrib + state.isha + state.witr;
  }, [state]);

  const totalCompleted = state.totalMadeUp;
  const initialBase = Math.max(state.totalInitial, totalRemaining + totalCompleted);
  const progressPct = initialBase > 0 ? Math.min(100, Math.round((totalCompleted / initialBase) * 100)) : 0;

  // Forecast completion date
  const projectedDays = useMemo(() => {
    if (!state.dailyTarget || state.dailyTarget <= 0 || totalRemaining <= 0) return 0;
    return Math.ceil(totalRemaining / state.dailyTarget);
  }, [totalRemaining, state.dailyTarget]);

  const projectedDateStr = useMemo(() => {
    if (projectedDays <= 0) return 'Completed!';
    const d = new Date();
    d.setDate(d.getDate() + projectedDays);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [projectedDays]);

  const updateCount = (key: QadaPrayerName, delta: number) => {
    const current = state[key];
    const updated = Math.max(0, current + delta);
    const madeUpDelta = delta < 0 ? Math.abs(delta) : 0;

    const nextState: QadaState = {
      ...state,
      [key]: updated,
      totalMadeUp: state.totalMadeUp + madeUpDelta,
    };
    setState(nextState);
    saveQadaState(nextState);
  };

  const applyWizardEstimate = () => {
    const totalDays = wizardYears * 365 + wizardMonths * 30;
    if (totalDays <= 0) return;

    const nextState: QadaState = {
      ...state,
      fajr: totalDays,
      dhuhr: totalDays,
      asr: totalDays,
      maghrib: totalDays,
      isha: totalDays,
      witr: totalDays,
      totalInitial: totalDays * 6,
      totalMadeUp: 0,
    };
    setState(nextState);
    saveQadaState(nextState);
    setShowWizard(false);
  };

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-sm`;

  return (
    <AppShell active="qada" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>SYSTEMATIC PRAYER REPAYMENT</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Missed Prayer (Qadā) Tracker
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Keep a faithful account of missed obligatory prayers, establish a daily repayment
              plan, and fulfill your obligations before Allah with peace of mind.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <Wand2 className="h-4 w-4 text-emerald-600" />
              <span>Estimate Wizard</span>
            </button>
            <Link
              href="/salah"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950"
            >
              <Clock className="h-4 w-4" />
              <span>Today’s Ṣalāh</span>
            </Link>
          </div>
        </header>

        {/* Wizard Modal */}
        {showWizard && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && setShowWizard(false)}
          >
            <div className="w-full max-w-md rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-[var(--app-ink)]">
                  Estimate Missed Prayers Duration
                </h3>
              </div>
              <p className="text-xs text-[var(--app-muted)] mb-4">
                Calculate approximate counts based on how much time you missed prayers before
                becoming steadfast in your worship.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Number of Years: {wizardYears} {wizardYears === 1 ? 'Year' : 'Years'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={wizardYears}
                    onChange={(e) => setWizardYears(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--app-ink)] block mb-1">
                    Additional Months: {wizardMonths} {wizardMonths === 1 ? 'Month' : 'Months'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="11"
                    step="1"
                    value={wizardMonths}
                    onChange={(e) => setWizardMonths(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--app-line)] text-xs text-[var(--app-ink)]">
                  Total Days: <strong>{wizardYears * 365 + wizardMonths * 30} days</strong>
                  <br />
                  Will initialize <strong>{wizardYears * 365 + wizardMonths * 30}</strong> of each of the 6 prayers.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWizard(false)}
                    className="flex-1 rounded-2xl border border-[var(--app-line)] py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyWizardEstimate}
                    className="flex-1 rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 py-2.5 text-xs font-bold"
                  >
                    Apply Estimate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Progress Banner */}
        <section className={`${cardClass} mb-8 relative overflow-hidden`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                Repayment Journey
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold text-[var(--app-ink)]">
                  {totalRemaining.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-[var(--app-muted)]">
                  Prayers Remaining
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {totalCompleted.toLocaleString()} prayers completed ({progressPct}% progress towards zero).
              </p>
            </div>

            {/* Repayment Rate & Target Date Card */}
            <div className="rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4 text-xs space-y-2 min-w-[260px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--app-muted)]">Daily Repayment Target:</span>
                <div className="flex items-center gap-1">
                  {[1, 5, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        const updated = { ...state, dailyTarget: rate };
                        setState(updated);
                        saveQadaState(updated);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${
                        state.dailyTarget === rate
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                          : 'bg-black/5 dark:bg-white/10 text-[var(--app-muted)]'
                      }`}
                    >
                      {rate}/d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--app-line)]">
                <span className="text-[var(--app-muted)]">Target Completion:</span>
                <strong suppressHydrationWarning className="text-emerald-700 dark:text-emerald-300">
                  {projectedDateStr}
                </strong>
              </div>
              <p className="text-[10px] text-[var(--app-muted)] leading-tight">
                {state.dailyTarget === 5
                  ? 'Tip: Pray 1 Qadā immediately before or after each of the 5 daily Farḍ prayers.'
                  : `At ${state.dailyTarget} prayers per day, you will finish in ~${projectedDays} days.`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(1, progressPct)}%` }}
              />
            </div>
          </div>
        </section>

        {/* 6 Prayers Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRAYER_LIST.map((p) => {
            const count = state[p.key];
            const Icon = p.icon;

            return (
              <div
                key={p.key}
                className={`${cardClass} flex flex-col justify-between hover:border-emerald-500/30 transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-black/5 dark:bg-white/5 ${p.color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-xs font-bold text-[var(--app-ink)]">{p.name}</h2>
                        <span className="font-arabic text-[11px] text-[var(--app-muted)]">
                          {p.arabicName} · {p.rakats} Rak‘āt
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-[var(--app-ink)]">
                        {count.toLocaleString()}
                      </span>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--app-muted)] font-bold">
                        Owed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--app-line)] flex items-center justify-between gap-2">
                  {/* Decrement by 1 (Prayed 1) */}
                  <button
                    type="button"
                    disabled={count === 0}
                    onClick={() => updateCount(p.key, -1)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-30 dark:bg-emerald-400 dark:text-emerald-950 transition-all active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Prayed 1</span>
                  </button>

                  {/* Batch adjustment buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={count === 0}
                      onClick={() => updateCount(p.key, -5)}
                      title="Made up 5"
                      className="rounded-xl border border-[var(--app-line)] px-2 py-2 text-[10px] font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCount(p.key, 1)}
                      title="Add 1 missed"
                      className="rounded-xl border border-[var(--app-line)] px-2 py-2 text-[10px] font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCount(p.key, 5)}
                      title="Add 5 missed"
                      className="rounded-xl border border-[var(--app-line)] px-2 py-2 text-[10px] font-bold text-[var(--app-ink)] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Scholarly Guidance Box */}
        <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-xs text-[var(--app-muted)] leading-relaxed">
          <strong className="text-[var(--app-ink)] block mb-1">
            Scholarly Guidance on Making Up Missed Prayers (Qadā):
          </strong>
          “Whoever forgets a prayer or sleeps through it, the expiation for it is that he prays it
          when he remembers it.” (Sahih Muslim 684). Classical consensus holds that missed prayers
          remain a debt to Allah until repaid. You can pray Qadā at any time except during sunrise,
          zenith, and sunset.
        </div>
      </div>
    </AppShell>
  );
}
