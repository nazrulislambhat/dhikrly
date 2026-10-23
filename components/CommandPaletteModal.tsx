'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarCheck,
  CircleDot,
  Clock3,
  Coffee,
  Compass,
  Headphones,
  HeartHandshake,
  Landmark,
  Layers,
  LineChart,
  MoonStar,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  ArrowRight,
  Command,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Pillars' | 'Companions' | 'Heart' | 'Seasons' | 'Account';
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  // 4 Main Pillars
  {
    id: 'adhkar',
    title: 'Daily Adhkār & Du‘ās',
    subtitle: 'Morning, evening and post-prayer remembrances',
    category: 'Pillars',
    href: '/',
    Icon: Sparkles,
    keywords: ['morning', 'evening', 'azkar', 'fortress', 'hisn', 'dua', 'supplication'],
  },
  {
    id: 'salah',
    title: 'Ṣalāh Prayer Times & Tracker',
    subtitle: 'Accurate times, azan alerts, sunnah & local masjids',
    category: 'Pillars',
    href: '/salah',
    Icon: Clock3,
    keywords: ['namaz', 'prayer', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'azan', 'iqamah'],
  },
  {
    id: 'quran',
    title: 'Noble Qur’an (Mushaf & Audio)',
    subtitle: 'Read, listen with reciters, word-by-word and khatmah tracker',
    category: 'Pillars',
    href: '/quran',
    Icon: BookOpen,
    keywords: ['surah', 'ayah', 'recitation', 'mushaf', 'khatam', 'fatiha', 'kahf', 'yasin'],
  },
  {
    id: 'tasbeeh',
    title: 'Digital Tasbīḥ Counter',
    subtitle: 'Tactile counter, subhanallah, alhamdulillah, 100 post-salah',
    category: 'Pillars',
    href: '/tasbeeh',
    Icon: CircleDot,
    keywords: ['subhah', 'misbaha', 'dhikr', 'counter', 'subhanallah', 'salawat', 'astaghfirullah'],
  },

  // Deen Companions
  {
    id: 'qibla',
    title: 'Qibla Compass',
    subtitle: 'Accurate Ka’bah direction from anywhere in the world',
    category: 'Companions',
    href: '/qibla',
    Icon: Compass,
    keywords: ['direction', 'makkah', 'mecca', 'kaaba', 'compass'],
  },
  {
    id: 'masjids',
    title: 'Masjid Finder',
    subtitle: 'Find verified nearby mosques & prayer congregations',
    category: 'Companions',
    href: '/masjids',
    Icon: Landmark,
    keywords: ['mosque', 'masjid', 'jamaat', 'nearby', 'maps'],
  },
  {
    id: 'halal',
    title: 'Halal Food & E-Number Scanner',
    subtitle: 'Instant barcode lookup & additive permissibility',
    category: 'Companions',
    href: '/halal',
    Icon: ShieldCheck,
    keywords: ['food', 'scanner', 'barcode', 'e-numbers', 'ingredients', 'haram'],
  },
  {
    id: 'qada',
    title: 'Qadā Prayer Tracker',
    subtitle: 'Calculate & systematically repay missed prayers',
    category: 'Companions',
    href: '/qada',
    Icon: CalendarCheck,
    keywords: ['missed', 'repay', 'qadaa', 'salah history'],
  },

  // Heart & Tadabbur
  {
    id: 'names',
    title: '99 Names of Allāh (Asmā’ al-Ḥusnā)',
    subtitle: 'Arabic calligraphy, audio pronunciation & memorization tracker',
    category: 'Heart',
    href: '/names',
    Icon: Sparkles,
    keywords: ['asma', 'husna', 'attributes', 'god', 'names', 'audio'],
  },
  {
    id: 'tadabbur',
    title: 'Situational Du‘ā & Tadabbur',
    subtitle: 'Du‘ās for anxiety, grief, gratitude, travel, illness & exams',
    category: 'Heart',
    href: '/tadabbur',
    Icon: BookOpen,
    keywords: ['emotions', 'anxiety', 'sadness', 'depression', 'stress', 'healing', 'ruqyah'],
  },
  {
    id: 'sunnah',
    title: 'Daily Prophetic Sunnah',
    subtitle: 'Revive daily traditions of Prophet Muhammad ﷺ',
    category: 'Heart',
    href: '/sunnah',
    Icon: HeartHandshake,
    keywords: ['hadith', 'prophet', 'lifestyle', 'habits', 'sunan'],
  },
  {
    id: 'books',
    title: 'Sunni Fiqh Library & Books',
    subtitle: 'Recommended books across the 4 Madhhabs & where to buy',
    category: 'Heart',
    href: '/books',
    Icon: BookOpen,
    keywords: ['books', 'fiqh', 'hanafi', 'shafii', 'maliki', 'hanbali', 'madhhab', 'jurisprudence', 'library', 'buy'],
  },

  // Seasons & Obligation
  {
    id: 'ramadan',
    title: 'Ramaḍān Hub & Fasting Tracker',
    subtitle: 'Suhoor/Iftar countdowns, Tarawih & Khatmah progress',
    category: 'Seasons',
    href: '/ramadan',
    Icon: MoonStar,
    keywords: ['fasting', 'sawm', 'iftar', 'suhoor', 'tarawih', 'laylatul qadr'],
  },
  {
    id: 'zakat',
    title: 'Zakāt & Nisāb Calculator',
    subtitle: 'Real-time gold & silver rates with multi-asset wealth assessment',
    category: 'Seasons',
    href: '/zakat',
    Icon: Scale,
    keywords: ['charity', 'nisab', 'gold', 'silver', 'wealth', 'tax', 'sadaqah'],
  },
  {
    id: 'umrah',
    title: 'Ḥajj & ‘Umrah Companion',
    subtitle: 'Live Ṭawāf & Sa‘ī round counters with authentic Talbiyah player',
    category: 'Seasons',
    href: '/umrah',
    Icon: Compass,
    keywords: ['pilgrimage', 'tawaf', 'sai', 'safaa', 'marwah', 'talbiyah', 'ihram'],
  },
  {
    id: 'ambient',
    title: 'Ambient Focus & Dhikr Breath',
    subtitle: 'Sacred rain, Makkah ambience & mindful dhikr pacing',
    category: 'Heart',
    href: '/ambient',
    Icon: Headphones,
    keywords: ['sounds', 'meditation', 'breathing', 'relax', 'audio', 'soundscape'],
  },
  {
    id: 'insights',
    title: 'Spiritual Insights & Consistency',
    subtitle: 'Long-term prayer trends, streak heatmaps & spiritual balance',
    category: 'Account',
    href: '/insights',
    Icon: LineChart,
    keywords: ['stats', 'analytics', 'charts', 'consistency', 'habits'],
  },
  {
    id: 'settings',
    title: 'Settings & Cloud Sync',
    subtitle: 'Calculation methods, notification sounds & account management',
    category: 'Account',
    href: '/settings',
    Icon: UserRound,
    keywords: ['profile', 'login', 'sync', 'notifications', 'athan', 'method'],
  },
];

interface CommandPaletteModalProps {
  dark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPaletteModal({
  dark,
  isOpen,
  onClose,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return COMMAND_ITEMS;
    const q = query.toLowerCase().trim();
    return COMMAND_ITEMS.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.subtitle.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query]);

  // Handle keyboard arrow navigation & enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, router, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-16 sm:p-6 sm:pt-24 bg-black/60 backdrop-blur-md transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Quick Command Search"
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/60 dark:border-white/12 bg-white/92 dark:bg-[#1c1c1e]/92 text-ink shadow-2xl transition-all backdrop-blur-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_24px_64px_rgba(0,0,0,0.3)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_30px_70px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar (Apple Spotlight style) */}
        <div className="flex items-center gap-3 border-b border-[var(--app-border)] px-4 py-4 sm:px-5">
          <Search className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, prayers, surahs, books or guides..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold outline-none placeholder:text-muted tracking-tight"
            aria-label="Search Dhikrly command palette"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="ios-press grid h-6 w-6 place-items-center rounded-full bg-black/5 dark:bg-white/10 text-muted hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-black/[0.03] dark:bg-white/[0.06] px-2.5 py-0.5 text-[9px] font-bold text-muted">
            esc
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-muted" />
              <p className="mt-2 text-sm font-bold">No matching spiritual tools found</p>
              <p className="mt-1 text-xs text-muted">
                Try searching for &quot;Morning adhkar&quot;, &quot;Qur&apos;an&quot;, &quot;Salah&quot;, or &quot;Qibla&quot;
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`ios-spring flex w-full items-center gap-3.5 rounded-2xl p-3 text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-light text-primary font-semibold shadow-xs'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-ink'
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform ${
                      isSelected
                        ? 'bg-primary text-white scale-105 shadow-xs font-bold'
                        : 'bg-primary-light text-primary'
                    }`}
                  >
                    <item.Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate leading-tight tracking-tight">{item.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          dark ? 'bg-white/10 text-muted' : 'bg-black/5 text-muted'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'translate-x-0.5 text-primary'
                        : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-[var(--app-border)] px-4 py-2.5 text-[11px] text-muted">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <span className="rounded-md border border-[var(--app-border)] px-1.5 font-mono text-[10px]">↑</span>
            <span className="rounded-md border border-[var(--app-border)] px-1.5 font-mono text-[10px]">↓</span>
            <span>Select</span>
            <span className="rounded-md border border-[var(--app-border)] px-1.5 font-mono text-[10px]">↵</span>
          </div>
          <span className="font-semibold tracking-tight">Dhikrly Spotlight</span>
        </div>
      </div>
    </div>
  );
}
