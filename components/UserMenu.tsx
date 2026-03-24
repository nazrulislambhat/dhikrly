'use client';

import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
  user: User;
  dark: boolean;
  onSignOut: () => void;
  isSynced: boolean;
}

export default function UserMenu({
  user,
  dark,
  onSignOut,
  isSynced,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  const avatarUrl =
    user.user_metadata?.avatar_url as string | undefined;

  const panel = dark
    ? 'bg-[#111f33] border-white/10 shadow-2xl'
    : 'bg-white border-stone-200 shadow-xl';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border px-2 py-1 transition-all hover:scale-105 active:scale-95 ${
          dark
            ? 'border-white/10 bg-white/5 hover:bg-white/10'
            : 'border-stone-200 bg-white hover:bg-stone-50 shadow-sm'
        }`}
      >
        {/* Avatar */}
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-6 w-6 rounded-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Hide broken image and show initials div instead
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${
              dark
                ? 'bg-amber-400/20 text-amber-300'
                : 'bg-amber-100 text-amber-700'
            } ${avatarUrl ? 'hidden' : 'flex'}`}
          >
            {initials}
          </div>
          {/* Sync indicator dot */}
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border ${
              dark ? 'border-[#111f33]' : 'border-white'
            } ${
              isSynced
                ? 'bg-emerald-500'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
        </div>

        {/* Sync label */}
        <span
          className={`text-[10px] ${
            dark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          {isSynced ? 'Synced' : 'Syncing…'}
        </span>

        {/* Chevron */}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''} ${
            dark ? 'text-stone-500' : 'text-stone-400'
          }`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-10 z-50 w-56 rounded-2xl border p-2 ${panel}`}
        >
          {/* User info */}
          <div
            className={`mb-2 rounded-xl px-3 py-2.5 ${
              dark ? 'bg-white/[0.03]' : 'bg-stone-50'
            }`}
          >
            <p
              className={`text-[11px] font-medium ${
                dark ? 'text-stone-200' : 'text-stone-700'
              }`}
            >
              {user.user_metadata?.full_name ?? 'Signed in'}
            </p>
            <p
              className={`truncate text-[10px] ${
                dark ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              {user.email}
            </p>
          </div>

          {/* Sync status */}
          <div
            className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-2 ${
              isSynced
                ? dark
                  ? 'bg-emerald-500/10'
                  : 'bg-emerald-50'
                : dark
                  ? 'bg-amber-400/10'
                  : 'bg-amber-50'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isSynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span
              className={`text-[10px] ${
                isSynced
                  ? dark
                    ? 'text-emerald-400'
                    : 'text-emerald-700'
                  : dark
                    ? 'text-amber-400'
                    : 'text-amber-700'
              }`}
            >
              {isSynced
                ? 'All changes synced'
                : 'Syncing changes…'}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={`w-full rounded-xl px-3 py-2 text-left text-[12px] transition-colors ${
              dark
                ? 'text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
                : 'text-red-500 hover:bg-red-50'
            }`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
