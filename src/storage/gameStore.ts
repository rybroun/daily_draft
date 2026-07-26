import { emptyStreak } from '../core/streak';
import type { StreakState } from '../core/streak';
import type { DateKey, PlayerId } from '../core/types';

/** Bumped from v2 when a day went from one puzzle to three rounds. */
export const STORAGE_KEY = 'daily_draft.v3';

/** One round's answer. `locked` means it's been played and can't be changed. */
export interface SavedRound {
  playerIds: PlayerId[];
  locked?: boolean;
}

export interface SavedGame {
  streak: StreakState;
  /**
   * Today's progress. `started` is whether the intro has been dismissed;
   * `rounds` is one entry per round in order, growing as they're played.
   */
  day: { date: DateKey; started?: boolean; rounds: SavedRound[] } | null;
}

/** The slice of `localStorage` we use — narrowed so it can be faked in tests. */
export interface GameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const newGame = (): SavedGame => ({ streak: emptyStreak(), day: null });

/**
 * Read the saved game, falling back to a fresh one on anything unexpected.
 *
 * A player whose storage is corrupt or unavailable loses their streak, which is
 * a bad day. Being unable to play at all is worse, so nothing here throws.
 */
export function loadGame(storage: GameStorage): SavedGame {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return newGame();
  }
  if (raw === null) return newGame();

  try {
    return parseGame(JSON.parse(raw));
  } catch {
    return newGame();
  }
}

/** Best-effort persist. Storage can be full or blocked; that's not fatal. */
export function saveGame(storage: GameStorage, game: SavedGame): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Nothing useful to do — the game is still playable in memory.
  }
}

function parseGame(value: unknown): SavedGame {
  if (typeof value !== 'object' || value === null) {
    throw new Error('saved game is not an object');
  }
  const { streak, day } = value as Record<string, unknown>;

  return { streak: parseStreak(streak), day: parseDay(day) };
}

function parseStreak(value: unknown): StreakState {
  if (typeof value !== 'object' || value === null) {
    throw new Error('saved streak is not an object');
  }
  const { current, best, lastPlayed } = value as Record<string, unknown>;
  if (typeof current !== 'number' || typeof best !== 'number') {
    throw new Error('saved streak counts are not numbers');
  }
  if (lastPlayed !== null && typeof lastPlayed !== 'string') {
    throw new Error('saved streak date is not a date');
  }
  return { current, best, lastPlayed };
}

function parseDay(value: unknown): SavedGame['day'] {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') throw new Error('saved day is not an object');

  const { date, started, rounds } = value as Record<string, unknown>;
  if (typeof date !== 'string') throw new Error('saved day has no date');
  if (!Array.isArray(rounds)) throw new Error('saved day has no rounds');

  return {
    date,
    ...(started === true ? { started: true } : {}),
    rounds: rounds.map(parseRound),
  };
}

function parseRound(value: unknown): SavedRound {
  if (typeof value !== 'object' || value === null) {
    throw new Error('a saved round is not an object');
  }
  const { playerIds, locked } = value as Record<string, unknown>;
  if (!Array.isArray(playerIds) || playerIds.some((id) => typeof id !== 'string')) {
    throw new Error('a saved round is not a list of players');
  }
  return { playerIds: playerIds as PlayerId[], ...(locked === true ? { locked: true } : {}) };
}
