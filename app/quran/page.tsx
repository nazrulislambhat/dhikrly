'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BookOpenText,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  Pause,
  Play,
  Plus,
  Repeat2,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import QuranTrackerModal from '@/components/QuranTrackerModal';
import QuranWordModal from '@/components/QuranWordModal';
import QuranLoopModal from '@/components/QuranLoopModal';
import { AyahReaderSkeleton, MushafPageSkeleton } from '@/components/Skeleton';
import {
  updateMediaMetadata,
  setMediaPlaybackState,
  updateMediaPositionState,
  registerMediaActionHandlers,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
} from '@/lib/mediaSession';
import { fetchVerseWords, type QuranWord } from '@/lib/quranWbw';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import {
  DEFAULT_QURAN_SETTINGS,
  DEFAULT_QURAN_DAILY_GOAL,
  DEFAULT_RECITERS,
  QURAN_BOOKMARK_KEY,
  QURAN_BOOKMARKS_KEY,
  QURAN_CACHE_KEY,
  QURAN_DAILY_GOAL_KEY,
  QURAN_PROGRESS_KEY,
  QURAN_SETTINGS_KEY,
  type QuranBookmark,
  type QuranEdition,
  type QuranLocation,
  type QuranReadingProgress,
  type QuranSettings,
  type QuranSurah,
  type QuranVerse,
} from '@/lib/quran';

interface ChapterCache {
  surah: QuranSurah;
  translation: string;
  reciter: string;
  arabicScript?: 'indopak';
  verses: QuranVerse[];
}

interface QuranEditionSurah extends QuranSurah {
  edition: QuranEdition;
  ayahs: { number: number; numberInSurah: number; text: string; audio?: string; page: number }[];
}

interface QuranEditionPage {
  edition: QuranEdition;
  ayahs: {
    number: number;
    numberInSurah: number;
    text: string;
    audio?: string;
    page?: number;
    surah: QuranSurah;
  }[];
}

interface MushafPageCache {
  page: number;
  translation: string;
  reciter: string;
  verses: QuranVerse[];
}

interface QuranIndopakVerse {
  verse_key: string;
  text_indopak: string;
}

interface MushafPageResponse {
  editions: QuranEditionPage[];
  indopak: QuranIndopakVerse[];
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

async function fetchQuran<T>(query: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/quran?${query}`, { signal });
  const result = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const message =
      typeof result === 'object' && result && 'error' in result
        ? result.error
        : 'Could not load Quran data.';
    throw new Error(message);
  }
  return result as T;
}

function languageName(code: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code.toUpperCase();
  }
}

function labelForEdition(edition: QuranEdition) {
  return edition.englishName || edition.name || edition.identifier;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TOTAL_MUSHAF_PAGES = 604;

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

function getJuzForPage(page: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_START_PAGES[i]) return i + 1;
  }
  return 1;
}

export default function QuranPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [settings, setSettings] = useState<QuranSettings>(() => {
    const saved = load<Partial<QuranSettings>>(QURAN_SETTINGS_KEY, {});
    return {
      ...DEFAULT_QURAN_SETTINGS,
      ...saved,
      playbackRate:
        PLAYBACK_RATES.find((rate) => rate === saved.playbackRate) ??
        DEFAULT_QURAN_SETTINGS.playbackRate,
      viewMode: saved.viewMode === 'mushaf' ? 'mushaf' : 'reader',
    };
  });
  const [surahs, setSurahs] = useState<QuranSurah[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<QuranEdition[]>([]);
  const [reciters, setReciters] = useState<QuranEdition[]>(DEFAULT_RECITERS);
  const [translationsLanguage, setTranslationsLanguage] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [chapter, setChapter] = useState<ChapterCache | null>(() =>
    load<ChapterCache | null>(QURAN_CACHE_KEY, null),
  );
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(() => {
    const savedBookmarks = load<QuranBookmark[]>(QURAN_BOOKMARKS_KEY, []);
    if (savedBookmarks.length > 0) return savedBookmarks;
    const legacyBookmark = load<QuranBookmark | null>(QURAN_BOOKMARK_KEY, null);
    return legacyBookmark
      ? [{ ...legacyBookmark, createdAt: new Date().toISOString() }]
      : [];
  });
  const [progress, setProgress] = useState<QuranReadingProgress>(() =>
    load<QuranReadingProgress>(QURAN_PROGRESS_KEY, { lastRead: null, dailyVerses: {} }),
  );
  const [dailyGoal, setDailyGoal] = useState(() =>
    Math.min(
      500,
      Math.max(1, load<number>(QURAN_DAILY_GOAL_KEY, DEFAULT_QURAN_DAILY_GOAL)),
    ),
  );
  const [activeAudio, setActiveAudio] = useState('');
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [continuousSurah, setContinuousSurah] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState('');
  const [jumpToAyah, setJumpToAyah] = useState<QuranLocation | null>(null);
  const [mushafPageNumber, setMushafPageNumber] = useState(1);
  const [mushafPage, setMushafPage] = useState<MushafPageCache | null>(null);
  const [mushafPageLoading, setMushafPageLoading] = useState(false);
  const [mushafPageError, setMushafPageError] = useState('');
  const [pageFlipDirection, setPageFlipDirection] = useState<'next' | 'previous'>('next');
  const [pendingPagePlayback, setPendingPagePlayback] = useState(false);
  const pendingSurahJump = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsCloseButtonRef = useRef<HTMLButtonElement>(null);

  // Word-by-word state
  const [selectedWord, setSelectedWord] = useState<QuranWord | null>(null);
  const [wordModalLocation, setWordModalLocation] = useState<{ surah: number; ayah: number } | null>(null);
  const [wbwVerseCache, setWbwVerseCache] = useState<Record<string, QuranWord[]>>({});

  // Hifz (Memorization) Recite mode state
  const [hifzMode, setHifzMode] = useState(false);
  const [revealedVerses, setRevealedVerses] = useState<Record<string, boolean>>({});

  // Audio Repeat & Range Looping state
  const [repeatCountTarget, setRepeatCountTarget] = useState<number>(1);
  const [currentAyahRepeat, setCurrentAyahRepeat] = useState<number>(1);
  const [rangeLoopActive, setRangeLoopActive] = useState<boolean>(false);
  const [rangeStartAyah, setRangeStartAyah] = useState<number>(1);
  const [rangeEndAyah, setRangeEndAyah] = useState<number>(5);
  const [rangeLoopTarget, setRangeLoopTarget] = useState<number>(3);
  const [currentRangeLoop, setCurrentRangeLoop] = useState<number>(1);
  const [repeatModalOpen, setRepeatModalOpen] = useState<boolean>(false);

  const visibleChapter =
    chapter?.surah.number === settings.surah &&
    chapter.translation === settings.translation &&
    chapter.reciter === settings.reciter &&
    chapter.arabicScript === 'indopak'
      ? chapter
      : null;
  const currentJuz = useMemo(() => getJuzForPage(mushafPageNumber), [mushafPageNumber]);
  const playbackVerses = useMemo(() => {
    if (settings.viewMode !== 'mushaf') return visibleChapter?.verses ?? [];
    return mushafPage?.translation === settings.translation &&
      mushafPage.reciter === settings.reciter
      ? mushafPage.verses
      : [];
  }, [mushafPage, settings.reciter, settings.translation, settings.viewMode, visibleChapter]);
  const playbackVerseIndex = playbackVerses.findIndex(
    (verse) => verse.number === activeAyah && verse.surahNumber === activeSurah,
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    const currentSettings = load<{ dark: boolean; sound?: boolean }>(SETTINGS_KEY, {
      dark,
      sound: true,
    });
    save(SETTINGS_KEY, { ...currentSettings, dark });
  }, [dark]);

  useEffect(() => {
    save(QURAN_SETTINGS_KEY, settings);
  }, [settings]);

  useEffect(() => {
    save(QURAN_BOOKMARKS_KEY, bookmarks);
    save(QURAN_BOOKMARK_KEY, null);
  }, [bookmarks]);

  useEffect(() => {
    save(QURAN_PROGRESS_KEY, progress);
  }, [progress]);

  useEffect(() => {
    save(QURAN_DAILY_GOAL_KEY, dailyGoal);
  }, [dailyGoal]);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const [surahData, languageData, reciterData] = await Promise.all([
          fetchQuran<QuranSurah[]>('resource=surahs'),
          fetchQuran<string[]>('resource=languages'),
          fetchQuran<QuranEdition[]>('resource=reciters'),
        ]);
        if (cancelled) return;
        setSurahs(surahData);
        setLanguages(languageData);
        setReciters(reciterData.length > 0 ? reciterData : DEFAULT_RECITERS);
        setSettings((current) => ({
          ...current,
          surah:
            Number.isInteger(current.surah) && current.surah >= 1 && current.surah <= 114
              ? current.surah
              : 1,
          language: languageData.includes(current.language)
            ? current.language
            : 'en',
          reciter: reciterData.some((item) => item.identifier === current.reciter)
            ? current.reciter
            : (reciterData[0]?.identifier ?? DEFAULT_RECITERS[0].identifier),
        }));
      } catch (error) {
        console.error('Could not load Quran reader options:', error);
        if (!cancelled) {
          setCatalogError(
            error instanceof Error ? error.message : 'Could not load Quran reader options.',
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (catalogLoading || !languages.includes(settings.language)) return;
    const controller = new AbortController();
    setTranslationsLanguage(null);
    setTranslations([]);
    async function loadTranslations() {
      try {
        const editions = await fetchQuran<QuranEdition[]>(
          `resource=translations&language=${encodeURIComponent(settings.language)}`,
          controller.signal,
        );
        setTranslations(editions);
        setTranslationsLanguage(settings.language);
        if (editions.length === 0) {
          setChapterError('No text translations are available for this language yet.');
          return;
        }
        const preferred =
          editions.find((edition) => edition.identifier === 'en.sahih') ?? editions[0];
        setSettings((current) =>
          editions.some((edition) => edition.identifier === current.translation)
            ? current
            : { ...current, translation: preferred.identifier },
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not load Quran translations:', error);
        setTranslationsLanguage(settings.language);
        setChapterError(
          error instanceof Error ? error.message : 'Could not load translations.',
        );
      }
    }
    void loadTranslations();
    return () => controller.abort();
  }, [catalogLoading, languages, settings.language]);

  useEffect(() => {
    if (
      catalogLoading ||
      catalogError ||
      !surahs.length ||
      translationsLanguage !== settings.language ||
      !translations.some((edition) => edition.identifier === settings.translation) ||
      !reciters.some((edition) => edition.identifier === settings.reciter)
    ) {
      return;
    }

    const controller = new AbortController();
    setChapterLoading(true);
    setChapterError('');
    setAudioError('');
    async function loadChapter() {
      try {
        const editions = await fetchQuran<QuranEditionSurah[]>(
          `resource=chapter&number=${settings.surah}&translation=${encodeURIComponent(settings.translation)}&reciter=${encodeURIComponent(settings.reciter)}`,
          controller.signal,
        );
        const arabic = editions.find((item) => item.edition.identifier === 'quran-uthmani');
        const translated = editions.find(
          (item) => item.edition.identifier === settings.translation,
        );
        const recitation = editions.find(
          (item) => item.edition.identifier === settings.reciter,
        );
        if (!arabic || !translated || !recitation) {
          throw new Error('The selected Quran text, translation, or recitation is unavailable.');
        }

        const activeSurah = surahs.find((item) => item.number === settings.surah);
        if (!activeSurah) throw new Error('This surah is not in the Quran catalogue.');
        const verses = arabic.ayahs.map((ayah, index) => ({
          number: ayah.numberInSurah,
          arabic: ayah.text,
          translation: translated.ayahs[index]?.text ?? '',
          audio: recitation.ayahs[index]?.audio,
          page: ayah.page,
          surahNumber: settings.surah,
          surahName: activeSurah.englishName,
          surahArabicName: activeSurah.name,
          globalNumber: ayah.number,
        }));
        const loadedChapter = {
          surah: activeSurah,
          translation: settings.translation,
          reciter: settings.reciter,
          arabicScript: 'indopak' as const,
          verses,
        };
        setChapter(loadedChapter);
        save(QURAN_CACHE_KEY, loadedChapter);
        if (verses[0]?.page) {
          if (settings.viewMode !== 'mushaf' || pendingSurahJump.current) {
            setMushafPageNumber(verses[0].page);
            pendingSurahJump.current = false;
          }
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not load the selected Quran surah:', error);
        const cached = load<ChapterCache | null>(QURAN_CACHE_KEY, null);
        if (
          cached?.surah.number === settings.surah &&
          cached.translation === settings.translation &&
          cached.reciter === settings.reciter &&
          cached.arabicScript === 'indopak'
        ) {
          setChapter(cached);
          setChapterError('Could not connect. Showing the saved copy of this surah.');
        } else {
          setChapterError(
            error instanceof Error ? error.message : 'Could not load this surah.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setChapterLoading(false);
      }
    }
    void loadChapter();
    return () => controller.abort();
  }, [
    catalogError,
    catalogLoading,
    reciters,
    settings.language,
    settings.reciter,
    settings.surah,
    settings.translation,
    surahs,
    translations,
    translationsLanguage,
  ]);

  useEffect(() => {
    if (settings.viewMode !== 'mushaf' || catalogLoading) return;
    const controller = new AbortController();
    setMushafPageLoading(true);
    setMushafPageError('');

    async function loadMushafPage() {
      try {
        const pageData = await fetchQuran<MushafPageResponse>(
          `resource=page&number=${mushafPageNumber}&translation=${encodeURIComponent(settings.translation)}&reciter=${encodeURIComponent(settings.reciter)}`,
          controller.signal,
        );
        const editions = pageData.editions;
        const arabic = editions.find((item) => item.edition.identifier === 'quran-uthmani');
        const translated = editions.find(
          (item) => item.edition.identifier === settings.translation,
        );
        const recitation = editions.find(
          (item) => item.edition.identifier === settings.reciter,
        );
        if (!arabic || !translated || !recitation) {
          throw new Error('The selected Mushaf page, translation, or recitation is unavailable.');
        }
        const indopakByVerse = new Map(
          pageData.indopak.map((ayah) => [ayah.verse_key, ayah.text_indopak]),
        );
        const verses = arabic.ayahs.map((ayah, index) => {
          const indopakText = indopakByVerse.get(
            `${ayah.surah.number}:${ayah.numberInSurah}`,
          );
          if (!indopakText) {
            throw new Error(
              `Indo-Pak Arabic text is unavailable for ${ayah.surah.number}:${ayah.numberInSurah}.`,
            );
          }
          return {
            number: ayah.numberInSurah,
            arabic: indopakText,
            translation: translated.ayahs[index]?.text ?? '',
            audio: recitation.ayahs[index]?.audio,
            page: ayah.page ?? mushafPageNumber,
            surahNumber: ayah.surah.number,
            surahName: ayah.surah.englishName,
            surahArabicName: ayah.surah.name,
            globalNumber: ayah.number,
          };
        });
        setMushafPage({
          page: mushafPageNumber,
          translation: settings.translation,
          reciter: settings.reciter,
          verses,
        });
        const pageFirstSurah = verses[0]?.surahNumber;
        if (pageFirstSurah && pageFirstSurah !== settings.surah) {
          pendingSurahJump.current = false;
          updateSetting('surah', pageFirstSurah);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not load the selected Mushaf page:', error);
        setMushafPageError(
          error instanceof Error ? error.message : 'Could not load this Mushaf page.',
        );
      } finally {
        if (!controller.signal.aborted) setMushafPageLoading(false);
      }
    }
    void loadMushafPage();
    return () => controller.abort();
  }, [
    catalogLoading,
    mushafPageNumber,
    settings.reciter,
    settings.translation,
    settings.viewMode,
  ]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = settings.playbackRate;
  }, [activeAudio, settings.playbackRate]);

  useEffect(() => {
    if (!activeAudio || !shouldPlay || !audioRef.current) {
      setMediaPlaybackState('paused');
      return;
    }

    startBackgroundAudioKeepAlive();

    void audioRef.current
      .play()
      .then(() => {
        setMediaPlaybackState('playing');
      })
      .catch((error: unknown) => {
        console.error('Quran recitation could not be played:', error);
        setShouldPlay(false);
        setMediaPlaybackState('none');
        setAudioError('Audio could not be played. Check your connection and try again.');
      });

    const surahInfo = surahs.find((s) => s.number === activeSurah) || visibleChapter?.surah;
    const reciterInfo = reciters.find((r) => r.identifier === settings.reciter);
    updateMediaMetadata({
      title: `${surahInfo ? surahInfo.englishName : 'Surah'} · Ayah ${activeAyah}`,
      artist: reciterInfo ? reciterInfo.name : 'Noble Reciter',
      album: `Qur'an al-Kareem · Surah ${activeSurah}`,
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
  }, [
    activeAudio,
    activeAyah,
    activeSurah,
    reciters,
    settings.reciter,
    shouldPlay,
    surahs,
    visibleChapter?.surah,
  ]);

  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    settingsCloseButtonRef.current?.focus();
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (!shouldPlay || activeAyah === null) return;
    const frame = requestAnimationFrame(() => {
      if (activeSurah === null) return;
      document.querySelector<HTMLElement>(
        `[data-ayah-key="${activeSurah}:${activeAyah}"]`,
      )?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeAyah, activeSurah, mushafPage?.page, shouldPlay]);

  useEffect(() => {
    if (
      !shouldPlay ||
      activeAyah === null ||
      activeSurah === null ||
      activeWordIndex === null
    ) {
      return;
    }
    const word = document.querySelector<HTMLElement>(
      `[data-word-key="${activeSurah}:${activeAyah}:${activeWordIndex}"]`,
    );
    if (!word) return;
    const bounds = word.getBoundingClientRect();
    if (bounds.top < 96 || bounds.bottom > window.innerHeight - 160) {
      word.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [activeAyah, activeSurah, activeWordIndex, shouldPlay]);

  useEffect(() => {
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setActiveWordIndex(null);
  }, [activeAudio]);

  useEffect(() => {
    if (
      jumpToAyah === null ||
      !visibleChapter ||
      visibleChapter.surah.number !== jumpToAyah.surah
    ) {
      return;
    }
    document
      .getElementById(`quran-ayah-${jumpToAyah.ayah}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setJumpToAyah(null);
  }, [jumpToAyah, visibleChapter]);

  const recordRead = useCallback((location: QuranLocation) => {
    setProgress((current) => {
      const date = localDateKey();
      const verseKey = `${location.surah}:${location.ayah}`;
      const todaysVerses = current.dailyVerses[date] ?? [];
      const lastRead = current.lastRead;
      if (
        lastRead?.surah === location.surah &&
        lastRead.ayah === location.ayah &&
        todaysVerses.includes(verseKey)
      ) {
        return current;
      }

      const dailyVerses = { ...current.dailyVerses };
      dailyVerses[date] = todaysVerses.includes(verseKey)
        ? todaysVerses
        : [...todaysVerses, verseKey];
      const retainedDates = Object.keys(dailyVerses).sort().slice(-30);
      return {
        lastRead: location,
        dailyVerses: Object.fromEntries(
          retainedDates.map((key) => [key, dailyVerses[key]]),
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (!visibleChapter || chapterLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const ayah = Number(current?.target.getAttribute('data-ayah'));
        const surah = Number(current?.target.getAttribute('data-surah'));
        if (current && Number.isInteger(ayah)) {
          recordRead({
            surah: Number.isInteger(surah) ? surah : visibleChapter.surah.number,
            ayah,
          });
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    document.querySelectorAll<HTMLElement>('[data-ayah]').forEach((element) => {
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [chapterLoading, mushafPage?.page, recordRead, visibleChapter]);

  const updateSetting = useCallback(
    <K extends keyof QuranSettings>(key: K, value: QuranSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const languageOptions = useMemo(
    () => languages.filter((language) => /^[a-z]{2,3}$/i.test(language)),
    [languages],
  );

  const stopPlayback = () => {
    audioRef.current?.pause();
    stopBackgroundAudioKeepAlive();
    setMediaPlaybackState('none');
    setActiveAudio('');
    setActiveAyah(null);
    setActiveSurah(null);
    setShouldPlay(false);
    setContinuousSurah(false);
    setPendingPagePlayback(false);
  };

  const playVerse = useCallback((verse: QuranVerse, continuous = settings.playbackMode === 'surah') => {
    if (!verse.audio) {
      setAudioError('Audio is not available for this verse.');
      return;
    }
    const verseSurah = verse.surahNumber ?? settings.surah;
    if (activeAyah === verse.number && activeSurah === verseSurah && shouldPlay) {
      audioRef.current?.pause();
      setShouldPlay(false);
      return;
    }
    if (activeAyah !== verse.number || activeSurah !== verseSurah) {
      setCurrentAyahRepeat(1);
    }
    setAudioError('');
    setActiveAyah(verse.number);
    setActiveSurah(verseSurah);
    setActiveAudio(verse.audio);
    setShouldPlay(true);
    setContinuousSurah(continuous);
    recordRead({ surah: verseSurah, ayah: verse.number });
  }, [activeAyah, activeSurah, recordRead, settings.playbackMode, settings.surah, shouldPlay]);

  useEffect(() => {
    if (settings.viewMode !== 'mushaf' || !pendingPagePlayback || mushafPageLoading) return;
    if (mushafPageError) {
      setPendingPagePlayback(false);
      setShouldPlay(false);
      setContinuousSurah(false);
      return;
    }
    if (
      !mushafPage ||
      mushafPage.page !== mushafPageNumber ||
      mushafPage.translation !== settings.translation ||
      mushafPage.reciter !== settings.reciter
    ) {
      return;
    }
    const nextVerse = mushafPage.verses.find(
      (verse) =>
        verse.surahNumber === activeSurah &&
        verse.number > (activeAyah ?? 0),
    );
    setPendingPagePlayback(false);
    if (nextVerse) {
      playVerse(nextVerse, true);
    } else {
      setShouldPlay(false);
      setContinuousSurah(false);
    }
  }, [
    activeAyah,
    activeSurah,
    mushafPage,
    mushafPageError,
    mushafPageLoading,
    mushafPageNumber,
    pendingPagePlayback,
    playVerse,
    settings.reciter,
    settings.translation,
    settings.viewMode,
  ]);

  const playFullSurah = () => {
    const firstVerse = visibleChapter?.verses[0];
    if (firstVerse) playVerse(firstVerse, true);
  };

  const updatePlaybackPosition = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaybackTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) {
      setPlaybackDuration(audio.duration);
      updateMediaPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime,
      });
    }

    const verse = playbackVerses.find(
      (item) => item.number === activeAyah && item.surahNumber === activeSurah,
    );
    if (!verse || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const words = verse.arabic.trim().split(/\s+/);
    const weights = words.map((word) =>
      Math.max(1, Array.from(word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, '')).length),
    );
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    const elapsedWeight = (audio.currentTime / audio.duration) * totalWeight;
    let accumulated = 0;
    const wordIndex = weights.findIndex((weight) => {
      accumulated += weight;
      return elapsedWeight < accumulated;
    });
    setActiveWordIndex(wordIndex < 0 ? words.length - 1 : wordIndex);
  }, [activeAyah, activeSurah, playbackVerses]);

  useEffect(() => {
    if (!activeAudio) return;
    registerMediaActionHandlers({
      onPlay: () => {
        audioRef.current
          ?.play()
          .then(() => {
            setShouldPlay(true);
            setMediaPlaybackState('playing');
          })
          .catch(console.warn);
      },
      onPause: () => {
        audioRef.current?.pause();
        setShouldPlay(false);
        setMediaPlaybackState('paused');
      },
      onNext: () => {
        if (playbackVerseIndex >= 0 && playbackVerseIndex < playbackVerses.length - 1) {
          playVerse(playbackVerses[playbackVerseIndex + 1], true);
        }
      },
      onPrevious: () => {
        if (playbackVerseIndex > 0) {
          playVerse(playbackVerses[playbackVerseIndex - 1], true);
        }
      },
      onSeekTo: (details) => {
        if (audioRef.current && Number.isFinite(details.seekTime)) {
          audioRef.current.currentTime = details.seekTime;
        }
      },
      onSeekBackward: (offset = 10) => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - offset);
        }
      },
      onSeekForward: (offset = 10) => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration || 0,
            audioRef.current.currentTime + offset,
          );
        }
      },
      onStop: stopPlayback,
    });
  }, [activeAudio, playbackVerseIndex, playbackVerses, playVerse]);

  useEffect(() => {
    if (!shouldPlay) return;
    let frame = 0;
    let lastUpdate = 0;
    const update = (timestamp: number) => {
      if (timestamp - lastUpdate >= 80) {
        updatePlaybackPosition();
        lastUpdate = timestamp;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [shouldPlay, updatePlaybackPosition]);

  const seekPlayback = (time: number) => {
    if (!audioRef.current || !Number.isFinite(time)) return;
    audioRef.current.currentTime = time;
    updatePlaybackPosition();
  };

  const playAdjacentVerse = (direction: -1 | 1) => {
    const currentIndex = playbackVerses.findIndex(
      (verse) => verse.number === activeAyah && verse.surahNumber === activeSurah,
    );
    const nextVerse = playbackVerses[currentIndex + direction];
    if (nextVerse) playVerse(nextVerse);
  };

  const handleAudioEnded = useCallback(() => {
    // 1. Range Looping
    if (rangeLoopActive && activeAyah !== null) {
      if (activeAyah < rangeEndAyah) {
        const nextAyahNumber = activeAyah + 1;
        const nextVerse = playbackVerses.find(
          (v) => (v.surahNumber ?? settings.surah) === activeSurah && v.number === nextAyahNumber,
        );
        if (nextVerse) {
          playVerse(nextVerse, true);
          return;
        }
      } else {
        // Reached end of range
        if (rangeLoopTarget === -1 || currentRangeLoop < rangeLoopTarget) {
          setCurrentRangeLoop((c) => c + 1);
          const startVerse = playbackVerses.find(
            (v) => (v.surahNumber ?? settings.surah) === activeSurah && v.number === rangeStartAyah,
          );
          if (startVerse) {
            playVerse(startVerse, true);
            return;
          }
        } else {
          // Finished range loop target
          setShouldPlay(false);
          setContinuousSurah(false);
          updatePlaybackPosition();
          return;
        }
      }
    }

    // 2. Single Ayah repeat (N times or infinite)
    if (
      (settings.repeatVerse || repeatCountTarget > 1 || repeatCountTarget === -1) &&
      audioRef.current
    ) {
      const isInfinite = settings.repeatVerse || repeatCountTarget === -1;
      if (isInfinite || currentAyahRepeat < repeatCountTarget) {
        if (!isInfinite) {
          setCurrentAyahRepeat((c) => c + 1);
        }
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch((error: unknown) => {
          console.error('Quran verse repeat could not be played:', error);
          setShouldPlay(false);
          setAudioError('Audio could not be replayed. Check your connection and try again.');
        });
        return;
      } else {
        setCurrentAyahRepeat(1);
      }
    }

    // 3. Normal progression
    const index = playbackVerses.findIndex(
      (verse) => verse.number === activeAyah && verse.surahNumber === activeSurah,
    );
    const candidateNextVerse = playbackVerses[index + 1];
    const nextVerse =
      candidateNextVerse?.surahNumber === activeSurah ? candidateNextVerse : undefined;
    if ((continuousSurah || settings.autoPlayNext) && nextVerse) {
      setCurrentAyahRepeat(1);
      playVerse(nextVerse, continuousSurah);
    } else if (
      settings.viewMode === 'mushaf' &&
      (continuousSurah || settings.autoPlayNext) &&
      mushafPageNumber < 604
    ) {
      setCurrentAyahRepeat(1);
      setPendingPagePlayback(true);
      setPageFlipDirection('next');
      setMushafPageNumber((page) => Math.min(604, page + 1));
    } else {
      setShouldPlay(false);
      setContinuousSurah(false);
      updatePlaybackPosition();
    }
  }, [
    activeAyah,
    activeSurah,
    continuousSurah,
    currentAyahRepeat,
    currentRangeLoop,
    mushafPageNumber,
    playbackVerses,
    playVerse,
    rangeEndAyah,
    rangeLoopActive,
    rangeLoopTarget,
    rangeStartAyah,
    repeatCountTarget,
    settings.autoPlayNext,
    settings.repeatVerse,
    settings.surah,
    settings.viewMode,
    updatePlaybackPosition,
  ]);

  const isVerseRevealed = useCallback(
    (surahNum: number, ayahNum: number) => {
      if (!hifzMode) return true;
      return Boolean(revealedVerses[`${surahNum}:${ayahNum}`]);
    },
    [hifzMode, revealedVerses],
  );

  const toggleRevealVerse = useCallback(
    (surahNum: number, ayahNum: number) => {
      setRevealedVerses((prev) => {
        const key = `${surahNum}:${ayahNum}`;
        return { ...prev, [key]: !prev[key] };
      });
    },
    [],
  );

  const revealAllVerses = useCallback(() => {
    if (!visibleChapter) return;
    const update: Record<string, boolean> = {};
    visibleChapter.verses.forEach((v) => {
      update[`${settings.surah}:${v.number}`] = true;
    });
    setRevealedVerses((prev) => ({ ...prev, ...update }));
  }, [settings.surah, visibleChapter]);

  const hideAllVerses = useCallback(() => {
    if (!visibleChapter) return;
    const update: Record<string, boolean> = {};
    visibleChapter.verses.forEach((v) => {
      update[`${settings.surah}:${v.number}`] = false;
    });
    setRevealedVerses((prev) => ({ ...prev, ...update }));
  }, [settings.surah, visibleChapter]);

  const revealNextAyah = useCallback(() => {
    if (!visibleChapter) return;
    const firstUnrevealed = visibleChapter.verses.find(
      (v) => !revealedVerses[`${settings.surah}:${v.number}`],
    );
    if (firstUnrevealed) {
      setRevealedVerses((prev) => ({
        ...prev,
        [`${settings.surah}:${firstUnrevealed.number}`]: true,
      }));
      const elem = document.getElementById(`quran-ayah-${firstUnrevealed.number}`);
      elem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealedVerses, settings.surah, visibleChapter]);

  const handleWordClick = useCallback(
    async (surahNum: number, ayahNum: number, wordIndex: number, fallbackText: string) => {
      setWordModalLocation({ surah: surahNum, ayah: ayahNum });
      const cacheKey = `${surahNum}:${ayahNum}`;
      let words = wbwVerseCache[cacheKey];
      if (!words) {
        words = await fetchVerseWords(surahNum, ayahNum);
        if (words && words.length > 0) {
          setWbwVerseCache((prev) => ({ ...prev, [cacheKey]: words }));
        }
      }
      if (words && words.length > 0) {
        const matched =
          words.find((w) => w.position === wordIndex + 1) ||
          words[wordIndex] ||
          words[0];
        setSelectedWord(matched);
      } else {
        setSelectedWord({
          id: wordIndex,
          position: wordIndex + 1,
          text: fallbackText,
          charType: 'word',
          translation: 'Tap audio to listen',
        });
      }
    },
    [wbwVerseCache],
  );

  const startRangeLoop = useCallback(
    (start: number, end: number, loopTarget: number) => {
      setRangeLoopActive(true);
      setRangeStartAyah(start);
      setRangeEndAyah(end);
      setRangeLoopTarget(loopTarget);
      setCurrentRangeLoop(1);

      const startVerse = playbackVerses.find(
        (v) => (v.surahNumber ?? settings.surah) === settings.surah && v.number === start,
      );
      if (startVerse) {
        playVerse(startVerse, true);
      }
    },
    [playbackVerses, playVerse, settings.surah],
  );

  const stopRangeLoop = useCallback(() => {
    setRangeLoopActive(false);
  }, []);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  const todayVerseCount = progress.dailyVerses[localDateKey()]?.length ?? 0;
  const goalProgress = Math.min(100, (todayVerseCount / dailyGoal) * 100);
  const lastReadSurah = progress.lastRead
    ? surahs.find((surah) => surah.number === progress.lastRead?.surah)
    : undefined;
  const currentSurah = surahs.find((item) => item.number === settings.surah);

  const toggleBookmark = (location: QuranLocation) => {
    setBookmarks((current) => {
      const exists = current.some(
        (item) => item.surah === location.surah && item.ayah === location.ayah,
      );
      return exists
        ? current.filter(
            (item) => item.surah !== location.surah || item.ayah !== location.ayah,
          )
        : [
            ...current,
            { ...location, createdAt: new Date().toISOString() },
          ];
    });
  };

  const saveBookmark = (ayah: number) =>
    toggleBookmark({ surah: settings.surah, ayah });

  const turnMushafPage = useCallback(
    (direction: -1 | 1) => {
      const target = mushafPageNumber + direction;
      if (target < 1 || target > TOTAL_MUSHAF_PAGES) return;
      pendingSurahJump.current = false;
      setPageFlipDirection(direction > 0 ? 'next' : 'previous');
      setPendingPagePlayback(false);
      setMushafPageNumber(target);
    },
    [mushafPageNumber],
  );

  const goToMushafPage = useCallback(
    (page: number) => {
      const target = Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, Math.round(page)));
      if (target === mushafPageNumber || Number.isNaN(target)) return;
      pendingSurahJump.current = false;
      setPageFlipDirection(target > mushafPageNumber ? 'next' : 'previous');
      setPendingPagePlayback(false);
      setMushafPageNumber(target);
    },
    [mushafPageNumber],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Detect fast, deliberate horizontal swipe (> 40px horizontal, predominantly horizontal, < 750ms)
    if (
      deltaTime < 750 &&
      Math.abs(deltaX) > 40 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.2
    ) {
      if (deltaX < 0) {
        // Swiped Left -> Advance to next page (1 -> 2)
        if (mushafPageNumber < TOTAL_MUSHAF_PAGES) {
          turnMushafPage(1);
        }
      } else {
        // Swiped Right -> Return to previous page (2 -> 1)
        if (mushafPageNumber > 1) {
          turnMushafPage(-1);
        }
      }
    }
  };

  useEffect(() => {
    if (settings.viewMode !== 'mushaf') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        turnMushafPage(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turnMushafPage(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.viewMode, turnMushafPage]);

  const selectViewMode = (viewMode: QuranSettings['viewMode']) => {
    if (viewMode === 'mushaf' && visibleChapter?.verses[0]?.page) {
      setMushafPageNumber(visibleChapter.verses[0].page);
      setPageFlipDirection('next');
    }
    updateSetting('viewMode', viewMode);
  };

  const openLocation = (location: QuranLocation) => {
    if (location.surah !== settings.surah) {
      pendingSurahJump.current = true;
      stopPlayback();
      updateSetting('surah', location.surah);
    }
    setJumpToAyah(location);
  };

  const moveSurah = (direction: -1 | 1) => {
    const next = Math.min(114, Math.max(1, settings.surah + direction));
    pendingSurahJump.current = true;
    updateSetting('surah', next);
    stopPlayback();
  };

  const card = dark
    ? 'border-white/[0.08] bg-white/[0.04]'
    : 'border-stone-200 bg-white shadow-sm';
  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  const selectClass = `min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-emerald-500 ${
    dark
      ? 'border-white/10 bg-[#14211e] text-stone-100'
      : 'border-stone-200 bg-white text-stone-800'
  }`;

  return (
    <div className={`min-h-screen ${dark ? 'bg-[#0d1715] text-stone-200' : 'bg-stone-50 text-stone-800'}`}>
      <AppShell
        active="quran"
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
      >
        <div className="mx-auto w-[min(calc(100%-2rem),72rem)] px-2 py-4 pb-12 sm:px-4 sm:py-7 lg:px-4">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                <span>THE NOBLE QUR'AN · القُرْآن الكَرِيم</span>
              </div>
              <h1 className={`mt-0.5 truncate font-ui text-2xl font-bold tracking-[-0.045em] sm:text-3xl ${dark ? 'text-stone-900 dark:text-stone-100' : 'text-stone-900'}`}>
                {currentSurah?.englishName ?? 'Read & listen'}
              </h1>
              <p className={`mt-0.5 text-xs ${muted}`}>
                {progress.lastRead && lastReadSurah
                  ? `Last read: ${lastReadSurah.englishName} · Verse ${progress.lastRead.ayah}`
                  : 'Read, listen, and reflect with word-by-word pronunciation and memorization tools'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setTrackerOpen(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
              >
                <Plus className="h-4 w-4" />
                <span>Track Reading</span>
              </button>
              {progress.lastRead && (
                <button
                  type="button"
                  onClick={() => {
                    if (progress.lastRead) openLocation(progress.lastRead);
                  }}
                  className={`hidden min-h-11 rounded-xl border px-3 text-xs font-medium sm:block ${card}`}
                >
                  Continue reading
                </button>
              )}
              <button
                type="button"
                ref={settingsButtonRef}
                onClick={() => setSettingsOpen(true)}
                aria-label="Open Quran settings"
                title="Quran settings"
                className={`grid h-11 w-11 place-items-center rounded-xl border text-lg ${card}`}
              >
                <Settings2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <section className={`mb-4 rounded-2xl border px-4 py-3 ${card}`} aria-label="Daily Quran reading progress">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold">Today’s reading & Khatm Tracker</h2>
                <p className={`mt-0.5 text-[11px] ${muted}`}>
                  {todayVerseCount} of {dailyGoal} verses · {goalProgress}% of daily goal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTrackerOpen(true)}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 transition-all"
                >
                  + Log to Tracker
                </button>
                <Link
                  href="/insights"
                  className="rounded-xl border border-[var(--app-line)] px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  View Graphs →
                </Link>
              </div>
            </div>
            <div
              className={`mt-3 h-2 overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-stone-100'}`}
              role="progressbar"
              aria-label="Daily verse goal progress"
              aria-valuemin={0}
              aria-valuemax={dailyGoal}
              aria-valuenow={Math.min(todayVerseCount, dailyGoal)}
            >
              <div
                className="h-full rounded-full bg-emerald-700 transition-[width] dark:bg-emerald-300"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </section>

          {catalogError && (
            <div role="alert" className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-500">
              {catalogError}
            </div>
          )}

          <div className="min-w-0">
            <section className="min-w-0" aria-label="Quran reader">
              <div className={`mb-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-2xl border p-3 ${card}`}>
                <label className="sr-only" htmlFor="surah-select">Choose a surah</label>
                <select
                  id="surah-select"
                  className={selectClass}
                  value={settings.surah}
                  onChange={(event) => {
                    pendingSurahJump.current = true;
                    updateSetting('surah', Number(event.target.value));
                    stopPlayback();
                  }}
                  disabled={catalogLoading || surahs.length === 0}
                >
                  {surahs.map((surah) => (
                    <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={surah.number} value={surah.number}>
                      {surah.number}. {surah.englishName} · {surah.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label="Previous surah"
                  className={`h-11 w-11 rounded-xl border text-lg ${card} disabled:opacity-40`}
                  onClick={() => moveSurah(-1)}
                  disabled={settings.surah <= 1}
                >
                  <ChevronLeft className="mx-auto h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next surah"
                  className={`h-11 w-11 rounded-xl border text-lg ${card} disabled:opacity-40`}
                  onClick={() => moveSurah(1)}
                  disabled={settings.surah >= 114}
                >
                  <ChevronRight className="mx-auto h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className={`mb-3 grid grid-cols-2 gap-1 rounded-xl border p-1 ${card}`} role="group" aria-label="Quran reading view">
                <button
                  type="button"
                  aria-pressed={settings.viewMode === 'reader'}
                  className={`min-h-10 rounded-lg text-xs font-bold transition ${
                    settings.viewMode === 'reader'
                      ? 'bg-[var(--app-surface)] text-emerald-800 shadow-sm dark:text-emerald-200'
                      : 'text-stone-500'
                  }`}
                  onClick={() => selectViewMode('reader')}
                >
                  <span className="inline-flex items-center justify-center gap-2"><BookOpenText className="h-4 w-4" aria-hidden="true" /> Verse reader</span>
                </button>
                <button
                  type="button"
                  aria-pressed={settings.viewMode === 'mushaf'}
                  className={`min-h-10 rounded-lg text-xs font-bold transition ${
                    settings.viewMode === 'mushaf'
                      ? 'bg-[var(--app-surface)] text-emerald-800 shadow-sm dark:text-emerald-200'
                      : 'text-stone-500'
                  }`}
                  onClick={() => selectViewMode('mushaf')}
                >
                  <span className="inline-flex items-center justify-center gap-2"><BookOpenText className="h-4 w-4" aria-hidden="true" /> Mushaf pages</span>
                </button>
              </div>

              {/* Memorization & Looping Toolbar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Hifz Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !hifzMode;
                      setHifzMode(next);
                      if (next) {
                        hideAllVerses();
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                      hifzMode
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : `${card} text-[var(--app-ink)] hover:border-emerald-500/40`
                    }`}
                    title="Toggle Recite / Hifz Mode to veil upcoming verses"
                  >
                    {hifzMode ? (
                      <EyeOff className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span>Hifz Recite Mode</span>
                    {hifzMode && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </button>

                  {/* Audio Repeat & Looping Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setRepeatModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-sm ${
                      rangeLoopActive || repeatCountTarget > 1 || repeatCountTarget === -1
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : `${card} text-[var(--app-ink)] hover:border-emerald-500/40`
                    }`}
                    title="Configure Ayah repeat and range looping"
                  >
                    <Repeat2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {rangeLoopActive
                        ? `Range Loop (${rangeStartAyah}–${rangeEndAyah})`
                        : repeatCountTarget > 1
                        ? `Repeat ${repeatCountTarget}×`
                        : repeatCountTarget === -1
                        ? 'Repeat ∞'
                        : 'Loop & Memorize'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[var(--app-muted)]">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Tap Arabic words for isolated root audio & meaning</span>
                </div>
              </div>

              {/* Hifz Banner when active */}
              {hifzMode && (
                <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-950 dark:text-emerald-200 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-800 text-white dark:bg-emerald-400 dark:text-emerald-950 shadow-sm">
                        <EyeOff className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold">Hifz Memorization Mode Active</p>
                        <p className="text-[11px] opacity-80">Verses are veiled. Test your recall, then tap each verse to check.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={revealNextAyah}
                        className="rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 transition-all"
                      >
                        Reveal Next Ayah
                      </button>
                      <button
                        type="button"
                        onClick={revealAllVerses}
                        className="rounded-xl border border-[var(--app-line)] px-2.5 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        Reveal All
                      </button>
                      <button
                        type="button"
                        onClick={hideAllVerses}
                        className="rounded-xl border border-[var(--app-line)] px-2.5 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      >
                        Hide All
                      </button>
                      <button
                        type="button"
                        onClick={() => setHifzMode(false)}
                        className="rounded-xl border border-[var(--app-line)] px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-all"
                      >
                        Exit Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settings.viewMode === 'mushaf' && (
                <div
                  className={`mb-5 overflow-hidden rounded-2xl border transition-all ${
                    dark
                      ? 'border-emerald-500/20 bg-[#12201a]/95 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.35)]'
                      : 'border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-[0_12px_36px_rgba(20,48,39,0.06)]'
                  }`}
                  aria-label={`Mushaf page navigation, page ${mushafPageNumber} of ${TOTAL_MUSHAF_PAGES}`}
                >
                  {/* Top Info Bar */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${
                      dark
                        ? 'border-white/[0.07] bg-white/[0.02]'
                        : 'border-stone-100 bg-[#f8faf7]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <BookOpenText className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Mushaf Madinah
                      </span>
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        Juz {currentJuz}
                      </span>
                      <span className={`hidden truncate text-xs sm:inline ${muted}`}>
                        · {mushafPage?.verses[0]?.surahName ?? currentSurah?.englishName ?? 'Al-Qur’an'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium tabular-nums">
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Page {mushafPageNumber}
                      </span>
                      <span className={muted}>of {TOTAL_MUSHAF_PAGES}</span>
                      <span className={`hidden text-[10px] sm:inline ${muted}`}>
                        ({((mushafPageNumber / TOTAL_MUSHAF_PAGES) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Middle Navigation Controls */}
                  <div className="flex items-center justify-between gap-3 p-3 sm:px-4">
                    <button
                      type="button"
                      aria-label="Previous Mushaf page"
                      title="Previous Page (ArrowLeft)"
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                        dark
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20'
                          : 'border-emerald-900/15 bg-emerald-50 text-emerald-900 hover:border-emerald-600/40 hover:bg-emerald-100/70'
                      }`}
                      onClick={() => turnMushafPage(-1)}
                      disabled={mushafPageLoading || mushafPageNumber <= 1}
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Scrubber and direct page input */}
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                          Page
                        </span>
                        <input
                          className={`h-8 w-16 rounded-lg border text-center text-sm font-bold tabular-nums outline-none transition focus:border-emerald-500 ${
                            dark
                              ? 'border-white/10 bg-white/[0.05] text-stone-100'
                              : 'border-stone-200 bg-white text-stone-800'
                          }`}
                          type="number"
                          min={1}
                          max={TOTAL_MUSHAF_PAGES}
                          value={mushafPageNumber}
                          aria-label="Mushaf page number"
                          disabled={mushafPageLoading}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (Number.isInteger(val) && val >= 1 && val <= TOTAL_MUSHAF_PAGES) {
                              goToMushafPage(val);
                            }
                          }}
                        />
                        <span className={`text-xs ${muted}`}>/ {TOTAL_MUSHAF_PAGES}</span>
                      </div>

                      {/* Range slider for instant scrubbing across 604 pages */}
                      <div className="w-full max-w-xs">
                        <input
                          type="range"
                          min={1}
                          max={TOTAL_MUSHAF_PAGES}
                          value={mushafPageNumber}
                          aria-label="Quran page scrubber"
                          onChange={(e) => goToMushafPage(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-emerald-600 transition dark:bg-white/10 dark:accent-emerald-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Next Mushaf page"
                      title="Next Page (ArrowRight)"
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                        dark
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20'
                          : 'border-emerald-900/15 bg-emerald-50 text-emerald-900 hover:border-emerald-600/40 hover:bg-emerald-100/70'
                      }`}
                      onClick={() => turnMushafPage(1)}
                      disabled={mushafPageLoading || mushafPageNumber >= TOTAL_MUSHAF_PAGES}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Quick Options Bar (Font Size, Translation Toggle, Mobile Swipe Hint) */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs sm:px-4 ${
                      dark
                        ? 'border-white/[0.05] bg-white/[0.015]'
                        : 'border-stone-100 bg-[#fafbfa]'
                    }`}
                  >
                    {/* Font size stepper */}
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>
                        Text:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSetting('arabicFontSize', Math.max(22, settings.arabicFontSize - 2))
                        }
                        className={`rounded-lg border px-2 py-0.5 text-xs font-bold transition hover:border-emerald-500 ${
                          dark ? 'border-white/10 text-stone-200' : 'border-stone-200 text-stone-700'
                        }`}
                        title="Decrease font size"
                      >
                        A-
                      </button>
                      <span className="min-w-7 text-center text-[11px] font-semibold tabular-nums text-stone-500">
                        {settings.arabicFontSize}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSetting('arabicFontSize', Math.min(52, settings.arabicFontSize + 2))
                        }
                        className={`rounded-lg border px-2 py-0.5 text-xs font-bold transition hover:border-emerald-500 ${
                          dark ? 'border-white/10 text-stone-200' : 'border-stone-200 text-stone-700'
                        }`}
                        title="Increase font size"
                      >
                        A+
                      </button>
                    </div>

                    {/* Mobile swipe hint banner */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400/80 sm:hidden">
                      <span className="animate-pulse">‹</span>
                      <span>Swipe page to turn</span>
                      <span className="animate-pulse">›</span>
                    </div>

                    {/* Translation toggle pill */}
                    <button
                      type="button"
                      onClick={() => updateSetting('showTranslation', !settings.showTranslation)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        settings.showTranslation
                          ? 'border-emerald-600/30 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-200'
                          : 'border-stone-200 text-stone-500 dark:border-white/10 dark:text-stone-400'
                      }`}
                    >
                      <span>Translation</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          settings.showTranslation ? 'bg-emerald-500' : 'bg-stone-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reading Progress Line */}
                  <div
                    className={`h-1.5 ${dark ? 'bg-white/[0.06]' : 'bg-[#edf1eb]'}`}
                    role="progressbar"
                    aria-label="Mushaf 604-page Quran progress"
                    aria-valuemin={1}
                    aria-valuemax={TOTAL_MUSHAF_PAGES}
                    aria-valuenow={mushafPageNumber}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 transition-[width] duration-300"
                      style={{ width: `${(mushafPageNumber / TOTAL_MUSHAF_PAGES) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {visibleChapter && settings.viewMode === 'reader' && (
                <div className={`mb-4 rounded-2xl border p-5 text-center sm:p-7 ${card}`}>
                  <p className={`text-xs uppercase tracking-[0.12em] ${muted}`}>
                    Surah {visibleChapter.surah.number} · {visibleChapter.surah.revelationType} · {visibleChapter.surah.numberOfAyahs} verses
                  </p>
                  <h2 className="mt-2 font-arabic text-3xl" dir="rtl" lang="ar">
                    {visibleChapter.surah.name}
                  </h2>
                  <p className={`mt-1 text-sm ${muted}`}>
                    {visibleChapter.surah.englishName} · {visibleChapter.surah.englishNameTranslation}
                  </p>
                  <button
                    type="button"
                    onClick={playFullSurah}
                    className={`mt-4 min-h-10 rounded-full border px-4 text-xs font-semibold ${
                      dark
                        ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                        : 'border-emerald-700/20 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {continuousSurah && shouldPlay ? <><Pause className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Playing full surah</> : <><Play className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Play full surah</>}
                  </button>
                </div>
              )}

              {settings.viewMode === 'reader' && chapterLoading && (
                <div className="mb-6" role="status">
                  <AyahReaderSkeleton count={5} />
                </div>
              )}
              {settings.viewMode === 'reader' && chapterError && (
                <div role="status" className={`mb-4 rounded-2xl border p-4 text-sm ${card} ${muted}`}>
                  {chapterError}
                </div>
              )}

              {settings.viewMode === 'mushaf' && (
                <section
                  className={`relative min-w-0 rounded-[2rem] p-2.5 [perspective:1600px] sm:p-5 ${
                    dark
                      ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgb(48_79_64/42%),rgb(12_24_20/0%)_72%)]'
                      : 'bg-[radial-gradient(ellipse_at_50%_0%,rgb(207_221_198/72%),rgb(237_242_233/0%)_72%)]'
                  }`}
                  aria-label={`Mushaf page ${mushafPageNumber}`}
                >
                  {mushafPageLoading && (
                    <div className="mb-6" role="status">
                      <MushafPageSkeleton />
                    </div>
                  )}
                  {mushafPageError && (
                    <div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-6 text-center text-sm text-red-700 dark:text-red-300" role="alert">
                      {mushafPageError}
                    </div>
                  )}
                  {!mushafPageLoading &&
                    !mushafPageError &&
                    mushafPage?.page === mushafPageNumber &&
                    mushafPage.translation === settings.translation &&
                    mushafPage.reciter === settings.reciter && (
                      <article
                        key={mushafPage.page}
                        className={`relative isolate mx-auto min-h-[min(72vh,58rem)] w-[min(100%,44rem)] overflow-hidden rounded-[1.35rem] border px-6 pb-20 pt-8 [transform-origin:left_center] sm:px-12 sm:pb-24 sm:pt-12 ${
                          dark
                            ? 'border-[#5e7968] bg-[#f0e8d4] text-[#253b2d] shadow-[0_28px_70px_rgb(0_0_0/38%),inset_0_0_0_1px_rgb(241_224_177/25%),inset_8px_0_18px_rgb(25_44_32/16%)]'
                            : 'border-[#b6a978] bg-[#fffaf0] text-[#263d2c] shadow-[0_28px_70px_rgb(39_57_41/18%),inset_0_0_0_1px_rgb(255_255_255/85%),inset_8px_0_18px_rgb(95_83_43/7%)]'
                        } ${
                          pageFlipDirection === 'next'
                            ? 'animate-[mushaf-page-turn-next_420ms_cubic-bezier(0.2,0.75,0.2,1)_both]'
                            : 'animate-[mushaf-page-turn-previous_420ms_cubic-bezier(0.2,0.75,0.2,1)_both]'
                        }`}
                        aria-label={`Mushaf page ${mushafPage.page}`}
                      >
                        <div className="pointer-events-none absolute inset-[0.65rem] rounded-[0.9rem] border border-[#b6a978]/45 sm:inset-[0.85rem]" aria-hidden="true" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#355c43,#d5c58f_18%,#547a59_50%,#d5c58f_82%,#355c43)]" aria-hidden="true" />
                        <div className="relative mb-8 flex items-center justify-between border-b border-[#8d9b6b]/45 pb-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6c7654]">
                          <span className="max-w-[65%] truncate">{mushafPage.verses[0]?.surahName ?? 'Al-Qur’an'}</span>
                          <span>Al-Qur’an al-Karīm</span>
                        </div>
                        <div className="relative mx-auto mb-8 flex max-w-[29rem] items-center justify-center gap-3 text-center">
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#a78d4c]/60" aria-hidden="true" />
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#a78d4c]/45 bg-[#efe5c8] font-arabic text-lg text-[#796333] shadow-[0_2px_8px_rgb(91_76_36/10%)]" aria-hidden="true">۞</span>
                          <span className="font-arabic text-sm font-bold text-[#355c43] sm:text-base" lang="ar">الْقُرْآنُ الْكَرِيمُ</span>
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#a78d4c]/45 bg-[#efe5c8] font-arabic text-lg text-[#796333] shadow-[0_2px_8px_rgb(91_76_36/10%)]" aria-hidden="true">۞</span>
                          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#a78d4c]/60" aria-hidden="true" />
                        </div>
                        <div
                          className="relative px-1 py-1 font-arabic leading-[2.5] text-justify [text-align-last:center] [text-justify:inter-word] sm:px-2"
                          dir="rtl"
                          lang="ar"
                          style={{ fontSize: `${settings.arabicFontSize}px` }}
                        >
                          {mushafPage.verses.map((verse) => {
                            const surahNumber = verse.surahNumber ?? settings.surah;
                            const isActiveAyah =
                              activeSurah === surahNumber && activeAyah === verse.number;
                            const arabicWords = verse.arabic.trim().split(/\s+/);
                            const startsSurah = verse.number === 1;
                            const showBismillah =
                              startsSurah && surahNumber !== 1 && surahNumber !== 9;
                            const surahName =
                              surahs.find((item) => item.number === surahNumber)?.name ??
                              verse.surahArabicName ??
                              '';
                            return (
                              <span key={`${surahNumber}:${verse.number}`} className="contents">
                                {startsSurah && (
                                  <span className={`my-6 flex items-center justify-center gap-3 rounded-xl border border-x-0 px-3 py-2 text-[1.03em] font-bold leading-loose ${
                                    dark
                                      ? 'border-[#718d70]/50 bg-[#e4e2c8]/60 text-[#355c43]'
                                      : 'border-[#8d9b6b]/65 bg-[#f0ead7] text-[#355c43]'
                                  }`}>
                                    <span className="text-[0.8em] text-[#92783d]" aria-hidden="true">۞</span>
                                    <span>{surahName}</span>
                                    <span className="text-[0.8em] text-[#92783d]" aria-hidden="true">۞</span>
                                  </span>
                                )}
                                {showBismillah && (
                                  <span className="my-2 block text-center text-[0.78em] text-[#536f54]" lang="ar">
                                    بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                                  </span>
                                )}
                                <span
                                  className="scroll-my-[40vh]"
                                  data-ayah-key={`${surahNumber}:${verse.number}`}
                                  data-ayah={verse.number}
                                  data-surah={surahNumber}
                                  aria-current={isActiveAyah ? 'true' : undefined}
                                >
                                  {hifzMode && !isVerseRevealed(surahNumber, verse.number) ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealVerse(surahNumber, verse.number)}
                                      className="mx-1 inline-flex items-center gap-1 rounded-lg border border-dashed border-emerald-600/40 bg-emerald-500/15 px-2 py-0.5 font-sans text-[0.6em] font-medium text-emerald-900 transition-colors hover:bg-emerald-500/25 dark:text-emerald-200"
                                      title="Ayah veiled for memorization. Tap to reveal."
                                    >
                                      <Eye className="inline h-3 w-3" /> Ayah {verse.number} (Hidden · Tap to reveal)
                                    </button>
                                  ) : (
                                    arabicWords.map((word, wordIndex) => (
                                      <span
                                        key={`${surahNumber}:${verse.number}:${wordIndex}`}
                                        data-word-index={wordIndex}
                                        data-word-key={`${surahNumber}:${verse.number}:${wordIndex}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void handleWordClick(surahNumber, verse.number, wordIndex, word);
                                        }}
                                        title="Tap for root meaning & pronunciation"
                                        className={`cursor-pointer rounded transition-colors duration-100 hover:bg-emerald-500/20 ${
                                          isActiveAyah &&
                                          activeWordIndex === wordIndex &&
                                          activeAudio
                                            ? dark
                                              ? 'bg-[#9ed7a6] text-[#10271b]'
                                              : 'bg-[#f4d978] text-[#352a10] shadow-[0_0_0_0.1rem_rgb(244_217_120/30%)]'
                                            : ''
                                        }`}
                                      >
                                        {word}{' '}
                                      </span>
                                    ))
                                  )}
                                  <button
                                    type="button"
                                    className={`mx-1 rounded-full text-[0.48em] align-[0.2em] text-[#937a42] hover:bg-emerald-500/15 hover:text-emerald-800 ${
                                      isActiveAyah ? 'bg-emerald-500/15 text-emerald-800' : ''
                                    }`}
                                    aria-label={`Play ${verse.surahName ?? 'surah'} verse ${verse.number}`}
                                    onClick={() => playVerse(verse, false)}
                                  >
                                    ۝{verse.number}
                                  </button>
                                </span>{' '}
                                {settings.showTranslation && (!hifzMode || isVerseRevealed(surahNumber, verse.number)) && (
                                  <span
                                    className={`mb-3 mt-1 block rounded-md border-l-2 border-[#a78d4c]/45 bg-[#f4eedf]/75 px-2 py-1.5 text-left text-[9px] leading-[1.5] ${
                                      dark
                                        ? 'text-[#526552]'
                                        : 'text-[#687361]'
                                    }`}
                                    dir="ltr"
                                    lang={settings.language}
                                  >
                                    {verse.translation || 'Translation unavailable.'}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                        <footer className="absolute inset-x-8 bottom-4 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6c7654] sm:inset-x-12 sm:bottom-5">
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#a78d4c]/45" aria-hidden="true" />
                          <span className="max-w-[55%] truncate">{mushafPage.verses[0]?.surahName ?? 'Al-Qur’an'}</span>
                          <span className="grid h-8 min-w-8 place-items-center rounded-full border border-[#a78d4c]/55 bg-[#f5edda] px-2 text-[10px] tabular-nums text-[#596743]">{mushafPage.page}</span>
                          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#a78d4c]/45" aria-hidden="true" />
                        </footer>
                      </article>
                    )}
                </section>
              )}

              {visibleChapter && !chapterLoading && settings.viewMode === 'reader' && (
                <div className="space-y-3">
                  {visibleChapter.verses.map((verse) => {
                    const isBookmarked =
                      bookmarks.some(
                        (item) => item.surah === settings.surah && item.ayah === verse.number,
                      );
                    const isPlaying = activeAyah === verse.number && shouldPlay;
                    const isActiveAyah =
                      activeSurah === (verse.surahNumber ?? settings.surah) &&
                      activeAyah === verse.number &&
                      Boolean(activeAudio);
                    const arabicWords = verse.arabic.trim().split(/\s+/);
                    const isVeiled = hifzMode && !isVerseRevealed(settings.surah, verse.number);

                    if (isVeiled) {
                      return (
                        <article
                          id={`quran-ayah-${verse.number}`}
                          data-ayah={verse.number}
                          data-surah={settings.surah}
                          data-ayah-key={`${settings.surah}:${verse.number}`}
                          key={verse.number}
                          className={`rounded-2xl border p-4 transition-all sm:p-6 ${card}`}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                              dark ? 'bg-emerald-300/10 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {verse.number}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                              Hifz Recite · Veiled
                            </span>
                          </div>

                          <div
                            onClick={() => toggleRevealVerse(settings.surah, verse.number)}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-8 text-center transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
                          >
                            <div className="select-none filter blur-md opacity-20 pointer-events-none" aria-hidden="true">
                              <p className="font-arabic text-3xl" dir="rtl" lang="ar">
                                {verse.arabic}
                              </p>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform group-hover:scale-105 dark:bg-emerald-400 dark:text-emerald-950"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Ayah {verse.number} Hidden · Tap to Reveal & Check</span>
                              </button>
                              <span className="mt-2 text-[11px] text-[var(--app-muted)]">
                                Recite first from memory, then verify
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <article
                        id={`quran-ayah-${verse.number}`}
                        data-ayah={verse.number}
                        data-surah={settings.surah}
                        data-ayah-key={`${settings.surah}:${verse.number}`}
                        key={verse.number}
                        aria-current={isActiveAyah ? 'true' : undefined}
                        className={`rounded-2xl border p-4 transition-colors sm:p-6 ${
                          isActiveAyah
                            ? dark
                              ? 'border-emerald-300/40 bg-emerald-300/[0.07]'
                              : 'border-emerald-500/40 bg-emerald-50'
                            : card
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                            dark ? 'bg-emerald-300/10 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {verse.number}
                          </span>
                          <div className="flex items-center gap-2">
                            {hifzMode && (
                              <button
                                type="button"
                                onClick={() => toggleRevealVerse(settings.surah, verse.number)}
                                className="rounded-full border border-[var(--app-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--app-muted)] hover:text-[var(--app-ink)] transition-colors"
                                title="Hide verse again for memorization testing"
                              >
                                <EyeOff className="mr-1 inline h-3 w-3" /> Hide
                              </button>
                            )}
                            {verse.audio && (
                              <button
                                type="button"
                                onClick={() => playVerse(verse)}
                                className={`min-h-10 rounded-full border px-3 text-xs font-medium ${
                                  dark
                                    ? 'border-white/10 text-stone-300 hover:bg-white/5'
                                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                                }`}
                                aria-label={`${isPlaying ? 'Pause' : 'Play'} verse ${verse.number}`}
                              >
                                {isPlaying ? <><Pause className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Pause</> : <><Headphones className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Listen</>}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => saveBookmark(verse.number)}
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
                              className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${
                                isBookmarked
                                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-700'
                                  : dark
                                    ? 'border-white/10 text-stone-400'
                                    : 'border-stone-200 text-stone-500'
                              }`}
                            >
                              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <p
                          className="scroll-mt-6 [overflow-wrap:anywhere] font-arabic text-right leading-[2.15]"
                          dir="rtl"
                          lang="ar"
                          style={{ fontSize: `${settings.arabicFontSize}px` }}
                        >
                          {arabicWords.map((word, index) => (
                            <span
                              key={`${verse.number}-${index}`}
                              data-word-key={`${settings.surah}:${verse.number}:${index}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleWordClick(settings.surah, verse.number, index, word);
                              }}
                              title="Tap for root meaning & pronunciation"
                              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-emerald-500/20 hover:text-emerald-950 dark:hover:text-emerald-100 ${
                                isActiveAyah && activeWordIndex === index && activeAudio
                                  ? dark
                                    ? 'rounded bg-emerald-300/25 text-emerald-100'
                                    : 'rounded bg-emerald-200 text-emerald-950'
                                  : ''
                              }`}
                            >
                              {word}{index < arabicWords.length - 1 ? ' ' : ''}
                            </span>
                          ))}{' '}
                          <span className={`font-ui text-sm ${
                            dark ? 'text-emerald-200' : 'text-emerald-800'
                          }`}>
                            ۝{verse.number}
                          </span>
                        </p>

                        {settings.showTranslation && (
                          <p className={`mt-4 border-t pt-4 text-sm leading-7 sm:text-base ${
                            dark ? 'border-white/[0.08] text-stone-300' : 'border-stone-100 text-stone-600'
                          }`}>
                            {verse.translation || 'No translation is available for this verse.'}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <QuranTrackerModal
              dark={dark}
              isOpen={trackerOpen}
              onClose={() => setTrackerOpen(false)}
              initialSurahNumber={settings.surah}
            />

            {settingsOpen && (
              <div
                className="fixed inset-0 z-[60] flex items-end bg-stone-950/45 backdrop-blur-sm min-[900px]:items-stretch min-[900px]:justify-end"
                onClick={(event) => {
                  if (event.target === event.currentTarget) setSettingsOpen(false);
                }}
              >
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="quran-settings-title"
                className={`max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl min-[900px]:h-full min-[900px]:max-h-none min-[900px]:w-[27rem] min-[900px]:rounded-none min-[900px]:rounded-l-3xl ${
                  dark
                    ? 'border-white/10 bg-[#14211e] text-stone-100'
                    : 'border-stone-200 bg-white text-stone-800'
                }`}
              >
              <div className={`sticky top-0 z-10 -mx-5 -mt-5 mb-5 flex items-center justify-between border-b px-5 py-4 ${
                dark ? 'border-white/10 bg-[#0d1715]' : 'border-stone-200 bg-[var(--app-surface)]'
              }`}>
                <div>
                  <h2 id="quran-settings-title" className="text-base font-semibold">Reader settings</h2>
                  <p className={`mt-0.5 text-xs ${muted}`}>Personalize reading and recitation</p>
                </div>
                <button
                  type="button"
                  ref={settingsCloseButtonRef}
                  aria-label="Close Quran settings"
                  onClick={() => setSettingsOpen(false)}
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${card}`}
                >
                  ×
                </button>
              </div>
              <section className={`mb-5 rounded-2xl border p-4 ${card}`}>
                <label className="block text-xs font-medium">
                  Daily verse goal
                  <span className={`mt-1 block text-[11px] font-normal ${muted}`}>Choose how many verses you want to read each day.</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={dailyGoal}
                    aria-label="Daily verse goal"
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isInteger(value) && value >= 1 && value <= 500) {
                        setDailyGoal(value);
                      }
                    }}
                    className={`${selectClass} mt-2`}
                  />
                </label>
              </section>
              <section aria-label="Saved Quran bookmarks">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Bookmarks</h2>
                  <span className={`text-xs ${muted}`}>{bookmarks.length}</span>
                </div>
                {bookmarks.length === 0 ? (
                  <p className={`mt-2 inline-flex items-center gap-1.5 text-xs ${muted}`}><Bookmark className="h-3.5 w-3.5" aria-hidden="true" /> Save a verse to find it here.</p>
                ) : (
                  <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                    {bookmarks.map((item) => {
                      const surah = surahs.find((entry) => entry.number === item.surah);
                      return (
                        <li
                          key={`${item.surah}:${item.ayah}`}
                          className={`flex items-center gap-2 rounded-xl border p-2 ${
                            dark ? 'border-white/[0.08]' : 'border-stone-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              openLocation(item);
                              setSettingsOpen(false);
                            }}
                            className="min-h-9 min-w-0 flex-1 text-left text-xs font-medium"
                          >
                            {surah?.englishName ?? `Surah ${item.surah}`} · Verse {item.ayah}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(item)}
                            aria-label={`Remove bookmark for ${surah?.englishName ?? `Surah ${item.surah}`} verse ${item.ayah}`}
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base ${muted}`}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
              <div className={`my-4 border-t ${dark ? 'border-white/[0.08]' : 'border-stone-100'}`} />
              <section className="quran-settings" aria-labelledby="quran-preferences-title">
                <h2 id="quran-preferences-title" className="text-sm font-semibold">
                  Reading preferences
                </h2>
                <p className={`mt-1 text-xs ${muted}`}>
                  Set up your translation, recitation, and display.
                </p>
                <div className="mt-5 space-y-4">
                  <label className="block text-xs font-medium">
                    Translation language
                    <select
                      className={`${selectClass} mt-1.5`}
                      value={settings.language}
                      onChange={(event) => {
                        updateSetting('language', event.target.value);
                        stopPlayback();
                      }}
                      disabled={catalogLoading || languageOptions.length === 0}
                    >
                      {languageOptions.map((language) => (
                        <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={language} value={language}>{languageName(language)}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium">
                    Translation
                    <select
                      className={`${selectClass} mt-1.5`}
                      value={settings.translation}
                      onChange={(event) => {
                        updateSetting('translation', event.target.value);
                        stopPlayback();
                      }}
                      disabled={translationsLanguage !== settings.language || translations.length === 0}
                    >
                      {translations.map((edition) => (
                        <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={edition.identifier} value={edition.identifier}>
                          {labelForEdition(edition)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium">
                    Reciter
                    <select
                      className={`${selectClass} mt-1.5`}
                      value={settings.reciter}
                      onChange={(event) => {
                        updateSetting('reciter', event.target.value);
                        stopPlayback();
                      }}
                    >
                      {reciters.map((edition) => (
                        <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={edition.identifier} value={edition.identifier}>
                          {labelForEdition(edition)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-medium">
                    Recitation mode
                    <select
                      className={`${selectClass} mt-1.5`}
                      value={settings.playbackMode}
                      onChange={(event) =>
                        updateSetting(
                          'playbackMode',
                          event.target.value === 'surah' ? 'surah' : 'verse',
                        )
                      }
                    >
                      <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" value="verse">Single verse</option>
                      <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" value="surah">Continuous full surah</option>
                    </select>
                    <span className={`mt-1 block text-[11px] font-normal ${muted}`}>
                      Continuous mode plays from the selected verse through the end of the surah.
                    </span>
                  </label>

                  <label className={`flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-sm ${
                    dark ? 'border-white/[0.08]' : 'border-stone-100'
                  }`}>
                    Repeat current verse
                    <input
                      type="checkbox"
                      checked={settings.repeatVerse}
                      onChange={(event) => updateSetting('repeatVerse', event.target.checked)}
                      className="h-4 w-4 accent-emerald-700"
                    />
                  </label>

                  <label className="block text-xs font-medium">
                    Arabic text size
                    <span className={`mt-1 flex items-center gap-3 text-xs ${muted}`}>
                      <input
                        type="range"
                        min={24}
                        max={48}
                        step={2}
                        value={settings.arabicFontSize}
                        onChange={(event) => updateSetting('arabicFontSize', Number(event.target.value))}
                        className="w-full accent-emerald-700"
                      />
                      {settings.arabicFontSize}px
                    </span>
                  </label>

                  <label className={`flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-sm ${
                    dark ? 'border-white/[0.08]' : 'border-stone-100'
                  }`}>
                    Show translation
                    <input
                      type="checkbox"
                      checked={settings.showTranslation}
                      onChange={(event) => updateSetting('showTranslation', event.target.checked)}
                      className="h-4 w-4 accent-emerald-700"
                    />
                  </label>
                  <label className={`flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-sm ${
                    dark ? 'border-white/[0.08]' : 'border-stone-100'
                  }`}>
                    Play next verse
                    <input
                      type="checkbox"
                      checked={settings.autoPlayNext}
                      onChange={(event) => updateSetting('autoPlayNext', event.target.checked)}
                      className="h-4 w-4 accent-emerald-700"
                    />
                  </label>
                </div>
              </section>
              {catalogLoading && <p className={`mt-4 text-xs ${muted}`}>Loading reciters and translations…</p>}
              {!catalogError && !catalogLoading && translationsLanguage === settings.language && translations.length === 0 && (
                <p role="status" className="mt-4 text-xs text-emerald-700">No text translations were found for this language.</p>
              )}
              <p className={`mt-5 border-t pt-4 text-xs leading-5 ${
                dark ? 'border-white/[0.08] text-stone-500' : 'border-stone-100 text-stone-500'
              }`}>
                Quran text, translations, and verse recitations provided by{' '}
                <a
                  className="underline underline-offset-2"
                  href="https://alquran.cloud/"
                  target="_blank"
                  rel="noreferrer"
                >
                  AlQuran Cloud
                </a>.
              </p>
              </aside>
              </div>
            )}
          </div>
        </div>
        {activeAudio && activeAyah !== null && (
          <>
          <section
            className={`fixed inset-x-3 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-[50] grid grid-cols-2 items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] p-3 shadow-[0_14px_40px_rgb(17_43_34/16%)] backdrop-blur-xl min-[900px]:bottom-5 min-[900px]:left-1/2 min-[900px]:right-auto min-[900px]:w-[min(calc(100vw-4rem),58rem)] min-[900px]:-translate-x-1/2 min-[900px]:grid-cols-[minmax(0,1fr)_auto_auto_minmax(12rem,0.9fr)] min-[900px]:gap-4 ${
              dark ? 'text-stone-100' : 'text-stone-800'
            }`}
            aria-label="Quran audio player"
          >
            <audio
              className="hidden"
              ref={audioRef}
              preload="metadata"
              src={activeAudio}
              onEnded={handleAudioEnded}
              onTimeUpdate={updatePlaybackPosition}
              onLoadedMetadata={updatePlaybackPosition}
              onDurationChange={updatePlaybackPosition}
              onPlay={() => setShouldPlay(true)}
              onError={() => setAudioError('This recitation could not be loaded. Try another reciter or check your connection.')}
            />
            <div className="col-span-1 grid min-w-0 gap-0.5 min-[900px]:col-span-1">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm font-semibold">
                {surahs.find((item) => item.number === activeSurah)?.englishName ?? 'The Noble Qur’an'}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
                Verse {activeAyah} · {reciters.find((item) => item.identifier === settings.reciter)?.englishName ?? 'Selected reciter'}
              </span>
            </div>
            <label className="col-span-1 flex items-center justify-self-end gap-1.5 whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400 min-[900px]:col-span-1 min-[900px]:justify-self-start">
              <span className="hidden sm:inline">Speed</span>
              <select
                className="min-h-8 rounded-lg border border-[var(--app-line)] bg-[var(--app-surface)] px-2 text-xs text-[var(--app-ink)]"
                aria-label="Playback speed"
                value={settings.playbackRate}
                onChange={(event) => updateSetting('playbackRate', Number(event.target.value))}
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option className="bg-white text-stone-900 dark:bg-[#14211e] dark:text-stone-100" key={rate} value={rate}>{rate}×</option>
                ))}
              </select>
            </label>
            <div className="col-span-2 flex items-center justify-center gap-2 min-[900px]:col-span-1 min-[900px]:justify-start">
              <button
                type="button"
                className={`flex h-9 items-center gap-1 rounded-full px-2 text-xs font-bold transition-all ${
                  settings.repeatVerse || repeatCountTarget > 1 || repeatCountTarget === -1 || rangeLoopActive
                    ? 'bg-emerald-500/20 text-emerald-800 ring-1 ring-emerald-500/40 dark:text-emerald-200'
                    : 'text-current hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                aria-label="Loop & Repeat options"
                title="Loop & Repeat options"
                onClick={() => setRepeatModalOpen(true)}
              >
                <Repeat2 className="h-4 w-4" aria-hidden="true" />
                {rangeLoopActive ? (
                  <span className="text-[10px] tabular-nums font-mono">
                    {rangeStartAyah}–{rangeEndAyah}
                  </span>
                ) : repeatCountTarget > 1 ? (
                  <span className="text-[10px] tabular-nums font-mono">{repeatCountTarget}×</span>
                ) : repeatCountTarget === -1 || settings.repeatVerse ? (
                  <span className="text-[10px] tabular-nums">∞</span>
                ) : null}
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous verse"
                onClick={() => playAdjacentVerse(-1)}
                disabled={playbackVerseIndex <= 0}
              >
                <SkipBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-emerald-800 text-sm text-white dark:bg-emerald-400 dark:text-emerald-950"
                aria-label={shouldPlay ? 'Pause recitation' : 'Play recitation'}
                onClick={() => {
                  if (shouldPlay) {
                    audioRef.current?.pause();
                    setShouldPlay(false);
                  } else {
                    setAudioError('');
                    setShouldPlay(true);
                  }
                }}
              >
                {shouldPlay ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next verse"
                onClick={() => playAdjacentVerse(1)}
                disabled={playbackVerseIndex < 0 || playbackVerseIndex >= playbackVerses.length - 1}
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[10px] tabular-nums text-stone-500 dark:text-stone-400 min-[900px]:col-span-1">
              <span>{formatTime(playbackTime)}</span>
              <input
                className="w-full cursor-pointer accent-emerald-700 disabled:cursor-wait"
                type="range"
                min={0}
                max={playbackDuration || 0}
                step={0.1}
                value={Math.min(playbackTime, playbackDuration || 0)}
                aria-label="Seek recitation"
                disabled={!playbackDuration}
                onChange={(event) => seekPlayback(Number(event.target.value))}
              />
              <span>{formatTime(playbackDuration)}</span>
            </div>
            {audioError && <p role="alert" className="col-span-2 m-0 text-xs text-red-600">{audioError}</p>}
          </section>
          <div aria-hidden="true" className="h-40 min-[900px]:h-24" />
          </>
        )}

        <QuranWordModal
          dark={dark}
          word={selectedWord}
          surahNumber={wordModalLocation?.surah ?? settings.surah}
          ayahNumber={wordModalLocation?.ayah ?? 1}
          onClose={() => {
            setSelectedWord(null);
            setWordModalLocation(null);
          }}
        />

        <QuranLoopModal
          dark={dark}
          isOpen={repeatModalOpen}
          onClose={() => setRepeatModalOpen(false)}
          surahNumber={settings.surah}
          surahName={currentSurah?.englishName ?? 'Surah'}
          totalVerses={currentSurah?.numberOfAyahs ?? visibleChapter?.verses.length ?? 7}
          activeAyah={activeAyah}
          repeatCountTarget={repeatCountTarget}
          onSetRepeatCountTarget={(cnt) => {
            setRepeatCountTarget(cnt);
            updateSetting('repeatVerse', cnt === -1);
          }}
          rangeLoopActive={rangeLoopActive}
          rangeStartAyah={rangeStartAyah}
          rangeEndAyah={rangeEndAyah}
          rangeLoopTarget={rangeLoopTarget}
          onStartRangeLoop={startRangeLoop}
          onStopRangeLoop={stopRangeLoop}
        />
      </AppShell>
    </div>
  );
}
