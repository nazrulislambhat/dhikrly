export const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

export const getDateKey = (date: Date): string =>
  date.toISOString().slice(0, 10);

export const getHijriDate = (): string => {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
};

export const getGregorianDate = (): string =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const formatDateLabel = (key: string): string => {
  if (!key) return '';
  try {
    const iso = key.includes('T') ? key : `${key}T12:00:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return key;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return key;
  }
};

export const formatSafeDate = (
  key: string | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  fallback = '',
): string => {
  if (!key) return fallback;
  try {
    const iso = key.includes('T') ? key : `${key}T12:00:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return fallback || key;
    return d.toLocaleDateString('en-US', options ?? { month: 'short', day: 'numeric' });
  } catch {
    return fallback || key;
  }
};

/** Returns date keys for the last N days (oldest → newest), excluding today. */
export const getRecentDayKeys = (n: number): string[] => {
  const keys: string[] = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
};
