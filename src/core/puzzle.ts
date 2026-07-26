import { drawWithoutReplacement, hashString, pickOne, seededRandom } from './random';
import { countWinningLines } from './solutions';
import type { Difficulty, FieldSpot, Player, Puzzle, SportAdapter } from './types';

/** Candidates offered per opening. Five fits a phone and still hides the answer. */
export const WAIVERS_PER_OPENING = 5;

/**
 * Difficulty is how many spots you have to get right.
 *
 * One is a single decision with several right answers. Three is a line that has
 * to hold end to end — more points available, but far more ways to drop one.
 */
export const OPENINGS_FOR: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

/**
 * What fraction of possible line-ups may win, per difficulty.
 *
 * The floor matters more than the ceiling: every puzzle must have at least one
 * winning line, or it isn't a puzzle. The ceiling stops an "easy" day being one
 * where literally anything wins.
 */
const BANDS: Record<Difficulty, [number, number]> = {
  easy: [0.4, 0.9],
  medium: [0.08, 0.44],
  hard: [0.008, 0.06],
};

/**
 * A day is three problems, easiest first.
 *
 * The order is the point: round one teaches you to read the board with a single
 * decision, and by round three you're holding a three-man line together. It's
 * a puzzle set, not a difficulty setting.
 */
export const ROUNDS: Difficulty[] = ['easy', 'medium', 'hard'];

const DIFFICULTIES: Difficulty[] = ROUNDS;

/** How many (season, week) pairs to try before settling for the best seen. */
const SEARCH_DEPTH = 60;

/** The local calendar day, which is the day the player thinks they're playing. */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The puzzle for a given day. Same date and same adapter, same puzzle, always —
 * the date string is the only entropy, so nothing here depends on when it runs.
 *
 * Unlike earlier versions this doesn't take the first arrangement it draws. It
 * searches for one that can actually be won, because a day where nothing you
 * pick changes the result is a day not worth opening the game for.
 */
export function puzzleFor(
  adapter: SportAdapter,
  date: string,
  /** Ask for a specific difficulty. Omit for the one the date chose. */
  asked?: Difficulty,
): Puzzle {
  const random = seededRandom(hashString(`${adapter.id}:${date}`));

  /*
   * Difficulty is capped by what the formation can actually open. A sport with
   * two openable positions has no "hard" — better to play its hardest than to
   * refuse the day.
   */
  const room = openableSlotCount(adapter);
  if (room === 0) {
    throw new Error(`${adapter.id}: formation has no openable slots`);
  }
  // The draw happens either way, so asking for a difficulty doesn't shift the
  // seed and change which weeks get searched.
  const drawn = pickOne(DIFFICULTIES, random);
  const wanted = asked ?? drawn;
  const difficulty =
    OPENINGS_FOR[wanted] <= room
      ? wanted
      : (DIFFICULTIES.filter((d) => OPENINGS_FOR[d] <= room).pop() as Difficulty);
  const openingCount = OPENINGS_FOR[difficulty];
  const [floor, ceiling] = BANDS[difficulty];

  const seasons = adapter.seasons();
  if (seasons.length === 0) {
    throw new Error(`${adapter.id}: adapter offers no seasons`);
  }

  let fallback: Puzzle | null = null;

  for (let attempt = 0; attempt < SEARCH_DEPTH; attempt++) {
    const season = pickOne(seasons, random);
    const weeks = adapter.weeks(season);
    if (weeks.length === 0) {
      throw new Error(`${adapter.id}: adapter offers no weeks in ${season}`);
    }
    const week = pickOne(weeks, random);

    const candidate = build(adapter, date, season, week, difficulty, openingCount, random);
    const lines = countWinningLines(adapter, candidate);
    const solved = { ...candidate, lines };

    if (lines.winning === 0) continue;
    const share = lines.winning / lines.total;
    if (share >= floor && share <= ceiling) return solved;

    // Winnable but off-target: keep the closest so far rather than nothing.
    if (fallback === null || better(share, fallback.lines, floor, ceiling)) fallback = solved;
  }

  if (fallback) return fallback;
  throw new Error(`${adapter.id}: found no winnable ${difficulty} puzzle for ${date}`);
}

const better = (share: number, best: { winning: number; total: number }, floor: number, ceiling: number) => {
  const distance = (s: number) => (s < floor ? floor - s : s > ceiling ? s - ceiling : 0);
  return distance(share) < distance(best.winning / best.total);
};

function build(
  adapter: SportAdapter,
  date: string,
  season: number,
  week: number,
  difficulty: Difficulty,
  openingCount: number,
  random: () => number,
): Puzzle {
  const openings = chooseOpenings(adapter, openingCount, random);
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
    difficulty,
    lines: { winning: 0, total: 0 },
    field: adapter.formation().map((spot) => ({
      spot,
      player: isOpen.has(spot.id) ? null : (roster.get(spot.id) ?? null),
    })),
    openings,
    waivers,
    opponent: adapter.opponent(season, week),
  };
}

/**
 * Empty out `count` spots, no two of the same slot.
 *
 * Sharing a slot would turn independent decisions into one combined one — pick
 * the best pair from a shared pool rather than the best player twice — and that
 * isn't the puzzle. Keeping the slots distinct keeps each opening its own
 * question, which is also what makes the line count mean something.
 */
function openableSpots(adapter: SportAdapter): Map<string, FieldSpot[]> {
  const openable = adapter.openableSlots();
  const bySlot = new Map<string, FieldSpot[]>();
  for (const spot of adapter.formation()) {
    if (!openable.includes(spot.slot)) continue;
    const spots = bySlot.get(spot.slot) ?? [];
    spots.push(spot);
    bySlot.set(spot.slot, spots);
  }
  return bySlot;
}

const openableSlotCount = (adapter: SportAdapter) => openableSpots(adapter).size;

function chooseOpenings(adapter: SportAdapter, count: number, random: () => number): FieldSpot[] {
  const bySlot = openableSpots(adapter);
  const slots = drawWithoutReplacement([...bySlot.keys()], count, random);
  const chosen = slots.map((slot) => pickOne(bySlot.get(slot)!, random));

  // Back into formation order, so the openings read down the field as drawn.
  const order = adapter.formation().map((spot) => spot.id);
  return chosen.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}
