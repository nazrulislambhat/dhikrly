export interface QuranWord {
  id: number;
  position: number;
  text: string;
  transliteration?: string;
  translation?: string;
  audioUrl?: string;
  charType: 'word' | 'end';
}

const wbwCache = new Map<string, QuranWord[]>();

export async function fetchVerseWords(
  surahNumber: number,
  ayahNumber: number,
): Promise<QuranWord[]> {
  const cacheKey = `${surahNumber}:${ayahNumber}`;
  if (wbwCache.has(cacheKey)) {
    return wbwCache.get(cacheKey)!;
  }

  // Check localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`dhikrly_wbw_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored) as QuranWord[];
        wbwCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&word_fields=translation,transliteration,audio_url`,
      { headers: { Accept: 'application/json' } },
    );

    if (!res.ok) throw new Error(`WBW request failed: ${res.status}`);
    const data = await res.json();
    const rawWords = data?.verse?.words || [];

    const words: QuranWord[] = rawWords.map((w: any) => ({
      id: w.id,
      position: w.position,
      text: w.text_uthmani || w.text,
      transliteration: w.transliteration?.text || '',
      translation: w.translation?.text || '',
      audioUrl: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : undefined,
      charType: w.char_type_name === 'end' ? 'end' : 'word',
    }));

    if (words.length > 0) {
      wbwCache.set(cacheKey, words);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`dhikrly_wbw_${cacheKey}`, JSON.stringify(words));
        } catch {
          // ignore
        }
      }
    }

    return words;
  } catch (error) {
    console.warn(`Could not load WBW data for ${surahNumber}:${ayahNumber}:`, error);
    return [];
  }
}

let activeWordAudio: HTMLAudioElement | null = null;

export function playWordAudio(audioUrl?: string, wordText?: string): void {
  if (!audioUrl) {
    // Fallback to speech synthesis if available
    if (wordText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(wordText);
        utter.lang = 'ar-SA';
        utter.rate = 0.85;
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore
      }
    }
    return;
  }

  if (activeWordAudio) {
    activeWordAudio.pause();
    activeWordAudio = null;
  }

  const audio = new Audio(audioUrl);
  activeWordAudio = audio;
  audio.play().catch((err) => {
    console.warn('Word audio playback failed:', err);
  });
}
