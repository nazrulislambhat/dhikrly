'use client';

import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type { SyncStatus } from '@/hooks/useSync';
import { hasSupabaseConfig } from '@/lib/supabase';

interface UserMenuProps {
  user: User;
  dark: boolean;
  onSignOut: () => void;
  syncStatus: SyncStatus;
  onManualSync?: () => Promise<boolean | void> | boolean | void;
  lastSyncedAt?: number | null;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export default function UserMenu({
  user,
  dark,
  onSignOut,
  syncStatus,
  onManualSync,
  lastSyncedAt,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
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

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : '??';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const isSynced = !hasSupabaseConfig || syncStatus === 'synced';
  const isSyncInProgress = syncStatus === 'syncing' || manualSyncing;

  const syncLabel = !hasSupabaseConfig
    ? 'Local'
    : isSyncInProgress
      ? 'Syncing…'
      : syncStatus === 'synced'
        ? 'Synced'
        : syncStatus === 'offline'
          ? 'Offline'
          : 'Sync failed';

  const syncColor = !hasSupabaseConfig
    ? 'bg-sky-400'
    : syncStatus === 'synced'
      ? 'bg-emerald-500'
      : syncStatus === 'error'
        ? 'bg-red-500'
        : syncStatus === 'offline'
          ? 'bg-stone-400'
          : 'bg-amber-400 animate-pulse';

  const panel = 'border-border bg-surface text-ink shadow-2xl';

  const handleManualSyncClick = async () => {
    if (!onManualSync || isSyncInProgress) return;
    setManualSyncing(true);
    try {
      await onManualSync();
    } finally {
      setManualSyncing(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center cursor-pointer gap-2 rounded-full border border-border bg-surface hover:bg-surface-hover px-2 py-1 transition-all hover:scale-105 active:scale-95 shadow-xs"
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
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 ${avatarUrl ? 'hidden' : 'flex'}`}
          >
            {initials}
          </div>
          {/* Sync indicator dot */}
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-surface ${syncColor}`}
          />
        </div>

        {/* Sync label */}
        <span
          className={`text-[10px] ${
            dark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          {syncLabel}
        </span>

        {/* Chevron */}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''} ${
            dark ? 'text-stone-500' : 'text-stone-400'
          }`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-10 z-50 w-60 rounded-2xl border p-2.5 ${panel}`}
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

          {/* Sync status & Manual Sync Button */}
          {!hasSupabaseConfig ? (
            <div
              className={`mb-2 rounded-xl px-3 py-2 text-[10px] ${
                dark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Local Mode
              </div>
              <p className={`text-[9px] ${dark ? 'text-sky-400/80' : 'text-sky-600'}`}>
                Cloud sync disabled (Supabase not configured in .env.local).
              </p>
            </div>
          ) : (
            <div className="mb-2 space-y-2">
              <div
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  isSynced
                    ? dark
                      ? 'bg-emerald-500/10'
                      : 'bg-emerald-50'
                    : syncStatus === 'error'
                      ? dark
                        ? 'bg-red-500/10'
                        : 'bg-red-50'
                      : dark
                        ? 'bg-amber-400/10'
                        : 'bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${syncColor}`} />
                  <span
                    className={`text-[10px] font-medium ${
                      isSynced
                        ? dark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : syncStatus === 'error'
                          ? dark
                            ? 'text-red-400'
                            : 'text-red-700'
                          : dark
                            ? 'text-amber-400'
                            : 'text-amber-700'
                    }`}
                  >
                    {isSyncInProgress
                      ? 'Syncing changes…'
                      : syncStatus === 'synced'
                        ? 'All changes synced'
                        : syncStatus === 'offline'
                          ? 'Offline (Queued)'
                          : 'Sync issue; retrying'}
                  </span>
                </div>
                {lastSyncedAt ? (
                  <span className="text-[9px] text-stone-400 dark:text-stone-500">
                    {formatRelativeTime(lastSyncedAt)}
                  </span>
                ) : null}
              </div>

              {/* Manual Sync Button */}
              {onManualSync && (
                <button
                  type="button"
                  onClick={handleManualSyncClick}
                  disabled={isSyncInProgress}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                    dark
                      ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <svg
                    className={`h-3.5 w-3.5 ${
                      isSyncInProgress ? 'animate-spin text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                  <span>{isSyncInProgress ? 'Syncing Now…' : 'Sync Now'}</span>
                </button>
              )}

              {syncStatus === 'error' && (
                <button
                  onClick={() => {
                    try {
                      const keys = Object.keys(localStorage);
                      for (const k of keys) {
                        if (
                          k.startsWith('adhkar_sync_queue') ||
                          k.startsWith('salah_sync_queue')
                        ) {
                          localStorage.removeItem(k);
                        }
                      }
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-center text-[10px] font-medium transition-colors ${
                    dark
                      ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Reset Sync Queue & Reload
                </button>
              )}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-[12px] font-medium transition-colors ${
              dark
                ? 'text-red-400/80 hover:bg-red-500/10 hover:text-red-400'
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
