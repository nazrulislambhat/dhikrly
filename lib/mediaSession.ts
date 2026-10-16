/**
 * mediaSession.ts
 * Unified MediaSession API & Background Audio Keep-Alive Engine for Dhikrly.
 * Enables background audio playback, lock screen metadata & controls across
 * Quran recitation, Ambient soundscapes, and Sunnah notification player.
 */

export interface MediaTrackInfo {
  title: string;
  artist?: string;
  album?: string;
  artwork?: Array<{ src: string; sizes?: string; type?: string }>;
}

export interface MediaActionCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeekTo?: (details: { seekTime: number }) => void;
  onSeekBackward?: (offset?: number) => void;
  onSeekForward?: (offset?: number) => void;
  onStop?: () => void;
}

// 44-byte standard silent WAV base64 data URI to prevent mobile browser audio suspension
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let silentAudioElement: HTMLAudioElement | null = null;
let isKeepAliveActive = false;

/**
 * Starts silent audio keep-alive loop to retain active audio thread when device locks or app backgrounds.
 */
export function startBackgroundAudioKeepAlive(): void {
  if (typeof window === 'undefined') return;
  if (isKeepAliveActive && silentAudioElement) return;

  try {
    if (!silentAudioElement) {
      silentAudioElement = new Audio(SILENT_WAV);
      silentAudioElement.loop = true;
      silentAudioElement.volume = 0.001; // virtually silent
    }
    const playPromise = silentAudioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isKeepAliveActive = true;
        })
        .catch(() => {
          // Handled gracefully if browser requires user gesture
        });
    }
  } catch {
    // Ignore audio initialization errors
  }
}

/**
 * Stops background keep-alive.
 */
export function stopBackgroundAudioKeepAlive(): void {
  if (silentAudioElement) {
    try {
      silentAudioElement.pause();
      silentAudioElement.currentTime = 0;
    } catch {}
    isKeepAliveActive = false;
  }
}

/**
 * Updates navigator.mediaSession with track metadata (Quran verse, Ambient preset, Sunnah recitation).
 */
export function updateMediaMetadata(info: MediaTrackInfo): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    const defaultArtwork = [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: info.title,
      artist: info.artist || 'Dhikrly',
      album: info.album || "Noble Qur'an & Authentic Sunnah",
      artwork: info.artwork && info.artwork.length > 0 ? info.artwork : defaultArtwork,
    });
  } catch (err) {
    console.warn('[MediaSession] Could not update metadata:', err);
  }
}

/**
 * Updates the playback state for the OS media center ('playing' | 'paused' | 'none').
 */
export function setMediaPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch (err) {
    console.warn('[MediaSession] Could not set playback state:', err);
  }
}

/**
 * Updates playback position & duration for lock screen scrubber bar.
 */
export function updateMediaPositionState(state: {
  duration: number;
  playbackRate?: number;
  position: number;
}): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  if (!Number.isFinite(state.duration) || state.duration <= 0) return;
  if (!Number.isFinite(state.position) || state.position < 0) return;

  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, state.duration),
      playbackRate: state.playbackRate || 1.0,
      position: Math.min(Math.max(0, state.position), state.duration),
    });
  } catch {}
}

/**
 * Registers lockscreen / notification media control action handlers.
 */
export function registerMediaActionHandlers(callbacks: MediaActionCallbacks): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  const actions: Array<{
    action: MediaSessionAction;
    handler?: (details: MediaSessionActionDetails) => void;
  }> = [
    {
      action: 'play',
      handler: callbacks.onPlay ? () => callbacks.onPlay?.() : undefined,
    },
    {
      action: 'pause',
      handler: callbacks.onPause ? () => callbacks.onPause?.() : undefined,
    },
    {
      action: 'previoustrack',
      handler: callbacks.onPrevious ? () => callbacks.onPrevious?.() : undefined,
    },
    {
      action: 'nexttrack',
      handler: callbacks.onNext ? () => callbacks.onNext?.() : undefined,
    },
    {
      action: 'seekto',
      handler: callbacks.onSeekTo
        ? (details) => {
            if (typeof details.seekTime === 'number') {
              callbacks.onSeekTo?.({ seekTime: details.seekTime });
            }
          }
        : undefined,
    },
    {
      action: 'seekbackward',
      handler: callbacks.onSeekBackward
        ? (details) => callbacks.onSeekBackward?.(details.seekOffset || 10)
        : undefined,
    },
    {
      action: 'seekforward',
      handler: callbacks.onSeekForward
        ? (details) => callbacks.onSeekForward?.(details.seekOffset || 10)
        : undefined,
    },
    {
      action: 'stop',
      handler: callbacks.onStop ? () => callbacks.onStop?.() : undefined,
    },
  ];

  actions.forEach(({ action, handler }) => {
    try {
      if (handler) {
        navigator.mediaSession.setActionHandler(action, handler);
      } else {
        navigator.mediaSession.setActionHandler(action, null);
      }
    } catch {
      // Some browsers do not support all media actions (e.g. seekto)
    }
  });
}

/**
 * Resets all media session metadata & action handlers.
 */
export function clearMediaSession(): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  } catch {}
}
