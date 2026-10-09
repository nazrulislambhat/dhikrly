'use client';

import type { PrayerName, PrayerStatus } from '@/types/salah';
import { PRAYER_LABELS } from '@/types/salah';
import { formatTime } from '@/lib/prayerTimes';
import { Check, Circle, Clock3, Landmark, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  { label: string; Icon: LucideIcon; darkBg: string; lightBg: string; darkText: string; lightText: string }
> = {
  prayed:  { label: 'Prayed',      Icon: Check,   darkBg: 'bg-emerald-500/15', lightBg: 'bg-emerald-50',  darkText: 'text-emerald-400', lightText: 'text-emerald-700' },
  jamah:   { label: "Jamā'ah",    Icon: Landmark, darkBg: 'bg-blue-500/15',   lightBg: 'bg-blue-50',     darkText: 'text-blue-400',    lightText: 'text-blue-700'   },
  delayed: { label: 'Delayed',     Icon: Clock3,  darkBg: 'bg-amber-500/15',  lightBg: 'bg-amber-50',    darkText: 'text-amber-400',  lightText: 'text-amber-700'  },
  missed:  { label: 'Missed',      Icon: X,       darkBg: 'bg-red-500/15',    lightBg: 'bg-red-50',      darkText: 'text-red-400',    lightText: 'text-red-600'    },
};

const NEXT_OPTIONS: { status: PrayerStatus; label: string; Icon: LucideIcon }[] = [
  { status: 'prayed',  label: 'Prayed',   Icon: Check },
  { status: 'jamah',   label: "Jamā'ah", Icon: Landmark },
  { status: 'delayed', label: 'Delayed', Icon: Clock3 },
  { status: 'missed',  label: 'Missed',  Icon: X },
  { status: null,      label: 'Clear',   Icon: Circle },
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
    ? 'bg-emerald-400/[0.08] border-emerald-400/30'
    : 'bg-emerald-50/80 border-emerald-300/60 shadow-sm';
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
            ?             dark ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
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
          <p className={`mt-0.5 text-[12px] font-medium ${dark ? 'text-emerald-200/80' : 'text-emerald-800'}`}>
            {time ? formatTime(time, timezone) : '—'}
          </p>
        </div>

        {/* Status badge */}
        {cfg && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${dark ? `${cfg.darkBg} ${cfg.darkText}` : `${cfg.lightBg} ${cfg.lightText}`}`}>
              <cfg.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {cfg.label}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-1.5">
        {NEXT_OPTIONS.map(opt => (
          <button
            key={String(opt.status)}
            onClick={() => onStatusChange(opt.status)}
            aria-label={`${label.en}: ${opt.label}`}
            title={opt.label}
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
            <opt.Icon className="mx-auto h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
