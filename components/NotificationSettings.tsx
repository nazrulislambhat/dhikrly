'use client';

import { useState, useEffect, useCallback } from 'react';
import { BellRing, Check, Moon, Sun, X } from 'lucide-react';
import { load, save, NOTIFICATION_KEY } from '@/lib/storage';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import type { NotifSettings } from '@/types';

const DEFAULT_SETTINGS: NotifSettings = {
  morningEnabled: false,
  morningTime: '06:00',
  eveningEnabled: false,
  eveningTime: '18:00',
};

/* ─────────────────────────────────────────────────────────────────────
   In-app fallback scheduler (fires when app is open)
   Used as a backup alongside server push.
───────────────────────────────────────────────────────────────────── */
let notifInterval: ReturnType<typeof setInterval> | null = null;

export async function fireNotification(title: string, options: NotificationOptions) {
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
      const shown = await fireNotification('Daily Adhkār Reminder 🌙', {
        body: `Time for your ${label.toLowerCase()} adhkār & duʿā`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `adhkar-${prop}`,
      });
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
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled
          ? color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
          : dark ? 'bg-stone-700' : 'bg-stone-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
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
    () => load<NotifSettings>(NOTIFICATION_KEY, DEFAULT_SETTINGS)
  );
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
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
    const sent = await fireNotification('Daily Adhkār Reminder 🌙', {
      body: "Bismillah! This is a test reminder. Your notifications are working perfectly.",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'adhkar-test',
    });
    if (sent) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } else {
      setErrorMsg('Could not display test notification. Please check browser permissions.');
    }
  };

  const handleSave = useCallback(async () => {
    setStatus('saving');
    setErrorMsg('');

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
          setErrorMsg('Local reminders saved & active! (Background push requires running the SQL migration in Supabase).');
        } else {
          setErrorMsg(result.error ?? 'Local reminders saved. Cloud push registration had an issue.');
        }
        return;
      }
    } catch (error) {
      console.warn('Push registration warning:', error);
      setStatus('saved');
      setErrorMsg('Local reminders saved. Cloud push registration had an issue.');
      return;
    }

    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  }, [settings, permission, userId, subscribe, unsubscribe]);

  /* ── Styles ── */
  const overlay = dark ? 'bg-black/65 backdrop-blur-md' : 'bg-stone-900/45 backdrop-blur-md';
  const panel   = dark ? 'bg-[#14211e] border-white/10 text-stone-100' : 'bg-white border-stone-200';
  const input   = dark
    ? 'bg-white/5 border-white/10 text-stone-200 focus:border-amber-400/50'
    : 'bg-stone-50 border-stone-200 text-stone-700 focus:border-amber-400';

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panel}`}>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className={`inline-flex items-center gap-2 font-serif text-lg font-semibold ${dark ? 'text-stone-100' : 'text-stone-800'}`}>
              <BellRing className="h-4 w-4 text-emerald-700 dark:text-emerald-200" aria-hidden="true" />
              Notification Reminders
            </h2>
            <p className={`mt-0.5 text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
              {isSubscribed
                ? 'Push notifications active — works when app is closed'
                : 'Enable to receive reminders even when app is closed'}
            </p>
          </div>
          <button aria-label="Close notification settings" onClick={onClose} className={`rounded-full p-1.5 ${dark ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Permission banner */}
        <div className={`mb-5 rounded-xl border px-4 py-3 text-[12px] ${
          permission === 'granted'
            ? dark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-300/50 bg-emerald-50 text-emerald-700'
            : permission === 'denied'
              ? dark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-200 bg-red-50 text-red-600'
              : dark ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {permission === 'granted' && <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" aria-hidden="true" /> Notifications are enabled</span>}
          {permission === 'denied' && <span className="inline-flex items-center gap-2"><X className="h-4 w-4" aria-hidden="true" /> Notifications blocked — enable in browser/system settings</span>}
          {permission === 'default' && (
            <div className="flex items-center justify-between gap-3">
              <span>Allow notifications to receive reminders</span>
              <button
                onClick={requestPermission}
                className={`rounded-full px-3 py-1 text-[10px] font-medium ${dark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}
              >
                Allow
              </button>
            </div>
          )}
        </div>

        {/* Morning */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className={`inline-flex items-center gap-2 text-[13px] font-medium ${dark ? 'text-stone-200' : 'text-stone-700'}`}>
                <Sun className="h-4 w-4 text-emerald-700 dark:text-emerald-200" aria-hidden="true" /> Morning Reminder
              </p>
              <p className={`text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
                Morning adhkār & du'ā
              </p>
            </div>
            <Toggle
              enabled={settings.morningEnabled}
              onToggle={() => setSettings((s) => ({ ...s, morningEnabled: !s.morningEnabled }))}
              color="amber"
              dark={dark}
            />
          </div>
          {settings.morningEnabled && (
            <input
              type="time"
              value={settings.morningTime}
              onChange={(e) => setSettings((s) => ({ ...s, morningTime: e.target.value }))}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          )}
        </div>

        {/* Evening */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className={`inline-flex items-center gap-2 text-[13px] font-medium ${dark ? 'text-stone-200' : 'text-stone-700'}`}>
                <Moon className="h-4 w-4 text-emerald-700 dark:text-emerald-200" aria-hidden="true" /> Evening Reminder
              </p>
              <p className={`text-[10px] ${dark ? 'text-stone-600' : 'text-stone-400'}`}>
                Evening adhkār & du'ā
              </p>
            </div>
            <Toggle
              enabled={settings.eveningEnabled}
              onToggle={() => setSettings((s) => ({ ...s, eveningEnabled: !s.eveningEnabled }))}
              color="violet"
              dark={dark}
            />
          </div>
          {settings.eveningEnabled && (
            <input
              type="time"
              value={settings.eveningTime}
              onChange={(e) => setSettings((s) => ({ ...s, eveningTime: e.target.value }))}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          )}
        </div>

        {/* Notice/Warning/Error */}
        {errorMsg && (
          <div
            className={`mb-4 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
              status === 'error'
                ? dark
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-red-200 bg-red-50 text-red-600'
                : dark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {errorMsg}
          </div>
        )}

        {/* Info */}
        <p className={`mb-4 text-[10px] leading-relaxed ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
          In-app reminders fire while using Dhikrly. Background push delivers reminders even when the app is closed.
        </p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={status === 'saving'}
            className={`flex-1 rounded-xl py-2.5 text-xs font-medium border transition-all active:scale-[0.98] ${
              testSent
                ? dark ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : dark
                  ? 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {testSent ? '✓ Sent!' : '🔔 Send Test'}
          </button>

          <button
            onClick={handleSave}
            disabled={permission === 'denied' || status === 'saving' || isLoading}
            className={`flex-[2] rounded-xl py-2.5 text-xs font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              status === 'saved'
                ? dark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700'
                : dark
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/30'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
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
