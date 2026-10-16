/**
 * ambientAudio.ts
 * High-performance Web Audio API procedural sound engine for Dhikr, Quran & Contemplation.
 * 100% offline, zero network assets required.
 */

import {
  startBackgroundAudioKeepAlive,
  stopBackgroundAudioKeepAlive,
} from './mediaSession';

export type AmbientTrackId =
  | 'rain'
  | 'birds'
  | 'drone'
  | 'stream'
  | 'chimes'
  | 'wind'
  | 'brownNoise';

export interface AmbientTrackConfig {
  id: AmbientTrackId;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  color: string;
  defaultVolume: number;
}

export const AMBIENT_TRACKS: AmbientTrackConfig[] = [
  {
    id: 'rain',
    name: 'Medina Rain',
    nameAr: 'مطر الروضة',
    description: 'Gentle raindrops falling softly on courtyard umbrellas',
    icon: 'CloudRain',
    color: 'from-blue-500/20 to-cyan-500/10',
    defaultVolume: 0.6,
  },
  {
    id: 'birds',
    name: 'Fajr Birds & Dawn',
    nameAr: 'عصافير الفجر',
    description: 'Peaceful morning birdsong and awakening dawn aura',
    icon: 'Bird',
    color: 'from-amber-500/20 to-emerald-500/10',
    defaultVolume: 0.5,
  },
  {
    id: 'drone',
    name: 'Night of Qadr Resonance',
    nameAr: 'سكينة الليل',
    description: '432Hz deep harmonic meditative warmth for Tahajjud',
    icon: 'Moon',
    color: 'from-purple-500/20 to-indigo-500/10',
    defaultVolume: 0.45,
  },
  {
    id: 'stream',
    name: 'Rivers of Jannah',
    nameAr: 'أنهار الجنة',
    description: 'Gentle babbling brook and pure cascading waters',
    icon: 'Waves',
    color: 'from-teal-500/20 to-emerald-500/10',
    defaultVolume: 0.5,
  },
  {
    id: 'chimes',
    name: 'Celestial Chimes',
    nameAr: 'رنين السكينة',
    description: 'Soft harmonic pentatonic chimes resonating gently',
    icon: 'Sparkles',
    color: 'from-yellow-500/20 to-amber-500/10',
    defaultVolume: 0.4,
  },
  {
    id: 'wind',
    name: 'Desert Evening Breeze',
    nameAr: 'نسيم الصحراء',
    description: 'Calm, soothing breeze across the sand dunes',
    icon: 'Wind',
    color: 'from-emerald-500/20 to-teal-500/10',
    defaultVolume: 0.5,
  },
  {
    id: 'brownNoise',
    name: 'Deep Hifdh Focus',
    nameAr: 'تركيز الحفظ',
    description: 'Smooth brown noise for deep Quran memorization',
    icon: 'Brain',
    color: 'from-stone-500/20 to-emerald-500/10',
    defaultVolume: 0.4,
  },
];

export interface AmbientPreset {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  tracks: Partial<Record<AmbientTrackId, number>>;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'prophet-mosque',
    name: 'Prophet’s Courtyard',
    nameAr: 'ساحة المسجد النبوي',
    icon: 'Landmark',
    description: 'Peaceful dawn atmosphere with soft birds and gentle breeze',
    tracks: { birds: 0.7, wind: 0.4, drone: 0.3 },
  },
  {
    id: 'tahajjud-night',
    name: 'Tahajjud Vigil',
    nameAr: 'قيام الليل',
    icon: 'MoonStar',
    description: 'Deep meditative stillness for the final third of the night',
    tracks: { drone: 0.75, chimes: 0.5, wind: 0.25 },
  },
  {
    id: 'rainy-reading',
    name: 'Rainy Quran Recitation',
    nameAr: 'تلاوة في المطر',
    icon: 'CloudRain',
    description: 'Soothing rain and gentle stream for focused contemplation',
    tracks: { rain: 0.8, stream: 0.45 },
  },
  {
    id: 'deep-memorization',
    name: 'Hifdh Deep Focus',
    nameAr: 'خلوة الحفظ',
    icon: 'BookOpen',
    description: 'Noise cancellation and peaceful drone for uninterrupted review',
    tracks: { brownNoise: 0.7, drone: 0.4 },
  },
  {
    id: 'serene-nature',
    name: 'Gardens of Peace',
    nameAr: 'رياض الصالحين',
    icon: 'Trees',
    description: 'Rivers flowing with birdsong and celestial chimes',
    tracks: { stream: 0.65, birds: 0.55, chimes: 0.35 },
  },
];

class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRunning = false;

  private trackGains: Map<AmbientTrackId, GainNode> = new Map();
  private trackNodes: Map<AmbientTrackId, (AudioNode | number)[]> = new Map();
  private chimesTimer: ReturnType<typeof setInterval> | null = null;
  private birdsTimer: ReturnType<typeof setInterval> | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch {
      // AudioContext not supported
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getContextState(): string {
    return this.ctx?.state ?? 'closed';
  }

  public async resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isRunning = true;
    startBackgroundAudioKeepAlive();
  }

  public setMasterVolume(val: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  public setTrackVolume(id: AmbientTrackId, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, volume));

    let gainNode = this.trackGains.get(id);
    if (!gainNode) {
      gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(clamped, this.ctx.currentTime);
      gainNode.connect(this.masterGain);
      this.trackGains.set(id, gainNode);
    } else {
      gainNode.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.08);
    }

    if (clamped > 0 && !this.trackNodes.has(id)) {
      this.startTrackGenerator(id, gainNode);
    }
  }

  private startTrackGenerator(id: AmbientTrackId, dest: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (id) {
      case 'rain': {
        // Continuous filtered pink noise with random flutter
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        whiteNoise.connect(filter);
        filter.connect(dest);
        whiteNoise.start();

        this.trackNodes.set(id, [whiteNoise, filter]);
        break;
      }

      case 'wind': {
        // Wind generator with sweeping bandpass filter
        const bufferSize = this.ctx.sampleRate * 3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.2;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.Q.setValueAtTime(2.5, now);

        // LFO to modulate wind gust
        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(280, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        source.connect(filter);
        filter.connect(dest);
        source.start();

        this.trackNodes.set(id, [source, filter, lfo]);
        break;
      }

      case 'stream': {
        // Stream: noise through highpass and dynamic bandpass
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.18;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'bandpass';
        lowpass.frequency.setValueAtTime(800, now);
        lowpass.Q.setValueAtTime(3.0, now);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.7, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(450, now);
        lfo.connect(lfoGain);
        lfoGain.connect(lowpass.frequency);
        lfo.start();

        source.connect(lowpass);
        lowpass.connect(dest);
        source.start();

        this.trackNodes.set(id, [source, lowpass, lfo]);
        break;
      }

      case 'drone': {
        // Deep 432 Hz warm harmonic drone with slight chorusing
        const baseFreq = 108; // Sub-octave of 432Hz (A2)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now); // 108

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(baseFreq * 2 + 0.3, now); // 216.3 Hz

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(432, now); // 432 Hz pure

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.3, now);

        osc1.connect(subGain);
        osc2.connect(subGain);
        osc3.connect(subGain);
        subGain.connect(filter);
        filter.connect(dest);

        osc1.start();
        osc2.start();
        osc3.start();

        this.trackNodes.set(id, [osc1, osc2, osc3, filter]);
        break;
      }

      case 'brownNoise': {
        // Pure smooth brown noise for Hifdh
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 1.8;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        source.connect(filter);
        filter.connect(dest);
        source.start();

        this.trackNodes.set(id, [source, filter]);
        break;
      }

      case 'chimes': {
        // Pentatonic bells played at randomized musical intervals
        const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
        const playChime = () => {
          if (!this.ctx || !this.isRunning) return;
          const currentGain = this.trackGains.get('chimes');
          if (!currentGain || currentGain.gain.value <= 0.01) return;

          const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const osc = this.ctx.createOscillator();
          const chimeGain = this.ctx.createGain();
          const t = this.ctx.currentTime;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          chimeGain.gain.setValueAtTime(0, t);
          chimeGain.gain.linearRampToValueAtTime(0.18, t + 0.015);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

          osc.connect(chimeGain);
          chimeGain.connect(dest);
          osc.start(t);
          osc.stop(t + 3.3);
        };

        if (this.chimesTimer) clearInterval(this.chimesTimer);
        this.chimesTimer = setInterval(playChime, 3200);
        playChime();
        this.trackNodes.set(id, []);
        break;
      }

      case 'birds': {
        // Procedural birdsong chirps
        const chirp = () => {
          if (!this.ctx || !this.isRunning) return;
          const currentGain = this.trackGains.get('birds');
          if (!currentGain || currentGain.gain.value <= 0.01) return;

          const numChirps = Math.floor(Math.random() * 3) + 2;
          let startTime = this.ctx.currentTime;
          const base = 2400 + Math.random() * 800;

          for (let i = 0; i < numChirps; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const chirpTime = startTime + i * 0.12;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(base, chirpTime);
            osc.frequency.exponentialRampToValueAtTime(base * 1.5, chirpTime + 0.04);
            osc.frequency.exponentialRampToValueAtTime(base * 0.9, chirpTime + 0.09);

            gain.gain.setValueAtTime(0, chirpTime);
            gain.gain.linearRampToValueAtTime(0.12, chirpTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, chirpTime + 0.1);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(chirpTime);
            osc.stop(chirpTime + 0.11);
          }
        };

        if (this.birdsTimer) clearInterval(this.birdsTimer);
        this.birdsTimer = setInterval(chirp, 4500);
        chirp();
        this.trackNodes.set(id, []);
        break;
      }
    }
  }

  public playGong() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now); // C4 warm bowl gong
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63 * 1.5, now); // G4 fifth

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 4.6);
    osc2.stop(now + 4.6);
  }

  public stopAll() {
    this.isRunning = false;
    stopBackgroundAudioKeepAlive();
    if (this.chimesTimer) {
      clearInterval(this.chimesTimer);
      this.chimesTimer = null;
    }
    if (this.birdsTimer) {
      clearInterval(this.birdsTimer);
      this.birdsTimer = null;
    }

    this.trackNodes.forEach((nodes) => {
      nodes.forEach((node) => {
        if (typeof node === 'object' && 'stop' in node) {
          try {
            (node as AudioScheduledSourceNode).stop();
          } catch {
            // Already stopped
          }
        }
      });
    });
    this.trackNodes.clear();
    this.trackGains.forEach((gain) => {
      try {
        gain.disconnect();
      } catch {
        // Ignore
      }
    });
    this.trackGains.clear();

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.suspend().catch(() => {});
    }
  }
}

export const ambientEngine = new ProceduralSoundEngine();
