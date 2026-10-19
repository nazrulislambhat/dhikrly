import { PRAYERS, PRAYER_LABELS } from '@/types/salah';
import type { PrayerName, LocalMasjidSettings } from '@/types/salah';
import { load, save } from '@/lib/storage';
import { formatTimeString } from '@/lib/prayerTimes';
import { fireNotification } from '@/components/NotificationSettings';
import { playAzanChime } from '@/lib/sounds';

export const AZAN_NOTIF_FIRED_PREFIX = 'dhikrly_azan_fired_';

export interface PlannedAzanNotification {
  prayer: PrayerName;
  labelEn: string;
  labelAr: string;
  azanTime: string;
  iqamahTime?: string;
  notifyOffsetMinutes: number;
  targetTime: Date;
  isFired: boolean;
  isDue: boolean;
  isUpcoming: boolean;
}

/** Check browser notification permission status */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/** Request browser notification permission */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

/** Get record of prayers whose Azan notification fired today */
export function getAzanFiredToday(date = new Date()): Record<string, boolean> {
  const todayKey = date.toISOString().slice(0, 10);
  return load<Record<string, boolean>>(`${AZAN_NOTIF_FIRED_PREFIX}${todayKey}`, {});
}

/** Mark a prayer's Azan notification as fired today */
export function markAzanFired(prayer: PrayerName, date = new Date()): void {
  const todayKey = date.toISOString().slice(0, 10);
  const key = `${AZAN_NOTIF_FIRED_PREFIX}${todayKey}`;
  const current = load<Record<string, boolean>>(key, {});
  current[prayer] = true;
  save(key, current);
}

/**
 * Return list of all planned Azan notifications for today based on local masjid settings
 */
export function getPlannedAzanList(
  settings: LocalMasjidSettings | null | undefined,
  now = new Date(),
): PlannedAzanNotification[] {
  if (!settings || !settings.timings) return [];

  const firedMap = getAzanFiredToday(now);
  const list: PlannedAzanNotification[] = [];

  for (const p of PRAYERS) {
    const timing = settings.timings[p];
    if (!timing || !timing.azanTime) continue;

    const [h, m] = timing.azanTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const offset = timing.notifyOffsetMinutes ?? 0;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    target.setMinutes(target.getMinutes() - offset);

    const diffMs = target.getTime() - now.getTime();
    const isFired = !!firedMap[p];
    const isDue = diffMs <= 0 && diffMs > -15 * 60 * 1000; // within past 15 min
    const isUpcoming = diffMs > 0;

    list.push({
      prayer: p,
      labelEn: PRAYER_LABELS[p].en,
      labelAr: PRAYER_LABELS[p].ar,
      azanTime: timing.azanTime,
      iqamahTime: timing.iqamahTime,
      notifyOffsetMinutes: offset,
      targetTime: target,
      isFired,
      isDue,
      isUpcoming,
    });
  }

  return list;
}

/**
 * Check if any planned Azan notification is due and fire it
 */
export async function checkAndFireAzanNotifications(
  settings: LocalMasjidSettings | null | undefined,
  now = new Date(),
): Promise<boolean> {
  if (!settings || !settings.timings) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const firedMap = getAzanFiredToday(now);
  let firedAny = false;

  for (const p of PRAYERS) {
    const timing = settings.timings[p];
    if (!timing || !timing.notifyAzan || !timing.azanTime) continue;
    if (firedMap[p]) continue;

    const [h, m] = timing.azanTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const offset = timing.notifyOffsetMinutes ?? 0;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    target.setMinutes(target.getMinutes() - offset);

    const diffMinutes = (now.getTime() - target.getTime()) / 60000;

    // Fire if we are within [0, 15] minutes after scheduled alarm time
    if (diffMinutes >= 0 && diffMinutes < 15) {
      const label = PRAYER_LABELS[p].en;
      const offsetText = offset > 0 ? ` (${offset}m before Azan)` : '';
      const masjidText = settings.masjidName ? ` · ${settings.masjidName}` : '';
      const iqamahText = timing.iqamahTime ? ` · Iqāmah at ${formatTimeString(timing.iqamahTime)}` : '';

      const title = `Adhan for ${label} 🕌`;
      const body = `Allāhu Akbar, Allāhu Akbar · Time for ${label} prayer${offsetText}${masjidText} (${formatTimeString(
        timing.azanTime,
      )})${iqamahText}.`;

      const shown = await fireNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `dhikrly-azan-${p}`,
        data: { url: '/salah' },
        vibrate: [120, 80, 120, 80, 240],
      });

      if (shown) {
        markAzanFired(p, now);
        playAzanChime();
        firedAny = true;
      }
    }
  }

  return firedAny;
}

/**
 * Send an immediate test notification with Azan chime
 */
export async function testAzanNotification(
  prayer: PrayerName = 'fajr',
  masjidName?: string,
): Promise<{ ok: boolean; message: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, message: 'Notifications are not supported in this browser.' };
  }

  let permission = Notification.permission;
  if (permission !== 'granted') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Notification permission was not granted. Please enable notifications in your browser settings.',
    };
  }

  const label = PRAYER_LABELS[prayer].en;
  const shown = await fireNotification(`Adhan Alert Test · ${label} 🕌`, {
    body: `Allāhu Akbar, Allāhu Akbar · Notifications are working properly for ${
      masjidName || 'your local masjid'
    }!`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'dhikrly-azan-test',
    data: { url: '/salah' },
    vibrate: [120, 80, 120, 80, 240],
  });

  playAzanChime();

  if (shown) {
    return { ok: true, message: 'Test notification sent with Azan chime!' };
  }
  return { ok: false, message: 'Could not display notification. Check system alert permissions.' };
}

/**
 * Start the recurring background scheduler for Azan notifications
 */
export function startAzanNotificationScheduler(
  getSettings: () => LocalMasjidSettings | null | undefined,
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Check immediately
  void checkAndFireAzanNotifications(getSettings());

  // Check every 25 seconds
  const interval = setInterval(() => {
    void checkAndFireAzanNotifications(getSettings());
  }, 25_000);

  return () => {
    clearInterval(interval);
  };
}
