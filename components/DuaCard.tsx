'use client';

import { useState } from 'react';
import type { Dua, TabLabel } from '@/types';
import SessionPill from './SessionPill';

const TABS: TabLabel[] = ['Arabic', 'English', 'Transliteration'];

interface DuaCardProps {
  dua: Dua;
  checked: boolean;
  onToggle: (id: string, soundEnabled?: boolean) => void;
  onDelete?: (id: string) => void;
  dark: boolean;
  soundEnabled?: boolean;
}

export default function DuaCard({
  dua,
  checked,
  onToggle,
  onDelete,
  dark,
  soundEnabled = true,
}: DuaCardProps) {
  const [activeTab, setActiveTab] = useState<TabLabel>('Arabic');

  const baseCard = dark
    ? 'bg-white/[0.04] border-white/[0.08]'
    : 'bg-white border-black/[0.09] shadow-sm';

  const doneCard = dark
    ? 'bg-emerald-500/[0.07] border-emerald-500/30'
    : 'bg-emerald-50/60 border-emerald-400/40 shadow-sm';

  const priorityBorderColor = checked
    ? 'border-l-emerald-500'
    : dark
      ? 'border-l-amber-400'
      : 'border-l-amber-500';

  return (
    <article
      className={[
        'rounded-2xl border transition-all duration-200 hover:-translate-y-px',
        dua.priority
          ? `border-l-[3px] rounded-l-none ${priorityBorderColor}`
          : '',
        checked ? doneCard : baseCard,
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(dua.id, soundEnabled)}
          aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
          className={[
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border-2 transition-all duration-150 active:scale-90',
            checked
              ? 'border-emerald-500 bg-emerald-500'
              : dark
                ? 'border-amber-400/50 bg-transparent hover:border-amber-400'
                : 'border-amber-500/60 bg-transparent hover:border-amber-500',
          ].join(' ')}
        >
          {checked && (
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7l4 4 6-7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Title block */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3
              className={[
                'font-serif text-[15px] font-semibold leading-snug transition-all',
                checked
                  ? dark
                    ? 'text-emerald-400/70 line-through'
                    : 'text-emerald-600/70 line-through'
                  : dark
                    ? 'text-stone-100'
                    : 'text-stone-800',
              ].join(' ')}
            >
              {dua.title}
            </h3>
            {dua.priority && (
              <span
                className={
                  dark
                    ? 'text-xs text-amber-400/60'
                    : 'text-xs text-amber-500/70'
                }
              >
                ★
              </span>
            )}
            {dua.custom && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                  dark
                    ? 'bg-violet-400/15 text-violet-300'
                    : 'bg-violet-100 text-violet-600'
                }`}
              >
                Custom
              </span>
            )}
            <span
              className={[
                'font-arabic text-base leading-none',
                dark ? 'text-amber-400/50' : 'text-amber-700/50',
              ].join(' ')}
              dir="rtl"
            >
              {dua.titleAr}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {dua.session.map((s: string) => (
              <SessionPill key={s} label={s} dark={dark} />
            ))}
            <span
              className={`text-[10px] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
            >
              {dua.count}
            </span>
          </div>
        </div>

        {/* Right side: status + optional delete */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={[
              'rounded-full px-2.5 py-0.5 text-[10px] font-medium',
              checked
                ? dark
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-emerald-100 text-emerald-700'
                : dark
                  ? 'bg-white/5 text-stone-500'
                  : 'bg-stone-100 text-stone-400',
            ].join(' ')}
          >
            {checked ? 'Done' : 'Pending'}
          </span>
          {dua.custom && onDelete && (
            <button
              onClick={() => onDelete(dua.id)}
              aria-label="Delete custom dua"
              className={`text-[10px] transition-colors ${
                dark
                  ? 'text-red-500/40 hover:text-red-400'
                  : 'text-red-400/50 hover:text-red-500'
              }`}
            >
              ✕ Remove
            </button>
          )}
        </div>
      </div>

      {/* Tab strip */}
      <div
        className={[
          'mx-4 mb-3 flex rounded-lg border p-0.5',
          dark
            ? 'border-white/[0.07] bg-white/[0.03]'
            : 'border-black/[0.06] bg-black/[0.03]',
        ].join(' ')}
      >
        {TABS.map((tab: TabLabel) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 rounded-md py-1.5 font-serif text-[11px] transition-all duration-150',
              activeTab === tab
                ? dark
                  ? 'bg-amber-400/20 text-amber-300 shadow-sm'
                  : 'border border-amber-200/60 bg-amber-50 text-amber-700 shadow-sm'
                : dark
                  ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-400 hover:text-stone-600',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className={[
          'mx-4 mb-4 rounded-xl border px-4 py-3.5 transition-opacity duration-200',
          checked ? 'opacity-60' : 'opacity-100',
          activeTab === 'Arabic'
            ? dark
              ? 'border-amber-400/20 bg-amber-400/[0.05]'
              : 'border-amber-200/50 bg-amber-50/60'
            : activeTab === 'English'
              ? dark
                ? 'border-white/[0.06] bg-white/[0.03]'
                : 'border-stone-200/60 bg-stone-50'
              : dark
                ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
                : 'border-emerald-200/40 bg-emerald-50/60',
        ].join(' ')}
      >
        {activeTab === 'Arabic' && (
          <p
            className={`font-arabic text-right leading-[2.2] text-[clamp(16px,2vw,24px)] ${
              dark ? 'text-stone-100' : 'text-stone-800'
            }`}
            dir="rtl"
            lang="ar"
            translate="no"
          >
            {dua.ar}
          </p>
        )}
        {activeTab === 'English' && (
          <p
            className={`font-serif italic leading-relaxed text-[13.5px] ${
              dark ? 'text-stone-300' : 'text-stone-600'
            }`}
          >
            {dua.en}
          </p>
        )}
        {activeTab === 'Transliteration' && (
          <p
            className={`font-serif italic leading-relaxed tracking-wide text-[13px] ${
              dark ? 'text-emerald-300' : 'text-emerald-800'
            }`}
          >
            {dua.transliteration}
          </p>
        )}
      </div>
    </article>
  );
}
