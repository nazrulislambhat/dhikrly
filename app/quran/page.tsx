'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenText,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  Play,
  Repeat2,
  Settings2,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
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
  ayahs: { number: number; numberInSurah: number; text: string; audio?: string; page?: number }[];
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsCloseButtonRef = useRef<HTMLButtonElement>(null);

  const visibleChapter =
    chapter?.surah.number === settings.surah &&
    chapter.translation === settings.translation &&
    chapter.reciter === settings.reciter &&
    chapter.arabicScript === 'indopak'
      ? chapter
      : null;
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
        if (verses[0]?.page) setMushafPageNumber(verses[0].page);
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
    if (!activeAudio || !shouldPlay || !audioRef.current) return;
    void audioRef.current.play().catch((error: unknown) => {
      console.error('Quran recitation could not be played:', error);
      setShouldPlay(false);
      setAudioError('Audio could not be played. Check your connection and try again.');
    });
  }, [activeAudio, shouldPlay]);

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
    if (Number.isFinite(audio.duration)) setPlaybackDuration(audio.duration);

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
    if (settings.repeatVerse && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch((error: unknown) => {
        console.error('Quran verse repeat could not be played:', error);
        setShouldPlay(false);
        setAudioError('Audio could not be replayed. Check your connection and try again.');
      });
      return;
    }
    const index = playbackVerses.findIndex(
      (verse) => verse.number === activeAyah && verse.surahNumber === activeSurah,
    );
    const candidateNextVerse = playbackVerses[index + 1];
    const nextVerse =
      candidateNextVerse?.surahNumber === activeSurah ? candidateNextVerse : undefined;
    if ((continuousSurah || settings.autoPlayNext) && nextVerse) {
      playVerse(nextVerse, continuousSurah);
    } else if (
      settings.viewMode === 'mushaf' &&
      (continuousSurah || settings.autoPlayNext) &&
      mushafPageNumber < 604
    ) {
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
    mushafPageNumber,
    playbackVerses,
    playVerse,
    settings.autoPlayNext,
    settings.repeatVerse,
    settings.viewMode,
    updatePlaybackPosition,
  ]);

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

  const turnMushafPage = (direction: -1 | 1) => {
    const nextPage = Math.min(604, Math.max(1, mushafPageNumber + direction));
    if (nextPage === mushafPageNumber) return;
    setPageFlipDirection(direction > 0 ? 'next' : 'previous');
    setPendingPagePlayback(false);
    setMushafPageNumber(nextPage);
  };

  const selectViewMode = (viewMode: QuranSettings['viewMode']) => {
    if (viewMode === 'mushaf' && visibleChapter?.verses[0]?.page) {
      setMushafPageNumber(visibleChapter.verses[0].page);
      setPageFlipDirection('next');
    }
    updateSetting('viewMode', viewMode);
  };

  const openLocation = (location: QuranLocation) => {
    if (location.surah !== settings.surah) {
      stopPlayback();
      updateSetting('surah', location.surah);
    }
    setJumpToAyah(location);
  };

  const moveSurah = (direction: -1 | 1) => {
    const next = Math.min(114, Math.max(1, settings.surah + direction));
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
        <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-12 sm:px-6 sm:py-7 lg:px-10">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-emerald-300/70' : 'text-emerald-800/75'}`}>
                The Noble Qur’an
              </p>
              <h1 className={`mt-0.5 truncate font-ui text-2xl font-bold tracking-[-0.045em] sm:text-3xl ${dark ? 'text-stone-900 dark:text-stone-100' : 'text-stone-900'}`}>
                {currentSurah?.englishName ?? 'Read & listen'}
              </h1>
              <p className={`mt-0.5 text-xs ${muted}`}>
                {progress.lastRead && lastReadSurah
                  ? `Last read: ${lastReadSurah.englishName} · Verse ${progress.lastRead.ayah}`
                  : 'Read, listen, and reflect'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
                <h2 className="text-xs font-semibold">Today’s reading</h2>
                <p className={`mt-0.5 text-[11px] ${muted}`}>
                  {todayVerseCount} of {dailyGoal} verses · {goalProgress}% of daily goal
                </p>
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
              {settings.viewMode === 'mushaf' && (
                <p className={`-mt-1 mb-3 text-center text-[11px] ${muted}`}>
                  Indo-Pak Arabic with compact translation
                </p>
              )}

              {settings.viewMode === 'mushaf' && (
                <div
                  className={`mb-5 overflow-hidden rounded-2xl border ${
                    dark
                      ? 'border-white/10 bg-[#14211e] shadow-[0_12px_32px_rgb(0_0_0/18%)]'
                      : 'border-[#d9e3d7] bg-white shadow-[0_12px_32px_rgb(20_48_39/6%)]'
                  }`}
                  aria-label="Mushaf page navigation"
                >
                  <div className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${
                    dark ? 'border-white/[0.07] bg-white/[0.025]' : 'border-stone-100 bg-[#f8faf7]'
                  }`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <BookOpenText className={`h-4 w-4 shrink-0 ${dark ? 'text-emerald-300' : 'text-emerald-800'}`} aria-hidden="true" />
                      <span className={`truncate text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>Mushaf reader</span>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold tabular-nums ${muted}`}>
                      {Math.round((mushafPageNumber / 604) * 100)}% complete
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3 sm:px-4">
                    <button
                      type="button"
                      aria-label="Previous Mushaf page"
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${
                        dark
                          ? 'border-white/10 bg-white/[0.04] text-emerald-200 hover:border-emerald-300/50 hover:bg-emerald-300/10'
                          : 'border-[#dce6da] bg-[#f7faf6] text-emerald-900 hover:border-emerald-700/40 hover:bg-emerald-50'
                      }`}
                      onClick={() => turnMushafPage(-1)}
                      disabled={mushafPageNumber <= 1 || mushafPageLoading}
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <label className="flex min-w-0 items-center justify-center gap-2">
                      <span className={`hidden text-[9px] font-bold uppercase tracking-[0.16em] sm:inline ${muted}`}>Page</span>
                      <input
                        className={`h-10 w-16 rounded-lg border text-center text-sm font-bold tabular-nums outline-none transition focus:border-emerald-600 ${
                          dark
                            ? 'border-white/10 bg-white/[0.05] text-stone-100'
                            : 'border-[#dce6da] bg-white text-stone-800'
                        }`}
                        type="number"
                        min={1}
                        max={604}
                        value={mushafPageNumber}
                        aria-label="Mushaf page number"
                        onChange={(event) => {
                          const nextPage = Number(event.target.value);
                          if (Number.isInteger(nextPage) && nextPage >= 1 && nextPage <= 604) {
                            setPageFlipDirection(nextPage > mushafPageNumber ? 'next' : 'previous');
                            setPendingPagePlayback(false);
                            setMushafPageNumber(nextPage);
                          }
                        }}
                      />
                      <span className={`text-xs ${muted}`}>of 604</span>
                    </label>
                    <button
                      type="button"
                      aria-label="Next Mushaf page"
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${
                        dark
                          ? 'border-white/10 bg-white/[0.04] text-emerald-200 hover:border-emerald-300/50 hover:bg-emerald-300/10'
                          : 'border-[#dce6da] bg-[#f7faf6] text-emerald-900 hover:border-emerald-700/40 hover:bg-emerald-50'
                      }`}
                      onClick={() => turnMushafPage(1)}
                      disabled={mushafPageNumber >= 604 || mushafPageLoading}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className={`h-1 ${dark ? 'bg-white/[0.06]' : 'bg-[#edf1eb]'}`} role="progressbar" aria-label="Mushaf reading position" aria-valuemin={1} aria-valuemax={604} aria-valuenow={mushafPageNumber}>
                    <div
                      className={`h-full transition-[width] duration-300 ${dark ? 'bg-emerald-300' : 'bg-emerald-800'}`}
                      style={{ width: `${(mushafPageNumber / 604) * 100}%` }}
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
                <div className={`mb-4 rounded-2xl border p-5 text-center text-sm ${card} ${muted}`} role="status">
                  Loading this surah and its selected editions…
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
                    <div className={`mx-auto grid min-h-[min(70vh,52rem)] w-[min(100%,44rem)] place-items-center rounded-[1.5rem] border p-6 text-center ${
                      dark ? 'border-[#496657] bg-[#17251f] text-stone-300' : 'border-[#bdcdb7] bg-[#fffdf6] text-stone-600'
                    }`} role="status">
                      <div>
                        <BookOpenText className={`mx-auto mb-3 h-7 w-7 ${dark ? 'text-emerald-300' : 'text-emerald-800'}`} aria-hidden="true" />
                        <p className="text-sm font-semibold">Opening page {mushafPageNumber}</p>
                        <p className={`mt-1 text-xs ${muted}`}>Preparing your reading page…</p>
                      </div>
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
                                  {arabicWords.map((word, wordIndex) => (
                                    <span
                                      key={`${surahNumber}:${verse.number}:${wordIndex}`}
                                      data-word-index={wordIndex}
                                      data-word-key={`${surahNumber}:${verse.number}:${wordIndex}`}
                                      className={`rounded transition-colors duration-100 ${
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
                                  ))}
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
                                {settings.showTranslation && (
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
                              className={
                                isActiveAyah && activeWordIndex === index && activeAudio
                                  ? dark
                                    ? 'rounded bg-emerald-300/25 text-emerald-100'
                                    : 'rounded bg-emerald-200 text-emerald-950'
                                  : undefined
                              }
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

            {settingsOpen && (
              <div
                className="fixed inset-0 z-[60] flex items-end bg-stone-950/45 backdrop-blur-sm lg:items-stretch lg:justify-end"
                onClick={(event) => {
                  if (event.target === event.currentTarget) setSettingsOpen(false);
                }}
              >
              <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="quran-settings-title"
                className={`max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl lg:h-full lg:max-h-none lg:w-[27rem] lg:rounded-none lg:rounded-l-3xl ${
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
            className={`fixed inset-x-3 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-[50] grid grid-cols-2 items-center gap-x-3 gap-y-1 rounded-2xl border border-[var(--app-line)] bg-[color-mix(in_srgb,var(--app-surface)_78%,transparent)] p-3 shadow-[0_14px_40px_rgb(17_43_34/16%)] backdrop-blur-xl lg:bottom-5 lg:left-1/2 lg:right-auto lg:w-[min(calc(100vw-4rem),58rem)] lg:-translate-x-1/2 lg:grid-cols-[minmax(0,1fr)_auto_auto_minmax(12rem,0.9fr)] lg:gap-4 ${
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
            <div className="col-span-2 grid min-w-0 gap-0.5 lg:col-span-1">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
                {surahs.find((item) => item.number === activeSurah)?.englishName ?? 'The Noble Qur’an'}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400">
                Verse {activeAyah} · {reciters.find((item) => item.identifier === settings.reciter)?.englishName ?? 'Selected reciter'}
              </span>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-1 lg:col-span-1 lg:justify-start">
              <button
                type="button"
                className={`grid h-9 w-9 place-items-center rounded-full text-base ${
                  settings.repeatVerse
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : 'text-current'
                }`}
                aria-label={settings.repeatVerse ? 'Turn off verse repeat' : 'Repeat current verse'}
                aria-pressed={settings.repeatVerse}
                title={settings.repeatVerse ? 'Repeat verse on' : 'Repeat verse off'}
                onClick={() => updateSetting('repeatVerse', !settings.repeatVerse)}
              >
                <Repeat2 className="h-4 w-4" aria-hidden="true" />
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
            <label className="col-span-2 flex items-center justify-self-end gap-2 whitespace-nowrap text-[11px] text-stone-500 dark:text-stone-400 lg:col-span-1 lg:justify-self-start">
              <span>Speed</span>
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
            <div className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[10px] tabular-nums text-stone-500 dark:text-stone-400 lg:col-span-1">
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
          <div aria-hidden="true" className="h-40 lg:h-24" />
          </>
        )}
      </AppShell>
    </div>
  );
}
