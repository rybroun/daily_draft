import { drawWithoutReplacement, hashString, pickOne, seededRandom } from './random';
import type { DateKey, Puzzle, SportAdapter } from './types';

/** How many candidates a slate holds. Six reads in a glance on a phone. */
export const SLATE_SIZE = 6;

/** A slate of one isn't a puzzle. */
const MIN_CANDIDATES = 2;

/** The local calendar day, which is the day the player thinks they're playing. */
export function dateKey(date: Date): DateKey {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The puzzle for a given day. Same date and same adapter, same puzzle, always —
 * the date string is the only entropy, so nothing here depends on when it runs.
 */
export function puzzleFor(adapter: SportAdapter, date: DateKey): Puzzle {
  const random = seededRandom(hashString(`${adapter.id}:${date}`));

  const seasons = adapter.seasons();
  if (seasons.length === 0) {
    throw new Error(`${adapter.id}: adapter offers no seasons`);
  }
  const season = pickOne(seasons, random);

  const slots = adapter.slots(season);
  if (slots.length === 0) {
    throw new Error(`${adapter.id}: adapter offers no slots for ${season}`);
  }
  const slot = pickOne(slots, random);

  const pool = adapter.candidates(season, slot);
  if (pool.length < MIN_CANDIDATES) {
    throw new Error(
      `${adapter.id}: ${season} ${slot} has ${pool.length} candidates, needs ${MIN_CANDIDATES}`,
    );
  }

  return {
    date,
    sportId: adapter.id,
    season,
    slot,
    statKeys: adapter.statKeys(slot),
    candidates: drawWithoutReplacement(pool, SLATE_SIZE, random),
  };
}
