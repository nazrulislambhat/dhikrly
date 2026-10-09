'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  verses: QuranVerse[];
}

interface QuranEditionSurah extends QuranSurah {
  edition: QuranEdition;
  ayahs: { number: number; numberInSurah: number; text: string; audio?: string }[];
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
  const [continuousSurah, setContinuousSurah] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState('');
  const [jumpToAyah, setJumpToAyah] = useState<QuranLocation | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsCloseButtonRef = useRef<HTMLButtonElement>(null);

  const visibleChapter =
    chapter?.surah.number === settings.surah &&
    chapter.translation === settings.translation &&
    chapter.reciter === settings.reciter
      ? chapter
      : null;

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
        }));
        const loadedChapter = {
          surah: activeSurah,
          translation: settings.translation,
          reciter: settings.reciter,
          verses,
        };
        setChapter(loadedChapter);
        save(QURAN_CACHE_KEY, loadedChapter);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not load the selected Quran surah:', error);
        const cached = load<ChapterCache | null>(QURAN_CACHE_KEY, null);
        if (
          cached?.surah.number === settings.surah &&
          cached.translation === settings.translation &&
          cached.reciter === settings.reciter
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
      document
        .getElementById(`quran-ayah-${activeAyah}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeAyah, shouldPlay, settings.surah]);

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
        if (current && Number.isInteger(ayah)) {
          recordRead({ surah: visibleChapter.surah.number, ayah });
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    document.querySelectorAll<HTMLElement>('[data-ayah]').forEach((element) => {
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, [chapterLoading, recordRead, visibleChapter]);

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
    setShouldPlay(false);
    setContinuousSurah(false);
  };

  const playVerse = useCallback((verse: QuranVerse, continuous = settings.playbackMode === 'surah') => {
    if (!verse.audio) {
      setAudioError('Audio is not available for this verse.');
      return;
    }
    if (activeAyah === verse.number && shouldPlay) {
      audioRef.current?.pause();
      setShouldPlay(false);
      return;
    }
    setAudioError('');
    setActiveAyah(verse.number);
    setActiveAudio(verse.audio);
    setShouldPlay(true);
    setContinuousSurah(continuous);
    recordRead({ surah: settings.surah, ayah: verse.number });
  }, [activeAyah, recordRead, settings.playbackMode, settings.surah, shouldPlay]);

  const playFullSurah = () => {
    const firstVerse = visibleChapter?.verses[0];
    if (firstVerse) playVerse(firstVerse, true);
  };

  const updatePlaybackPosition = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setPlaybackTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) setPlaybackDuration(audio.duration);

    const verse = visibleChapter?.verses.find((item) => item.number === activeAyah);
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
  }, [activeAyah, visibleChapter]);

  const seekPlayback = (time: number) => {
    if (!audioRef.current || !Number.isFinite(time)) return;
    audioRef.current.currentTime = time;
    updatePlaybackPosition();
  };

  const playAdjacentVerse = (direction: -1 | 1) => {
    const verses = visibleChapter?.verses ?? [];
    const currentIndex = verses.findIndex((verse) => verse.number === activeAyah);
    const nextVerse = verses[currentIndex + direction];
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
    const verses = visibleChapter?.verses ?? [];
    const index = verses.findIndex((verse) => verse.number === activeAyah);
    const nextVerse = verses[index + 1];
    if ((continuousSurah || settings.autoPlayNext) && nextVerse) {
      playVerse(nextVerse, continuousSurah);
    } else {
      setShouldPlay(false);
      setContinuousSurah(false);
      updatePlaybackPosition();
    }
  }, [activeAyah, continuousSurah, playVerse, settings.autoPlayNext, settings.repeatVerse, updatePlaybackPosition, visibleChapter]);

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
  const selectClass = `min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-amber-400 ${
    dark
      ? 'border-white/10 bg-[#14211e] text-stone-100'
      : 'border-stone-200 bg-white text-stone-800'
  }`;

  return (
    <div className={`quran-page ${dark ? 'min-h-screen bg-[#0d1715] text-stone-200' : 'min-h-screen bg-stone-50 text-stone-800'}`}>
      <AppShell
        active="quran"
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-12 sm:px-6 sm:py-7 lg:px-10">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>
                The Noble Qur’an
              </p>
              <h1 className={`mt-0.5 truncate font-serif text-2xl font-semibold sm:text-3xl ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
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
                ⚙
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
                className="h-full rounded-full bg-amber-500 transition-[width]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </section>

          {catalogError && (
            <div role="alert" className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-500">
              {catalogError}
            </div>
          )}

          <div className="quran-layout">
            <section className="quran-reader min-w-0" aria-label="Quran reader">
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
                    <option key={surah.number} value={surah.number}>
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
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next surah"
                  className={`h-11 w-11 rounded-xl border text-lg ${card} disabled:opacity-40`}
                  onClick={() => moveSurah(1)}
                  disabled={settings.surah >= 114}
                >
                  →
                </button>
              </div>

              {visibleChapter && (
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
                        ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                        : 'border-amber-700/20 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {continuousSurah && shouldPlay ? 'Ⅱ Playing full surah' : '▶ Play full surah'}
                  </button>
                </div>
              )}

              {chapterLoading && (
                <div className={`mb-4 rounded-2xl border p-5 text-center text-sm ${card} ${muted}`} role="status">
                  Loading this surah and its selected editions…
                </div>
              )}
              {chapterError && (
                <div role="status" className={`mb-4 rounded-2xl border p-4 text-sm ${card} ${muted}`}>
                  {chapterError}
                </div>
              )}

              {visibleChapter && !chapterLoading && (
                <div className="space-y-3">
                  {visibleChapter.verses.map((verse) => {
                    const isBookmarked =
                      bookmarks.some(
                        (item) => item.surah === settings.surah && item.ayah === verse.number,
                      );
                    const isPlaying = activeAyah === verse.number && shouldPlay;
                    const isActiveAyah = activeAyah === verse.number && Boolean(activeAudio);
                    const arabicWords = verse.arabic.trim().split(/\s+/);
                    return (
                      <article
                        id={`quran-ayah-${verse.number}`}
                        data-ayah={verse.number}
                        key={verse.number}
                        aria-current={isActiveAyah ? 'true' : undefined}
                        className={`rounded-2xl border p-4 transition-colors sm:p-6 ${
                          isActiveAyah
                            ? dark
                              ? 'border-amber-300/40 bg-amber-300/[0.07]'
                              : 'border-amber-500/40 bg-amber-50'
                            : card
                        }`}
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                            dark ? 'bg-amber-300/10 text-amber-200' : 'bg-amber-100 text-amber-800'
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
                                {isPlaying ? 'Ⅱ Pause' : '▶ Listen'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => saveBookmark(verse.number)}
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
                              className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${
                                isBookmarked
                                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-500'
                                  : dark
                                    ? 'border-white/10 text-stone-400'
                                    : 'border-stone-200 text-stone-500'
                              }`}
                            >
                              {isBookmarked ? '★' : '☆'}
                            </button>
                          </div>
                        </div>

                        <p
                          className="quran-ayah-text font-arabic text-right leading-[2.15]"
                          dir="rtl"
                          lang="ar"
                          style={{ fontSize: `${settings.arabicFontSize}px` }}
                        >
                          {arabicWords.map((word, index) => (
                            <span
                              key={`${verse.number}-${index}`}
                              className={
                                isActiveAyah && activeWordIndex === index && shouldPlay
                                  ? dark
                                    ? 'rounded bg-amber-300/25 text-amber-100'
                                    : 'rounded bg-amber-200 text-amber-950'
                                  : undefined
                              }
                            >
                              {word}{index < arabicWords.length - 1 ? ' ' : ''}
                            </span>
                          ))}{' '}
                          <span className={`font-ui text-sm ${
                            dark ? 'text-amber-200' : 'text-amber-800'
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
                className={`max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-2xl lg:h-full lg:max-h-none lg:w-[27rem] lg:rounded-none lg:rounded-l-3xl ${card}`}
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
                  <p className={`mt-2 text-xs ${muted}`}>Save a verse with ☆ to find it here.</p>
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
                        <option key={language} value={language}>{languageName(language)}</option>
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
                        <option key={edition.identifier} value={edition.identifier}>
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
                        <option key={edition.identifier} value={edition.identifier}>
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
                      <option value="verse">Single verse</option>
                      <option value="surah">Continuous full surah</option>
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
                      className="h-4 w-4 accent-amber-600"
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
                        className="w-full accent-amber-600"
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
                      className="h-4 w-4 accent-amber-600"
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
                      className="h-4 w-4 accent-amber-600"
                    />
                  </label>
                </div>
              </section>
              {catalogLoading && <p className={`mt-4 text-xs ${muted}`}>Loading reciters and translations…</p>}
              {!catalogError && !catalogLoading && translationsLanguage === settings.language && translations.length === 0 && (
                <p role="status" className="mt-4 text-xs text-amber-600">No text translations were found for this language.</p>
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
        {activeAudio && visibleChapter && activeAyah !== null && (
          <section
            className={`quran-player ${dark ? 'quran-player-dark' : ''}`}
            aria-label="Quran audio player"
          >
            <audio
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
            <div className="quran-player-info">
              <span className="quran-player-surah">{visibleChapter.surah.englishName}</span>
              <span className="quran-player-meta">
                Verse {activeAyah} · {reciters.find((item) => item.identifier === settings.reciter)?.englishName ?? 'Selected reciter'}
              </span>
            </div>
            <div className="quran-player-controls">
              <button
                type="button"
                className={settings.repeatVerse ? 'is-active' : undefined}
                aria-label={settings.repeatVerse ? 'Turn off verse repeat' : 'Repeat current verse'}
                aria-pressed={settings.repeatVerse}
                title={settings.repeatVerse ? 'Repeat verse on' : 'Repeat verse off'}
                onClick={() => updateSetting('repeatVerse', !settings.repeatVerse)}
              >
                ↻
              </button>
              <button
                type="button"
                className="quran-player-skip"
                aria-label="Previous verse"
                onClick={() => playAdjacentVerse(-1)}
                disabled={activeAyah <= 1}
              >
                ↶
              </button>
              <button
                type="button"
                className="quran-player-play"
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
                {shouldPlay ? 'Ⅱ' : '▶'}
              </button>
              <button
                type="button"
                className="quran-player-skip"
                aria-label="Next verse"
                onClick={() => playAdjacentVerse(1)}
                disabled={activeAyah >= visibleChapter.verses.length}
              >
                ↷
              </button>
            </div>
            <label className="quran-player-speed">
              <span>Speed</span>
              <select
                aria-label="Playback speed"
                value={settings.playbackRate}
                onChange={(event) => updateSetting('playbackRate', Number(event.target.value))}
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>{rate}×</option>
                ))}
              </select>
            </label>
            <div className="quran-player-progress">
              <span>{formatTime(playbackTime)}</span>
              <input
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
            {audioError && <p role="alert" className="quran-player-error">{audioError}</p>}
          </section>
        )}
      </AppShell>
    </div>
  );
}
