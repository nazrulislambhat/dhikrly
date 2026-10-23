export type AccentColorKey = 'emerald' | 'amber' | 'teal' | 'sky' | 'rose' | 'violet';

export interface AccentThemeDef {
  key: AccentColorKey;
  name: string;
  dot: string;
  light: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primarySubtle: string;
    primaryFg: string;
  };
  dark: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primarySubtle: string;
    primaryFg: string;
  };
}

export const ACCENT_PALETTES: Record<AccentColorKey, AccentThemeDef> = {
  emerald: {
    key: 'emerald',
    name: 'Sacred Emerald',
    dot: '#10b981',
    light: {
      primary: '#0d5e42',
      primaryHover: '#094430',
      primaryLight: 'rgba(13, 94, 66, 0.16)',
      primarySubtle: 'rgba(13, 94, 66, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#10b981',
      primaryHover: '#34d399',
      primaryLight: 'rgba(16, 185, 129, 0.16)',
      primarySubtle: 'rgba(16, 185, 129, 0.08)',
      primaryFg: '#021a10',
    },
  },
  amber: {
    key: 'amber',
    name: 'Sunset Amber',
    dot: '#f59e0b',
    light: {
      primary: '#c25708',
      primaryHover: '#9a4204',
      primaryLight: 'rgba(194, 87, 8, 0.16)',
      primarySubtle: 'rgba(194, 87, 8, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#f59e0b',
      primaryHover: '#fbbf24',
      primaryLight: 'rgba(245, 158, 11, 0.16)',
      primarySubtle: 'rgba(245, 158, 11, 0.08)',
      primaryFg: '#1c0d02',
    },
  },
  teal: {
    key: 'teal',
    name: 'Oasis Teal',
    dot: '#14b8a6',
    light: {
      primary: '#0f766e',
      primaryHover: '#115e59',
      primaryLight: 'rgba(15, 118, 110, 0.16)',
      primarySubtle: 'rgba(15, 118, 110, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#14b8a6',
      primaryHover: '#2dd4bf',
      primaryLight: 'rgba(20, 184, 166, 0.16)',
      primarySubtle: 'rgba(20, 184, 166, 0.08)',
      primaryFg: '#021a17',
    },
  },
  sky: {
    key: 'sky',
    name: 'Sapphire Sky',
    dot: '#38bdf8',
    light: {
      primary: '#0369a1',
      primaryHover: '#075985',
      primaryLight: 'rgba(3, 105, 161, 0.16)',
      primarySubtle: 'rgba(3, 105, 161, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#38bdf8',
      primaryHover: '#7dd3fc',
      primaryLight: 'rgba(56, 189, 248, 0.16)',
      primarySubtle: 'rgba(56, 189, 248, 0.08)',
      primaryFg: '#041624',
    },
  },
  rose: {
    key: 'rose',
    name: 'Damask Rose',
    dot: '#fb7185',
    light: {
      primary: '#be123c',
      primaryHover: '#9f1239',
      primaryLight: 'rgba(190, 18, 60, 0.16)',
      primarySubtle: 'rgba(190, 18, 60, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#fb7185',
      primaryHover: '#fda4af',
      primaryLight: 'rgba(251, 113, 133, 0.16)',
      primarySubtle: 'rgba(251, 113, 133, 0.08)',
      primaryFg: '#24040a',
    },
  },
  violet: {
    key: 'violet',
    name: 'Night Amethyst',
    dot: '#a78bfa',
    light: {
      primary: '#6d28d9',
      primaryHover: '#5b21b6',
      primaryLight: 'rgba(109, 40, 217, 0.16)',
      primarySubtle: 'rgba(109, 40, 217, 0.08)',
      primaryFg: '#ffffff',
    },
    dark: {
      primary: '#a78bfa',
      primaryHover: '#c4b5fd',
      primaryLight: 'rgba(167, 139, 250, 0.16)',
      primarySubtle: 'rgba(167, 139, 250, 0.08)',
      primaryFg: '#14092b',
    },
  },
};

export const DEFAULT_ACCENT: AccentColorKey = 'emerald';
export const ACCENT_STORAGE_KEY = 'dhikrly_accent_color_v1';

export function getSavedAccent(): AccentColorKey {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (raw && raw in ACCENT_PALETTES) return raw as AccentColorKey;
  } catch {}
  return DEFAULT_ACCENT;
}

export function applyAccentTheme(accent: AccentColorKey, isDark?: boolean) {
  if (typeof document === 'undefined') return;
  const darkActive = typeof isDark === 'boolean'
    ? isDark
    : document.documentElement.classList.contains('dark');

  const palette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.emerald;
  const colors = darkActive ? palette.dark : palette.light;
  const root = document.documentElement;

  root.style.setProperty('--app-primary', colors.primary);
  root.style.setProperty('--app-primary-hover', colors.primaryHover);
  root.style.setProperty('--app-primary-light', colors.primaryLight);
  root.style.setProperty('--app-primary-subtle', colors.primarySubtle);
  root.style.setProperty('--app-primary-fg', colors.primaryFg);
  root.style.setProperty('--app-accent', colors.primary);

  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {}

  window.dispatchEvent(new CustomEvent('dhikrly:accent-changed', { detail: { accent } }));
}
