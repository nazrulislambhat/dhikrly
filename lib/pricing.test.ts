import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectIsIndia,
  detectPricingRegion,
  getPricingPlan,
  getPricingPlans,
  getPricingRegionOverride,
  savePricingRegionOverride,
  PRICING_REGION_STORAGE_KEY,
  REGIONAL_PRICING,
} from './pricing';

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

describe('pricing', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    // @ts-expect-error Mocking global localStorage
    globalThis.localStorage = mockStorage;
    // @ts-expect-error Mocking global window
    globalThis.window = {
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    // @ts-expect-error Mocking global Event
    globalThis.Event = class Event {};
  });

  afterEach(() => {
    // @ts-expect-error Clean up
    delete globalThis.localStorage;
    // @ts-expect-error Clean up
    delete globalThis.window;
  });

  it('provides correct Indian pricing structure (Tier B: ₹149/mo, ₹1,199/yr, ₹2,499 lifetime)', () => {
    const inPlans = getPricingPlans('IN');
    expect(inPlans).toHaveLength(3);

    const annual = getPricingPlan('IN', 'annual');
    expect(annual.price).toBe('₹1,199');
    expect(annual.currency).toBe('INR');
    expect(annual.subtext).toContain('₹100 / month');
    expect(annual.targetText).toContain('₹1,199/yr target');

    const monthly = getPricingPlan('IN', 'monthly');
    expect(monthly.price).toBe('₹149');
    expect(monthly.currency).toBe('INR');
    expect(monthly.period).toBe('/month');

    const lifetime = getPricingPlan('IN', 'lifetime');
    expect(lifetime.price).toBe('₹2,499');
    expect(lifetime.currency).toBe('INR');
    expect(lifetime.period).toBe('one-time');
  });

  it('provides correct Global USD pricing structure ($2.99/mo, $24.99/yr, $49.99 lifetime)', () => {
    const globalPlans = getPricingPlans('GLOBAL');
    expect(globalPlans).toHaveLength(3);

    const annual = getPricingPlan('GLOBAL', 'annual');
    expect(annual.price).toBe('$24.99');
    expect(annual.currency).toBe('USD');
    expect(annual.subtext).toContain('$2.08 / month');

    const monthly = getPricingPlan('GLOBAL', 'monthly');
    expect(monthly.price).toBe('$2.99');
    expect(monthly.currency).toBe('USD');

    const lifetime = getPricingPlan('GLOBAL', 'lifetime');
    expect(lifetime.price).toBe('$49.99');
    expect(lifetime.currency).toBe('USD');
  });

  it('honors manual region override in localStorage', () => {
    expect(getPricingRegionOverride()).toBeNull();

    savePricingRegionOverride('IN');
    expect(getPricingRegionOverride()).toBe('IN');
    expect(detectPricingRegion()).toBe('IN');
    expect(detectIsIndia()).toBe(true);

    savePricingRegionOverride('GLOBAL');
    expect(getPricingRegionOverride()).toBe('GLOBAL');
    expect(detectPricingRegion()).toBe('GLOBAL');
    expect(detectIsIndia()).toBe(false);

    savePricingRegionOverride('auto');
    expect(getPricingRegionOverride()).toBeNull();
  });

  it('detects India from saved salah_settings location country', () => {
    mockStorage.setItem(
      'salah_settings',
      JSON.stringify({ location: { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' } })
    );

    expect(detectIsIndia()).toBe(true);
    expect(detectPricingRegion()).toBe('IN');
  });

  it('detects India from saved profile country', () => {
    mockStorage.setItem(
      'dhikrly_profile',
      JSON.stringify({ country: 'India' })
    );

    expect(detectIsIndia()).toBe(true);
    expect(detectPricingRegion()).toBe('IN');
  });

  it('defaults to GLOBAL when no Indian signals are present', () => {
    mockStorage.setItem(
      'salah_settings',
      JSON.stringify({ location: { city: 'London', country: 'UK', timezone: 'Europe/London' } })
    );

    expect(detectIsIndia()).toBe(false);
    expect(detectPricingRegion()).toBe('GLOBAL');
  });
});
