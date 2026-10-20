/**
 * duaAudio.ts
 * Unified Islamic audio engine supporting real Qari studio recitations (Mishary Rashid Alafasy)
 * for Quranic verses, and male-tuned Arabic speech synthesis for Hadith and situational du'as.
 * Supports user-selected Male ♂ (default) / Female ♀ voice preference.
 */

import { SituationalDua } from '@/lib/situationsData';
import {
  updateMediaMetadata,
  setMediaPlaybackState,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
  registerMediaActionHandlers,
} from '@/lib/mediaSession';

export type VoiceGender = 'male' | 'female';

export const VOICE_GENDER_STORAGE_KEY = 'dhikrly_voice_gender';

export function getVoiceGender(): VoiceGender {
  if (typeof window === 'undefined') return 'male';
  try {
    const saved = localStorage.getItem(VOICE_GENDER_STORAGE_KEY);
    return saved === 'female' ? 'female' : 'male';
  } catch {
    return 'male';
  }
}

export function setVoiceGender(gender: VoiceGender): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_GENDER_STORAGE_KEY, gender);
    window.dispatchEvent(new CustomEvent('dhikrly_voice_gender_changed', { detail: gender }));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Intelligent Arabic voice picker.
 * Selects an authentic male Arabic voice (e.g., Maged, Tarik, Naayf, Hamed) on iOS/Android/Windows,
 * or female voice if requested.
 */
export function findArabicVoice(gender: VoiceGender = 'male'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const arabicVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith('ar') || v.lang.toLowerCase().includes('ara')
  );

  if (arabicVoices.length === 0) return null;

  const maleKeywords = ['maged', 'tarik', 'naayf', 'hamed', 'shakir', 'male', 'youssef', 'george', 'ali', 'hoda', 'bilal'];
  const femaleKeywords = ['laila', 'mariam', 'salma', 'zariyah', 'female', 'yasmin', 'zeina', 'hala'];

  if (gender === 'male') {
    // 1. Look for explicit male Arabic voice names
    const explicitMale = arabicVoices.find((v) => {
      const name = v.name.toLowerCase();
      return maleKeywords.some((k) => name.includes(k)) && !femaleKeywords.some((k) => name.includes(k));
    });
    if (explicitMale) return explicitMale;

    // 2. Look for any voice not known to be female
    const notFemale = arabicVoices.find((v) => {
      const name = v.name.toLowerCase();
      return !femaleKeywords.some((k) => name.includes(k));
    });
    if (notFemale) return notFemale;

    // 3. Fallback to first available Arabic voice
    return arabicVoices[0];
  } else {
    // Female voice search
    const explicitFemale = arabicVoices.find((v) => {
      const name = v.name.toLowerCase();
      return femaleKeywords.some((k) => name.includes(k));
    });
    if (explicitFemale) return explicitFemale;

    return arabicVoices[0];
  }
}

/**
 * Synthesizes Arabic text with explicit male cadence & resonant baritone pitch (0.82)
 * to avoid mobile iOS/Android high robotic or female defaults.
 */
export function speakArabicText(
  text: string,
  options?: {
    gender?: VoiceGender;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  try {
    window.speechSynthesis.cancel();
    const gender = options?.gender ?? getVoiceGender();
    // Normalize middle dots · and formatting into natural Arabic commas for rhythmic breath pauses
    const cleanText = text.replace(/·/g, '،').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';

    const voice = findArabicVoice(gender);
    if (voice) {
      utterance.voice = voice;
    }

    if (gender === 'male') {
      // Baritone resonance and measured, respectful recitation cadence
      utterance.pitch = options?.pitch ?? 0.82;
      utterance.rate = options?.rate ?? 0.80;
    } else {
      utterance.pitch = options?.pitch ?? 1.15;
      utterance.rate = options?.rate ?? 0.85;
    }

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options?.onError) {
      utterance.onerror = () => options.onError?.();
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch {
    return null;
  }
}

// Global active audio controller state
let activeHtmlAudio: HTMLAudioElement | null = null;
let activeDuaId: string | null = null;
let activeAudioCtx: AudioContext | null = null;
let activeStopCallback: (() => void) | null = null;

export function getActiveDuaId(): string | null {
  return activeDuaId;
}

export function stopDuaAudio(): void {
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // Ignore audio abort
    }
    activeHtmlAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }

  if (activeStopCallback) {
    activeStopCallback();
    activeStopCallback = null;
  }

  activeDuaId = null;
  setMediaPlaybackState('none');
  stopBackgroundAudioKeepAlive();
}

/**
 * Plays a situational du'a:
 * - If real human studio recording exists (Quranic verses by Sheikh Mishary Alafasy), plays real audio.
 * - Otherwise plays melodic sacred frequencies and speaks Arabic with configured Male/Female voice.
 */
export async function playDuaAudio(
  dua: SituationalDua,
  options?: {
    gender?: VoiceGender;
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> {
  // If already playing this dua, toggle off
  if (activeDuaId === dua.id) {
    stopDuaAudio();
    return;
  }

  // Stop any other currently playing audio
  stopDuaAudio();

  activeDuaId = dua.id;
  startBackgroundAudioKeepAlive();

  const gender = options?.gender ?? getVoiceGender();
  const reciterLabel = dua.reciter ? `${dua.reciter} (Real Qari Studio Audio)` : (gender === 'male' ? 'Male Recitation' : 'Female Recitation');

  updateMediaMetadata({
    title: dua.title,
    artist: `${dua.emotionLabel} · ${reciterLabel}`,
    album: 'Prophetic Situational Du‘ās · Dhikrly',
    artwork: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
  setMediaPlaybackState('playing');

  registerMediaActionHandlers({
    onPlay: () => playDuaAudio(dua, options),
    onPause: stopDuaAudio,
    onStop: stopDuaAudio,
  });

  options?.onStart?.();

  // If real studio reciter audio URL is available (Quranic verses), play real person's audio
  if (dua.audioUrl) {
    try {
      const audio = new Audio(dua.audioUrl);
      activeHtmlAudio = audio;

      audio.onended = () => {
        if (activeDuaId === dua.id) {
          activeDuaId = null;
          activeHtmlAudio = null;
          setMediaPlaybackState('none');
          stopBackgroundAudioKeepAlive();
          options?.onEnd?.();
        }
      };

      audio.onerror = () => {
        // Fallback to speech synthesis if network fails
        fallbackSynthesis(dua, gender, options?.onEnd);
      };

      await audio.play();
      return;
    } catch {
      // Fallback to speech synthesis if autoplay or fetch fails
      fallbackSynthesis(dua, gender, options?.onEnd);
      return;
    }
  }

  // Otherwise, use melodic harmonic accompaniment and male-tuned Arabic speech
  fallbackSynthesis(dua, gender, options?.onEnd);
}

function fallbackSynthesis(
  dua: SituationalDua,
  gender: VoiceGender,
  onEnd?: () => void
): void {
  try {
    if (typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      
      if (!activeAudioCtx && AudioCtxClass) {
        activeAudioCtx = new AudioCtxClass();
      }

      if (activeAudioCtx && activeAudioCtx.state === 'suspended') {
        activeAudioCtx.resume();
      }

      // Play soft sacred harmonic frequency notes
      if (activeAudioCtx && dua.frequencies && dua.frequencies.length > 0) {
        const now = activeAudioCtx.currentTime;
        dua.frequencies.forEach((freq, idx) => {
          if (!activeAudioCtx) return;
          const osc = activeAudioCtx.createOscillator();
          const gain = activeAudioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.35);

          gain.gain.setValueAtTime(0, now + idx * 0.35);
          gain.gain.linearRampToValueAtTime(0.20, now + idx * 0.35 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 1.5);

          osc.connect(gain);
          gain.connect(activeAudioCtx.destination);

          osc.start(now + idx * 0.35);
          osc.stop(now + idx * 0.35 + 1.55);
        });
      }
    }

    // Speak with resonant male Arabic voice
    speakArabicText(dua.arabicText, {
      gender,
      onEnd: () => {
        if (activeDuaId === dua.id) {
          activeDuaId = null;
          setMediaPlaybackState('none');
          stopBackgroundAudioKeepAlive();
          onEnd?.();
        }
      },
      onError: () => {
        if (activeDuaId === dua.id) {
          activeDuaId = null;
          setMediaPlaybackState('none');
          stopBackgroundAudioKeepAlive();
          onEnd?.();
        }
      },
    });
  } catch {
    activeDuaId = null;
    setMediaPlaybackState('none');
    stopBackgroundAudioKeepAlive();
    onEnd?.();
  }
}
