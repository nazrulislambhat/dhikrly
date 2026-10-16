'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  Heart,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { load, save } from '@/lib/storage';

export interface DailyTodoItem {
  id: string;
  title: string;
  category: 'salah' | 'adhkar' | 'quran' | 'salawat' | 'charity' | 'custom';
  completed: boolean;
  isCustom?: boolean;
  linkHref?: string;
}

export interface DailyTodoState {
  date: string;
  items: DailyTodoItem[];
}

export const DAILY_TODOS_STORAGE_KEY = 'dhikrly_daily_todos_v1';

const DEFAULT_ITEMS: DailyTodoItem[] = [
  {
    id: 'salah_5',
    title: 'Pray 5 daily prayers on time',
    category: 'salah',
    completed: false,
    linkHref: '/salah',
  },
  {
    id: 'adhkar_morning',
    title: 'Morning Adhkār (Ḥiṣn al-Muslim)',
    category: 'adhkar',
    completed: false,
    linkHref: '/adhkar',
  },
  {
    id: 'adhkar_evening',
    title: 'Evening Adhkār (Ḥiṣn al-Muslim)',
    category: 'adhkar',
    completed: false,
    linkHref: '/adhkar',
  },
  {
    id: 'quran_daily',
    title: 'Read daily Qur’ān (1 Ruku / 20 Ayahs)',
    category: 'quran',
    completed: false,
    linkHref: '/quran',
  },
  {
    id: 'salawat_daily',
    title: 'Send 100 Salawāt upon the Prophet ﷺ',
    category: 'salawat',
    completed: false,
    linkHref: '/tasbeeh',
  },
  {
    id: 'sadaqah_daily',
    title: 'Give Sadaqah or share kindness',
    category: 'charity',
    completed: false,
  },
];

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyTodoWidget() {
  const { user } = useAuth();
  const today = useMemo(() => getTodayString(), []);

  const [todoState, setTodoState] = useState<DailyTodoState>(() => {
    const raw = load<DailyTodoState | null>(DAILY_TODOS_STORAGE_KEY, null);
    if (!raw) {
      return { date: today, items: DEFAULT_ITEMS };
    }
    // If stored date is from a previous day, reset completion status while keeping custom tasks
    if (raw.date !== today) {
      return {
        date: today,
        items: raw.items.map((it) => ({ ...it, completed: false })),
      };
    }
    return raw;
  });

  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Push updates to cloud user_metadata asynchronously when signed in
  const syncToCloud = useCallback(
    async (stateToSync: DailyTodoState) => {
      save(DAILY_TODOS_STORAGE_KEY, stateToSync);
      if (!user) return;

      try {
        setSyncStatus('saving');
        await supabase.auth.updateUser({
          data: {
            daily_todos: stateToSync,
            daily_todos_updated_at: new Date().toISOString(),
          },
        });
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Could not sync daily todos to account:', err);
        setSyncStatus('offline');
      }
    },
    [user],
  );

  // Sync on initial sign-in / user change
  useEffect(() => {
    if (!user?.user_metadata?.daily_todos) return;
    const remote = user.user_metadata.daily_todos as DailyTodoState;

    if (remote && Array.isArray(remote.items)) {
      setTodoState((prev) => {
        // If remote is today, merge completions and custom items
        if (remote.date === today) {
          const itemMap = new Map<string, DailyTodoItem>();
          for (const it of prev.items) itemMap.set(it.id, it);
          for (const rIt of remote.items) {
            const local = itemMap.get(rIt.id);
            if (local) {
              itemMap.set(rIt.id, {
                ...local,
                completed: local.completed || rIt.completed,
              });
            } else {
              itemMap.set(rIt.id, rIt);
            }
          }
          const mergedState: DailyTodoState = {
            date: today,
            items: Array.from(itemMap.values()),
          };
          save(DAILY_TODOS_STORAGE_KEY, mergedState);
          return mergedState;
        }
        return prev;
      });
    }
  }, [user, today]);

  const toggleItem = (id: string) => {
    setTodoState((prev) => {
      const updatedItems = prev.items.map((it) =>
        it.id === id ? { ...it, completed: !it.completed } : it,
      );
      const nextState = { ...prev, items: updatedItems };
      void syncToCloud(nextState);
      return nextState;
    });
  };

  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCustomTitle.trim();
    if (!clean) return;

    const newItem: DailyTodoItem = {
      id: `custom_${Date.now()}`,
      title: clean,
      category: 'custom',
      completed: false,
      isCustom: true,
    };

    setTodoState((prev) => {
      const nextState = { ...prev, items: [...prev.items, newItem] };
      void syncToCloud(nextState);
      return nextState;
    });

    setNewCustomTitle('');
    setShowAddInput(false);
  };

  const deleteCustomItem = (id: string) => {
    setTodoState((prev) => {
      const nextState = {
        ...prev,
        items: prev.items.filter((it) => it.id !== id),
      };
      void syncToCloud(nextState);
      return nextState;
    });
  };

  const resetAllToday = () => {
    if (!window.confirm('Reset all daily tasks for today?')) return;
    setTodoState((prev) => {
      const nextState = {
        ...prev,
        items: prev.items.map((it) => ({ ...it, completed: false })),
      };
      void syncToCloud(nextState);
      return nextState;
    });
  };

  const completedCount = todoState.items.filter((it) => it.completed).length;
  const totalCount = todoState.items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-sm transition-all dark:bg-[#14211e]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--app-line)]">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
            <CalendarCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--app-ink)]">
              Daily Spiritual Checklist
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--app-muted)]">
              <span suppressHydrationWarning>{user ? 'Synced with Account' : 'Saved Locally'}</span>
              <span>·</span>
              <span suppressHydrationWarning>{today}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetAllToday}
          title="Reset today's checks"
          className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--app-line)] text-[var(--app-muted)] hover:text-[var(--app-ink)] transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="my-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[11px] text-[var(--app-muted)]">
            Today&apos;s Progress
          </span>
          <span suppressHydrationWarning className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
            {completedCount} / {totalCount} ({progressPct}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10 p-0.5">
          <div
            suppressHydrationWarning
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              allCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                : 'bg-emerald-600 dark:bg-emerald-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* All Done Celebration Badge */}
      {allCompleted && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-xs font-bold text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Māshā’Allāh! All daily spiritual goals completed today.</span>
        </div>
      )}

      {/* Checklist Items */}
      <ul className="space-y-1 text-xs">
        {todoState.items.map((item) => {
          return (
            <li
              key={item.id}
              className={`group flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
                item.completed
                  ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-medium'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-[var(--app-ink)]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-2.5 flex-1 text-left min-w-0"
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-md border transition-all ${
                    item.completed
                      ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950'
                      : 'border-stone-400/60 dark:border-stone-500/60'
                  }`}
                >
                  {item.completed && <Check className="h-3 w-3 stroke-[3]" />}
                </span>
                <span
                  className={`truncate leading-snug ${
                    item.completed
                      ? 'line-through text-stone-500 dark:text-stone-400'
                      : 'text-[var(--app-ink)]'
                  }`}
                >
                  {item.title}
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.linkHref && !item.completed && (
                  <Link
                    href={item.linkHref}
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold opacity-75 hover:opacity-100 hover:underline"
                  >
                    Go &rarr;
                  </Link>
                )}

                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomItem(item.id)}
                    aria-label="Delete custom task"
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add Custom Task Form / Button */}
      <div className="mt-3 pt-2.5 border-t border-[var(--app-line)]">
        {showAddInput ? (
          <form onSubmit={addCustomItem} className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newCustomTitle}
              onChange={(e) => setNewCustomTitle(e.target.value)}
              placeholder="e.g. 2 Rakahs Tahajjud, Surah Al-Mulk"
              className="flex-1 rounded-xl border border-[var(--app-line)] bg-transparent px-3 py-1.5 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddInput(false);
                setNewCustomTitle('');
              }}
              className="px-2 py-1.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="flex items-center gap-1.5 w-full justify-center rounded-xl py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Daily Goal</span>
          </button>
        )}
      </div>
    </div>
  );
}
