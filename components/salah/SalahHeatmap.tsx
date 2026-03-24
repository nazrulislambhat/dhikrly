'use client';

import { useMemo, useState } from 'react';
import { getAllLogs, computeDayScore, isPrayed } from '@/lib/salahStorage';
import type { HeatmapCell } from '@/types/salah';

interface SalahHeatmapProps { dark: boolean; }

export default function SalahHeatmap({ dark }: SalahHeatmapProps) {
  const [tooltip, setTooltip] = useState<HeatmapCell | null>(null);
  const WEEKS = 16;

  const { weeks, monthLabels } = useMemo(() => {
    const all = getAllLogs();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const cells: HeatmapCell[] = [];
    for (let i = WEEKS * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const log = all[date];
      const score = log ? computeDayScore(log) : 0;
      const prayers = log ? Object.values(log.prayers) : [];
      const fard = prayers.filter(p => isPrayed(p)).length;
      cells.push({ date, score, fard, isToday: date === todayStr, isFuture: d > today });
    }

    const weekGroups: HeatmapCell[][] = [];
    for (let w = 0; w < WEEKS; w++) weekGroups.push(cells.slice(w * 7, w * 7 + 7));

    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weekGroups.forEach((week, col) => {
      const m = new Date(week[0].date + 'T12:00:00').getMonth();
      if (m !== lastMonth) {
        labels.push({ label: new Date(week[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }), col });
        lastMonth = m;
      }
    });

    return { weeks: weekGroups, monthLabels: labels };
  }, []);

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
    <div className={`rounded-2xl border p-4 ${card}`}>
      <p className={`mb-3 text-[10px] uppercase tracking-widest ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
        Prayer consistency · {WEEKS} weeks
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          <div className="mb-1 flex pl-8">
            {weeks.map((_, col) => {
              const lbl = monthLabels.find(m => m.col === col);
              return <div key={col} className={`flex-1 text-[8px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>{lbl?.label ?? ''}</div>;
            })}
          </div>
          <div className="flex gap-0.5">
            <div className="mr-1.5 flex w-6 flex-col gap-0.5">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className={`flex h-3 items-center justify-end text-[7px] ${dark ? 'text-stone-700' : 'text-stone-300'} ${i % 2 === 0 ? 'opacity-0' : ''}`}>{d}</div>
              ))}
            </div>
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-1 flex-col gap-0.5">
                {week.map(cell => (
                  <div
                    key={cell.date}
                    className={`h-3 w-full cursor-pointer rounded-[2px] transition-all hover:scale-125 hover:z-10 ${color(cell)} ${cell.isToday ? `ring-1 ring-amber-400 ring-offset-1 ${dark ? 'ring-offset-[#0c1a2e]' : 'ring-offset-white'}` : ''}`}
                    onMouseEnter={() => setTooltip(cell)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>

          {tooltip && (
            <div className={`mt-2 rounded-xl border px-3 py-2 text-[10px] ${dark ? 'border-white/10 bg-white/5 text-stone-300' : 'border-stone-200 bg-stone-50 text-stone-600'}`}>
              <span className="font-medium">{tooltip.date}</span>
              {' · '}
              {tooltip.fard === 0 ? 'No prayers logged' : `${tooltip.fard}/5 prayers · ${Math.round(tooltip.score * 100)}%`}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[9px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>0</span>
            {[dark ? 'bg-stone-800' : 'bg-stone-100', dark ? 'bg-amber-900/60' : 'bg-amber-100', dark ? 'bg-amber-600/50' : 'bg-amber-300', dark ? 'bg-emerald-700/60' : 'bg-emerald-300', 'bg-emerald-500'].map((c, i) => (
              <div key={i} className={`h-3 w-3 rounded-[2px] ${c}`} />
            ))}
            <span className={`text-[9px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>5/5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
