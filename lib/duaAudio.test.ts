import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getVoiceGender,
  setVoiceGender,
  VOICE_GENDER_STORAGE_KEY,
  speakArabicText,
  findArabicVoice,
} from './duaAudio';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe('duaAudio service', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    // @ts-expect-error Mocking global localStorage
    globalThis.localStorage = mockStorage;
    // @ts-expect-error Mocking global window
    globalThis.window = {
      localStorage: mockStorage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    // @ts-expect-error Mocking global CustomEvent
    globalThis.CustomEvent = class CustomEvent {
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.detail = init?.detail;
      }
    };
    // @ts-expect-error Mocking global SpeechSynthesisUtterance
    globalThis.SpeechSynthesisUtterance = class MockUtterance {
      text: string;
      lang = '';
      pitch = 1;
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  it('defaults voice gender to male', () => {
    expect(getVoiceGender()).toBe('male');
  });

  it('persists and retrieves female voice gender when selected', () => {
    setVoiceGender('female');
    expect(mockStorage.getItem(VOICE_GENDER_STORAGE_KEY)).toBe('female');
    expect(getVoiceGender()).toBe('female');
  });

  it('switches back to male voice gender', () => {
    setVoiceGender('female');
    expect(getVoiceGender()).toBe('female');
    setVoiceGender('male');
    expect(mockStorage.getItem(VOICE_GENDER_STORAGE_KEY)).toBe('male');
    expect(getVoiceGender()).toBe('male');
  });

  it('finds authentic male Arabic voice when available', () => {
    const mockVoices = [
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Laila', lang: 'ar-SA' },
      { name: 'Maged', lang: 'ar-SA' },
    ] as unknown as SpeechSynthesisVoice[];

    (window as any).speechSynthesis = {
      getVoices: () => mockVoices,
      speak: vi.fn(),
      cancel: vi.fn(),
    };

    const maleVoice = findArabicVoice('male');
    expect(maleVoice).toBeDefined();
    expect(maleVoice?.name).toBe('Maged');

    const femaleVoice = findArabicVoice('female');
    expect(femaleVoice).toBeDefined();
    expect(femaleVoice?.name).toBe('Laila');
  });

  it('speaks Arabic with male baritone pitch (0.82) by default', () => {
    let capturedUtterance: any = null;
    (window as any).speechSynthesis = {
      getVoices: () => [],
      speak: vi.fn((utter: any) => {
        capturedUtterance = utter;
      }),
      cancel: vi.fn(),
    };

    speakArabicText('اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ');
    expect((window as any).speechSynthesis.speak).toHaveBeenCalled();
    expect(capturedUtterance).not.toBeNull();
    expect(capturedUtterance?.pitch).toBe(0.82);
    expect(capturedUtterance?.rate).toBe(0.80);
    expect(capturedUtterance?.lang).toBe('ar-SA');
  });

  it('speaks Arabic with higher pitch (1.15) when female gender selected', () => {
    let capturedUtterance: any = null;
    (window as any).speechSynthesis = {
      getVoices: () => [],
      speak: vi.fn((utter: any) => {
        capturedUtterance = utter;
      }),
      cancel: vi.fn(),
    };

    speakArabicText('اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الهَمِّ وَالحَزَنِ', { gender: 'female' });
    expect(capturedUtterance?.pitch).toBe(1.15);
    expect(capturedUtterance?.rate).toBe(0.85);
  });
});
