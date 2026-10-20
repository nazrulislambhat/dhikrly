/**
 * sunnahAudio.ts
 * High-performance Web Audio API harmonic sound engine and recitation player
 * for the Prophetic Sunnah page & Notification Player.
 * Supports background play, MediaSession metadata & live canvas audio analysis.
 */

import {
  updateMediaMetadata,
  setMediaPlaybackState,
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
  registerMediaActionHandlers,
} from './mediaSession';
import type { SunnahItem } from './sunnahData';
import { findArabicVoice, getVoiceGender } from './duaAudio';

class SunnahAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private activeItem: SunnahItem | null = null;
  private sequenceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentStep = 0;
  private playbackRate = 1.0;
  private volume = 0.8;
  private repeat = false;
  private onStateChange: ((playing: boolean, item: SunnahItem | null) => void) | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setOnStateChange(cb: (playing: boolean, item: SunnahItem | null) => void) {
    this.onStateChange = cb;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setRepeat(repeat: boolean) {
    this.repeat = repeat;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getActiveItem(): SunnahItem | null {
    return this.activeItem;
  }

  public async playSunnah(item: SunnahItem) {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.stop();
    this.activeItem = item;
    this.isPlaying = true;
    this.currentStep = 0;

    // Start background keep-alive to keep playing if screen is locked
    startBackgroundAudioKeepAlive();

    // Configure lockscreen & notification media controls
    updateMediaMetadata({
      title: item.audioTitle || item.title,
      artist: `${item.titleAr} · ${item.reference}`,
      album: 'Authentic Prophetic Sunnah · Dhikrly',
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    setMediaPlaybackState('playing');

    registerMediaActionHandlers({
      onPlay: () => this.resume(),
      onPause: () => this.pause(),
      onStop: () => this.stop(),
    });

    if (this.onStateChange) this.onStateChange(true, item);

    // Play synthesized melodic sequence
    this.playNextNote();

    // Also attempt speech synthesis for the supplication if user device supports Arabic speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && item.arabicText) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.arabicText);
        utterance.lang = 'ar-SA';
        const gender = getVoiceGender();
        const voice = findArabicVoice(gender);
        if (voice) utterance.voice = voice;
        utterance.pitch = gender === 'male' ? 0.82 : 1.15;
        utterance.rate = (gender === 'male' ? 0.80 : 0.85) * this.playbackRate;
        utterance.volume = Math.min(1.0, this.volume * 1.1);
        utterance.onend = () => {
          // If repeat enabled and speech finishes, loop
          if (this.repeat && this.isPlaying) {
            setTimeout(() => {
              if (this.isPlaying && this.activeItem === item) {
                this.playSunnah(item);
              }
            }, 1000);
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback to melodic sequence only
      }
    }
  }

  private playNextNote() {
    if (!this.isPlaying || !this.ctx || !this.masterGain || !this.activeItem) return;

    const freqs = this.activeItem.audioFrequencies || [261.63, 329.63, 392.0, 523.25];
    const freq = freqs[this.currentStep % freqs.length];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 1.5, now); // Fifth harmonic warmth

    const duration = 1.8 / this.playbackRate;

    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(noteGain);
    oscHarmonic.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + duration + 0.1);
    oscHarmonic.stop(now + duration + 0.1);

    this.currentStep++;

    const delayMs = (duration * 0.75 * 1000);

    // Keep sequence playing if repeat or under 12 steps
    if (this.currentStep < 12 || this.repeat) {
      this.sequenceTimer = setTimeout(() => {
        this.playNextNote();
      }, delayMs);
    } else {
      // Finished
      this.sequenceTimer = setTimeout(() => {
        this.stop();
      }, duration * 1000);
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.sequenceTimer) clearTimeout(this.sequenceTimer);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setMediaPlaybackState('paused');
    if (this.onStateChange) this.onStateChange(false, this.activeItem);
  }

  public resume() {
    if (!this.activeItem) return;
    this.isPlaying = true;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    setMediaPlaybackState('playing');
    if (this.onStateChange) this.onStateChange(true, this.activeItem);
    this.playNextNote();
  }

  public stop() {
    this.isPlaying = false;
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    stopBackgroundAudioKeepAlive();
    setMediaPlaybackState('none');
    if (this.onStateChange) this.onStateChange(false, this.activeItem);
  }
}

export const sunnahAudioEngine = new SunnahAudioEngine();
