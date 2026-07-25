import { emptyStreak } from '../core/streak';
import type { StreakState } from '../core/streak';
import type { DateKey, PlayerId } from '../core/types';

export const STORAGE_KEY = 'daily_draft.v1';

export interface SavedGame {
  streak: StreakState;
  /** The pick already made today, so a refresh shows the result again. */
  lastPick: { date: DateKey; playerId: PlayerId } | null;
}

/** The slice of `localStorage` we use — narrowed so it can be faked in tests. */
export interface GameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const newGame = (): SavedGame => ({ streak: emptyStreak(), lastPick: null });

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
  const { streak, lastPick } = value as Record<string, unknown>;

  return {
    streak: parseStreak(streak),
    lastPick: parseLastPick(lastPick),
  };
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

function parseLastPick(value: unknown): SavedGame['lastPick'] {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') throw new Error('saved pick is not an object');

  const { date, playerId } = value as Record<string, unknown>;
  if (typeof date !== 'string' || typeof playerId !== 'string') {
    throw new Error('saved pick is missing a date or a player');
  }
  return { date, playerId };
}
