/* ─────────────────────────────────────────────
   sounds.ts
   Web Audio API sound effects — zero external files.
   All sounds are synthesized in <1ms.
───────────────────────────────────────────── */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Short soft envelope utility */
function envelope(
  gain: GainNode,
  audioCtx: AudioContext,
  attack: number,
  sustain: number,
  release: number,
  peak: number
) {
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.setValueAtTime(peak, now + attack + sustain);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + sustain + release);
}

/**
 * Check sound — warm rising chime (D5 → F#5)
 * Feels satisfying and rewarding.
 */
export function playCheck(): void {
  const audioCtx = getCtx();
  if (!audioCtx) return;

  const notes = [587.33, 739.99]; // D5, F#5
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime + i * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.005, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  });
}

/**
 * Uncheck sound — soft descending tap (F#5 → D5)
 * Subtle, not punishing.
 */
export function playUncheck(): void {
  const audioCtx = getCtx();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now);        // C5
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.14); // A4

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/**
 * Completion fanfare — all duas done 🎉
 * Short celebratory arpeggio.
 */
export function playComplete(): void {
  const audioCtx = getCtx();
  if (!audioCtx) return;

  // D major arpeggio: D5 F#5 A5 D6
  const notes = [587.33, 739.99, 880, 1174.66];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime + i * 0.1;

    osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    envelope(gain, audioCtx, 0.01, 0.05, 0.3, i === notes.length - 1 ? 0.22 : 0.14);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  });
}
