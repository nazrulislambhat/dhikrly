'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDhikrTracking } from '@/hooks/useDhikrTracking';
import DUAS_JSON from '@/data/duas.json';
import type { Dua } from '@/types';
import { load, SETTINGS_KEY } from '@/lib/storage';

const BASE_DUAS = DUAS_JSON as Dua[];

export default function HistoryPage() {
  const { user } = useAuth();
  const [dark, setDark] = useState(false);
  const [customDuas, setCustomDuas] = useState<Dua[]>(() => []);

  useEffect(() => {
    const settings = load<{ dark?: boolean }>(SETTINGS_KEY, {});
    setDark(settings.dark !== false);
    const stored = load<Dua[]>('duas_custom_v1', []);
    setCustomDuas(stored);
  }, []);

  const allDuas = useMemo(() => [...BASE_DUAS, ...customDuas], [customDuas]);
  const { history, trackedEntries } = useDhikrTracking(
    allDuas,
    user?.id ?? null,
  );

  return (
    <div
      className={`min-h-screen px-4 py-8 pb-24 ${dark ? 'bg-[#0c1a2e] text-stone-200' : 'bg-stone-50 text-stone-800'}`}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-amber-500/70">
            History
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Dhikr history</h1>
          <p
            className={`mt-2 text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}
          >
            Your recorded daily dhikr counts from the main screen.
          </p>
        </div>

        {trackedEntries.length === 0 ? (
          <div
            className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/3' : 'border-black/6 bg-white'}`}
          >
            <p
              className={`text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}
            >
              No dhikr counters are available yet.
            </p>
          </div>
        ) : history.length === 0 ? (
          <div
            className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/3' : 'border-black/6 bg-white'}`}
          >
            <p
              className={`text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}
            >
              Your dhikr history will appear here after you start counting.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((snapshot) => (
              <div
                key={snapshot.date}
                className={`rounded-2xl border p-4 ${dark ? 'border-white/8 bg-white/3' : 'border-black/6 bg-white'}`}
              >
                <div
                  className={`mb-2 text-[11px] uppercase tracking-[0.22em] ${dark ? 'text-stone-500' : 'text-stone-400'}`}
                >
                  {snapshot.date}
                </div>
                <div className="flex flex-wrap gap-2">
                  {snapshot.entries.map((entry) => (
                    <span
                      key={`${snapshot.date}-${entry.id}`}
                      className={`rounded-full px-3 py-1 text-[11px] ${dark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {entry.label}: {entry.count}/{entry.target}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
