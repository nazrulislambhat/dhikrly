'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { load, save, SETTINGS_KEY } from '@/lib/storage';
import {
  DEFAULT_QURAN_SETTINGS,
  DEFAULT_RECITERS,
  QURAN_BOOKMARK_KEY,
  QURAN_CACHE_KEY,
  QURAN_SETTINGS_KEY,
  type QuranEdition,
  type QuranSettings,
  type QuranSurah,
  type QuranVerse,
} from '@/lib/quran';

interface QuranBookmark {
  surah: number;
  ayah: number;
}

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

export default function QuranPage() {
  const [dark, setDark] = useState(
    () => load<{ dark: boolean }>(SETTINGS_KEY, { dark: false }).dark,
  );
  const [settings, setSettings] = useState<QuranSettings>(() =>
    load<QuranSettings>(QURAN_SETTINGS_KEY, DEFAULT_QURAN_SETTINGS),
  );
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
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(() =>
    load<QuranBookmark | null>(QURAN_BOOKMARK_KEY, null),
  );
  const [activeAudio, setActiveAudio] = useState('');
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState('');
  const [jumpToAyah, setJumpToAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsRef = useRef<HTMLDetailsElement>(null);

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
    const desktop = window.matchMedia('(min-width: 1024px)');
    const syncSettingsVisibility = () => {
      if (settingsRef.current) settingsRef.current.open = desktop.matches;
    };
    syncSettingsVisibility();
    desktop.addEventListener('change', syncSettingsVisibility);
    return () => desktop.removeEventListener('change', syncSettingsVisibility);
  }, []);

  useEffect(() => {
    save(QURAN_SETTINGS_KEY, settings);
  }, [settings]);

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
    if (!activeAudio || !shouldPlay || !audioRef.current) return;
    void audioRef.current.play().catch((error: unknown) => {
      console.error('Quran recitation could not be played:', error);
      setShouldPlay(false);
      setAudioError('Audio could not be played. Check your connection and try again.');
    });
  }, [activeAudio, shouldPlay]);

  useEffect(() => {
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setActiveWordIndex(null);
  }, [activeAudio]);

  useEffect(() => {
    if (jumpToAyah === null || !visibleChapter) return;
    document
      .getElementById(`quran-ayah-${jumpToAyah}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setJumpToAyah(null);
  }, [jumpToAyah, visibleChapter]);

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
  };

  const playVerse = useCallback((verse: QuranVerse) => {
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
  }, [activeAyah, shouldPlay]);

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
    const verses = visibleChapter?.verses ?? [];
    const index = verses.findIndex((verse) => verse.number === activeAyah);
    const nextVerse = verses[index + 1];
    if (settings.autoPlayNext && nextVerse) {
      playVerse(nextVerse);
    } else {
      setShouldPlay(false);
      updatePlaybackPosition();
    }
  }, [activeAyah, playVerse, settings.autoPlayNext, updatePlaybackPosition, visibleChapter]);

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const saveBookmark = (ayah: number) => {
    if (bookmark?.surah === settings.surah && bookmark.ayah === ayah) {
      setBookmark(null);
      save(QURAN_BOOKMARK_KEY, null);
    } else {
      const next = { surah: settings.surah, ayah };
      setBookmark(next);
      save(QURAN_BOOKMARK_KEY, next);
    }
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
      ? 'border-white/10 bg-[#13253a] text-stone-100'
      : 'border-stone-200 bg-white text-stone-800'
  }`;

  return (
    <div className={dark ? 'min-h-screen bg-[#0c1a2e] text-stone-200' : 'min-h-screen bg-stone-50 text-stone-800'}>
      <AppShell
        active="quran"
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-10 sm:px-6 sm:py-8 lg:px-10">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>
                The Noble Qur’an
              </p>
              <h1 className={`mt-1 font-serif text-3xl sm:text-4xl ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
                Read &amp; listen
              </h1>
              <p className={`mt-1 max-w-xl text-sm ${muted}`}>
                Explore all 114 surahs, listen to trusted reciters, and choose the translation and reading settings that work for you.
              </p>
            </div>
            {bookmark && (
              <button
                type="button"
                onClick={() => {
                  updateSetting('surah', bookmark.surah);
                  setJumpToAyah(bookmark.ayah);
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${card}`}
              >
                Continue · {surahs.find((surah) => surah.number === bookmark.surah)?.englishName ?? `Surah ${bookmark.surah}`} {bookmark.ayah}
              </button>
            )}
          </header>

          {catalogError && (
            <div role="alert" className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-500">
              {catalogError}
            </div>
          )}

          <div className="quran-layout grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
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
                      bookmark?.surah === settings.surah && bookmark.ayah === verse.number;
                    const isPlaying = activeAyah === verse.number && shouldPlay;
                    const isActiveAyah = activeAyah === verse.number && Boolean(activeAudio);
                    const arabicWords = verse.arabic.trim().split(/\s+/);
                    return (
                      <article
                        id={`quran-ayah-${verse.number}`}
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

            <aside className={`quran-settings-card rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-6 ${card}`}>
              <details ref={settingsRef} className="quran-settings">
                <summary className="cursor-pointer list-none text-sm font-semibold">
                  Reading preferences
                  <span className={`ml-2 text-xs font-normal ${muted}`}>Change reciter, translation, and display</span>
                </summary>

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
              </details>
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
