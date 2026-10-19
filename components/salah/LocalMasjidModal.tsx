'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Clock3,
  Cloud,
  HelpCircle,
  Info,
  Landmark,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import type {
  PrayerName,
  LocalPrayerTiming,
  LocalMasjidSettings,
  LocalMasjidItem,
  PrayerTimesResult,
} from '@/types/salah';
import { PRAYERS, PRAYER_LABELS, MAX_LOCAL_MASJIDS } from '@/types/salah';
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
  currentSettings?: LocalMasjidSettings | null;
  allMasjids?: LocalMasjidItem[];
  initialActiveId?: string | null;
  initialEditingId?: string | null;
  calculatedTimes?: PrayerTimesResult | null;
  timezone?: string;
  initialPrayerFocus?: PrayerName;
  onSave: (settings: LocalMasjidSettings | null) => void;
}

const PRESET_LABELS = ['Home', 'Work', 'Jumu‘ah', 'Campus', 'Travel', 'Local'];

export default function LocalMasjidModal({
  isOpen,
  onClose,
  dark,
  currentSettings,
  allMasjids,
  initialActiveId,
  initialEditingId,
  calculatedTimes,
  timezone,
  initialPrayerFocus,
  onSave,
}: LocalMasjidModalProps) {
  const [masjids, setMasjids] = useState<LocalMasjidItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Initialize form state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setPermission(getNotificationPermission());
    setTestStatus(null);

    // Prefer explicit allMasjids list
    const candidateList: LocalMasjidItem[] =
      allMasjids && allMasjids.length > 0
        ? [...allMasjids]
        : currentSettings?.masjids && currentSettings.masjids.length > 0
          ? [...currentSettings.masjids]
          : currentSettings?.masjidName
            ? [
                {
                  id: currentSettings.selectedId || `masjid_${Date.now()}`,
                  name: currentSettings.masjidName,
                  label: 'Home',
                  notes: currentSettings.notes,
                  timings: currentSettings.timings ? { ...currentSettings.timings } : {},
                  updatedAt: currentSettings.updatedAt || new Date().toISOString(),
                },
              ]
            : [];

    if (candidateList.length > 0) {
      // Ensure unique IDs across all loaded masjids so they don't collide
      const sanitized = candidateList.map((m, idx) => ({
        ...m,
        id: m.id && m.id !== 'masjid_default' ? m.id : `masjid_${Date.now()}_${idx}`,
      }));
      setMasjids(sanitized);

      const targetActive =
        initialActiveId || currentSettings?.selectedId || sanitized[0].id;
      const validActive = sanitized.some((m) => m.id === targetActive)
        ? targetActive
        : sanitized[0].id;
      setActiveId(validActive);

      const targetEditing = initialEditingId || validActive;
      const validEditing = sanitized.some((m) => m.id === targetEditing)
        ? targetEditing
        : sanitized[0].id;
      setEditingId(validEditing);
    } else {
      // Empty new draft
      const newId = `masjid_${Date.now()}`;
      const draft: LocalMasjidItem = {
        id: newId,
        name: '',
        label: 'Home',
        notes: '',
        timings: {},
        updatedAt: new Date().toISOString(),
      };
      setMasjids([draft]);
      setActiveId(newId);
      setEditingId(newId);
    }
  }, [isOpen, currentSettings, allMasjids, initialActiveId, initialEditingId]);

  if (!isOpen) return null;

  const currentEditingMasjid =
    masjids.find((m) => m.id === editingId) ?? masjids[0] ?? null;

  const bgModal = dark ? 'bg-[#101c19] text-stone-100 border-white/10' : 'bg-white text-stone-900 border-stone-200';
  const cardRow = dark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-stone-50 border-stone-200';
  const inputBg = dark
    ? 'bg-black/30 border-white/15 text-stone-100 focus:border-emerald-400 focus:ring-emerald-400/20'
    : 'bg-white border-stone-300 text-stone-900 focus:border-emerald-600 focus:ring-emerald-500/20';

  const updateCurrentMasjid = (updates: Partial<LocalMasjidItem>) => {
    if (!currentEditingMasjid) return;
    setMasjids((prev) =>
      prev.map((m) =>
        m.id === currentEditingMasjid.id
          ? { ...m, ...updates, updatedAt: new Date().toISOString() }
          : m,
      ),
    );
  };

  const updatePrayerTiming = (prayer: PrayerName, updates: Partial<LocalPrayerTiming>) => {
    if (!currentEditingMasjid) return;
    const currentTimings = currentEditingMasjid.timings || {};
    const updatedPrayerTiming: LocalPrayerTiming = {
      ...(currentTimings[prayer] ?? {
        azanTime: '',
        iqamahTime: '',
        notifyAzan: false,
        notifyOffsetMinutes: 0,
      }),
      ...updates,
    };

    updateCurrentMasjid({
      timings: {
        ...currentTimings,
        [prayer]: updatedPrayerTiming,
      },
    });
  };

  /** Pre-fill Azan times from today's calculated times for current mosque */
  const handlePrefillCalculated = () => {
    if (!calculatedTimes || !currentEditingMasjid) return;
    const updated = { ...(currentEditingMasjid.timings || {}) };

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
          iqamahTime: updated[p]?.iqamahTime ?? '',
        };
      }
    }
    updateCurrentMasjid({ timings: updated });
  };

  /** Toggle Azan notification for all prayers of current mosque */
  const handleToggleAllNotifications = async (enable: boolean) => {
    if (enable && permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }

    if (!currentEditingMasjid) return;
    const updated = { ...(currentEditingMasjid.timings || {}) };
    for (const p of PRAYERS) {
      updated[p] = {
        ...(updated[p] ?? { azanTime: '', iqamahTime: '', notifyOffsetMinutes: 0 }),
        notifyAzan: enable,
      };
    }
    updateCurrentMasjid({ timings: updated });
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const result = await testAzanNotification(
        'fajr',
        currentEditingMasjid?.name || 'Local Masjid',
      );
      setTestStatus(result.message);
      setPermission(getNotificationPermission());
    } finally {
      setTesting(false);
    }
  };

  const handleAddMasjid = () => {
    if (masjids.length >= MAX_LOCAL_MASJIDS) return;
    const nextLabel = PRESET_LABELS[masjids.length] || 'Local';
    const newId = `masjid_${Date.now()}`;
    const newMasjid: LocalMasjidItem = {
      id: newId,
      name: '',
      label: nextLabel,
      notes: '',
      timings: {},
      updatedAt: new Date().toISOString(),
    };
    setMasjids((prev) => [...prev, newMasjid]);
    setEditingId(newId);
  };

  const handleDeleteCurrentMasjid = () => {
    if (!currentEditingMasjid) return;
    const remaining = masjids.filter((m) => m.id !== currentEditingMasjid.id);
    if (remaining.length === 0) {
      onSave(null);
      onClose();
      return;
    }
    setMasjids(remaining);
    const nextActive = activeId === currentEditingMasjid.id ? remaining[0].id : activeId;
    setActiveId(nextActive);
    setEditingId(remaining[0].id);
  };

  const handleSave = async () => {
    // Check if any notification is requested but permission not granted
    const hasAnyNotif = masjids.some((m) =>
      Object.values(m.timings || {}).some((t) => t?.notifyAzan),
    );
    if (hasAnyNotif && permission !== 'granted') {
      const perm = await requestNotificationPermission();
      setPermission(perm);
    }

    // Filter valid masjids
    const validMasjids = masjids
      .map((m, idx) => ({
        ...m,
        name: m.name.trim() || `Mosque #${idx + 1}`,
        notes: m.notes?.trim() || undefined,
        label: m.label?.trim() || undefined,
        updatedAt: m.updatedAt || new Date().toISOString(),
      }))
      .slice(0, MAX_LOCAL_MASJIDS);

    if (validMasjids.length === 0) {
      onSave(null);
      onClose();
      return;
    }

    const currentActive =
      validMasjids.find((m) => m.id === activeId) ?? validMasjids[0];

    const newSettings: LocalMasjidSettings = {
      enabled: true,
      masjidName: currentActive.name,
      notes: currentActive.notes,
      timings: currentActive.timings || {},
      updatedAt: new Date().toISOString(),
      masjids: validMasjids,
      selectedId: currentActive.id,
    };

    onSave(newSettings);
    onClose();
  };

  const allNotificationsEnabled = currentEditingMasjid
    ? PRAYERS.every((p) => currentEditingMasjid.timings?.[p]?.notifyAzan)
    : false;

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
              <div className="flex items-center gap-2">
                <h2 id="local-masjid-title" className="font-serif text-lg font-bold sm:text-xl">
                  Local Masjid Timings & Azaan Alerts
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Up to 5 Mosques
                </span>
              </div>
              <p className={`text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
                Add up to 5 local mosques with custom Azaan & Iqāmah timings. All data syncs to Supabase with zero data loss.
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

        {/* ── 5-Masjid Tab Strip ── */}
        <div className="flex items-center gap-2 overflow-x-auto border-b px-5 py-2.5 sm:px-6 border-inherit scrollbar-none">
          {masjids.map((m, idx) => {
            const isEditing = m.id === currentEditingMasjid?.id;
            const isActive = m.id === activeId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setEditingId(m.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isEditing
                    ? dark
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-sm'
                    : dark
                      ? 'bg-white/[0.04] text-stone-400 hover:text-stone-200'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                <Landmark className="h-3.5 w-3.5 shrink-0" />
                <span>{m.name.trim() || `Mosque #${idx + 1}`}</span>
                {m.label && (
                  <span className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.2 text-[9px] font-medium">
                    {m.label}
                  </span>
                )}
                {isActive && (
                  <span className="inline-flex items-center text-amber-500" title="Active mosque for daily tracker">
                    <Star className="h-3 w-3 fill-amber-500" />
                  </span>
                )}
              </button>
            );
          })}

          {masjids.length < MAX_LOCAL_MASJIDS && (
            <button
              type="button"
              onClick={handleAddMasjid}
              className={`inline-flex shrink-0 items-center gap-1 rounded-xl border border-dashed px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                dark
                  ? 'border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10'
                  : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Mosque ({masjids.length}/5)</span>
            </button>
          )}
        </div>

        {/* ── Scrollable Body for Currently Selected Mosque ── */}
        {currentEditingMasjid && (
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
            {/* Active Toggle & Label Chips */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                currentEditingMasjid.id === activeId
                  ? dark
                    ? 'border-emerald-400/30 bg-emerald-400/10'
                    : 'border-emerald-300 bg-emerald-50'
                  : dark
                    ? 'border-white/10 bg-white/[0.02]'
                    : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveId(currentEditingMasjid.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition ${
                    currentEditingMasjid.id === activeId
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : dark
                        ? 'bg-white/10 text-stone-300 hover:bg-white/20'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Star
                    className={`h-3.5 w-3.5 ${currentEditingMasjid.id === activeId ? 'fill-white' : ''}`}
                  />
                  <span>
                    {currentEditingMasjid.id === activeId
                      ? 'Active Mosque (Currently displaying)'
                      : 'Set as Active Mosque'}
                  </span>
                </button>
              </div>

              {/* Quick Label Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] opacity-70">Category:</span>
                {PRESET_LABELS.map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => updateCurrentMasjid({ label: lbl })}
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                      currentEditingMasjid.label === lbl
                        ? 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950'
                        : dark
                          ? 'bg-white/5 text-stone-300 hover:bg-white/10'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Mosque Name & Notes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Mosque / Masjid Name
                </label>
                <input
                  type="text"
                  value={currentEditingMasjid.name}
                  onChange={(e) => updateCurrentMasjid({ name: e.target.value })}
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
                  value={currentEditingMasjid.notes || ''}
                  onChange={(e) => updateCurrentMasjid({ notes: e.target.value })}
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
                  {allNotificationsEnabled ? 'Disable alerts' : 'Plan Azan alerts for all 5'}
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
                    ? 'border-red-400/20 bg-red-400/10 text-red-200'
                    : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 shrink-0" />
                <span>
                  {permission === 'granted'
                    ? 'Browser notifications are enabled. Azan alerts will fire on time.'
                    : permission === 'denied'
                      ? 'Notifications are blocked in your browser settings.'
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

            {/* ── 5 Daily Prayer Timings & Azan Alerts ── */}
            <div className="space-y-3">
              {PRAYERS.map((prayer) => {
                const timing = currentEditingMasjid.timings?.[prayer] ?? {
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
                        <input
                          type="time"
                          value={timing.azanTime || ''}
                          onChange={(e) => updatePrayerTiming(prayer, { azanTime: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${inputBg}`}
                        />
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
        )}

        {/* ── Modal Footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 border-inherit">
          <div className="flex items-center gap-3">
            {masjids.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteCurrentMasjid}
                className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete this mosque</span>
              </button>
            )}
            <span className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
              <Cloud className="h-3 w-3 text-emerald-500" />
              <span>Synced with Account</span>
            </span>
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
              Save & Sync All Mosques
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
