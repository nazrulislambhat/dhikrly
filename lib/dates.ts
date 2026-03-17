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
  const d = new Date(key + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
