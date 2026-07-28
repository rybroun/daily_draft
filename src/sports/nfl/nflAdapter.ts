import { drawWithoutReplacement, hashString, seededRandom } from '../../core/random';
import type { Player, RosterSlot, SpotId, SportAdapter } from '../../core/types';
import {
  FIRST_WEEK,
  FORMATION,
  OPENABLE,
  SLOT_COLORS,
  SLOT_STATS,
  STAT_LABELS,
  STAT_MEANINGS,
  TEAM_NAMES,
  fantasyPoints,
} from './league';
import { gameNote, lastWeekOf, project, ranked, seasonYears, standingsFor } from './season';
import numberOnes from './number-ones.json';

/**
 * What was number one the week each game was played.
 *
 * Kept as plain JSON beside the season data rather than in code, because it's a
 * table someone will want to extend by hand — the file carries its own note on
 * where each field comes from, how a week maps to a date, and which parts are
 * deliberately blank rather than missing.
 */
interface Week {
  song?: string;
  artist?: string;
  headline?: string;
}

const MOMENTS = (numberOnes as { seasons: Record<string, Record<string, Week>> }).seasons;

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

/**
 * The positions named on the opening card — every one the formation fields.
 *
 * There is no defence here because there is no defence in the data: the season
 * files carry individual players at these five positions only, and team defence
 * would need both a new pull and a spot on the field to stand in.
 */
const FEATURED: RosterSlot[] = ['QB', 'RB', 'WR', 'TE', 'K'];

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

  // Asked per season, because 2021 onward play eighteen weeks and the rest play
  // seventeen. Read from that season's own results rather than assumed.
  weeks: (season) => {
    const last = lastWeekOf(season);
    return Array.from({ length: last - FIRST_WEEK + 1 }, (_, i) => FIRST_WEEK + i);
  },

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
  statMeaning: (key) => STAT_MEANINGS[key] ?? key,

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

  standings: (season, week) => standingsFor(season, week),

  /*
   * Song first — it's the line that actually puts you in the year. Headlines
   * are only present for weeks whose events were checked against a source, so
   * most weeks return one line and some return two.
   */
  moment: (season, week) => {
    const entry = MOMENTS[String(season)]?.[String(week)];
    if (!entry) return [];

    const lines: { label: string; detail: string }[] = [];
    if (entry.song && entry.artist) {
      lines.push({ label: 'No. 1 song', detail: `“${entry.song}” by ${entry.artist}` });
    }
    if (entry.headline) lines.push({ label: 'In the news', detail: entry.headline });
    return lines;
  },

  /*
   * Read straight off `ranked`, which sorts on season form and nothing else —
   * so this can't see the week being played even by accident.
   */
  leaders: (season, week) =>
    FEATURED.map((slot) => ({
      slot,
      players: ranked(season, week, slot)
        .slice(0, 2)
        .map((p) => ({
          name: p.name,
          team: p.team,
          detail: `${p.form[0].stats.ppg.toFixed(1)}`,
        })),
    })),

  outcomeValue: (player) => fantasyPoints(player.outcome.stats),

  projectedValue: (player) => project(player),

  gameNote: (player, season, week) => gameNote(player.team, season, week),
};
