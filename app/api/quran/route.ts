import { NextResponse } from 'next/server';
import type { QuranEdition } from '@/lib/quran';
import { DEFAULT_RECITERS } from '@/lib/quran';
import surahsData from '@/data/surahs.json';

const API_BASE = 'https://api.alquran.cloud/v1';
const DAY = 60 * 60 * 24;

interface ApiEnvelope<T> {
  code: number;
  status: string;
  data: T;
}

interface ApiErrorEnvelope {
  status?: string;
  data?: string;
}

interface QuranComIndopakVerse {
  verse_key: string;
  text_indopak: string;
}

function isIndopakVerse(value: unknown): value is QuranComIndopakVerse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'verse_key' in value &&
    typeof value.verse_key === 'string' &&
    'text_indopak' in value &&
    typeof value.text_indopak === 'string'
  );
}

interface QuranChapterEdition {
  edition: { identifier: string };
  surah?: unknown;
  ayahs: { number: number; numberInSurah: number; text: string; audio?: string; page: number }[];
}

function normalizeIndopakVerses(verses: QuranComIndopakVerse[]) {
  return verses.map((verse) => ({
    ...verse,
    text_indopak: verse.text_indopak.replace(/[\uE000-\uF8FF]/g, ''),
  }));
}

// Global verse offset helper for audio / global numbers
function getGlobalVerseOffset(surahNumber: number): number {
  let offset = 0;
  for (const s of surahsData) {
    if (s.number < surahNumber) {
      offset += s.numberOfAyahs;
    }
  }
  return offset;
}

async function getUpstream<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const result = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope;
    if ('code' in result && result.code === 200 && 'data' in result) {
      return result.data;
    }
    return null;
  } catch (err) {
    console.warn(`Upstream api.alquran.cloud fetch failed for ${path}:`, err);
    return null;
  }
}

async function getIndopakPage(page: number): Promise<QuranComIndopakVerse[]> {
  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/quran/verses/indopak?page_number=${page}`,
      { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return [];
    const result = (await response.json()) as { verses?: unknown };
    if (!Array.isArray(result.verses) || !result.verses.every(isIndopakVerse)) {
      return [];
    }
    return normalizeIndopakVerses(result.verses);
  } catch {
    return [];
  }
}

async function getIndopakChapter(chapter: number): Promise<QuranComIndopakVerse[]> {
  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/quran/verses/indopak?chapter_number=${chapter}`,
      { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return [];
    const result = (await response.json()) as { verses?: unknown };
    if (!Array.isArray(result.verses) || !result.verses.every(isIndopakVerse)) {
      return [];
    }
    return normalizeIndopakVerses(result.verses);
  } catch {
    return [];
  }
}

// Fallback chapter fetcher using api.quran.com when alquran.cloud is unavailable
async function getChapterFromQuranCom(
  chapterNumber: number,
  translation: string,
  reciter: string,
): Promise<QuranChapterEdition[]> {
  const [uthmaniRes, indopakVerses, pageRes, transRes] = await Promise.all([
    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapterNumber}`, {
      next: { revalidate: DAY },
      signal: AbortSignal.timeout(10_000),
    }).then((r) => r.json()),
    getIndopakChapter(chapterNumber),
    fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${chapterNumber}?fields=page_number&per_page=300`,
      { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) },
    ).then((r) => r.json()),
    fetch(
      `https://api.quran.com/api/v4/quran/translations/20?chapter_number=${chapterNumber}`,
      { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) },
    ).then((r) => r.json()).catch(() => ({ translations: [] })),
  ]);

  const uthmaniList = (uthmaniRes.verses ?? []) as { verse_key: string; text_uthmani: string }[];
  const pageList = (pageRes.verses ?? []) as { verse_key: string; page_number: number }[];
  const translations = (transRes.translations ?? []) as { text: string }[];

  const pageByKey = new Map(pageList.map((v) => [v.verse_key, v.page_number]));
  const indopakByKey = new Map(indopakVerses.map((v) => [v.verse_key, v.text_indopak]));

  const globalOffset = getGlobalVerseOffset(chapterNumber);

  const arabicAyahs = uthmaniList.map((v, i) => {
    const numberInSurah = i + 1;
    const key = `${chapterNumber}:${numberInSurah}`;
    const text = indopakByKey.get(key) || v.text_uthmani;
    const page = pageByKey.get(key) || 1;
    return {
      number: globalOffset + numberInSurah,
      numberInSurah,
      text,
      page,
    };
  });

  const translationAyahs = arabicAyahs.map((ayah, i) => {
    const raw = translations[i]?.text ?? '';
    // Strip footnote annotations like <sup foot_note=195932>1</sup>
    const cleanText = raw.replace(/<sup[^>]*>.*?<\/sup>/gi, '').trim();
    return {
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      text: cleanText || ayah.text,
      page: ayah.page,
    };
  });

  const reciterId = reciter.includes('alafasy') ? 'ar.alafasy' : reciter;
  const audioAyahs = arabicAyahs.map((ayah) => {
    return {
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      text: '',
      audio: `https://cdn.islamic.network/quran/audio/128/${reciterId}/${ayah.number}.mp3`,
      page: ayah.page,
    };
  });

  const surahMeta = surahsData.find((s) => s.number === chapterNumber);

  return [
    { edition: { identifier: 'quran-uthmani' }, surah: surahMeta, ayahs: arabicAyahs },
    { edition: { identifier: translation }, surah: surahMeta, ayahs: translationAyahs },
    { edition: { identifier: reciter }, surah: surahMeta, ayahs: audioAyahs },
  ];
}

const FALLBACK_TRANSLATIONS: QuranEdition[] = [
  { identifier: 'en.sahih', name: 'Saheeh International', englishName: 'Saheeh International', language: 'en', type: 'translation', format: 'text' },
  { identifier: 'en.pickthall', name: 'Pickthall', englishName: 'Pickthall', language: 'en', type: 'translation', format: 'text' },
  { identifier: 'en.yusufali', name: 'Yusuf Ali', englishName: 'Yusuf Ali', language: 'en', type: 'translation', format: 'text' },
  { identifier: 'ur.jalandhry', name: 'Jalandhry', englishName: 'Jalandhry', language: 'ur', type: 'translation', format: 'text' },
  { identifier: 'fr.hamidullah', name: 'Hamidullah', englishName: 'Muhammad Hamidullah', language: 'fr', type: 'translation', format: 'text' },
  { identifier: 'id.indonesian', name: 'Indonesian Ministry', englishName: 'Indonesian Ministry of Religious Affairs', language: 'id', type: 'translation', format: 'text' },
  { identifier: 'tr.diyanet', name: 'Diyanet Isleri', englishName: 'Diyanet Isleri', language: 'tr', type: 'translation', format: 'text' },
];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const resource = params.get('resource');

  try {
    if (resource === 'surahs') {
      // Return static reliable data (all 114 surahs)
      return NextResponse.json(surahsData);
    }

    if (resource === 'languages') {
      const data = await getUpstream<string[]>('/edition/language', DAY);
      if (data && data.length > 0) return NextResponse.json(data);
      return NextResponse.json(['en', 'ar', 'ur', 'fr', 'id', 'tr', 'es', 'de', 'ru', 'bn', 'hi', 'ms']);
    }

    if (resource === 'translations') {
      const language = params.get('language') ?? 'en';
      if (!/^[a-z]{2,3}$/i.test(language)) {
        return NextResponse.json({ error: 'Invalid language code.' }, { status: 400 });
      }
      const editions = await getUpstream<QuranEdition[]>(
        `/edition/language/${encodeURIComponent(language)}`,
        DAY,
      );
      if (editions && editions.length > 0) {
        const data = editions.filter(
          (edition) => edition.type === 'translation' && edition.format === 'text',
        );
        if (data.length > 0) return NextResponse.json(data);
      }
      const filtered = FALLBACK_TRANSLATIONS.filter((e) => e.language === language.toLowerCase());
      return NextResponse.json(filtered.length > 0 ? filtered : FALLBACK_TRANSLATIONS);
    }

    if (resource === 'reciters') {
      const editions = await getUpstream<QuranEdition[]>('/edition/format/audio', DAY);
      if (editions && editions.length > 0) {
        const data = editions.filter((edition) => edition.language === 'ar');
        if (data.length > 0) return NextResponse.json(data);
      }
      return NextResponse.json(DEFAULT_RECITERS);
    }

    if (resource === 'chapter') {
      const number = Number(params.get('number'));
      const translation = params.get('translation') ?? 'en.sahih';
      const reciter = params.get('reciter') ?? 'ar.alafasy';
      if (!Number.isInteger(number) || number < 1 || number > 114) {
        return NextResponse.json({ error: 'Surah number must be from 1 to 114.' }, { status: 400 });
      }

      // Try upstream first
      const editions = [
        'quran-uthmani',
        encodeURIComponent(translation),
        encodeURIComponent(reciter),
      ].join(',');

      const upstreamData = await getUpstream<QuranChapterEdition[]>(
        `/surah/${number}/editions/${editions}`,
        DAY,
      );

      if (upstreamData && upstreamData.length >= 3) {
        const arabic = upstreamData.find((ed) => ed.edition.identifier === 'quran-uthmani');
        if (arabic) {
          const indopak = await getIndopakChapter(number);
          const indopakByVerse = new Map(indopak.map((ayah) => [ayah.verse_key, ayah.text_indopak]));
          const verses = arabic.ayahs.map((ayah) => {
            const text = indopakByVerse.get(`${number}:${ayah.numberInSurah}`) || ayah.text;
            return { ...ayah, text };
          });
          const dataWithIndopak = upstreamData.map((ed) =>
            ed === arabic ? { ...ed, ayahs: verses } : ed,
          );
          return NextResponse.json(dataWithIndopak);
        }
      }

      // Upstream failed or returned 503 — use api.quran.com fallback
      const fallbackData = await getChapterFromQuranCom(number, translation, reciter);
      return NextResponse.json(fallbackData);
    }

    if (resource === 'page') {
      const page = Number(params.get('number'));
      const translation = params.get('translation') ?? 'en.sahih';
      const reciter = params.get('reciter') ?? 'ar.alafasy';
      if (!Number.isInteger(page) || page < 1 || page > 604) {
        return NextResponse.json({ error: 'Mushaf page must be from 1 to 604.' }, { status: 400 });
      }

      const [editions, indopak] = await Promise.all([
        Promise.all([
          getUpstream<unknown>(`/page/${page}/quran-uthmani`, DAY),
          getUpstream<unknown>(`/page/${page}/${encodeURIComponent(translation)}`, DAY),
          getUpstream<unknown>(`/page/${page}/${encodeURIComponent(reciter)}`, DAY),
        ]),
        getIndopakPage(page),
      ]);

      if (editions[0] && editions[1] && editions[2]) {
        return NextResponse.json({ editions, indopak });
      }

      // Fallback via api.quran.com
      const pageRes = await fetch(
        `https://api.quran.com/api/v4/verses/by_page/${page}?words=false&translations=20&fields=text_uthmani,page_number`,
        { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) },
      ).then((r) => r.json());

      const verses = (pageRes.verses ?? []) as {
        id: number;
        verse_number: number;
        verse_key: string;
        text_uthmani: string;
        page_number: number;
        translations?: { text: string }[];
      }[];

      const uthmaniPage = {
        edition: { identifier: 'quran-uthmani' },
        ayahs: verses.map((v) => {
          const sNum = Number(v.verse_key?.split(':')[0]) || 1;
          const surahMeta = surahsData.find((s) => s.number === sNum);
          return {
            number: v.id,
            numberInSurah: v.verse_number,
            text: v.text_uthmani,
            page: v.page_number,
            surah: surahMeta
              ? {
                  number: surahMeta.number,
                  name: surahMeta.name,
                  englishName: surahMeta.englishName,
                  englishNameTranslation: surahMeta.englishNameTranslation,
                  numberOfAyahs: surahMeta.numberOfAyahs,
                  revelationType: surahMeta.revelationType,
                }
              : undefined,
          };
        }),
      };

      const translationPage = {
        edition: { identifier: translation },
        ayahs: verses.map((v) => {
          const sNum = Number(v.verse_key?.split(':')[0]) || 1;
          const surahMeta = surahsData.find((s) => s.number === sNum);
          return {
            number: v.id,
            numberInSurah: v.verse_number,
            text: (v.translations?.[0]?.text ?? '').replace(/<sup[^>]*>.*?<\/sup>/gi, '').trim(),
            page: v.page_number,
            surah: surahMeta
              ? {
                  number: surahMeta.number,
                  name: surahMeta.name,
                  englishName: surahMeta.englishName,
                  englishNameTranslation: surahMeta.englishNameTranslation,
                  numberOfAyahs: surahMeta.numberOfAyahs,
                  revelationType: surahMeta.revelationType,
                }
              : undefined,
          };
        }),
      };

      const reciterId = reciter.includes('alafasy') ? 'ar.alafasy' : reciter;
      const reciterPage = {
        edition: { identifier: reciter },
        ayahs: verses.map((v) => {
          const sNum = Number(v.verse_key?.split(':')[0]) || 1;
          const surahMeta = surahsData.find((s) => s.number === sNum);
          return {
            number: v.id,
            numberInSurah: v.verse_number,
            text: '',
            audio: `https://cdn.islamic.network/quran/audio/128/${reciterId}/${v.id}.mp3`,
            page: v.page_number,
            surah: surahMeta
              ? {
                  number: surahMeta.number,
                  name: surahMeta.name,
                  englishName: surahMeta.englishName,
                  englishNameTranslation: surahMeta.englishNameTranslation,
                  numberOfAyahs: surahMeta.numberOfAyahs,
                  revelationType: surahMeta.revelationType,
                }
              : undefined,
          };
        }),
      };

      return NextResponse.json({
        editions: [uthmaniPage, translationPage, reciterPage],
        indopak,
      });
    }

    return NextResponse.json({ error: 'Unknown Quran resource.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load Quran data.';
    console.error('Quran API request failed:', message);
    return NextResponse.json(
      { error: message },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
