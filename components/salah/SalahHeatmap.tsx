'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { getAllLogs, computeDayScore, isPrayed } from '@/lib/salahStorage';
import type { HeatmapCell } from '@/types/salah';

interface SalahHeatmapProps { dark: boolean; }

export default function SalahHeatmap({ dark }: SalahHeatmapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [rangeMode, setRangeMode] = useState<'1y' | '16w'>('1y');
  const [dataVersion, setDataVersion] = useState(0);
  const [tooltip, setTooltip] = useState<HeatmapCell | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener('dhikrly:salah-logs-updated', onUpdate);
    return () => window.removeEventListener('dhikrly:salah-logs-updated', onUpdate);
  }, []);

  const WEEKS = rangeMode === '1y' ? 52 : 16;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [rangeMode, dataVersion]);

  const { weeks, monthLabels, totalFardCount, activeDays } = useMemo(() => {
    const all = mounted ? getAllLogs() : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const cells: HeatmapCell[] = [];
    let fardSum = 0;
    let daysWithPrayers = 0;

    for (let i = WEEKS * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const log = all[date];
      const score = log ? computeDayScore(log) : 0;
      const prayers = log ? Object.values(log.prayers ?? {}) : [];
      const fard = prayers.filter((p) => isPrayed(p)).length;
      if (fard > 0) {
        daysWithPrayers += 1;
        fardSum += fard;
      }
      cells.push({ date, score, fard, isToday: date === todayStr, isFuture: d > today });
    }

    const weekGroups: HeatmapCell[][] = [];
    for (let w = 0; w < WEEKS; w++) weekGroups.push(cells.slice(w * 7, w * 7 + 7));

    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weekGroups.forEach((week, col) => {
      try {
        const m = new Date(week[0].date + 'T12:00:00').getMonth();
        if (m !== lastMonth) {
          labels.push({
            label: new Date(week[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }),
            col,
          });
          lastMonth = m;
        }
      } catch {}
    });

    return {
      weeks: weekGroups,
      monthLabels: labels,
      totalFardCount: fardSum,
      activeDays: daysWithPrayers,
    };
  }, [WEEKS, dataVersion]);

  const color = (cell: HeatmapCell) => {
    if (cell.isFuture) return dark ? 'bg-stone-800/50' : 'bg-stone-100';
    if (cell.score === 0) return dark ? 'bg-stone-800' : 'bg-stone-100';
    if (cell.score < 0.4) return dark ? 'bg-amber-900/60' : 'bg-amber-100';
    if (cell.score < 0.8) return dark ? 'bg-amber-600/50' : 'bg-amber-300';
    if (cell.score < 1)   return dark ? 'bg-emerald-700/60' : 'bg-emerald-300';
    return 'bg-emerald-500';
  };

  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';

  return (
    <div suppressHydrationWarning className={`rounded-2xl border p-4 ${card}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className={`text-[10px] uppercase tracking-widest ${
              dark ? 'text-stone-400' : 'text-stone-500'
            } font-bold`}
          >
            Prayer Heatmap · {rangeMode === '1y' ? 'Past 52 Weeks (Full Year)' : 'Past 16 Weeks'}
          </p>
          <p suppressHydrationWarning className="text-[11px] text-[var(--app-muted)] mt-0.5">
            {mounted ? totalFardCount : 0} Farḍ prayers logged across {mounted ? activeDays : 0} days
          </p>
        </div>

        {/* Range Selector */}
        <div
          className={`inline-flex rounded-xl p-0.5 border text-xs font-semibold ${
            dark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setRangeMode('16w')}
            className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
              rangeMode === '16w'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            16 Wks
          </button>
          <button
            type="button"
            onClick={() => setRangeMode('1y')}
            className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
              rangeMode === '1y'
                ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-xs'
                : 'text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Full Year (365d)
          </button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto pb-1">
        <div className={rangeMode === '1y' ? 'min-w-[720px]' : 'min-w-[340px]'}>
          <div className="mb-1 flex pl-8">
            {weeks.map((_, col) => {
              const lbl = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  className={`flex-1 text-[8px] font-medium truncate ${
                    dark ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  {lbl?.label ?? ''}
                </div>
              );
            })}
          </div>
          <div className="flex gap-0.5">
            <div className="mr-1.5 flex w-6 flex-col gap-0.5 shrink-0">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div
                  key={i}
                  className={`flex h-3 items-center justify-end text-[7px] font-medium ${
                    dark ? 'text-stone-500' : 'text-stone-400'
                  } ${i % 2 === 0 ? 'opacity-0' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-1 flex-col gap-0.5 min-w-[9px]">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    className={`h-3 w-full cursor-pointer rounded-[2px] transition-all hover:scale-125 hover:z-10 ${color(
                      cell,
                    )} ${
                      cell.isToday
                        ? `ring-1 ring-amber-400 ring-offset-1 ${
                            dark ? 'ring-offset-[#14211e]' : 'ring-offset-white'
                          }`
                        : ''
                    }`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {tooltip && (
            <div
              className={`mt-2 rounded-xl border px-3 py-2 text-[10px] ${
                dark
                  ? 'border-white/10 bg-white/5 text-stone-200'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            >
              <span className="font-bold">{tooltip.date}</span>
              {' · '}
              {tooltip.fard === 0
                ? 'No prayers logged'
                : `${tooltip.fard}/5 prayers · ${Math.round(tooltip.score * 100)}%`}
            </div>
          )}

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-[var(--app-muted)]">
            <span>Scroll horizontally to view past months</span>
            <div className="flex items-center gap-1.5">
              <span>0/5</span>
              {[
                dark ? 'bg-stone-800' : 'bg-stone-100',
                dark ? 'bg-amber-900/60' : 'bg-amber-100',
                dark ? 'bg-amber-600/50' : 'bg-amber-300',
                dark ? 'bg-emerald-700/60' : 'bg-emerald-300',
                'bg-emerald-500',
              ].map((c, i) => (
                <div key={i} className={`h-3 w-3 rounded-[2px] ${c}`} />
              ))}
              <span>5/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
