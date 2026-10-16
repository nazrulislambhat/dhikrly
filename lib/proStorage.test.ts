import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyPromoCode,
  getProStatus,
  PRO_FEATURES,
  saveProStatus,
} from './proStorage';

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

describe('proStorage', () => {
  beforeEach(() => {
    const mockStorage = new MockStorage();
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

  it('returns default free status when storage is empty', () => {
    const status = getProStatus();
    expect(status.isPro).toBe(false);
    expect(status.tier).toBe('free');
  });

  it('saves and retrieves Pro status', () => {
    saveProStatus({
      isPro: true,
      tier: 'annual',
      activatedAt: new Date().toISOString(),
      promoCode: 'TESTPRO',
    });

    const status = getProStatus();
    expect(status.isPro).toBe(true);
    expect(status.tier).toBe('annual');
    expect(status.promoCode).toBe('TESTPRO');
  });

  it('handles expired pro status gracefully', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    saveProStatus({
      isPro: true,
      tier: 'monthly',
      expiresAt: pastDate.toISOString(),
    });

    const status = getProStatus();
    expect(status.isPro).toBe(false);
    expect(status.tier).toBe('free');
  });

  it('successfully applies valid promo codes', () => {
    const resTest = applyPromoCode('TESTPRO');
    expect(resTest.success).toBe(true);
    expect(resTest.tier).toBe('lifetime');

    const status = getProStatus();
    expect(status.isPro).toBe(true);
    expect(status.tier).toBe('lifetime');

    const resRamadan = applyPromoCode('ramadan');
    expect(resRamadan.success).toBe(true);
    expect(resRamadan.tier).toBe('annual');
  });

  it('rejects invalid promo codes with helpful message', () => {
    const res = applyPromoCode('INVALID_CODE_123');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Invalid promo code');
  });

  it('includes all planned halal pro features', () => {
    expect(PRO_FEATURES.length).toBeGreaterThanOrEqual(6);
    const ids = PRO_FEATURES.map((f) => f.id);
    expect(ids).toContain('ai_hifdh');
    expect(ids).toContain('cloud_sync');
    expect(ids).toContain('soundscapes');
    expect(ids).toContain('analytics');
    expect(ids).toContain('zakat_screener');
    expect(ids).toContain('waqf_giveback');
  });
});
