/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  load,
  save,
  NOTIFICATION_KEY,
  NOTIF_FIRED_PREFIX,
} from '@/lib/storage';
import type { NotifSettings } from '@/types';

const DEFAULT_SETTINGS: NotifSettings = {
  morningEnabled: false,
  morningTime: '06:00',
  eveningEnabled: false,
  eveningTime: '18:00',
};

function scheduleNotifications(settings: NotifSettings): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const firedKey = `${NOTIF_FIRED_PREFIX}${todayKey}`;
  const fired = load<Record<string, boolean>>(firedKey, {});

  const schedule = (
    label: string,
    timeStr: string,
    enabled: boolean,
    firedProp: string,
  ) => {
    if (!enabled || fired[firedProp]) return;
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const delay = target.getTime() - now.getTime();
    if (delay > 0 && delay < 86_400_000) {
      setTimeout(() => {
        new Notification('Daily Adhkār Reminder 🌙', {
          body: `Time for your ${label} adhkār & du'ā`,
          icon: '/icon-192.png',
          tag: `adhkar-${firedProp}`,
        });
        const f = load<Record<string, boolean>>(firedKey, {});
        f[firedProp] = true;
        save(firedKey, f);
      }, delay);
    }
  };

  schedule('Morning', settings.morningTime, settings.morningEnabled, 'morning');
  schedule('Evening', settings.eveningTime, settings.eveningEnabled, 'evening');
}

interface NotificationSettingsProps {
  dark: boolean;
  onClose: () => void;
}

export default function NotificationSettings({
  dark,
  onClose,
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotifSettings>(() =>
    load<NotifSettings>(NOTIFICATION_KEY, DEFAULT_SETTINGS),
  );
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [saved, setSaved] = useState(false);

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

  const handleSave = useCallback(() => {
    save(NOTIFICATION_KEY, settings);
    if (permission === 'granted') {
      scheduleNotifications(settings);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings, permission]);

  const overlay = dark
    ? 'bg-[#0c1a2e]/80 backdrop-blur-sm'
    : 'bg-stone-900/40 backdrop-blur-sm';

  const panel = dark
    ? 'bg-[#111f33] border-white/10'
    : 'bg-white border-stone-200';

  const input = dark
    ? 'bg-white/5 border-white/10 text-stone-200 focus:border-amber-400/50'
    : 'bg-stone-50 border-stone-200 text-stone-700 focus:border-amber-400';

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
            Notification Reminders
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

        {/* Permission status */}
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-[12px] ${
            permission === 'granted'
              ? dark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-emerald-300/50 bg-emerald-50 text-emerald-700'
              : permission === 'denied'
                ? dark
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-red-300/50 bg-red-50 text-red-600'
                : dark
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-amber-300/50 bg-amber-50 text-amber-700'
          }`}
        >
          {permission === 'granted' && '✓ Notifications are enabled'}
          {permission === 'denied' &&
            '✗ Notifications blocked — enable in browser settings'}
          {permission === 'default' && (
            <div className="flex items-center justify-between gap-3">
              <span>Notifications not yet enabled</span>
              <button
                onClick={requestPermission}
                className={`rounded-full px-3 py-1 text-[10px] font-medium transition-all ${
                  dark
                    ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                Enable
              </button>
            </div>
          )}
        </div>

        {/* Morning */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p
                className={`text-[13px] font-medium ${
                  dark ? 'text-stone-200' : 'text-stone-700'
                }`}
              >
                🌅 Morning Reminder
              </p>
              <p
                className={`text-[10px] ${
                  dark ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Morning adhkār & du`ā
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  morningEnabled: !s.morningEnabled,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.morningEnabled
                  ? dark
                    ? 'bg-amber-500'
                    : 'bg-amber-500'
                  : dark
                    ? 'bg-stone-700'
                    : 'bg-stone-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 left-0 rounded-full bg-white shadow transition-transform ${
                  settings.morningEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {settings.morningEnabled && (
            <input
              type="time"
              value={settings.morningTime}
              onChange={(e) =>
                setSettings((s) => ({ ...s, morningTime: e.target.value }))
              }
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          )}
        </div>

        {/* Evening */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p
                className={`text-[13px] font-medium ${
                  dark ? 'text-stone-200' : 'text-stone-700'
                }`}
              >
                🌙 Evening Reminder
              </p>
              <p
                className={`text-[10px] ${
                  dark ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Evening adhkār & du`ā
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  eveningEnabled: !s.eveningEnabled,
                }))
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.eveningEnabled
                  ? dark
                    ? 'bg-violet-500'
                    : 'bg-violet-500'
                  : dark
                    ? 'bg-stone-700'
                    : 'bg-stone-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 left-0 rounded-full bg-white shadow transition-transform ${
                  settings.eveningEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {settings.eveningEnabled && (
            <input
              type="time"
              value={settings.eveningTime}
              onChange={(e) =>
                setSettings((s) => ({ ...s, eveningTime: e.target.value }))
              }
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors ${input}`}
            />
          )}
        </div>

        <p
          className={`mb-4 text-[10px] ${
            dark ? 'text-stone-600' : 'text-stone-400'
          }`}
        >
          Note: Notifications are scheduled when the app is open. For background
          notifications, add to your home screen as a PWA.
        </p>

        <button
          onClick={handleSave}
          disabled={permission === 'denied'}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
            saved
              ? dark
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-emerald-100 text-emerald-700'
              : permission === 'denied'
                ? 'cursor-not-allowed opacity-50 ' +
                  (dark
                    ? 'bg-stone-700 text-stone-500'
                    : 'bg-stone-100 text-stone-400')
                : dark
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {saved ? '✓ Saved!' : 'Save & Schedule'}
        </button>
      </div>
    </div>
  );
}

export { scheduleNotifications };
