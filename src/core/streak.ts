import type { DateKey } from './types';

export interface StreakState {
  current: number;
  best: number;
  /** The last day a puzzle was completed, or null if none ever was. */
  lastPlayed: DateKey | null;
}

const DAY_MS = 86_400_000;

export function emptyStreak(): StreakState {
  return { current: 0, best: 0, lastPlayed: null };
}

/**
 * Advance the streak for a completed day.
 *
 * Idempotent: replaying a day already recorded leaves the streak alone, so a
 * refresh can't inflate it. Dates are compared as calendar days, not instants.
 */
export function recordPlay(state: StreakState, date: DateKey): StreakState {
  if (state.lastPlayed !== null && date <= state.lastPlayed) {
    return state;
  }

  const current = state.lastPlayed !== null && daysBetween(state.lastPlayed, date) === 1
    ? state.current + 1
    : 1;

  return {
    current,
    best: Math.max(state.best, current),
    lastPlayed: date,
  };
}

/** Whole days from one calendar day to another. UTC, so DST can't shift it. */
function daysBetween(from: DateKey, to: DateKey): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
}
