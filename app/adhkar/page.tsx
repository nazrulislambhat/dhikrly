'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Moon,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import {
  ADHKAR_CATEGORIES,
  ALL_ADHKAR,
  type AdhkarCategoryKey,
  type AdhkarItem,
} from '@/lib/adhkarData';
import { playCheck, playComplete } from '@/lib/sounds';

const ICON_MAP = {
  Sunrise,
  Sunset,
  Clock3,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  BookOpen,
};

const COMPLETED_ADHKAR_STORAGE_KEY = 'dhikrly_adhkar_completed_v1';

export default function AdhkarPage() {
  const [dark, setDark] = useState<boolean>(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );

  const [activeCategory, setActiveCategory] = useState<AdhkarCategoryKey>('morning');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-item counts for session: { [id]: count }
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // Display preferences
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = window.localStorage.getItem(`${COMPLETED_ADHKAR_STORAGE_KEY}_${today}`);
      if (raw) setItemCounts(JSON.parse(raw));
    } catch {
      // Ignore
    }
  }, [dark]);

  const saveCounts = (updated: Record<string, number>) => {
    setItemCounts(updated);
    try {
      const today = new Date().toISOString().slice(0, 10);
      window.localStorage.setItem(`${COMPLETED_ADHKAR_STORAGE_KEY}_${today}`, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleIncrement = (item: AdhkarItem) => {
    const current = itemCounts[item.id] ?? 0;
    if (current >= item.targetCount) {
      // Reset this item
      const next = { ...itemCounts, [item.id]: 0 };
      saveCounts(next);
      return;
    }

    const nextCount = current + 1;
    const next = { ...itemCounts, [item.id]: nextCount };
    saveCounts(next);

    if (nextCount >= item.targetCount) {
      playComplete();
    } else {
      playCheck();
    }
  };

  const handleResetCategory = () => {
    const categoryItemIds = ALL_ADHKAR.filter((i) => i.category === activeCategory).map((i) => i.id);
    const updated = { ...itemCounts };
    categoryItemIds.forEach((id) => {
      delete updated[id];
    });
    saveCounts(updated);
  };

  const handleCopyText = (item: AdhkarItem) => {
    const text = `${item.titleAr}\n${item.ar}\n\n${item.transliteration}\n\n${item.en}\n\nSource: ${item.source}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered adhkar items
  const filteredItems = useMemo(() => {
    return ALL_ADHKAR.filter((item) => {
      if (item.category !== activeCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.en.toLowerCase().includes(q) ||
        item.transliteration.toLowerCase().includes(q) ||
        item.ar.includes(searchQuery)
      );
    });
  }, [activeCategory, searchQuery]);

  // Category completion progress
  const categoryTotal = ALL_ADHKAR.filter((i) => i.category === activeCategory).length;
  const categoryCompleted = ALL_ADHKAR.filter(
    (i) => i.category === activeCategory && (itemCounts[i.id] ?? 0) >= i.targetCount,
  ).length;
  const progressPct = categoryTotal ? Math.round((categoryCompleted / categoryTotal) * 100) : 0;

  const currentMeta = ADHKAR_CATEGORIES.find((c) => c.key === activeCategory);

  const cardClass = `rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-sm`;
  const muted = dark ? 'text-stone-400' : 'text-stone-500';

  return (
    <AppShell active="adhkar" dark={dark} onToggleDark={() => setDark((v) => !v)}>
      <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-6 sm:py-8 lg:px-4">
        {/* Header */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>FORTRESS OF THE MUSLIM · حِصْنُ الْمُسْلِمِ</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--app-ink)]">
              Authentic Adhkār Library
            </h1>
            <p className="mt-1 text-sm text-[var(--app-muted)] max-w-xl">
              Authentic prophetic remembrance with complete vocalization, transliteration, English meanings, virtures, and interactive session repetition counters.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] px-4 py-2.5 text-xs font-bold text-[var(--app-ink)] shadow-xs hover:bg-emerald-500/10 transition-colors"
            >
              <Settings2 className="h-4 w-4" />
              <span>Reading Preferences</span>
            </button>
          </div>
        </header>

        {/* Preferences Drawer Panel */}
        {showPreferences && (
          <div className={`${cardClass} mb-6 p-5 transition-all`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[var(--app-ink)]">Arabic Font Size:</span>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {(['normal', 'large', 'xlarge'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFontSize(s)}
                      className={`rounded-xl px-3 py-1 text-xs font-bold capitalize transition-all ${
                        fontSize === s
                          ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                          : 'border border-[var(--app-line)] text-[var(--app-muted)]'
                      }`}
                    >
                      {s === 'xlarge' ? 'Extra Large' : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--app-ink)]">
                  <input
                    type="checkbox"
                    checked={showTransliteration}
                    onChange={(e) => setShowTransliteration(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600 rounded"
                  />
                  <span>Show Transliteration</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--app-ink)]">
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={(e) => setShowTranslation(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600 rounded"
                  />
                  <span>Show Translation</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs Row */}
        <section className="mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-max">
            {ADHKAR_CATEGORIES.map((cat) => {
              const CatIcon = ICON_MAP[cat.iconName as keyof typeof ICON_MAP] || Sparkles;
              const isSelected = activeCategory === cat.key;
              const count = ALL_ADHKAR.filter((i) => i.category === cat.key).length;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-800 text-white shadow-xs dark:bg-emerald-400 dark:text-emerald-950'
                      : 'border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
                  }`}
                >
                  <CatIcon className="h-4 w-4" />
                  <span>{cat.label}</span>
                  <span className="opacity-70 text-[11px] font-medium">({count})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Category Progress & Search Bar */}
        <section className={`${cardClass} mb-8 p-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[var(--app-ink)]">
                  {currentMeta?.label}
                </h2>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-arabic" dir="rtl" lang="ar">
                  {currentMeta?.labelAr}
                </span>
              </div>
              <p className="text-xs text-[var(--app-muted)] mt-0.5">
                {currentMeta?.description}
              </p>
            </div>

            {/* Progress status */}
            <div className="flex items-center gap-4 self-start md:self-auto">
              <div className="text-right">
                <span className="text-xs font-bold text-[var(--app-ink)]">
                  {categoryCompleted} of {categoryTotal} completed
                </span>
                <span className="block text-[11px] text-[var(--app-muted)]">{progressPct}% of session</span>
              </div>
              <button
                type="button"
                onClick={handleResetCategory}
                className="p-2 rounded-xl border border-[var(--app-line)] text-stone-500 hover:text-stone-900 transition-colors"
                title="Reset session counter for this category"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Search input */}
          <div className="mt-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, transliteration, or translation…"
              className="w-full rounded-2xl border border-[var(--app-line)] bg-black/5 dark:bg-white/5 pl-10 pr-4 py-2.5 text-xs text-[var(--app-ink)] outline-none focus:border-emerald-500"
            />
          </div>
        </section>

        {/* Adhkar Cards List */}
        <section className="space-y-4 mb-8">
          {filteredItems.map((item) => {
            const currentCount = itemCounts[item.id] ?? 0;
            const isCompleted = currentCount >= item.targetCount;
            const isCopied = copiedId === item.id;

            const arabicSizeClass =
              fontSize === 'xlarge'
                ? 'text-2xl sm:text-3xl leading-loose'
                : fontSize === 'large'
                ? 'text-xl sm:text-2xl leading-relaxed'
                : 'text-lg sm:text-xl leading-normal';

            return (
              <div
                key={item.id}
                className={`${cardClass} p-6 transition-all ${
                  isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' : ''
                }`}
              >
                {/* Card Header: Title & Action Buttons */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--app-ink)]">{item.title}</h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold font-arabic mt-0.5" dir="rtl" lang="ar">
                      {item.titleAr}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyText(item)}
                      className="p-1.5 rounded-xl border border-[var(--app-line)] text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      title="Copy text"
                      aria-label="Copy text"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Arabic Vocalized Text */}
                <div className="my-5 rounded-2xl bg-black/5 dark:bg-white/5 p-5 text-right">
                  <p
                    className={`font-arabic text-[var(--app-ink)] font-bold select-text ${arabicSizeClass}`}
                    dir="rtl"
                    lang="ar"
                  >
                    {item.ar}
                  </p>
                </div>

                {/* Transliteration */}
                {showTransliteration && (
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 italic mb-3 leading-relaxed">
                    {item.transliteration}
                  </p>
                )}

                {/* English Meaning */}
                {showTranslation && (
                  <p className="text-xs text-[var(--app-ink)] leading-relaxed mb-4">
                    “{item.en}”
                  </p>
                )}

                {/* Virtue & Hadith Reference */}
                <div className="rounded-2xl border border-[var(--app-line)] bg-emerald-500/5 p-3.5 text-xs text-[var(--app-muted)] leading-relaxed mb-4">
                  <strong className="text-emerald-900 dark:text-emerald-200 block mb-0.5 font-bold">
                    Virtue & Benefit:
                  </strong>
                  <span>{item.virtue}</span>
                  <span className="block mt-1 font-medium text-[11px] opacity-80">— {item.source}</span>
                </div>

                {/* Card Footer: Interactive Tap Counter */}
                <div className="pt-4 border-t border-[var(--app-line)] flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--app-muted)]">
                    Target: {item.countLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleIncrement(item)}
                    className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all active:scale-95 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950'
                        : 'border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed ({item.targetCount}×)</span>
                      </>
                    ) : (
                      <>
                        <span>Count: {currentCount} / {item.targetCount}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
