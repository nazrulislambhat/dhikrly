export type TasbihTarget = number | null;

export interface TasbihState {
  count: number;
  target: TasbihTarget;
  rounds: number;
  previousCount: number | null;
  previousRounds: number | null;
}

export const DEFAULT_TASBIH_STATE: TasbihState = {
  count: 0,
  target: 33,
  rounds: 0,
  previousCount: null,
  previousRounds: null,
};

function isValidCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isValidTarget(value: unknown): value is TasbihTarget {
  return value === null || (isValidCount(value) && value >= 1 && value <= 100_000);
}

export function normalizeTasbihState(raw: unknown): TasbihState {
  if (!raw || typeof raw !== 'object') return DEFAULT_TASBIH_STATE;

  const value = raw as Partial<TasbihState>;
  return {
    count: isValidCount(value.count) ? value.count : 0,
    target: isValidTarget(value.target) ? value.target : DEFAULT_TASBIH_STATE.target,
    rounds: isValidCount(value.rounds) ? value.rounds : 0,
    previousCount: isValidCount(value.previousCount) ? value.previousCount : null,
    previousRounds: isValidCount(value.previousRounds) ? value.previousRounds : null,
  };
}

export function incrementTasbih(state: TasbihState): TasbihState {
  const count = state.count + 1;
  const completesRound = state.target !== null && count === state.target;

  return {
    ...state,
    count,
    rounds: state.rounds + Number(completesRound),
    previousCount: state.count,
    previousRounds: state.rounds,
  };
}

export function undoTasbih(state: TasbihState): TasbihState {
  if (state.previousCount === null || state.previousRounds === null) return state;

  return {
    ...state,
    count: state.previousCount,
    rounds: state.previousRounds,
    previousCount: null,
    previousRounds: null,
  };
}

export function resetTasbih(state: TasbihState): TasbihState {
  return {
    ...state,
    count: 0,
    previousCount: null,
    previousRounds: null,
  };
}

export function changeTasbihTarget(
  state: TasbihState,
  target: TasbihTarget,
): TasbihState {
  if (!isValidTarget(target)) return state;
  return { ...state, target, previousCount: null, previousRounds: null };
}
