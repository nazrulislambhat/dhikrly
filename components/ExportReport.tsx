'use client';

import { useState } from 'react';
import { load, STORAGE_KEY, STREAK_KEY } from '@/lib/storage';
import { getTodayKey, formatDateLabel } from '@/lib/dates';
import type { Dua, Streak } from '@/types';

interface ExportReportProps {
  dark: boolean;
  duas: Dua[];
  onClose: () => void;
}

type ReportRange = 'weekly' | 'monthly';

export default function ExportReport({
  dark,
  duas,
  onClose,
}: ExportReportProps) {
  const [range, setRange] = useState<ReportRange>('weekly');
  const [generating, setGenerating] = useState(false);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      const days = range === 'weekly' ? 7 : 30;
      const allData = load<Record<string, Record<string, boolean>>>(
        STORAGE_KEY,
        {},
      );
      const streak = load<Streak>(STREAK_KEY, {
        current: 0,
        best: 0,
        lastComplete: '',
      });
      const today = getTodayKey();
      const total = duas.length;

      // Build day-by-day data
      const dayRows: {
        key: string;
        label: string;
        cnt: number;
        pct: number;
      }[] = [];
      let totalCompleted = 0;
      let perfectDays = 0;

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000);
        const key = d.toISOString().slice(0, 10);
        const dayData = allData[key] ?? {};
        const cnt = Object.values(dayData).filter(Boolean).length;
        const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
        totalCompleted += cnt;
        if (pct === 100) perfectDays++;
        dayRows.push({ key, label: formatDateLabel(key), cnt, pct });
      }

      // Per-dua completion rates
      const duaStats = duas.map((d) => {
        let completedDays = 0;
        dayRows.forEach(({ key }) => {
          if (allData[key]?.[d.id]) completedDays++;
        });
        return {
          ...d,
          completedDays,
          rate: Math.round((completedDays / days) * 100),
        };
      });
      duaStats.sort((a, b) => b.rate - a.rate);

      const avgPct =
        dayRows.length > 0
          ? Math.round(dayRows.reduce((s, r) => s + r.pct, 0) / dayRows.length)
          : 0;

      // Build bar SVG
      const barWidth = 600 / days;
      const bars = dayRows
        .map(
          (r, i) =>
            `<rect x="${i * barWidth + 2}" y="${80 - r.pct * 0.8}" width="${barWidth - 4}" height="${r.pct * 0.8}" fill="${r.pct === 100 ? '#10b981' : r.pct > 0 ? '#f59e0b' : '#e5e7eb'}" rx="2"/>`,
        )
        .join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Adhkār Report – ${range === 'weekly' ? 'Weekly' : 'Monthly'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Noto+Naskh+Arabic&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Crimson Pro', Georgia, serif; color: #1c1917; background: #fafaf9; padding: 40px; max-width: 680px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 600; color: #92400e; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #78716c; margin-bottom: 32px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px; }
  .stat { background: #fff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 14px 12px; text-align: center; }
  .stat-val { font-size: 26px; font-weight: 300; color: #b45309; line-height: 1; }
  .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #a8a29e; margin-top: 4px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #a8a29e; margin-bottom: 10px; }
  .chart-wrap { background: #fff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  svg { display: block; width: 100%; height: 80px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e7e5e4; margin-bottom: 24px; }
  th { background: #fef3c7; text-align: left; padding: 10px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #92400e; font-weight: 600; }
  td { padding: 9px 14px; font-size: 13px; border-bottom: 1px solid #f5f5f4; color: #44403c; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 600; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-gray { background: #f5f5f4; color: #a8a29e; }
  .bar-pct { display: inline-block; width: 48px; height: 6px; border-radius: 3px; background: #e5e7eb; vertical-align: middle; margin-right: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; background: #10b981; }
  .arabic { font-family: 'Noto Naskh Arabic', serif; direction: rtl; font-size: 15px; color: #92400e; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e7e5e4; font-size: 10px; color: #a8a29e; text-align: center; }
  @media print { body { padding: 20px; } button { display: none; } }
</style>
</head>
<body>
<h1>Daily Adhkār Report</h1>
<p class="subtitle">${range === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'} · Generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

<div class="stats-grid">
  <div class="stat"><div class="stat-val">${avgPct}%</div><div class="stat-label">Avg Daily</div></div>
  <div class="stat"><div class="stat-val">${perfectDays}</div><div class="stat-label">Perfect Days</div></div>
  <div class="stat"><div class="stat-val">${streak.current}d</div><div class="stat-label">Current Streak</div></div>
  <div class="stat"><div class="stat-val">${streak.best}d</div><div class="stat-label">Best Streak</div></div>
</div>

<p class="section-title">Daily Completion</p>
<div class="chart-wrap">
  <svg viewBox="0 0 600 80" preserveAspectRatio="none">${bars}</svg>
</div>

<p class="section-title">Day-by-Day Breakdown</p>
<table>
  <thead><tr><th>Date</th><th>Completed</th><th>Progress</th><th>Status</th></tr></thead>
  <tbody>
  ${dayRows
    .map(
      (r) => `<tr>
    <td>${r.label}</td>
    <td>${r.cnt} / ${total}</td>
    <td>
      <span class="bar-pct"><span class="bar-fill" style="width:${r.pct}%;background:${r.pct === 100 ? '#10b981' : '#f59e0b'}"></span></span>
      ${r.pct}%
    </td>
    <td>
      <span class="badge ${r.pct === 100 ? 'badge-green' : r.pct > 0 ? 'badge-amber' : 'badge-gray'}">
        ${r.pct === 100 ? '✓ Complete' : r.pct > 0 ? 'Partial' : 'Missed'}
      </span>
    </td>
  </tr>`,
    )
    .join('')}
  </tbody>
</table>

<p class="section-title">Du'ā Completion Rates</p>
<table>
  <thead><tr><th>Du'ā</th><th>Arabic</th><th>Days</th><th>Rate</th></tr></thead>
  <tbody>
  ${duaStats
    .map(
      (d) => `<tr>
    <td>${d.title}</td>
    <td class="arabic">${d.titleAr}</td>
    <td>${d.completedDays} / ${days}</td>
    <td>
      <span class="bar-pct"><span class="bar-fill" style="width:${d.rate}%;background:${d.rate === 100 ? '#10b981' : '#f59e0b'}"></span></span>
      ${d.rate}%
    </td>
  </tr>`,
    )
    .join('')}
  </tbody>
</table>

<footer>
  <p style="font-family:'Noto Naskh Arabic',serif;font-size:16px;color:#b45309;direction:rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
  <p style="margin-top:6px">Progress saved locally · Adhkār Tracker</p>
</footer>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
      setGenerating(false);
      onClose();
    }, 300);
  };

  const overlay = dark
    ? 'bg-[#0c1a2e]/80 backdrop-blur-sm'
    : 'bg-stone-900/40 backdrop-blur-sm';
  const panel = dark
    ? 'bg-[#111f33] border-white/10'
    : 'bg-white border-stone-200';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${panel}`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className={`font-serif text-lg font-semibold ${
              dark ? 'text-stone-100' : 'text-stone-800'
            }`}
          >
            Export Progress Report
          </h2>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              dark
                ? 'text-stone-500 hover:bg-white/5 hover:text-stone-300'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            ✕
          </button>
        </div>

        <p
          className={`mb-4 text-[12px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
        >
          Generate a printable PDF report with your completion stats, day-by-day
          breakdown, and perdu`ā rates.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {(['weekly', 'monthly'] as ReportRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-xl border py-3 text-[13px] font-medium transition-all ${
                range === r
                  ? dark
                    ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                    : 'border-amber-400/50 bg-amber-50 text-amber-700'
                  : dark
                    ? 'border-white/[0.07] text-stone-500 hover:text-stone-300'
                    : 'border-stone-200 text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="text-lg">{r === 'weekly' ? '📅' : '📆'}</div>
              <div className="mt-1">
                {r === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 rounded-xl border py-2.5 text-sm transition-all ${
              dark
                ? 'border-white/10 text-stone-400 hover:text-stone-200'
                : 'border-stone-200 text-stone-500 hover:text-stone-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={generateReport}
            disabled={generating}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
              generating
                ? 'cursor-wait opacity-70 ' +
                  (dark
                    ? 'bg-amber-400/10 text-amber-400/50'
                    : 'bg-amber-200 text-amber-600')
                : dark
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                  : 'bg-green-500 text-white hover:bg-amber-600'
            }`}
          >
            {generating ? 'Generating…' : '↓ Export PDF'}
          </button>
        </div>

        <p
          className={`mt-3 text-[10px] ${dark ? 'text-stone-700' : 'text-stone-400'}`}
        >
          Opens in a new tab. Use your browser`s Save as PDF option.
        </p>
      </div>
    </div>
  );
}
