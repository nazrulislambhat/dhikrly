'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Clock3,
  HelpCircle,
  Info,
  Landmark,
  RotateCcw,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import type { PrayerName, LocalPrayerTiming, LocalMasjidSettings, PrayerTimesResult } from '@/types/salah';
import { PRAYERS, PRAYER_LABELS } from '@/types/salah';
import { formatTime, formatTimeString } from '@/lib/prayerTimes';
import {
  getNotificationPermission,
  requestNotificationPermission,
  testAzanNotification,
} from '@/lib/azanNotificationService';

interface LocalMasjidModalProps {
  isOpen: boolean;
  onClose: () => void;
  dark: boolean;
  currentSettings: LocalMasjidSettings | null;
  calculatedTimes?: PrayerTimesResult | null;
  timezone?: string;
  initialPrayerFocus?: PrayerName;
  onSave: (settings: LocalMasjidSettings | null) => void;
}

export default function LocalMasjidModal({
  isOpen,
  onClose,
  dark,
  currentSettings,
  calculatedTimes,
  timezone,
  initialPrayerFocus,
  onSave,
}: LocalMasjidModalProps) {
  const [masjidName, setMasjidName] = useState('');
  const [notes, setNotes] = useState('');
  const [timings, setTimings] = useState<Partial<Record<PrayerName, LocalPrayerTiming>>>({});
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Initialize form state when modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setMasjidName(currentSettings?.masjidName ?? '');
      setNotes(currentSettings?.notes ?? '');
      setTimings(currentSettings?.timings ? { ...currentSettings.timings } : {});
      setPermission(getNotificationPermission());
      setTestStatus(null);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const bgModal = dark ? 'bg-[#101c19] text-stone-100 border-white/10' : 'bg-white text-stone-900 border-stone-200';
  const cardRow = dark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-stone-50 border-stone-200';
  const inputBg = dark
    ? 'bg-black/30 border-white/15 text-stone-100 focus:border-emerald-400 focus:ring-emerald-400/20'
    : 'bg-white border-stone-300 text-stone-900 focus:border-emerald-600 focus:ring-emerald-500/20';

  const updatePrayerTiming = (prayer: PrayerName, updates: Partial<LocalPrayerTiming>) => {
    setTimings((prev) => ({
      ...prev,
      [prayer]: {
        ...(prev[prayer] ?? {
          azanTime: '',
          iqamahTime: '',
          notifyAzan: false,
          notifyOffsetMinutes: 0,
        }),
        ...updates,
      },
    }));
  };

  /** Pre-fill Azan times from today's calculated times */
  const handlePrefillCalculated = () => {
    if (!calculatedTimes) return;
    const updated = { ...timings };

    const toHHMM = (d: Date): string => {
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };

    for (const p of PRAYERS) {
      const calcDate = calculatedTimes[p];
      if (calcDate) {
        const hhmm = toHHMM(calcDate);
        updated[p] = {
          ...(updated[p] ?? { notifyAzan: false, notifyOffsetMinutes: 0 }),
          azanTime: hhmm,
          // If no iqamah yet, leave blank for manual customization
          iqamahTime: updated[p]?.iqamahTime ?? '',
        };
      }
    }
    setTimings(updated);
  };

  /** Toggle Azan notification for all prayers */
  const handleToggleAllNotifications = async (enable: boolean) => {
    if (enable && permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }

    const updated = { ...timings };
    for (const p of PRAYERS) {
      updated[p] = {
        ...(updated[p] ?? { azanTime: '', iqamahTime: '', notifyOffsetMinutes: 0 }),
        notifyAzan: enable,
      };
    }
    setTimings(updated);
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const result = await testAzanNotification('fajr', masjidName || 'Local Masjid');
      setTestStatus(result.message);
      setPermission(getNotificationPermission());
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Check if any notification is requested but permission not granted
    const hasAnyNotif = Object.values(timings).some((t) => t?.notifyAzan);
    if (hasAnyNotif && permission !== 'granted') {
      const perm = await requestNotificationPermission();
      setPermission(perm);
    }

    const cleanTimings: Partial<Record<PrayerName, LocalPrayerTiming>> = {};
    for (const p of PRAYERS) {
      const t = timings[p];
      if (t && (t.azanTime || t.iqamahTime || t.notifyAzan)) {
        cleanTimings[p] = {
          azanTime: t.azanTime || undefined,
          iqamahTime: t.iqamahTime || undefined,
          notifyAzan: !!t.notifyAzan,
          notifyOffsetMinutes: t.notifyOffsetMinutes ?? 0,
        };
      }
    }

    const newSettings: LocalMasjidSettings = {
      enabled: true,
      masjidName: masjidName.trim() || 'My Local Masjid',
      notes: notes.trim() || undefined,
      timings: cleanTimings,
      updatedAt: new Date().toISOString(),
    };

    onSave(newSettings);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to remove your local masjid timings and return to automatic calculation times?')) {
      onSave(null);
      onClose();
    }
  };

  const allNotificationsEnabled = PRAYERS.every((p) => timings[p]?.notifyAzan);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="local-masjid-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border shadow-2xl overflow-hidden ${bgModal}`}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between border-b px-5 py-4 sm:px-6 sm:py-5 border-inherit">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 place-items-center rounded-2xl ${
                dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              <Landmark className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 id="local-masjid-title" className="font-serif text-lg font-bold sm:text-xl">
                Local Masjid & Azaan Timings
              </h2>
              <p className={`text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                Add or update your local mosque’s schedule. Astronomical calculation times remain unchanged.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`rounded-full p-2 transition ${
              dark ? 'hover:bg-white/10 text-stone-400 hover:text-stone-200' : 'hover:bg-stone-100 text-stone-500'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
          {/* Mosque Name & Notes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Mosque / Masjid Name
              </label>
              <input
                type="text"
                value={masjidName}
                onChange={(e) => setMasjidName(e.target.value)}
                placeholder="e.g. Masjid Al-Noor / Central Mosque"
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Schedule Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Jumu‘ah Khutbah at 1:15 PM"
                className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
              />
            </div>
          </div>

          {/* Smart Quick Actions Bar */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 ${
              dark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-emerald-50/50 border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold">Quick setup:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {calculatedTimes && (
                <button
                  type="button"
                  onClick={handlePrefillCalculated}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    dark
                      ? 'bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Pre-fill Azaan from calculated times
                </button>
              )}
              <button
                type="button"
                onClick={() => handleToggleAllNotifications(!allNotificationsEnabled)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  allNotificationsEnabled
                    ? dark
                      ? 'bg-amber-400/20 text-amber-200'
                      : 'bg-amber-100 text-amber-900'
                    : dark
                      ? 'bg-white/10 text-stone-300 hover:bg-white/15'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                {allNotificationsEnabled ? 'Disable all notifications' : 'Plan Azan notifications for all'}
              </button>
            </div>
          </div>

          {/* Browser Notification Status Banner */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
              permission === 'granted'
                ? dark
                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : permission === 'denied'
                  ? dark
                    ? 'border-red-400/20 bg-red-400/10 text-red-200'
                    : 'border-red-200 bg-red-50 text-red-900'
                  : dark
                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 shrink-0" />
              <span>
                {permission === 'granted'
                  ? 'Browser notifications are enabled. Azan alerts will arrive on time.'
                  : permission === 'denied'
                    ? 'Notifications are blocked in your browser settings. Please enable them to receive Azan alerts.'
                    : 'Enable browser notifications so you never miss local Azan alerts.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {permission !== 'granted' && permission !== 'denied' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Enable Notifications
                </button>
              )}
              {permission === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testing}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                    dark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border text-emerald-900 hover:bg-stone-50'
                  }`}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  {testing ? 'Testing…' : 'Test Azan Alert'}
                </button>
              )}
            </div>
          </div>

          {testStatus && (
            <p className={`text-xs text-center font-medium ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {testStatus}
            </p>
          )}

          {/* ── Prayer Timings & Azan Notifications Form ── */}
          <div className="space-y-3">
            {PRAYERS.map((prayer) => {
              const timing = timings[prayer] ?? {
                azanTime: '',
                iqamahTime: '',
                notifyAzan: false,
                notifyOffsetMinutes: 0,
              };
              const calcDate = calculatedTimes?.[prayer];
              const isFocused = initialPrayerFocus === prayer;

              return (
                <div
                  key={prayer}
                  className={`rounded-2xl border p-4 transition-all ${cardRow} ${
                    isFocused ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 mb-3 border-inherit">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-bold">
                        {prayer === 'dhuhr' ? 'Dhuhr / Jumu‘ah' : PRAYER_LABELS[prayer].en}
                      </span>
                      <span className="font-arabic text-xs opacity-60" dir="rtl">
                        {PRAYER_LABELS[prayer].ar}
                      </span>
                    </div>
                    {calcDate && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          dark ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-600'
                        }`}
                        title="Automatic astronomical calculation time"
                      >
                        <Clock3 className="h-3 w-3" />
                        Calc: {formatTime(calcDate, timezone)}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Azaan time input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                        Azaan Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={timing.azanTime || ''}
                          onChange={(e) => updatePrayerTiming(prayer, { azanTime: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
                        />
                      </div>
                      {timing.azanTime && (
                        <p className={`mt-0.5 text-[10px] font-medium ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          Display: {formatTimeString(timing.azanTime)}
                        </p>
                      )}
                    </div>

                    {/* Iqamah time input */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                        Iqāmah / Jamā‘ah Time
                      </label>
                      <input
                        type="time"
                        value={timing.iqamahTime || ''}
                        onChange={(e) => updatePrayerTiming(prayer, { iqamahTime: e.target.value })}
                        className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
                      />
                      {timing.iqamahTime && (
                        <p className={`mt-0.5 text-[10px] font-medium ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          Display: {formatTimeString(timing.iqamahTime)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Azan Notification Planning Section */}
                  <div
                    className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-2.5 border ${
                      timing.notifyAzan
                        ? dark
                          ? 'border-amber-500/30 bg-amber-500/10'
                          : 'border-amber-200 bg-amber-50/70'
                        : dark
                          ? 'border-white/5 bg-white/[0.01]'
                          : 'border-stone-100 bg-white'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!timing.notifyAzan}
                        onChange={(e) => updatePrayerTiming(prayer, { notifyAzan: e.target.checked })}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold">
                        Plan Azan notification
                      </span>
                    </label>

                    {timing.notifyAzan && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] opacity-75">Alert at:</span>
                        <select
                          value={timing.notifyOffsetMinutes ?? 0}
                          onChange={(e) =>
                            updatePrayerTiming(prayer, { notifyOffsetMinutes: parseInt(e.target.value, 10) })
                          }
                          className={`rounded-lg border px-2 py-1 text-xs outline-none ${inputBg}`}
                        >
                          <option value="0">At Azan time</option>
                          <option value="5">5 min before Azan</option>
                          <option value="10">10 min before Azan</option>
                          <option value="15">15 min before Azan</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 border-inherit">
          <div>
            {currentSettings && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear local timings
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                dark ? 'border-white/10 hover:bg-white/5 text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <Check className="h-4 w-4" />
              Save & Plan Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
