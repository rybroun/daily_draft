import type { FieldSpot, RosterSlot, StatKey } from '../../core/types';

/**
 * The shape of the invented league.
 *
 * Real football positions on a real-looking field, so the board reads the way a
 * lineup should — but no real player, club or season is involved anywhere.
 */

export const FIRST_SEASON = 1998;
export const LAST_SEASON = 2019;

/** Weeks start at 4 so every candidate has a season's form worth reading. */
export const FIRST_WEEK = 4;
export const LAST_WEEK = 14;

/**
 * Coordinates are percentages of the field graphic: x across, y downfield.
 *
 * This is your half only — everything from the halfway line back. The opponent
 * is the same shape rotated about the centre, so the two lineups face each
 * other across the halfway line the way a matchup actually reads.
 *
 * Three bands, by what each does: catchers on the front line, the backfield
 * behind them with the passer in the middle, and the kicking game apart at the
 * back where it belongs.
 */
export const FORMATION: FieldSpot[] = [
  { id: 'wr1', slot: 'WR', x: 12, y: 58 },
  { id: 'wr2', slot: 'WR', x: 36, y: 58 },
  { id: 'te1', slot: 'TE', x: 63, y: 58 },
  { id: 'wr3', slot: 'WR', x: 88, y: 58 },
  { id: 'rb1', slot: 'RB', x: 24, y: 73 },
  { id: 'rb2', slot: 'RB', x: 76, y: 73 },
  { id: 'qb1', slot: 'QB', x: 50, y: 81 },
  // The kicking game and the defence on opposite touchlines, out of the play.
  { id: 'k1', slot: 'K', x: 12, y: 93 },
  { id: 'dst1', slot: 'DST', x: 88, y: 93 },
];

/** The positions you actually stream off waivers. */
export const OPENABLE: RosterSlot[] = ['RB', 'WR', 'TE'];

/**
 * Position colours, following the convention every fantasy app already trained
 * its users on: the passer warm, the backs green, receivers blue. Borrowed as a
 * language, not copied from any one of them.
 *
 * Returned as custom properties rather than hex so the theme owns the actual
 * values — the same position has to read on white grass at three o'clock and on
 * dark grass at night, and those aren't the same colour.
 *
 * Tight ends break the convention and go violet: the usual orange is now the
 * player's own team colour, and two oranges at pill size is one too many.
 */
export const SLOT_COLORS: Record<RosterSlot, string> = {
  QB: 'var(--qb)',
  RB: 'var(--rb)',
  WR: 'var(--wr)',
  TE: 'var(--te)',
  K: 'var(--k)',
  DST: 'var(--dst)',
};

export const SLOT_LABELS: Record<RosterSlot, string> = {
  QB: 'Quarterback',
  RB: 'Running back',
  WR: 'Wide receiver',
  TE: 'Tight end',
  K: 'Kicker',
  DST: 'Defense',
};

/** Which counting stats a slot is described by, in display order. */
export const SLOT_STATS: Record<RosterSlot, StatKey[]> = {
  QB: ['pyd', 'ptd', 'int'],
  RB: ['car', 'ryd', 'td'],
  WR: ['rec', 'ryd', 'td'],
  TE: ['rec', 'ryd', 'td'],
  K: ['fg', 'xp'],
  DST: ['sack', 'int'],
};

export const STAT_LABELS: Record<StatKey, string> = {
  ppg: 'PPG',
  pts: 'PTS',
  car: 'CAR',
  rec: 'REC',
  ryd: 'YDS',
  pyd: 'PASS YDS',
  td: 'TD',
  ptd: 'PASS TD',
  int: 'INT',
  fg: 'FG',
  xp: 'XP',
  sack: 'SACK',
};

/** Fantasy scoring, half-PPR. The league's own rule, invented like the rest. */
export const POINTS_PER: Record<StatKey, number> = {
  rec: 0.5,
  ryd: 0.1,
  pyd: 0.04,
  td: 6,
  ptd: 4,
  int: -2,
  fg: 3,
  xp: 1,
  sack: 1,
  car: 0,
};

export const fantasyPoints = (stats: Record<StatKey, number>): number =>
  Object.entries(stats).reduce((total, [key, value]) => total + value * (POINTS_PER[key] ?? 0), 0);
