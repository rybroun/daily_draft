import { drawWithoutReplacement, hashString, seededRandom } from '../../core/random';
import type { Player, RosterSlot, StatKey, StatLine } from '../../core/types';
import { fantasyPoints } from './league';
import { CLUBS, FIRST_NAMES, LAST_NAMES } from './names';

/**
 * Invented careers.
 *
 * Every player has a true weekly level that nothing in the game ever shows you.
 * What you get instead are three noisy readings of it: a season average, a
 * three-week average, and — only after you've decided — the week itself.
 *
 * The noise grows as the sample shrinks. That's the whole puzzle. A season line
 * is a steady but stale read, a hot three weeks is often just three lucky games,
 * and any single week is mostly weather. Form is worth reading and will still
 * be wrong a lot, which is exactly what waivers feel like.
 */

/** Standard deviations, in fantasy points, of each reading of a player's level. */
const NOISE = { season: 1.4, recent: 3.4, week: 5.4 };

/**
 * Averages never quite reach zero. A player who genuinely averaged nothing over
 * three weeks would have been dropped, not offered on waivers — but a single
 * week really can be a nought, so only the averages get a floor.
 */
const AVERAGE_FLOOR = 1.2;

/** Waiver-tier weekly expectation by position: nobody here is a star. */
const TALENT: Record<RosterSlot, [number, number]> = {
  QB: [13, 22],
  RB: [5.5, 16],
  WR: [5, 15],
  TE: [3.5, 11],
  K: [5.5, 11],
  DST: [4.5, 11],
};

export function makePlayer(
  seed: string,
  slot: RosterSlot,
  week: number,
  name: string,
): Player {
  const random = seededRandom(hashString(seed));

  const [low, high] = TALENT[slot];
  // Skewed low: most of a waiver board is replacement level, which is the point.
  const talent = low + Math.pow(random(), 1.4) * (high - low);

  const seasonPpg = reading(talent, NOISE.season, random, AVERAGE_FLOOR);
  const recentPpg = reading(talent, NOISE.recent, random, AVERAGE_FLOOR);
  const weekPoints = reading(talent, NOISE.week, random, 0);

  return {
    id: seed,
    name,
    team: CLUBS[Math.floor(random() * CLUBS.length)],
    slot,
    form: [
      averageLine('SEASON', slot, seasonPpg, random),
      averageLine('LAST 3', slot, recentPpg, random),
    ],
    outcome: {
      label: `WEEK ${week}`,
      stats: countingLine(slot, weekPoints, random),
    },
  };
}

/** A whole pool of players for one slot, with names that don't collide. */
export function makePool(seed: string, slot: RosterSlot, week: number, size: number): Player[] {
  const random = seededRandom(hashString(`names:${seed}`));
  const firsts = drawWithoutReplacement(FIRST_NAMES, size, random);
  const lasts = drawWithoutReplacement(LAST_NAMES, size, random);

  return Array.from({ length: size }, (_, i) =>
    makePlayer(`${seed}:${i}`, slot, week, `${firsts[i]} ${lasts[i]}`),
  );
}

/** One noisy reading of a player's true level. */
function reading(
  talent: number,
  spread: number,
  random: () => number,
  floor: number,
): number {
  return Math.max(floor, talent + gaussian(random) * spread);
}

/** Box–Muller, so the noise is actually shaped like noise. */
function gaussian(random: () => number): number {
  const u1 = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * random());
}

/** The stat line for a single week, in whole numbers. */
function countingLine(
  slot: RosterSlot,
  points: number,
  random: () => number,
): Record<StatKey, number> {
  const line = rawLine(slot, points, random, false);
  return round(line, 0);
}

/** A per-game average line, to one decimal, headed by the average itself. */
function averageLine(
  label: string,
  slot: RosterSlot,
  ppg: number,
  random: () => number,
): StatLine {
  const stats = round(rawLine(slot, ppg, random, true), 1);

  // Derived from the rounded numbers on show, so the line always adds up to the
  // average printed beside it. A player checking the maths must not find a gap.
  stats.ppg = Math.round(fantasyPoints(stats) * 10) / 10;
  return { label, stats };
}

const round = (line: Record<StatKey, number>, places: number): Record<StatKey, number> => {
  const factor = 10 ** places;
  return Object.fromEntries(
    Object.entries(line).map(([key, value]) => [key, Math.round(value * factor) / factor]),
  );
};

/**
 * Work backwards from a points total to a stat line that produces it.
 *
 * Generating the stats and letting the scoring rule read them back means the
 * numbers on screen always add up to the value the pick is judged on — there's
 * no separate hidden score to drift out of step with what's shown.
 */
function rawLine(
  slot: RosterSlot,
  points: number,
  random: () => number,
  perGame: boolean,
): Record<StatKey, number> {
  switch (slot) {
    case 'RB': {
      const td = touchdowns(points, random, perGame);
      const ryd = Math.max(0, (points - td * 6) * 10);
      return { car: Math.max(1, ryd / (3.4 + random() * 1.8)), ryd, td };
    }
    case 'WR':
    case 'TE': {
      const td = touchdowns(points, random, perGame);
      const perCatch = 10.5 + random() * 5;
      const rec = Math.max(0, (points - td * 6) / (0.5 + perCatch * 0.1));
      return { rec, ryd: rec * perCatch, td };
    }
    case 'QB': {
      const int = perGame ? 0.4 + random() * 0.8 : random() < 0.45 ? Math.round(random() * 2) : 0;
      const ptd = touchdowns(points, random, perGame, 4, 4);
      return { pyd: Math.max(0, (points - ptd * 4 + int * 2) / 0.04), ptd, int };
    }
    case 'K': {
      const fg = Math.max(0, Math.min(5, points / 3.4));
      return { fg, xp: Math.max(0, points - fg * 3) };
    }
    default: {
      const int = Math.max(0, Math.min(3, points / 7));
      return { sack: Math.max(0, points - int), int };
    }
  }
}

/**
 * Big weeks are usually big because somebody scored.
 *
 * Capped by what the points can actually pay for, so a nothing game can never
 * come back holding two touchdowns and no yards.
 */
function touchdowns(
  points: number,
  random: () => number,
  perGame: boolean,
  worth = 6,
  most = 2,
): number {
  // Leave at least a quarter of the day's points for the volume stats to carry.
  const affordable = (points * 0.75) / worth;
  if (perGame) return Math.min(affordable, (0.18 + random() * 0.3) * (points / worth));

  const chance = Math.min(0.72, Math.max(0.04, points / 26));
  const drawn = random() > chance ? 0 : random() < 0.18 ? 2 : 1;
  return Math.min(drawn, most, Math.floor(affordable));
}
