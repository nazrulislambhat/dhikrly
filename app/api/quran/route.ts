import { NextResponse } from 'next/server';
import type { QuranEdition } from '@/lib/quran';

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

async function getUpstream<T>(path: string, revalidate: number): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(15_000),
  });

  let result: ApiEnvelope<T> | ApiErrorEnvelope;
  try {
    result = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope;
  } catch (error) {
    console.error('The Quran data provider returned invalid JSON:', error);
    throw new Error('The Quran data provider returned an unreadable response.');
  }

  if (
    !response.ok ||
    !('code' in result) ||
    result.code !== 200 ||
    !('data' in result)
  ) {
    const reason = 'data' in result ? result.data : undefined;
    throw new Error(
      typeof reason === 'string' ? reason : 'The Quran data provider request failed.',
    );
  }
  return result.data;
}

async function getIndopakPage(page: number): Promise<QuranComIndopakVerse[]> {
  const response = await fetch(
    `https://api.quran.com/api/v4/quran/verses/indopak?page_number=${page}`,
    { next: { revalidate: DAY }, signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) {
    throw new Error('Could not load Indo-Pak Quran text for this page.');
  }

  const result = (await response.json()) as {
    verses?: QuranComIndopakVerse[];
  };
  if (!Array.isArray(result.verses)) {
    throw new Error('The Indo-Pak Quran text provider returned an unreadable response.');
  }
  return result.verses;
}

function isEdition(value: unknown): value is QuranEdition {
  if (typeof value !== 'object' || value === null) return false;
  const edition = value as Partial<QuranEdition>;
  return (
    typeof edition.identifier === 'string' &&
    typeof edition.language === 'string' &&
    typeof edition.type === 'string' &&
    typeof edition.format === 'string'
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const resource = params.get('resource');

  try {
    if (resource === 'surahs') {
      const data = await getUpstream<unknown[]>('/surah', DAY);
      return NextResponse.json(data);
    }

    if (resource === 'languages') {
      const data = await getUpstream<string[]>('/edition/language', DAY);
      return NextResponse.json(data);
    }

    if (resource === 'translations') {
      const language = params.get('language') ?? 'en';
      if (!/^[a-z]{2,3}$/i.test(language)) {
        return NextResponse.json({ error: 'Invalid language code.' }, { status: 400 });
      }
      const editions = await getUpstream<unknown[]>(
        `/edition/language/${encodeURIComponent(language)}`,
        DAY,
      );
      const data = editions.filter(
        (edition): edition is QuranEdition =>
          isEdition(edition) &&
          edition.type === 'translation' &&
          edition.format === 'text',
      );
      return NextResponse.json(data);
    }

    if (resource === 'reciters') {
      const editions = await getUpstream<unknown[]>('/edition/format/audio', DAY);
      const data = editions.filter(
        (edition): edition is QuranEdition =>
          isEdition(edition) && edition.language === 'ar',
      );
      return NextResponse.json(data);
    }

    if (resource === 'chapter') {
      const number = Number(params.get('number'));
      const translation = params.get('translation') ?? 'en.sahih';
      const reciter = params.get('reciter') ?? 'ar.alafasy';
      if (!Number.isInteger(number) || number < 1 || number > 114) {
        return NextResponse.json({ error: 'Surah number must be from 1 to 114.' }, { status: 400 });
      }
      if (!/^[a-z0-9.-]+$/i.test(translation) || !/^[a-z0-9.-]+$/i.test(reciter)) {
        return NextResponse.json({ error: 'Invalid edition identifier.' }, { status: 400 });
      }
      const editions = [
        'quran-uthmani',
        encodeURIComponent(translation),
        encodeURIComponent(reciter),
      ].join(',');
      const data = await getUpstream<unknown[]>(
        `/surah/${number}/editions/${editions}`,
        DAY,
      );
      return NextResponse.json(data);
    }

    if (resource === 'page') {
      const page = Number(params.get('number'));
      const translation = params.get('translation') ?? 'en.sahih';
      const reciter = params.get('reciter') ?? 'ar.alafasy';
      if (!Number.isInteger(page) || page < 1 || page > 604) {
        return NextResponse.json({ error: 'Mushaf page must be from 1 to 604.' }, { status: 400 });
      }
      if (!/^[a-z0-9.-]+$/i.test(translation) || !/^[a-z0-9.-]+$/i.test(reciter)) {
        return NextResponse.json({ error: 'Invalid edition identifier.' }, { status: 400 });
      }
      const [editions, indopak] = await Promise.all([
        Promise.all([
          getUpstream<unknown>(`/page/${page}/quran-uthmani`, DAY),
          getUpstream<unknown>(`/page/${page}/${encodeURIComponent(translation)}`, DAY),
          getUpstream<unknown>(`/page/${page}/${encodeURIComponent(reciter)}`, DAY),
        ]),
        getIndopakPage(page),
      ]);
      return NextResponse.json({ editions, indopak });
    }

    return NextResponse.json({ error: 'Unknown Quran resource.' }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load Quran data.';
    console.error('Quran API request failed:', message);
    return NextResponse.json(
      { error: message },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
