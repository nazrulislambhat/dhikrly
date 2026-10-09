import { describe, expect, it } from 'vitest';
import { shouldPreserveLocalEdit } from './localEdits';

describe('shouldPreserveLocalEdit', () => {
  it('preserves a local change that clears a remotely checked dua', () => {
    expect(
      shouldPreserveLocalEdit(
        true,
        { morning: false, evening: true },
        { morning: true, evening: true },
      ),
    ).toBe(true);
  });

  it('preserves an intentionally empty prayer log over a stale remote log', () => {
    expect(
      shouldPreserveLocalEdit(
        true,
        { prayers: { fajr: null } },
        { prayers: { fajr: 'prayed' } },
      ),
    ).toBe(true);
  });

  it('does not require a write when local and remote snapshots already match', () => {
    expect(
      shouldPreserveLocalEdit(
        true,
        { prayers: { fajr: null } },
        { prayers: { fajr: null } },
      ),
    ).toBe(false);
  });

  it('preserves the user clearing every checked item', () => {
    expect(shouldPreserveLocalEdit(true, {}, { morning: true })).toBe(true);
  });

  it('does not preserve stale local state without a pending edit marker', () => {
    expect(
      shouldPreserveLocalEdit(
        false,
        { prayers: { fajr: null } },
        { prayers: { fajr: 'prayed' } },
      ),
    ).toBe(false);
  });
});
