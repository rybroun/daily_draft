import { drawWithoutReplacement, hashString, seededRandom } from '../../core/random';
import type { Player, RosterSlot, SpotId, SportAdapter } from '../../core/types';
import {
  FIRST_WEEK,
  FORMATION,
  LAST_WEEK,
  OPENABLE,
  SLOT_COLORS,
  SLOT_STATS,
  STAT_LABELS,
  TEAM_NAMES,
  fantasyPoints,
} from './league';
import { project, ranked, seasonYears } from './season';

/**
 * A real NFL season, as a league you're in.
 *
 * Two managers field eight players each and the rest of that position's talent
 * sits on the wire. Who's rostered and who isn't is drawn from the date, so the
 * same day gives the same league to everyone — but it's drawn from a *tier*:
 * starters come off the top of the position by form, the wire from the band
 * below it. That's what makes the waiver decision a real one. Nobody is
 * choosing between Julio Jones and Antonio Brown on a Tuesday in November.
 */

/** How deep each position's starter tier and waiver tier run. */
const TIERS: Record<RosterSlot, { starters: number; wire: number }> = {
  QB: { starters: 14, wire: 14 },
  RB: { starters: 24, wire: 26 },
  WR: { starters: 34, wire: 30 },
  TE: { starters: 14, wire: 18 },
  K: { starters: 14, wire: 10 },
};

interface Squads {
  yours: Map<SpotId, Player>;
  theirs: Map<SpotId, Player>;
  wire: Map<RosterSlot, Player[]>;
  opponentName: string;
}

/**
 * Deal both lineups and the wire in one pass.
 *
 * It has to be one pass: a player can't be on your team, their team and the
 * waiver wire at the same time, and dealing each separately would let that
 * happen.
 */
function deal(season: number, week: number): Squads {
  const random = seededRandom(hashString(`nfl:${season}:${week}`));
  const yours = new Map<SpotId, Player>();
  const theirs = new Map<SpotId, Player>();
  const wire = new Map<RosterSlot, Player[]>();

  for (const slot of Object.keys(TIERS) as RosterSlot[]) {
    const pool = ranked(season, week, slot);
    const tier = TIERS[slot];
    const spots = FORMATION.filter((s) => s.slot === slot);
    const needed = spots.length * 2;

    const starters = drawWithoutReplacement(pool.slice(0, tier.starters), needed, random);
    spots.forEach((spot, i) => {
      yours.set(spot.id, starters[i]);
      theirs.set(spot.id, starters[spots.length + i]);
    });

    /*
     * The wire is the band below the starters, minus anyone just rostered —
     * and capped at one ruled-out player.
     *
     * Ruled-out players cluster in exactly this band, and left alone they can
     * take three of five places on a slate. One is a trap worth spotting; three
     * is a dead board where most of the choices score nothing.
     */
    const taken = new Set(starters.map((p) => p.id));
    const band = pool
      .slice(tier.starters, tier.starters + tier.wire)
      .filter((p) => !taken.has(p.id));
    const out = band.filter((p) => p.status === 'OUT');
    const rest = band.filter((p) => p.status !== 'OUT');
    wire.set(slot, [...rest, ...out.slice(0, 1)]);
  }

  return {
    yours,
    theirs,
    wire,
    opponentName: TEAM_NAMES[hashString(`rival:${season}:${week}`) % TEAM_NAMES.length],
  };
}

/** One deal per week, reused across the several calls the engine makes. */
const dealt = new Map<string, Squads>();
const squads = (season: number, week: number): Squads => {
  const key = `${season}:${week}`;
  if (!dealt.has(key)) dealt.set(key, deal(season, week));
  return dealt.get(key)!;
};

const ORDER = ['ppg', 'rushAtt', 'rushYds', 'rec', 'recYds', 'passYds', 'td', 'passTd', 'int', 'fgMade', 'patMade', 'fumLost'];

/** Whole numbers for a real week, one decimal for a per-game average. */
const format = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export const nflAdapter: SportAdapter = {
  id: 'nfl2015',
  displayName: 'NFL',

  seasons: () => seasonYears,

  weeks: () => Array.from({ length: LAST_WEEK - FIRST_WEEK + 1 }, (_, i) => FIRST_WEEK + i),

  formation: () => FORMATION,

  openableSlots: () => OPENABLE,

  roster: (season, week) => squads(season, week).yours,

  opponent: (season, week) => {
    const { theirs, opponentName } = squads(season, week);
    return {
      name: opponentName,
      lineup: FORMATION.map((spot) => ({ spot, player: theirs.get(spot.id)! })),
    };
  },

  candidates: (season, week, slot) => squads(season, week).wire.get(slot) ?? [],

  statKeys: (slot) => SLOT_STATS[slot] ?? [],

  statLabel: (key) => STAT_LABELS[key] ?? key.toUpperCase(),

  /*
   * Only the stats that describe this position, plus a fumble when there was
   * one — otherwise a line reading "4 CAR · 18 YDS" scores minus 0.2 and the
   * player has no way of seeing why.
   */
  formatStatLine: (line, slot) => {
    const shown = new Set([...(SLOT_STATS[slot] ?? []), 'fumLost']);
    return ORDER.filter((key) => shown.has(key) && key in line.stats && line.stats[key] !== 0)
      .map((key) => `${format(line.stats[key])} ${STAT_LABELS[key] ?? key.toUpperCase()}`)
      .join(' · ');
  },

  slotColor: (slot) => SLOT_COLORS[slot] ?? 'var(--dst)',

  outcomeValue: (player) => fantasyPoints(player.outcome.stats),

  projectedValue: (player) => project(player),
};
