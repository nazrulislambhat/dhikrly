'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplets,
  Ear,
  Eye,
  HandHeart,
  HeartHandshake,
  Minus,
  Plus,
  RotateCcw,
  Smile,
  Sparkles,
} from 'lucide-react';
import {
  JUMUAH_SUNNAH_ITEMS,
  getJumuahState,
  isJumuahTimeWindow,
  saveJumuahState,
  type JumuahState,
  type JumuahSunnahItem,
} from '@/lib/jumuah';

interface JumuahBannerProps {
  dark: boolean;
  dhuhrTime?: string | Date;
  maghribTime?: string | Date;
  asrTime?: string | Date;
}

function formatTimeString(val?: string | Date, fallback = '--:--'): string {
  if (!val) return fallback;
  if (val instanceof Date) {
    return val.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return String(val);
}

export default function JumuahBanner({
  dark,
  dhuhrTime,
  maghribTime,
  asrTime,
}: JumuahBannerProps) {
  const formattedDhuhr = formatTimeString(dhuhrTime, '12:30');
  const formattedMaghrib = formatTimeString(maghribTime, '18:15');
  const formattedAsr = formatTimeString(asrTime, '15:45');
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [forcePreview, setForcePreview] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const windowInfo = useMemo(() => isJumuahTimeWindow(now), [now]);
  const isJumuahActive = windowInfo.isJumuah || forcePreview;
  const fridayKey = windowInfo.fridayDateStr;

  const [state, setState] = useState<JumuahState>({
    completedSunnahs: {},
    salawatCount: 0,
    kahfRead: false,
  });

  useEffect(() => {
    setMounted(true);
    setState(getJumuahState(fridayKey));
  }, [fridayKey]);

  useEffect(() => {
    const handleUpdate = () => setState(getJumuahState(fridayKey));
    window.addEventListener('dhikrly:jumuah-updated', handleUpdate);
    return () => window.removeEventListener('dhikrly:jumuah-updated', handleUpdate);
  }, [fridayKey]);

  const toggleSunnah = (id: string) => {
    const nextState: JumuahState = {
      ...state,
      completedSunnahs: {
        ...state.completedSunnahs,
        [id]: !state.completedSunnahs[id],
      },
    };
    if (id === 'surah_kahf') {
      nextState.kahfRead = !state.completedSunnahs.surah_kahf;
    }
    setState(nextState);
    saveJumuahState(fridayKey, nextState);
  };

  const incrementSalawat = (amount = 1) => {
    const nextState: JumuahState = {
      ...state,
      salawatCount: Math.max(0, state.salawatCount + amount),
    };
    setState(nextState);
    saveJumuahState(fridayKey, nextState);
  };

  const resetSalawat = () => {
    const nextState: JumuahState = {
      ...state,
      salawatCount: 0,
    };
    setState(nextState);
    saveJumuahState(fridayKey, nextState);
  };

  const completedCount = useMemo(() => {
    return Object.values(state.completedSunnahs).filter(Boolean).length;
  }, [state.completedSunnahs]);

  const totalSunnahs = JUMUAH_SUNNAH_ITEMS.length;
  const progressPct = Math.round((completedCount / totalSunnahs) * 100);

  if (!mounted) {
    return null;
  }

  if (!isJumuahActive) {
    return (
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setForcePreview(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-1 text-[11px] font-medium text-[var(--app-muted)] hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>Preview Jumu’ah Mode</span>
        </button>
      </div>
    );
  }

  const getSunnahIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplets':
        return Droplets;
      case 'Sparkles':
        return Sparkles;
      case 'Smile':
        return Smile;
      case 'BookOpen':
        return BookOpen;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Clock':
        return Clock;
      case 'Ear':
        return Ear;
      case 'HandHeart':
        return HandHeart;
      default:
        return Sparkles;
    }
  };

  return (
    <section
      aria-label="Jumu'ah Mode"
      className="mb-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-emerald-950 via-[#0d221c] to-[#122b22] text-white p-5 sm:p-7 shadow-xl relative overflow-hidden"
    >
      {/* Background Islamic Pattern Accent */}
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-200 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>
              {windowInfo.isEve
                ? 'Jumu’ah Eve (Thursday Maghrib)'
                : 'Blessed Friday · Sayyid al-Ayyām'}
            </span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-amber-100">
            Jumu’ah Mubarak 🕌
          </h2>
          <p className="mt-1 text-xs text-stone-300 max-w-xl leading-relaxed">
            “The sun does not rise nor set on a day more blessed than Friday.” Fulfill the Sunan,
            recite Surah Al-Kahf, and catch the Hour of Response.
          </p>
        </div>

        {/* Quick action: Read Surah Al-Kahf */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/quran"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
          >
            <BookOpen className="h-4 w-4" />
            <span>Read Surah Al-Kahf (18)</span>
          </Link>
          {forcePreview && (
            <button
              type="button"
              onClick={() => setForcePreview(false)}
              className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-stone-300 hover:text-white"
            >
              Exit Preview
            </button>
          )}
        </div>
      </div>

      {/* Times & Sa'at al-Istijabah Card Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Jumu'ah Prayer Timing */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <Clock className="h-3.5 w-3.5" />
            <span>Jumu’ah Khutbah & Prayer</span>
          </div>
          <div className="mt-1 text-xl font-extrabold text-white">~{formattedDhuhr}</div>
          <p className="mt-0.5 text-[10px] text-stone-300">
            Arrive early to pray Tahiyyat al-Masjid before the Khutbah starts.
          </p>
        </div>

        {/* Sa'at al-Istijabah */}
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3.5">
          <div className="flex items-center gap-2 text-amber-200 text-xs font-bold">
            <HandHeart className="h-3.5 w-3.5 text-amber-300" />
            <span>Hour of Response (Du’ā)</span>
          </div>
          <div className="mt-1 text-xl font-extrabold text-amber-100">
            {formattedAsr} – {formattedMaghrib}
          </div>
          <p className="mt-0.5 text-[10px] text-amber-200/90">
            The last hour after ‘Asr until sunset is the time du‘ā is guaranteed accepted.
          </p>
        </div>

        {/* Salawat Counter Widget */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Salawāt upon Prophet ﷺ</span>
            </span>
            <span className="text-[11px] text-stone-300">{state.salawatCount} / 100</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => incrementSalawat(1)}
              className="flex-1 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 py-1.5 px-3 text-xs font-bold transition-all active:scale-95"
            >
              +1 Allāhumma Salli
            </button>
            <button
              type="button"
              onClick={() => incrementSalawat(10)}
              className="rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 py-1.5 px-2.5 text-xs font-bold transition-all active:scale-95"
            >
              +10
            </button>
            <button
              type="button"
              onClick={resetSalawat}
              title="Reset Salawat counter"
              className="p-1.5 text-stone-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sunnah Checklist Progress Bar */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-stone-200">
            Friday Sunan Checklist ({completedCount} of {totalSunnahs} fulfilled)
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <span>{expanded ? 'Hide Details' : 'View All Sunan'}</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Expanded Sunnah List */}
      {expanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
          {JUMUAH_SUNNAH_ITEMS.map((item) => {
            const isDone = !!state.completedSunnahs[item.id];
            const Icon = getSunnahIcon(item.icon);

            return (
              <div
                key={item.id}
                onClick={() => toggleSunnah(item.id)}
                className={`group flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-500/15'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl border transition-all mt-0.5 ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-400 text-stone-950 font-bold'
                      : 'border-white/30 bg-white/5 text-transparent group-hover:border-white/50'
                  }`}
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-xs font-bold ${
                        isDone ? 'line-through text-stone-400' : 'text-stone-100'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.arabicTitle && (
                      <span className="font-arabic text-[11px] text-amber-200/80">
                        {item.arabicTitle}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-300 leading-snug">{item.desc}</p>
                  <p className="mt-1 text-[10px] text-stone-400 italic font-serif">
                    {item.hadith}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
