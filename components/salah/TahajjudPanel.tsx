'use client';

import type { DayLog, PrayerTimesResult } from '@/types/salah';
import { formatTime } from '@/lib/prayerTimes';

interface TahajjudPanelProps {
  tahajjud: DayLog['tahajjud'];
  times: PrayerTimesResult | null;
  timezone: string;
  dark: boolean;
  onUpdate: (patch: Partial<DayLog['tahajjud']>) => void;
}

export default function TahajjudPanel({ tahajjud, times, timezone, dark, onUpdate }: TahajjudPanelProps) {
  const card = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-stone-200 shadow-sm';
  const input = dark
    ? 'bg-white/5 border-white/10 text-stone-200 focus:border-amber-400/40'
    : 'bg-stone-50 border-stone-200 text-stone-700 focus:border-amber-400';

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className={`font-serif text-[15px] font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
            Tahajjud
          </h3>
          {times && (
            <p className={`mt-0.5 text-[11px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
              Last third begins: {formatTime(times.lastThirdOfNight, timezone)}
            </p>
          )}
        </div>
        <button
          onClick={() => onUpdate({ prayed: !tahajjud.prayed })}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
            tahajjud.prayed
              ? 'border-violet-500 bg-violet-500'
              : dark ? 'border-white/20' : 'border-stone-300'
          }`}
        >
          {tahajjud.prayed && (
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {tahajjud.prayed && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className={`mb-1 block text-[10px] uppercase tracking-wide ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
              Rakats
            </label>
            <input
              type="number"
              min={2}
              max={20}
              step={2}
              value={tahajjud.rakats || ''}
              onChange={e => onUpdate({ rakats: Number(e.target.value) })}
              placeholder="e.g. 8"
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          </div>
          <div>
            <label className={`mb-1 block text-[10px] uppercase tracking-wide ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
              Duration (min)
            </label>
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={tahajjud.durationMinutes || ''}
              onChange={e => onUpdate({ durationMinutes: Number(e.target.value) })}
              placeholder="e.g. 30"
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          </div>
        </div>
      )}

      {!tahajjud.prayed && (
        <p className={`text-[12px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
          Tap the circle above to log Tahajjud for tonight
        </p>
      )}
    </div>
  );
}
