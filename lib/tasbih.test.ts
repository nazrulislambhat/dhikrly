import { describe, expect, it } from 'vitest';
import {
  changeTasbihTarget,
  DEFAULT_TASBIH_STATE,
  incrementTasbih,
  normalizeTasbihState,
  resetTasbih,
  undoTasbih,
} from './tasbih';

describe('Tasbih counter state', () => {
  it('keeps the count when a target is reached and records the completed round', () => {
    const state = { ...DEFAULT_TASBIH_STATE, count: 32 };

    expect(incrementTasbih(state)).toMatchObject({
      count: 33,
      rounds: 1,
      target: 33,
    });
  });

  it('undoes the last count, including a just-completed round', () => {
    const completed = incrementTasbih({
      ...DEFAULT_TASBIH_STATE,
      count: 32,
      rounds: 2,
    });

    expect(undoTasbih(completed)).toMatchObject({
      count: 32,
      rounds: 2,
      previousCount: null,
      previousRounds: null,
    });
  });

  it('supports custom and untargeted counts without discarding progress', () => {
    const current = { ...DEFAULT_TASBIH_STATE, count: 14 };

    expect(changeTasbihTarget(current, 250)).toMatchObject({
      count: 14,
      target: 250,
    });
    expect(changeTasbihTarget(current, null)).toMatchObject({
      count: 14,
      target: null,
    });
  });

  it('resets the count without clearing completed rounds', () => {
    expect(resetTasbih({ ...DEFAULT_TASBIH_STATE, count: 18, rounds: 4 })).toMatchObject({
      count: 0,
      rounds: 4,
    });
  });

  it('normalizes legacy saved state and rejects invalid values', () => {
    expect(normalizeTasbihState({ count: 12, target: 99, rounds: 1 })).toMatchObject({
      count: 12,
      target: 99,
      rounds: 1,
    });
    expect(normalizeTasbihState({ count: -1, target: 0, rounds: 'bad' })).toEqual(
      DEFAULT_TASBIH_STATE,
    );
  });
});
