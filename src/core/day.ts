import { drawWithoutReplacement, hashString, pickOne, seededRandom } from './random';
import { countWinningLines } from './solutions';
import type { Difficulty, FieldSpot, Player, Puzzle, SportAdapter } from './types';

/** Candidates offered per opening. Five fits a phone and still hides the answer. */
export const WAIVERS_PER_OPENING = 5;

/**
 * A day is three rounds on one matchup, and they share a waiver wire.
 *
 * Round one opens a single spot. Round two opens that spot and one more. Round
 * three opens all three. The wire never changes, so what round one's reveal
 * showed you about those five players is still true in rounds two and three —
 * the day is one puzzle you learn your way through rather than three unrelated
 * ones.
 *
 * It gets harder because each round takes another of your own starters off the
 * field, so more of your total has to come off the wire.
 */
export const ROUNDS: Difficulty[] = ['easy', 'medium', 'hard'];

export const OPENINGS_FOR: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

/**
 * What fraction of possible line-ups may win, per round.
 *
 * The floor is the promise: every round must have at least one winning line, or
 * it isn't a puzzle. The ceiling stops round one being a day where anything wins.
 */
const BANDS: Record<Difficulty, [number, number]> = {
  easy: [0.2, 0.8],
  medium: [0.04, 0.44],
  hard: [0.008, 0.12],
};

/** How many matchups to try before settling for the best seen. */
const SEARCH_DEPTH = 80;

export interface Day {
  date: string;
  season: number;
  week: number;
  /** One puzzle per round, sharing a matchup, a lineup and a wire. */
  rounds: Puzzle[];
}

/** The local calendar day, which is the day the player thinks they're playing. */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The day for a given date. Same date and same adapter, same day, always.
 *
 * The search is over whole days rather than single puzzles: one matchup has to
 * work three times over, at three different sizes, which is a stronger thing to
 * ask for than three separate puzzles each working once.
 */
export function dayFor(adapter: SportAdapter, date: string): Day {
  const random = seededRandom(hashString(`${adapter.id}:${date}`));

  const room = openableSpots(adapter).size;
  if (room === 0) {
    throw new Error(`${adapter.id}: formation has no openable slots`);
  }
  const rounds = ROUNDS.slice(0, Math.min(ROUNDS.length, room));

  const seasons = adapter.seasons();
  if (seasons.length === 0) {
    throw new Error(`${adapter.id}: adapter offers no seasons`);
  }

  let fallback: Day | null = null;
  let fallbackMiss = Infinity;

  for (let attempt = 0; attempt < SEARCH_DEPTH; attempt++) {
    const season = pickOne(seasons, random);
    const weeks = adapter.weeks(season);
    if (weeks.length === 0) {
      throw new Error(`${adapter.id}: adapter offers no weeks in ${season}`);
    }
    const week = pickOne(weeks, random);

    const spots = chooseOpenings(adapter, rounds.length, random);
    const wire = new Map<string, Player[]>();
    for (const spot of spots) {
      const pool = adapter.candidates(season, week, spot.slot);
      if (pool.length < WAIVERS_PER_OPENING) {
        throw new Error(
          `${adapter.id}: ${season} week ${week} ${spot.slot} has ${pool.length} candidates, ` +
            `needs ${WAIVERS_PER_OPENING}`,
        );
      }
      wire.set(spot.id, drawWithoutReplacement(pool, WAIVERS_PER_OPENING, random));
    }

    const built = rounds.map((difficulty, i) =>
      round(adapter, date, season, week, difficulty, spots.slice(0, i + 1), wire),
    );

    if (built.some((p) => p.lines.winning === 0)) continue;

    const miss = built.reduce((worst, p, i) => Math.max(worst, offBand(p, rounds[i])), 0);
    if (miss === 0) return { date, season, week, rounds: built };

    if (miss < fallbackMiss) {
      fallback = { date, season, week, rounds: built };
      fallbackMiss = miss;
    }
  }

  if (fallback) return fallback;
  throw new Error(`${adapter.id}: found no winnable day for ${date}`);
}

/** How far outside its band a round's share of winning line-ups sits. */
function offBand(puzzle: Puzzle, difficulty: Difficulty): number {
  const [floor, ceiling] = BANDS[difficulty];
  const share = puzzle.lines.winning / puzzle.lines.total;
  return share < floor ? floor - share : share > ceiling ? share - ceiling : 0;
}

function round(
  adapter: SportAdapter,
  date: string,
  season: number,
  week: number,
  difficulty: Difficulty,
  openings: FieldSpot[],
  wire: Map<string, Player[]>,
): Puzzle {
  const roster = adapter.roster(season, week);
  const isOpen = new Set(openings.map((spot) => spot.id));

  const puzzle: Puzzle = {
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
    waivers: openings.flatMap((spot) => wire.get(spot.id) ?? []),
    opponent: adapter.opponent(season, week),
  };

  return { ...puzzle, lines: countWinningLines(adapter, puzzle) };
}

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

/**
 * The three spots that will open, in the order they open.
 *
 * No two share a slot, so each opening stays its own question and the wire for
 * one round never overlaps another's.
 */
function chooseOpenings(adapter: SportAdapter, count: number, random: () => number): FieldSpot[] {
  const bySlot = openableSpots(adapter);
  const slots = drawWithoutReplacement([...bySlot.keys()], count, random);
  return slots.map((slot) => pickOne(bySlot.get(slot)!, random));
}
