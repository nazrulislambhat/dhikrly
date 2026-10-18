export type PricingRegion = 'IN' | 'GLOBAL';
export type PricingPlanId = 'annual' | 'monthly' | 'lifetime';

export interface PricingPlan {
  id: PricingPlanId;
  title: string;
  badge: string;
  price: string;
  amount: number;
  currency: 'INR' | 'USD';
  currencySymbol: string;
  period: string;
  subtext: string;
  description: string;
  highlight: boolean;
  targetText: string;
}

export const PRICING_REGION_STORAGE_KEY = 'dhikrly_pricing_region_v1';

export const REGIONAL_PRICING: Record<PricingRegion, Record<PricingPlanId, PricingPlan>> = {
  IN: {
    annual: {
      id: 'annual',
      title: 'Annual Patron Pass',
      badge: 'Most Popular · 7-Day Free Trial',
      price: '₹1,199',
      amount: 1199,
      currency: 'INR',
      currencySymbol: '₹',
      period: '/year',
      subtext: 'Only ₹100 / month · Save 33%',
      description: 'Full access to all Pro features with a 7-day free trial. Cancel anytime with 1 click.',
      highlight: true,
      targetText: 'Annual Patron Pass (₹1,199/yr target)',
    },
    monthly: {
      id: 'monthly',
      title: 'Monthly Pass',
      badge: 'Flexibility',
      price: '₹149',
      amount: 149,
      currency: 'INR',
      currencySymbol: '₹',
      period: '/month',
      subtext: 'Billed monthly · Cancel anytime',
      description: 'Month-to-month access with complete flexibility and no commitments.',
      highlight: false,
      targetText: 'Monthly Pass (₹149/mo target)',
    },
    lifetime: {
      id: 'lifetime',
      title: 'Lifetime Waqf Pass',
      badge: '1-for-1 Student Sponsor',
      price: '₹2,499',
      amount: 2499,
      currency: 'INR',
      currencySymbol: '₹',
      period: 'one-time',
      subtext: 'Lifetime access + 1 Student Sponsored',
      description: 'Lifetime VIP access forever. Sponsoring 1 full student account as Sadaqah Jariyah.',
      highlight: false,
      targetText: 'Lifetime Waqf Pass (₹2,499 target)',
    },
  },
  GLOBAL: {
    annual: {
      id: 'annual',
      title: 'Annual Patron Pass',
      badge: 'Most Popular · 7-Day Free Trial',
      price: '$24.99',
      amount: 24.99,
      currency: 'USD',
      currencySymbol: '$',
      period: '/year',
      subtext: 'Only $2.08 / month · Save 30%',
      description: 'Full access to all Pro features with a 7-day free trial. Cancel anytime with 1 click.',
      highlight: true,
      targetText: 'Annual Patron Pass ($24.99/yr target)',
    },
    monthly: {
      id: 'monthly',
      title: 'Monthly Pass',
      badge: 'Flexibility',
      price: '$2.99',
      amount: 2.99,
      currency: 'USD',
      currencySymbol: '$',
      period: '/month',
      subtext: 'Billed monthly · Cancel anytime',
      description: 'Month-to-month access with complete flexibility and no commitments.',
      highlight: false,
      targetText: 'Monthly Pass ($2.99/mo target)',
    },
    lifetime: {
      id: 'lifetime',
      title: 'Lifetime Waqf Pass',
      badge: '1-for-1 Student Sponsor',
      price: '$49.99',
      amount: 49.99,
      currency: 'USD',
      currencySymbol: '$',
      period: 'one-time',
      subtext: 'Lifetime access + 1 Student Sponsored',
      description: 'Lifetime VIP access forever. Sponsoring 1 full student account as Sadaqah Jariyah.',
      highlight: false,
      targetText: 'Lifetime Waqf Pass ($49.99 target)',
    },
  },
};

/**
 * Returns the array of pricing plans for a given region (Annual, Monthly, Lifetime).
 */
export function getPricingPlans(region: PricingRegion): PricingPlan[] {
  const plans = REGIONAL_PRICING[region] || REGIONAL_PRICING.GLOBAL;
  return [plans.annual, plans.monthly, plans.lifetime];
}

/**
 * Returns a specific pricing plan for a given region.
 */
export function getPricingPlan(region: PricingRegion, planId: PricingPlanId): PricingPlan {
  const plans = REGIONAL_PRICING[region] || REGIONAL_PRICING.GLOBAL;
  return plans[planId] || plans.annual;
}

/**
 * Reads manual region override if explicitly set by the user.
 */
export function getPricingRegionOverride(): PricingRegion | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(PRICING_REGION_STORAGE_KEY);
    if (val === 'IN' || val === 'GLOBAL') return val;
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves or clears manual region override.
 */
export function savePricingRegionOverride(region: PricingRegion | 'auto'): void {
  if (typeof window === 'undefined') return;
  try {
    if (region === 'auto') {
      localStorage.removeItem(PRICING_REGION_STORAGE_KEY);
    } else {
      localStorage.setItem(PRICING_REGION_STORAGE_KEY, region);
    }
    window.dispatchEvent(new Event('dhikrly:pricing-updated'));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Detects whether the user is located in India.
 * Priority:
 * 1. Manual user override in localStorage ('IN' vs 'GLOBAL')
 * 2. Saved Salah location country or timezone in localStorage ('salah_settings')
 * 3. Saved user profile country in localStorage ('dhikrly_profile')
 * 4. Browser/OS timezone (e.g. 'Asia/Kolkata', 'Asia/Calcutta')
 * 5. Browser languages (e.g. 'en-IN', 'hi-IN', etc.)
 * Fallback: false (GLOBAL)
 */
export function detectIsIndia(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Manual user override
  const override = getPricingRegionOverride();
  if (override !== null) {
    return override === 'IN';
  }

  // 2. Saved Salah location
  try {
    const rawSalah = localStorage.getItem('salah_settings');
    if (rawSalah) {
      const parsed = JSON.parse(rawSalah);
      const country = (parsed?.location?.country || '').trim().toLowerCase();
      if (country === 'india' || country === 'in') return true;
      if (country) {
        // Explicit non-India location configured
        return false;
      }
      const tz = parsed?.location?.timezone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return true;
      if (tz) return false;
    }
  } catch {}

  // 3. User profile country
  try {
    const rawProfile = localStorage.getItem('dhikrly_profile');
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      const country = (parsed?.country || '').trim().toLowerCase();
      if (country === 'india' || country === 'in') return true;
      if (country) {
        // Explicit non-India profile country configured
        return false;
      }
    }
  } catch {}

  // 4. System / Browser Timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      return true;
    }
  } catch {}

  // 5. Browser languages
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const langs = nav ? (nav.languages && nav.languages.length ? nav.languages : [nav.language]) : [];
    for (const lang of langs) {
      if (!lang) continue;
      if (
        /-IN$/i.test(lang) ||
        /^hi(-|$)/i.test(lang) ||
        /^ta-IN$/i.test(lang) ||
        /^te-IN$/i.test(lang) ||
        /^bn-IN$/i.test(lang) ||
        /^mr-IN$/i.test(lang) ||
        /^gu-IN$/i.test(lang) ||
        /^kn-IN$/i.test(lang) ||
        /^ml-IN$/i.test(lang) ||
        /^pa-IN$/i.test(lang) ||
        /^ur-IN$/i.test(lang)
      ) {
        return true;
      }
    }
  } catch {}

  return false;
}

/**
 * Returns 'IN' if the user is in India, otherwise 'GLOBAL'.
 */
export function detectPricingRegion(): PricingRegion {
  return detectIsIndia() ? 'IN' : 'GLOBAL';
}
