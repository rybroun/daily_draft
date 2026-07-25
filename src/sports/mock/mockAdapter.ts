import { drawWithoutReplacement, hashString, seededRandom } from '../../core/random';
import type { Player, RosterSlot, SportAdapter, StatKey } from '../../core/types';
import { CLUBS, FIRST_NAMES, LAST_NAMES } from './names';

/**
 * An invented league, standing in until a real sport is chosen.
 *
 * Everything here is fabricated — the players, the clubs, the stats and the way
 * they turn into a season's worth of value. It exists so the puzzle can be built
 * and played before anyone commits to MLB, NHL or NBA, and so the adapter seam
 * is proven by something that is definitely not a real sport.
 */

const FIRST_SEASON = 1974;
const LAST_SEASON = 2001;

/** Attacking slots and defensive slots are judged on different stats. */
const SLOTS = ['ANCHOR', 'WING', 'PIVOT', 'WARDEN'] as const;
const DEFENSIVE_SLOTS: readonly RosterSlot[] = ['PIVOT', 'WARDEN'];

/** Deep enough that a six-man slate looks different most days. */
const ROSTER_SIZE = 14;

const STAT_LABELS: Record<StatKey, string> = {
  scores: 'SCR',
  stops: 'STP',
  setups: 'SET',
  rating: 'RTG',
};

/**
 * What a season at this slot is worth. The mock's own answer, not core's.
 *
 * Weighted so all three stats move the total by a comparable amount. If the
 * volume stat dominated, the slate would sort itself at a glance and there'd be
 * no puzzle left to solve.
 */
const VALUE_WEIGHTS: Record<StatKey, number> = {
  scores: 1.5,
  stops: 1.5,
  setups: 2,
  rating: 1,
};

export const mockAdapter: SportAdapter = {
  id: 'mock',
  displayName: 'Mock League',

  seasons: () =>
    Array.from({ length: LAST_SEASON - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i),

  slots: () => [...SLOTS],

  statKeys: (slot) =>
    DEFENSIVE_SLOTS.includes(slot)
      ? ['stops', 'setups', 'rating']
      : ['scores', 'setups', 'rating'],

  candidates: (season, slot) => rosterFor(season, slot),

  formatStatLine: (player, slot) =>
    mockAdapter
      .statKeys(slot)
      .map((key) => `${format(key, player.stats[key])} ${STAT_LABELS[key]}`)
      .join(' · '),

  seasonValue: (player, slot) =>
    mockAdapter
      .statKeys(slot)
      .reduce((total, key) => total + player.stats[key] * VALUE_WEIGHTS[key], 0),
};

/**
 * The same roster every time it's asked for — the league's history is fixed,
 * it just happens to be generated rather than looked up.
 */
function rosterFor(season: number, slot: RosterSlot): Player[] {
  const random = seededRandom(hashString(`mock:${season}:${slot}`));
  const firsts = drawWithoutReplacement(FIRST_NAMES, ROSTER_SIZE, random);
  const lasts = drawWithoutReplacement(LAST_NAMES, ROSTER_SIZE, random);

  // Scoring drifted upward over the league's history, the way it does anywhere.
  const era = 0.85 + ((season - FIRST_SEASON) / (LAST_SEASON - FIRST_SEASON)) * 0.35;

  return Array.from({ length: ROSTER_SIZE }, (_, i) => ({
    id: `${season}-${slot}-${i}`,
    name: `${firsts[i]} ${lasts[i]}`,
    team: CLUBS[Math.floor(random() * CLUBS.length)],
    stats: statsFor(slot, era, random),
  }));
}

function statsFor(
  slot: RosterSlot,
  era: number,
  random: () => number,
): Record<StatKey, number> {
  // Skewed so most of a slate is ordinary and a couple of players are special.
  const quality = Math.pow(random(), 1.7);

  // Each stat only partly follows overall quality. That's the whole puzzle: the
  // slate's volume leader is often not the season that was actually worth most.
  const blend = (followsQuality: number) =>
    quality * followsQuality + Math.pow(random(), 1.4) * (1 - followsQuality);

  const volume = Math.round((9 + blend(0.55) * 43) * era);
  const setups = Math.round((7 + blend(0.35) * 31) * era);
  const rating = Math.round((44 + blend(0.6) * 54) * 10) / 10;

  const volumeKey = DEFENSIVE_SLOTS.includes(slot) ? 'stops' : 'scores';
  return { [volumeKey]: volume, setups, rating };
}

const format = (key: StatKey, value: number) =>
  key === 'rating' ? value.toFixed(1) : String(value);
