'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import type { PrayerTimesResult } from '@/types/salah';
import { getMakroohIntervals, checkMakroohStatus } from '@/lib/makroohTimes';
import { formatTime } from '@/lib/prayerTimes';

interface MakroohTimesCardProps {
  times: PrayerTimesResult;
  timezone: string;
  dark: boolean;
  now?: Date;
}

export default function MakroohTimesCard({
  times,
  timezone,
  dark,
  now = new Date(),
}: MakroohTimesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { isMakrooh, activeInterval, minutesRemaining } = checkMakroohStatus(times, now);
  const intervals = getMakroohIntervals(times);

  const cardBase = 'border-border bg-surface text-ink shadow-xs';

  return (
    <div className={`rounded-2xl border p-4 transition-all ${cardBase}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {isMakrooh ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-500 dark:bg-amber-400/20 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isMakrooh
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isMakrooh ? 'Makrooh Window Active' : 'Permissible Time to Pray'}
              </span>
              <span className="text-[10px] text-stone-400">• Sahih Muslim 831</span>
            </div>
            <p className="font-serif text-sm font-bold sm:text-base">
              {isMakrooh && activeInterval
                ? `${activeInterval.name} (${minutesRemaining}m remaining)`
                : 'All voluntary & nafl prayers permissible right now'}
            </p>
          </div>
        </div>

        {/* Toggle details button */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            dark
              ? 'border-white/10 text-stone-300 hover:bg-white/5'
              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
          aria-expanded={expanded}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{expanded ? 'Hide Prohibited Times' : 'View 3 Makrooh Times'}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded list of the 3 Makrooh intervals */}
      {expanded && (
        <div className="mt-4 space-y-3 pt-3 border-t border-[var(--app-line)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {intervals.map((int) => {
              const isActive = activeInterval?.id === int.id;
              return (
                <div
                  key={int.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isActive
                      ? 'border-amber-400/60 bg-amber-500/10 ring-1 ring-amber-400/30'
                      : dark
                        ? 'border-white/[0.06] bg-black/20'
                        : 'border-stone-200/60 bg-stone-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[var(--app-ink)]">{int.name}</span>
                    {isActive && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-extrabold text-amber-600 dark:text-amber-400 animate-pulse">
                        ACTIVE NOW
                      </span>
                    )}
                  </div>
                  <p className="font-arabic text-[11px] text-stone-400 mb-1.5" dir="rtl">
                    {int.nameAr}
                  </p>
                  <p className="text-xs font-extrabold text-red-500 dark:text-emerald-300">
                    {formatTime(int.start, timezone)} — {formatTime(int.end, timezone)}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                    {int.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 p-3 text-[11px] text-stone-600 dark:text-stone-300 border border-amber-500/15">
            <Info className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p>
              <strong>Fiqh Rule:</strong> The Prophet ﷺ forbade praying voluntary (nafl) prayers during these three times: while the sun is rising until it rises, at midday when the sun is at its zenith until it moves past the meridian, and while the sun is setting until it has set (Sahih Muslim 831). Obligatory missed prayers (Qadā) or Janāzah may be prayed according to majority opinion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
