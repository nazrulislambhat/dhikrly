'use client';

import type { PrayerName, PrayerStatus, PrayerTimesResult } from '@/types/salah';
import { PRAYER_LABELS } from '@/types/salah';
import { formatTime } from '@/lib/prayerTimes';

interface PrayerCardProps {
  prayer: PrayerName;
  status: PrayerStatus;
  time: Date | null;
  timezone: string;
  isCurrent: boolean;
  isNext: boolean;
  dark: boolean;
  onStatusChange: (status: PrayerStatus) => void;
}

const STATUS_CONFIG: Record<
  NonNullable<PrayerStatus>,
  { label: string; icon: string; darkBg: string; lightBg: string; darkText: string; lightText: string }
> = {
  prayed:  { label: 'Prayed',      icon: '✔',  darkBg: 'bg-emerald-500/15', lightBg: 'bg-emerald-50',  darkText: 'text-emerald-400', lightText: 'text-emerald-700' },
  jamah:   { label: "Jamā'ah",    icon: '🕌', darkBg: 'bg-blue-500/15',    lightBg: 'bg-blue-50',     darkText: 'text-blue-400',    lightText: 'text-blue-700'   },
  delayed: { label: 'Delayed',     icon: '⏰', darkBg: 'bg-amber-500/15',   lightBg: 'bg-amber-50',    darkText: 'text-amber-400',   lightText: 'text-amber-700'  },
  missed:  { label: 'Missed',      icon: '✗',  darkBg: 'bg-red-500/15',     lightBg: 'bg-red-50',      darkText: 'text-red-400',     lightText: 'text-red-600'    },
};

const NEXT_OPTIONS: { status: PrayerStatus; label: string; icon: string }[] = [
  { status: 'prayed',  label: 'Prayed',   icon: '✔'  },
  { status: 'jamah',   label: "Jamā'ah",  icon: '🕌' },
  { status: 'delayed', label: 'Delayed',  icon: '⏰' },
  { status: 'missed',  label: 'Missed',   icon: '✗'  },
  { status: null,      label: 'Clear',    icon: '○'  },
];

export default function PrayerCard({
  prayer, status, time, timezone, isCurrent, isNext, dark, onStatusChange
}: PrayerCardProps) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  const label = PRAYER_LABELS[prayer];

  const baseCard = dark
    ? 'bg-white/[0.04] border-white/[0.07]'
    : 'bg-white border-stone-200 shadow-sm';
  const currentCard = dark
    ? 'bg-amber-400/[0.08] border-amber-400/30'
    : 'bg-amber-50/80 border-amber-300/60 shadow-md';
  const nextCard = dark
    ? 'bg-white/[0.06] border-white/[0.12]'
    : 'bg-white border-stone-300 shadow-sm';

  const cardClass = isCurrent ? currentCard : isNext ? nextCard : baseCard;

  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${cardClass}`}>
      {/* Current / Next badge */}
      {(isCurrent || isNext) && (
        <span className={`absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${
          isCurrent
            ? dark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-700'
            : dark ? 'bg-white/10 text-stone-400' : 'bg-stone-100 text-stone-500'
        }`}>
          {isCurrent ? '● Now' : 'Next'}
        </span>
      )}

      <div className="flex items-center gap-4">
        {/* Prayer info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className={`font-serif text-base font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
              {label.en}
            </h3>
            <span className={`font-arabic text-sm ${dark ? 'text-stone-600' : 'text-stone-400'}`} dir="rtl">
              {label.ar}
            </span>
          </div>
          <p className={`mt-0.5 text-[12px] font-medium ${dark ? 'text-amber-400/70' : 'text-amber-600'}`}>
            {time ? formatTime(time, timezone) : '—'}
          </p>
        </div>

        {/* Status badge */}
        {cfg && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${dark ? `${cfg.darkBg} ${cfg.darkText}` : `${cfg.lightBg} ${cfg.lightText}`}`}>
            {cfg.icon} {cfg.label}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-1.5">
        {NEXT_OPTIONS.map(opt => (
          <button
            key={String(opt.status)}
            onClick={() => onStatusChange(opt.status)}
            className={`flex-1 rounded-xl py-2 text-[11px] font-medium transition-all active:scale-95 ${
              status === opt.status
                ? opt.status === null
                  ? dark ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'
                  : opt.status === 'prayed'
                    ? 'bg-emerald-500 text-white'
                    : opt.status === 'jamah'
                      ? 'bg-blue-500 text-white'
                      : opt.status === 'delayed'
                        ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                : dark
                  ? 'bg-white/[0.04] text-stone-500 hover:bg-white/[0.08] hover:text-stone-300'
                  : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
