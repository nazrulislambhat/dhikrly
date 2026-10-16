export type QadaPrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';

export interface QadaState {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
  totalInitial: number;
  totalMadeUp: number;
  dailyTarget: number; // Number of Qada prayers planned per day (default 5: one after each Fard)
  updatedAt: string;
}

export const DEFAULT_QADA_STATE: QadaState = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0,
  totalInitial: 0,
  totalMadeUp: 0,
  dailyTarget: 5,
  updatedAt: new Date().toISOString(),
};

export const QADA_STORAGE_KEY = 'dhikrly_qada_tracker_v1';

export function getQadaState(): QadaState {
  if (typeof window === 'undefined') return DEFAULT_QADA_STATE;
  try {
    const raw = localStorage.getItem(QADA_STORAGE_KEY);
    if (!raw) return DEFAULT_QADA_STATE;
    const parsed = JSON.parse(raw);
    return {
      fajr: Math.max(0, Number(parsed.fajr) || 0),
      dhuhr: Math.max(0, Number(parsed.dhuhr) || 0),
      asr: Math.max(0, Number(parsed.asr) || 0),
      maghrib: Math.max(0, Number(parsed.maghrib) || 0),
      isha: Math.max(0, Number(parsed.isha) || 0),
      witr: Math.max(0, Number(parsed.witr) || 0),
      totalInitial: Math.max(0, Number(parsed.totalInitial) || 0),
      totalMadeUp: Math.max(0, Number(parsed.totalMadeUp) || 0),
      dailyTarget: Math.max(1, Number(parsed.dailyTarget) || 5),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return DEFAULT_QADA_STATE;
  }
}

export function saveQadaState(state: QadaState): void {
  if (typeof window === 'undefined') return;
  try {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(QADA_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('dhikrly:qada-updated'));
  } catch (e) {
    console.error('Failed to save Qada state:', e);
  }
}
