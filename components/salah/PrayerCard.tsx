'use client';

import type { PrayerName, PrayerStatus, LocalPrayerTiming } from '@/types/salah';
import { PRAYER_LABELS } from '@/types/salah';
import { formatTime, formatTimeString } from '@/lib/prayerTimes';
import { Bell, Check, Circle, Clock3, Landmark, Pencil, Plus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SlideToFinish from '@/components/SlideToFinish';

interface PrayerCardProps {
  prayer: PrayerName;
  status: PrayerStatus;
  time: Date | null;
  endTime?: Date | null;
  endLabel?: string;
  timezone: string;
  isCurrent: boolean;
  isNext: boolean;
  dark: boolean;
  localTiming?: LocalPrayerTiming | null;
  masjidName?: string;
  onEditLocalTiming?: () => void;
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
  prayer,
  status,
  time,
  endTime,
  endLabel,
  timezone,
  isCurrent,
  isNext,
  dark,
  localTiming,
  masjidName,
  onEditLocalTiming,
  onStatusChange,
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

  const hasLocalTimes = localTiming && (localTiming.azanTime || localTiming.iqamahTime);

  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${cardClass}`}>
      {/* Current / Next badge */}
      {(isCurrent || isNext) && (
        <span className={`absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${
          isCurrent
            ? dark ? 'bg-emerald-400/20 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
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

          {/* Automatic calculation window */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={`font-bold ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              Start: {time ? formatTime(time, timezone) : '—'}
            </span>
            {endTime && (
              <span className={`font-medium ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                End: {formatTime(endTime, timezone)}
                {endLabel && <span className="opacity-75"> ({endLabel})</span>}
              </span>
            )}
          </div>

          {/* Local Masjid & Azaan Timing Pill */}
          {hasLocalTimes ? (
            <div
              className={`mt-2 flex flex-wrap items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs border ${
                dark
                  ? 'bg-white/[0.03] border-white/[0.08] text-stone-200'
                  : 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
              }`}
            >
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{masjidName || 'Local Masjid'}:</span>
              </span>
              {localTiming?.azanTime && (
                <span className="inline-flex items-center gap-1">
                  <span className="opacity-70">Azan</span>
                  <strong className="font-semibold">{formatTimeString(localTiming.azanTime)}</strong>
                  {localTiming.notifyAzan && (
                    <span
                      title={`Azan notification planned${
                        localTiming.notifyOffsetMinutes ? ` (${localTiming.notifyOffsetMinutes}m before)` : ''
                      }`}
                      className="inline-flex items-center text-amber-600 dark:text-amber-400"
                    >
                      <Bell className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </span>
              )}
              {localTiming?.iqamahTime && (
                <span className="inline-flex items-center gap-1">
                  <span className="opacity-40">·</span>
                  <span className="opacity-70">Iqāmah</span>
                  <strong className="font-semibold text-emerald-800 dark:text-emerald-300">
                    {formatTimeString(localTiming.iqamahTime)}
                  </strong>
                </span>
              )}
              {onEditLocalTiming && (
                <button
                  type="button"
                  onClick={onEditLocalTiming}
                  title="Update local timings"
                  className={`ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    dark
                      ? 'text-stone-400 hover:text-stone-100 hover:bg-white/5'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-emerald-100/60'
                  }`}
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          ) : onEditLocalTiming ? (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={onEditLocalTiming}
                className={`inline-flex items-center gap-1 text-[11px] font-medium transition ${
                  dark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                <span>Add local masjid time</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Status badge */}
        {cfg && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${dark ? `${cfg.darkBg} ${cfg.darkText}` : `${cfg.lightBg} ${cfg.lightText}`}`}>
              <cfg.Icon className="h-3.5 w-3.5" aria-hidden="true" /> {cfg.label}
          </span>
        )}
      </div>

      {/* Desktop status actions */}
      <div className="mt-3 hidden gap-1.5 sm:flex">
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

      <div className="mt-3 space-y-2 sm:hidden">
        <SlideToFinish
          completed={status === 'prayed' || status === 'jamah' || status === 'delayed'}
          dark={dark}
          label={`Slide to finish ${label.en}`}
          completedLabel={cfg?.label ?? 'Prayed'}
          onFinish={() => onStatusChange(
            status === 'prayed' || status === 'jamah' || status === 'delayed'
              ? null
              : 'prayed',
          )}
        />
        <label className="block">
          <span className="sr-only">{label.en} prayer status</span>
          <select
            value={status ?? ''}
            onChange={(event) => {
              const selected = NEXT_OPTIONS.find(
                (option) => String(option.status ?? '') === event.target.value,
              );
              if (selected) onStatusChange(selected.status);
            }}
            className={`min-h-10 w-full rounded-lg border px-3 text-xs ${
              dark
                ? 'border-white/10 bg-[#14211e] text-stone-300'
                : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            <option value="">More status options…</option>
            {NEXT_OPTIONS.filter((option) => option.status !== null).map((option) => (
              <option key={option.label} value={String(option.status)}>
                {option.label}
              </option>
            ))}
            {status !== null && <option value="">Clear status</option>}
          </select>
        </label>
      </div>
    </div>
  );
}
