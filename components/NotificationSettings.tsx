'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BellRing,
  Check,
  Copy,
  ExternalLink,
  Moon,
  Sparkles,
  Sun,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { load, save, NOTIFICATION_KEY } from '@/lib/storage';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import type { NotifSettings } from '@/types';

const DEFAULT_SETTINGS: NotifSettings = {
  morningEnabled: false,
  morningTime: '06:00',
  eveningEnabled: false,
  eveningTime: '18:00',
};

const PUSH_MIGRATION_SQL = `-- ── Dhikrly Push Subscriptions Migration ──
create extension if not exists "uuid-ossp";

create table if not exists public.push_subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade,
  device_id         text,
  subscription      jsonb not null,
  morning_enabled   boolean not null default false,
  morning_time      text not null default '06:00',
  evening_enabled   boolean not null default false,
  evening_time      text not null default '18:00',
  timezone          text not null default 'UTC',
  last_sent_morning date,
  last_sent_evening date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists push_subs_user_id_idx   on public.push_subscriptions(user_id);
create index if not exists push_subs_device_id_idx on public.push_subscriptions(device_id);
create index if not exists push_subs_morning_idx   on public.push_subscriptions(morning_enabled, morning_time);
create index if not exists push_subs_evening_idx   on public.push_subscriptions(evening_enabled, evening_time);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Service role manages push subs" on public.push_subscriptions;
create policy "Service role manages push subs"
  on public.push_subscriptions for all
  using (true)
  with check (true);
`;

/* ─────────────────────────────────────────────────────────────────────
   In-app fallback scheduler (fires when app is open)
   Used as a backup alongside server push.
───────────────────────────────────────────────────────────────────── */
let notifInterval: ReturnType<typeof setInterval> | null = null;

type ExtendedNotificationOptions = NotificationOptions & {
  vibrate?: number[];
};

export async function fireNotification(title: string, options: ExtendedNotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  // 1. Try Service Worker showNotification (standard for Chrome, Android, PWAs, macOS)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch (e) {
      console.warn('[Notifications] Service worker showNotification failed:', e);
    }
  }

  // 2. Fallback to standard Notification constructor
  try {
    new Notification(title, options);
    return true;
  } catch (e) {
    console.warn('[Notifications] Notification constructor fallback failed:', e);
    return false;
  }
}

export async function checkAndFireInApp(settings: NotifSettings) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const firedKey = `dhikrly_notif_fired_${todayKey}`;
  const fired = load<Record<string, boolean>>(firedKey, {});
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const check = async (label: string, timeStr: string, enabled: boolean, prop: string) => {
    if (!enabled || fired[prop]) return;
    const [h, m] = timeStr.split(':').map(Number);
    const diff = nowMinutes - (h * 60 + m);
    // Fire if within 15 minutes of scheduled time
    if (diff >= 0 && diff < 15) {
      const shown = await fireNotification(
        label === 'Morning' ? 'Morning Adhkār & Du’ā 🌅' : 'Evening Adhkār & Du’ā 🌙',
        {
          body:
            label === 'Morning'
              ? 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ · Time for your morning adhkār & duʿā'
              : 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ · Time for your evening adhkār & duʿā',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `dhikrly-${prop}`,
          data: { url: label === 'Morning' ? '/?session=morning' : '/?session=evening' },
          vibrate: [120, 80, 120, 80, 240],
        },
      );
      if (shown) {
        fired[prop] = true;
        save(firedKey, fired);
      }
    }
  };

  await check('Morning', settings.morningTime, settings.morningEnabled, 'morning');
  await check('Evening', settings.eveningTime, settings.eveningEnabled, 'evening');
}

export function scheduleNotifications(settings?: NotifSettings): void {
  if (typeof window === 'undefined') return;
  const current = settings ?? load<NotifSettings>(NOTIFICATION_KEY, DEFAULT_SETTINGS);
  if (notifInterval) {
    clearInterval(notifInterval);
    notifInterval = null;
  }
  if (!current.morningEnabled && !current.eveningEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  void checkAndFireInApp(current);
  notifInterval = setInterval(() => void checkAndFireInApp(current), 30_000);
}

/* ── Toggle switch sub-component ── */
function Toggle({
  enabled,
  onToggle,
  color = 'amber',
  dark,
}: {
  enabled: boolean;
  onToggle: () => void;
  color?: 'amber' | 'violet';
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled
          ? color === 'amber'
            ? 'bg-amber-500'
            : 'bg-emerald-600'
          : dark
            ? 'bg-stone-700'
            : 'bg-stone-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   NotificationSettings component
───────────────────────────────────────────────────────────────────── */
interface NotificationSettingsProps {
  dark: boolean;
  userId: string | null;
  onClose: () => void;
}

export default function NotificationSettings({
  dark,
  userId,
  onClose,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotifSettings>(
    () => load<NotifSettings>(NOTIFICATION_KEY, DEFAULT_SETTINGS),
  );
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePushSubscription();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    const sent = await fireNotification('Dhikrly — Daily Remembrance 🌙', {
      body: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ · Bismillah! Your Dhikrly notifications are active, branded, and working smoothly.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'dhikrly-test',
      data: { url: '/' },
      vibrate: [120, 80, 120, 80, 240],
    });
    if (sent) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      setErrorMsg('Could not display test notification. Please check browser permissions.');
    }
  };

  const copySqlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(PUSH_MIGRATION_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleSave = useCallback(async () => {
    setStatus('saving');
    setErrorMsg('');
    setShowSqlHelp(false);

    // Always save locally and schedule in-browser
    save(NOTIFICATION_KEY, settings);
    scheduleNotifications(settings);

    const anyEnabled = settings.morningEnabled || settings.eveningEnabled;

    if (!anyEnabled) {
      // Disabling notifications
      try {
        await unsubscribe();
      } catch (err) {
        console.warn('Unsubscribe warning:', err);
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
      return;
    }

    if (permission !== 'granted') {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await subscribe(settings, userId, timezone);
      if (!result.ok) {
        setStatus('saved');
        if (result.error?.includes('push_subscriptions')) {
          setShowSqlHelp(true);
          setErrorMsg(
            'In-app reminders saved & active! For background push when the app is closed, run the SQL migration below in Supabase.',
          );
        } else {
          setErrorMsg(result.error ?? 'In-app reminders active. Cloud push had an issue.');
        }
        return;
      }
    } catch (error) {
      console.warn('Push registration warning:', error);
      setStatus('saved');
      setErrorMsg('In-app reminders active. Cloud push had an issue.');
      return;
    }

    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  }, [settings, permission, userId, subscribe, unsubscribe]);

  const overlay = 'bg-black/60 backdrop-blur-md';
  const panel = 'bg-surface border-border text-ink';
  const input =
    'bg-surface-hover border-border text-ink focus:border-primary';

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border p-6 shadow-2xl ${panel}`}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-md">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <h2
                className={`font-serif text-lg font-bold ${
                  dark ? 'text-stone-100' : 'text-stone-800'
                }`}
              >
                Notification Reminders
              </h2>
              <p className={`text-[11px] ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                {isSubscribed
                  ? 'Background Web Push active — works when closed'
                  : 'Receive reminders even when Dhikrly is closed'}
              </p>
            </div>
          </div>
          <button
            aria-label="Close notification settings"
            onClick={onClose}
            className={`rounded-full p-2 ${
              dark
                ? 'text-stone-400 hover:bg-white/10 hover:text-stone-200'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Permission banner */}
        <div
          className={`mb-5 rounded-2xl border px-4 py-3 text-xs ${
            permission === 'granted'
              ? dark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-emerald-300/50 bg-emerald-50 text-emerald-800'
              : permission === 'denied'
                ? dark
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-red-200 bg-red-50 text-red-600'
                : dark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {permission === 'granted' && (
            <span className="inline-flex items-center gap-2 font-medium">
              <Check className="h-4 w-4" aria-hidden="true" /> Browser notification permission granted
            </span>
          )}
          {permission === 'denied' && (
            <span className="inline-flex items-center gap-2 font-medium">
              <X className="h-4 w-4" aria-hidden="true" /> Notifications blocked — enable in browser/OS settings
            </span>
          )}
          {permission === 'default' && (
            <div className="flex items-center justify-between gap-3">
              <span>Allow notifications to receive daily reminders</span>
              <button
                type="button"
                onClick={requestPermission}
                className="rounded-xl bg-emerald-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950"
              >
                Allow
              </button>
            </div>
          )}
        </div>

        {/* Morning */}
        <div className="mb-4 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300">
                <Sun className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--app-ink)]">Morning Reminder</p>
                <p className="text-[10px] text-[var(--app-muted)]">
                  Morning Adhkār & Du’ā at dawn
                </p>
              </div>
            </div>
            <Toggle
              enabled={settings.morningEnabled}
              onToggle={() =>
                setSettings((s) => ({ ...s, morningEnabled: !s.morningEnabled }))
              }
              color="amber"
              dark={dark}
            />
          </div>
          {settings.morningEnabled && (
            <div className="mt-3 pt-3 border-t border-[var(--app-line)]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                value={settings.morningTime}
                onChange={(e) => setSettings((s) => ({ ...s, morningTime: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition-colors ${input}`}
              />
            </div>
          )}
        </div>

        {/* Evening */}
        <div className="mb-5 rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <Moon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[var(--app-ink)]">Evening Reminder</p>
                <p className="text-[10px] text-[var(--app-muted)]">
                  Evening Adhkār & gratitude before night
                </p>
              </div>
            </div>
            <Toggle
              enabled={settings.eveningEnabled}
              onToggle={() =>
                setSettings((s) => ({ ...s, eveningEnabled: !s.eveningEnabled }))
              }
              color="violet"
              dark={dark}
            />
          </div>
          {settings.eveningEnabled && (
            <div className="mt-3 pt-3 border-t border-[var(--app-line)]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)] block mb-1">
                Scheduled Time
              </label>
              <input
                type="time"
                value={settings.eveningTime}
                onChange={(e) => setSettings((s) => ({ ...s, eveningTime: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition-colors ${input}`}
              />
            </div>
          )}
        </div>

        {/* Notice/Warning/Error */}
        {errorMsg && (
          <div
            className={`mb-4 rounded-2xl border px-3.5 py-3 text-xs leading-relaxed ${
              status === 'error'
                ? dark
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-red-200 bg-red-50 text-red-700'
                : dark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Supabase SQL Migration Helper Box */}
        {showSqlHelp && (
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                <strong className="text-[var(--app-ink)]">How to enable Background Push:</strong>
              </div>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950"
              >
                {copiedSql ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[var(--app-muted)]">
              <li>Open your Supabase Project Dashboard</li>
              <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
              <li>Paste the SQL (or copy from button above) and click <strong>Run</strong></li>
              <li>Come back here and click <strong>Save & Schedule</strong></li>
            </ol>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={status === 'saving'}
            className={`flex-1 rounded-2xl py-3 text-xs font-bold border transition-all active:scale-[0.98] ${
              testSent
                ? dark
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : dark
                  ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {testSent ? '✓ Sent Test!' : '🔔 Send Test'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={permission === 'denied' || status === 'saving' || isLoading}
            className={`flex-[2] rounded-2xl py-3 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'saved'
                ? dark
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-800'
                : 'bg-emerald-800 text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 shadow-md'
            }`}
          >
            {status === 'saving' || isLoading
              ? 'Saving…'
              : status === 'saved'
                ? '✓ Saved & Scheduled'
                : 'Save & Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
