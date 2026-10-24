import { describe, it, expect } from 'vitest';
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS } from '@/app/zakat/page';

describe('Zakat & Nisab Calculations', () => {
  it('has accurate classical Nisab constants for gold and silver', () => {
    // 7.5 tolas / 87.48 grams gold
    expect(GOLD_NISAB_GRAMS).toBeCloseTo(87.48, 2);
    // 52.5 tolas / 612.36 grams silver
    expect(SILVER_NISAB_GRAMS).toBeCloseTo(612.36, 2);
  });

  it('calculates silver Nisab threshold value correctly', () => {
    const silverPricePerGram = 1.05;
    const threshold = SILVER_NISAB_GRAMS * silverPricePerGram;
    expect(threshold).toBeCloseTo(642.978, 2);
  });

  it('calculates gold Nisab threshold value correctly', () => {
    const goldPricePerGram = 86.5;
    const threshold = GOLD_NISAB_GRAMS * goldPricePerGram;
    expect(threshold).toBeCloseTo(7567.02, 2);
  });

  it('correctly assesses zakat obligation when net assets exceed Nisab', () => {
    const totalAssets = 15000;
    const liabilities = 2000;
    const netZakatableWealth = totalAssets - liabilities; // 13,000
    const silverNisab = SILVER_NISAB_GRAMS * 1.05; // ~642.98

    const isDue = netZakatableWealth >= silverNisab;
    expect(isDue).toBe(true);

    const lunarZakat = netZakatableWealth * 0.025; // 2.5%
    expect(lunarZakat).toBe(325);

    const solarZakat = netZakatableWealth * 0.02577; // 2.577%
    expect(solarZakat).toBeCloseTo(335.01, 2);
  });

  it('exempts wealth below Nisab from zakat obligation', () => {
    const totalAssets = 500;
    const liabilities = 100;
    const netZakatableWealth = totalAssets - liabilities; // 400
    const silverNisab = SILVER_NISAB_GRAMS * 1.05; // 642.98

    const isDue = netZakatableWealth >= silverNisab;
    expect(isDue).toBe(false);
  });
});
