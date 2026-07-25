import { emptyStreak } from '../core/streak';
import type { StreakState } from '../core/streak';
import type { DateKey, PlayerId } from '../core/types';

/** Bumped from v1 when a puzzle went from one pick to a set of them. */
export const STORAGE_KEY = 'daily_draft.v2';

export interface SavedGame {
  streak: StreakState;
  /**
   * Picks already made today, in opening order. Shorter than the number of
   * openings while the board is half-filled — a refresh mid-decision keeps them.
   */
  picks: { date: DateKey; playerIds: PlayerId[] } | null;
}

/** The slice of `localStorage` we use — narrowed so it can be faked in tests. */
export interface GameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const newGame = (): SavedGame => ({ streak: emptyStreak(), picks: null });

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
  const { streak, picks } = value as Record<string, unknown>;

  return { streak: parseStreak(streak), picks: parsePicks(picks) };
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

function parsePicks(value: unknown): SavedGame['picks'] {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') throw new Error('saved picks are not an object');

  const { date, playerIds } = value as Record<string, unknown>;
  if (typeof date !== 'string') throw new Error('saved picks have no date');
  if (!Array.isArray(playerIds) || playerIds.some((id) => typeof id !== 'string')) {
    throw new Error('saved picks are not a list of players');
  }
  return { date, playerIds };
}
