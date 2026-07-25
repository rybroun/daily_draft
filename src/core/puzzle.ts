import { drawWithoutReplacement, hashString, pickOne, seededRandom } from './random';
import type { DateKey, FieldSpot, Player, Puzzle, SportAdapter } from './types';

/** How many spots the puzzle leaves open. Two is a decision, one is a guess. */
export const OPENINGS = 2;

/** Candidates offered per opening. Five fits a phone and still hides the answer. */
export const WAIVERS_PER_OPENING = 5;

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

  const weeks = adapter.weeks(season);
  if (weeks.length === 0) {
    throw new Error(`${adapter.id}: adapter offers no weeks in ${season}`);
  }
  const week = pickOne(weeks, random);

  const openings = chooseOpenings(adapter, random);
  const roster = adapter.roster(season, week);

  const waivers: Player[] = [];
  for (const opening of openings) {
    const pool = adapter.candidates(season, week, opening.slot);
    if (pool.length < WAIVERS_PER_OPENING) {
      throw new Error(
        `${adapter.id}: ${season} week ${week} ${opening.slot} has ${pool.length} candidates, ` +
          `needs ${WAIVERS_PER_OPENING}`,
      );
    }
    waivers.push(...drawWithoutReplacement(pool, WAIVERS_PER_OPENING, random));
  }

  const isOpen = new Set(openings.map((spot) => spot.id));

  return {
    date,
    sportId: adapter.id,
    season,
    week,
    field: adapter.formation().map((spot) => ({
      spot,
      player: isOpen.has(spot.id) ? null : (roster.get(spot.id) ?? null),
    })),
    openings,
    waivers,
  };
}

/**
 * Empty out `OPENINGS` spots, no two of the same slot.
 *
 * Sharing a slot would turn two independent decisions into one combined one —
 * pick the best pair rather than the best player twice — and that isn't the
 * puzzle. Keeping the slots distinct keeps each opening its own question.
 */
function chooseOpenings(adapter: SportAdapter, random: () => number): FieldSpot[] {
  const openable = adapter.openableSlots();
  const bySlot = new Map<string, FieldSpot[]>();
  for (const spot of adapter.formation()) {
    if (!openable.includes(spot.slot)) continue;
    const spots = bySlot.get(spot.slot) ?? [];
    spots.push(spot);
    bySlot.set(spot.slot, spots);
  }

  if (bySlot.size < OPENINGS) {
    throw new Error(
      `${adapter.id}: formation has ${bySlot.size} openable slots, needs ${OPENINGS}`,
    );
  }

  const slots = drawWithoutReplacement([...bySlot.keys()], OPENINGS, random);
  const chosen = slots.map((slot) => pickOne(bySlot.get(slot)!, random));

  // Back into formation order, so the openings read down the field as drawn.
  const order = adapter.formation().map((spot) => spot.id);
  return chosen.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
