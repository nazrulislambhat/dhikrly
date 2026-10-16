export type ProTier = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface ProStatus {
  isPro: boolean;
  tier: ProTier;
  activatedAt?: string;
  expiresAt?: string;
  promoCode?: string;
}

export const PRO_STORAGE_KEY = 'dhikrly_pro_status_v1';

export const VALID_PROMO_CODES: Record<string, { tier: ProTier; label: string }> = {
  DHIKRLY2026: { tier: 'annual', label: 'Annual Sponsor Pass' },
  TESTPRO: { tier: 'lifetime', label: 'Lifetime VIP Pass' },
  RAMADAN: { tier: 'annual', label: 'Ramadan Mubarak Pass' },
  STUDENT: { tier: 'annual', label: 'Student of Knowledge Waqf' },
};

export const PRO_FEATURES = [
  {
    id: 'ai_hifdh',
    title: 'AI Quran Memorization & Hifdh Coach',
    desc: 'Interactive voice-listening that hides ayahs, checks pronunciation, and flags memorization lapses in real-time.',
    icon: 'Mic',
  },
  {
    id: 'cloud_sync',
    title: 'End-to-End Encrypted Cloud Sync',
    desc: 'Seamless real-time synchronization across phone, tablet, and PC so you never lose streaks or bookmarks.',
    icon: 'Cloud',
  },
  {
    id: 'soundscapes',
    title: 'Studio Ambient Soundscape Mixer',
    desc: 'Multi-track studio mixer blending Makkah rain, Madinah night wind, and high-bitrate studio reciter audio.',
    icon: 'Headphones',
  },
  {
    id: 'analytics',
    title: 'Spiritual Analytics & Annual Soul Report',
    desc: 'Deep monthly consistency trends, prayer punctuality metrics, and shareable annual Dhikrly Reflections.',
    icon: 'LineChart',
  },
  {
    id: 'zakat_screener',
    title: 'Equity, Crypto & 401(k) Zakat Screener',
    desc: 'Automated AAOIFI Shariah screening and zakat calculations for investment portfolios.',
    icon: 'Scale',
  },
  {
    id: 'family_circles',
    title: 'Family & Halāqah Group Circles',
    desc: 'Private family circles to complete Ramadan khatmahs together and share spiritual habits.',
    icon: 'Users',
  },
  {
    id: 'waqf_giveback',
    title: 'Sadaqah Jariyah 1-for-1 Student Waqf',
    desc: 'Every Pro subscription sponsors a full Pro account for a student of Islamic knowledge in need.',
    icon: 'HeartHandshake',
  },
];

export function getProStatus(): ProStatus {
  if (typeof window === 'undefined') {
    return { isPro: false, tier: 'free' };
  }
  try {
    const raw = localStorage.getItem(PRO_STORAGE_KEY);
    if (!raw) return { isPro: false, tier: 'free' };
    const parsed = JSON.parse(raw) as ProStatus;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      return { isPro: false, tier: 'free' };
    }
    return parsed;
  } catch {
    return { isPro: false, tier: 'free' };
  }
}

export function saveProStatus(status: ProStatus): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(status));
    window.dispatchEvent(new Event('dhikrly:pro-updated'));
  } catch {
    // Ignore storage quota
  }
}

export function applyPromoCode(code: string): { success: boolean; message: string; tier?: ProTier } {
  const clean = code.trim().toUpperCase();
  const match = VALID_PROMO_CODES[clean];
  if (!match) {
    return { success: false, message: 'Invalid promo code. Try TESTPRO or DHIKRLY2026.' };
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + (match.tier === 'lifetime' ? 10 : 1));

  const newStatus: ProStatus = {
    isPro: true,
    tier: match.tier,
    activatedAt: new Date().toISOString(),
    expiresAt: match.tier === 'lifetime' ? undefined : oneYearFromNow.toISOString(),
    promoCode: clean,
  };

  saveProStatus(newStatus);
  return {
    success: true,
    message: `Code applied successfully! Unlocked ${match.label} (${match.tier.toUpperCase()}).`,
    tier: match.tier,
  };
}
