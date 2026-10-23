'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  GraduationCap,
  Info,
  Layers,
  Library,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Store,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import {
  SUNNI_FIQH_BOOKS,
  type FiqhBook,
  type MadhhabKey,
  type StudyLevel,
} from '@/data/fiqhBooksData';
import { load, save, SETTINGS_KEY } from '@/lib/storage';

const SAVED_BOOKS_STORAGE_KEY = 'dhikrly_bookmarked_books_v1';

const MADHHAB_TABS: { key: MadhhabKey; label: string; sub: string }[] = [
  { key: 'all', label: 'All Traditions', sub: 'The 4 Madhhabs & Usūl' },
  { key: 'hanafi', label: 'Ḥanafī Fiqh', sub: 'Imām Abū Ḥanīfah' },
  { key: 'shafii', label: 'Shāfi‘ī Fiqh', sub: 'Imām ash-Shāfi‘ī' },
  { key: 'maliki', label: 'Mālikī Fiqh', sub: 'Imām Mālik' },
  { key: 'hanbali', label: 'Ḥanbalī Fiqh', sub: 'Imām Aḥmad' },
  { key: 'comparative', label: 'Usūl & Comparative', sub: 'Legal Methodology' },
];

const LEVEL_TABS: { key: StudyLevel; label: string }[] = [
  { key: 'all', label: 'All Levels' },
  { key: 'beginner', label: 'Beginner / Essentials' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced Reference' },
];

const RECOMMENDED_BOOKSTORES = [
  {
    name: 'Mecca Books',
    description: 'Premier Islamic bookstore specializing in traditional Sunni classical translations and bilingual manuals.',
    url: 'https://www.meccabooks.com',
    location: 'USA / Worldwide Shipping',
  },
  {
    name: 'White Thread Press',
    description: 'Acclaimed publisher of exquisite, scholarly English translations of classical Ḥanafī jurisprudence and spirituality.',
    url: 'https://www.whitethreadpress.com',
    location: 'UK & USA',
  },
  {
    name: 'Diwan Press',
    description: 'Leading traditional publisher dedicated to the school of Madīnah, Mālikī jurisprudence, and classical texts.',
    url: 'https://diwanpress.com',
    location: 'UK / Europe',
  },
  {
    name: 'Amana Publications',
    description: 'Renowned publisher of monumental works including Reliance of the Traveller and English Qur’an commentaries.',
    url: 'https://amana-publications.com',
    location: 'USA / Worldwide',
  },
  {
    name: 'Darussalam Books',
    description: 'One of the world’s largest publishers of authentic Islamic literature and simplified fiqh compendiums.',
    url: 'https://darussalam.com',
    location: 'Global Branches',
  },
];

export default function FiqhBooksPage() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState<boolean>(false);

  const [selectedMadhhab, setSelectedMadhhab] = useState<MadhhabKey>('all');
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);

  const [expandedRoadmap, setExpandedRoadmap] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize from storage on client mount
  useEffect(() => {
    setMounted(true);
    const settings = load<{ dark: boolean }>(SETTINGS_KEY, { dark: false });
    setDark(settings.dark);

    const saved = load<string[]>(SAVED_BOOKS_STORAGE_KEY, []);
    setSavedBookIds(Array.isArray(saved) ? saved : []);
  }, []);

  const toggleSaveBook = (bookId: string) => {
    setSavedBookIds((prev) => {
      const exists = prev.includes(bookId);
      const updated = exists ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      save(SAVED_BOOKS_STORAGE_KEY, updated);
      return updated;
    });
  };

  const handleCopyBook = (book: FiqhBook) => {
    const text = `${book.titleEnglish} (${book.titleArabic})\nBy: ${book.author}\nMadhhab: ${book.madhhab} | Level: ${book.level}\n${book.description}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(book.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return SUNNI_FIQH_BOOKS.filter((book) => {
      // Madhhab filter
      if (selectedMadhhab !== 'all' && book.madhhabKey !== selectedMadhhab) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'all' && book.levelKey !== selectedLevel) {
        return false;
      }
      // Saved filter
      if (savedOnly && !savedBookIds.includes(book.id)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle =
          book.titleEnglish.toLowerCase().includes(query) ||
          book.titleArabic.toLowerCase().includes(query);
        const matchesAuthor = book.author.toLowerCase().includes(query);
        const matchesTopics = book.topics.some((t) => t.toLowerCase().includes(query));
        const matchesDesc = book.description.toLowerCase().includes(query);
        const matchesTranslation = book.englishTranslation?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAuthor && !matchesTopics && !matchesDesc && !matchesTranslation) {
          return false;
        }
      }
      return true;
    });
  }, [selectedMadhhab, selectedLevel, savedOnly, savedBookIds, searchQuery]);

  const cardClass = 'rounded-3xl border border-border bg-surface p-5 sm:p-7 shadow-xs';

  return (
    <div className="min-h-dvh text-ink">
      <AppShell active="books" dark={dark} onToggleDark={() => setDark((v) => !v)}>
        <div className="mx-auto w-[min(calc(100%-2rem),76rem)] px-2 py-6 sm:py-8 lg:px-4 space-y-6">
          {/* Header & Hadith Showcase */}
          <header className={`${cardClass} overflow-hidden relative`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <Library className="h-3.5 w-3.5" />
                  <span>TAFAQQUH FID-DĪN · 4 SUNNI MADHHABS</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
                  Sunni Fiqh Library & Books
                </h1>

                <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
                  Curated classical and contemporary Islamic jurisprudence manuals across the Ḥanafī,
                  Shāfi‘ī, Mālikī, and Ḥanbalī schools of thought. Includes verified English
                  translations, pedagogical study levels, and trusted bookstores.
                </p>

                {/* Hadith Quote Banner */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mt-2">
                  <p className="font-arabic text-primary text-base sm:text-lg text-right leading-loose">
                    «مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ»
                  </p>
                  <p className="text-xs text-ink/80 mt-1 italic font-medium">
                    “Whomsoever Allāh intends good for, He grants him deep comprehension of the Deen.”
                  </p>
                  <span className="text-[10px] text-primary/80 font-bold block mt-0.5">
                    — Ṣaḥīḥ al-Bukhārī (71) & Ṣaḥīḥ Muslim (1037)
                  </span>
                </div>
              </div>

              {/* Quick Actions / Reading List Counter */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSavedOnly((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    savedOnly
                      ? 'bg-primary text-primary-fg shadow-xs ring-2 ring-primary/40'
                      : 'border border-border bg-canvas text-ink hover:border-primary/40'
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>
                    {savedOnly ? 'Show All Books' : `My Saved Books (${savedBookIds.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedRoadmap((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-canvas px-4 py-2.5 text-xs font-semibold text-ink hover:text-primary transition-all cursor-pointer"
                >
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>How to Study Sunni Fiqh</span>
                  {expandedRoadmap ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Expandable How to Study Sunni Fiqh Roadmap */}
            {expandedRoadmap && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>The Traditional Four-Stage Sunni Curriculum Roadmap</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border bg-canvas p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary block">Stage 1: Farḍ ‘Ayn</span>
                    <strong className="text-xs font-bold text-ink block">Personal Essentials</strong>
                    <p className="text-[11px] text-ink/75 leading-relaxed">
                      Begin with a basic worship primer in your chosen Madhhab (e.g. <em>Nūr al-Īḍāḥ</em>, <em>Safīnat an-Najāh</em>, or <em>Ibn ‘Āshir</em>) covering valid purification, prayer, and fasting.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary block">Stage 2: Comprehensive Matn</span>
                    <strong className="text-xs font-bold text-ink block">Full School Survey</strong>
                    <p className="text-[11px] text-ink/75 leading-relaxed">
                      Study an intermediate classical compendium (e.g. <em>Al-Qudūrī</em>, <em>Abū Shujā‘</em>, <em>Al-Risālah</em>, or <em>Zād al-Mustaqni‘</em>) introducing financial, marital, and judicial law.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary block">Stage 3: Legal Theory</span>
                    <strong className="text-xs font-bold text-ink block">Uṣūl al-Fiqh</strong>
                    <p className="text-[11px] text-ink/75 leading-relaxed">
                      Learn how the Imāms deduced rulings from the Qur’an and Sunnah with an entry tract like <em>Al-Waraqāt</em>, grasping consensus, analogy, and textual interpretation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-canvas p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary block">Stage 4: Comparative Fiqh</span>
                    <strong className="text-xs font-bold text-ink block">Adab al-Ikhtilāf</strong>
                    <p className="text-[11px] text-ink/75 leading-relaxed">
                      Examine comparative proofs (e.g. <em>Bidāyat al-Mujtahid</em> or <em>Al-Hidāyah</em>), appreciating why the great jurists differed and honoring their scholarly consensus.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* Search & Filter Controls */}
          <div className="space-y-3">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books by title, author, Arabic name, translation, or topics (e.g. 'Nur al-Idah', 'Quduri', 'prayer', 'finance')…"
                className="w-full min-h-12 rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/60 hover:text-ink cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Madhhab Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Filter by Madhhab">
              {MADHHAB_TABS.map((tab) => {
                const isSelected = selectedMadhhab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedMadhhab(tab.key)}
                    className={`flex flex-col items-start px-3.5 py-2 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-fg shadow-xs ring-1 ring-primary'
                        : 'border-border bg-surface text-ink hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-bold">{tab.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-primary-fg/80' : 'text-ink/60'}`}>
                      {tab.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="Filter by Level">
              <span className="text-xs font-bold text-ink/60 px-1 shrink-0 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span>Level:</span>
              </span>
              {LEVEL_TABS.map((lvl) => {
                const isSelected = selectedLevel === lvl.key;
                return (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'border border-border bg-canvas text-ink/80 hover:text-ink'
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Count & Active Filter Indicator */}
          <div className="flex items-center justify-between text-xs text-ink/75 px-1">
            <span>
              Showing <strong>{filteredBooks.length}</strong> {filteredBooks.length === 1 ? 'book' : 'books'}
              {selectedMadhhab !== 'all' ? ` in ${MADHHAB_TABS.find((m) => m.key === selectedMadhhab)?.label}` : ''}
              {selectedLevel !== 'all' ? ` (${selectedLevel})` : ''}
              {savedOnly ? ' · Saved items only' : ''}
            </span>
            {(selectedMadhhab !== 'all' || selectedLevel !== 'all' || searchQuery || savedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMadhhab('all');
                  setSelectedLevel('all');
                  setSearchQuery('');
                  setSavedOnly(false);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Book Cards Grid */}
          {filteredBooks.length === 0 ? (
            <div className={`${cardClass} text-center py-12 space-y-3`}>
              <BookOpen className="h-10 w-10 text-primary mx-auto opacity-50" />
              <h3 className="text-base font-bold text-ink">No books matched your criteria</h3>
              <p className="text-xs text-ink/70 max-w-md mx-auto">
                Try selecting &ldquo;All Traditions&rdquo;, clearing your search query, or unchecking &ldquo;My Saved Books&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedMadhhab('all');
                  setSelectedLevel('all');
                  setSearchQuery('');
                  setSavedOnly(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all cursor-pointer"
              >
                Show All Books
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBooks.map((book) => {
                const isSaved = savedBookIds.includes(book.id);
                return (
                  <article
                    key={book.id}
                    className={`${cardClass} flex flex-col justify-between hover:border-primary/50 transition-all duration-200`}
                  >
                    <div className="space-y-4">
                      {/* Top Badges & Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                            {book.madhhab}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-ink/80">
                            {book.level}
                          </span>
                        </div>

                        {/* Save & Share */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleSaveBook(book.id)}
                            className={`grid h-8 w-8 place-items-center rounded-xl border transition-all cursor-pointer ${
                              isSaved
                                ? 'border-primary bg-primary text-primary-fg'
                                : 'border-border bg-canvas text-ink/70 hover:text-ink hover:border-primary/40'
                            }`}
                            title={isSaved ? 'Remove from reading list' : 'Save to my reading list'}
                          >
                            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyBook(book)}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-canvas text-ink/70 hover:text-ink hover:border-primary/40 transition-all cursor-pointer"
                            title="Copy book details to clipboard"
                          >
                            {copiedId === book.id ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Titles & Author */}
                      <div>
                        <p className="font-arabic text-primary text-lg sm:text-xl font-bold leading-relaxed text-right">
                          {book.titleArabic}
                        </p>
                        <h2 className="text-lg font-black text-ink mt-0.5">
                          {book.titleEnglish}
                        </h2>
                        <p className="text-xs text-ink/75 font-semibold mt-0.5">
                          Author: <strong className="text-ink">{book.author}</strong>{' '}
                          <span className="text-ink/60 font-normal">
                            (d. {book.deathYearAH} AH / {book.deathYearCE} CE)
                          </span>
                        </p>
                      </div>

                      {/* Topics Chips */}
                      <div className="flex flex-wrap gap-1">
                        {book.topics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-lg border border-border bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink/75"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-ink/80 leading-relaxed">
                        {book.description}
                      </p>

                      {/* Why Essential Callout */}
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          <span>Why This Book is Essential</span>
                        </span>
                        <p className="text-[11px] text-ink/90 leading-relaxed">
                          {book.whyEssential}
                        </p>
                      </div>

                      {/* Key Features Bullet points */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block">
                          Key Highlights
                        </span>
                        <ul className="space-y-1 text-[11px] text-ink/80 pl-1">
                          {book.keyFeatures.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-primary font-bold">·</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* English Translation Meta if available */}
                      {book.englishTranslation && (
                        <div className="text-[11px] text-ink/75 pt-1 border-t border-border">
                          <span className="font-semibold text-ink">English Edition:</span>{' '}
                          <span>{book.englishTranslation}</span>
                          {book.translator && (
                            <span className="block text-ink/60">{book.translator}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Where to Buy Links Section */}
                    <div className="pt-5 mt-4 border-t border-border space-y-2">
                      <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                        <span>Where to Buy Verified Copies</span>
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {book.buyLinks.map((buy, idx) => (
                          <a
                            key={idx}
                            href={buy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-canvas hover:border-primary/50 hover:bg-surface px-3 py-1.5 text-xs font-bold text-ink transition-all cursor-pointer shadow-2xs"
                          >
                            <span>{buy.storeName}</span>
                            {buy.format && (
                              <span className="text-[10px] font-normal text-ink/60">
                                ({buy.format})
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-primary" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Authentic Bookstores Directory Section */}
          <section className={cardClass} aria-labelledby="bookstores-heading">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <h2 id="bookstores-heading" className="text-base font-bold text-ink">
                  Trusted Islamic Bookstores & Publishers
                </h2>
                <p className="text-xs text-ink/75">
                  Verified traditional publishers producing high-quality printings, critical editions, and reliable translations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
              {RECOMMENDED_BOOKSTORES.map((store, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-canvas p-4 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink">{store.name}</h3>
                      <span className="text-[10px] text-primary font-semibold">{store.location}</span>
                    </div>
                    <p className="text-[11px] text-ink/75 leading-relaxed">
                      {store.description}
                    </p>
                  </div>
                  <a
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-link hover:text-link-hover pt-1 cursor-pointer"
                  >
                    <span>Visit {store.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Settings & Navigation Link */}
          <div className="rounded-3xl border border-border bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-ink block">
                Align Your Practice in Settings
              </strong>
              <span className="text-[11px] text-ink/75">
                Configure your Madhhab (Ḥanafī, Shāfi‘ī, Mālikī, Ḥanbalī) to calibrate ‘Asr prayer shadows and daily worship targets.
              </span>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:bg-primary-hover transition-all cursor-pointer shrink-0"
            >
              <span>Calibrate Madhhab in Settings</span>
              <Compass className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
