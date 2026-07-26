import type { FieldSpot, RosterSlot, StatKey } from '../../core/types';

/**
 * The 2015 NFL season as a fantasy league.
 *
 * Eight spots rather than the mock's nine: the source is per-player, so there
 * are no team defences to field. `formation()` is per-sport precisely so this
 * kind of difference costs nothing.
 */

/**
 * Week 7 at the earliest.
 *
 * Not 4. With a three-game minimum, a week-4 candidate has played exactly three
 * games — so "last 3" *is* the season line, the two read identically, and the
 * tension the whole puzzle runs on disappears. By week 7 most players have five
 * or six behind them and the two lines say different things.
 */
export const FIRST_WEEK = 7;
export const LAST_WEEK = 17;

export const FORMATION: FieldSpot[] = [
  { id: 'wr1', slot: 'WR', x: 13, y: 59 },
  { id: 'wr2', slot: 'WR', x: 38, y: 59 },
  { id: 'te1', slot: 'TE', x: 62, y: 59 },
  { id: 'wr3', slot: 'WR', x: 87, y: 59 },
  { id: 'rb1', slot: 'RB', x: 18, y: 76 },
  { id: 'qb1', slot: 'QB', x: 50, y: 76 },
  { id: 'rb2', slot: 'RB', x: 82, y: 76 },
  { id: 'k1', slot: 'K', x: 50, y: 91 },
];

export const OPENABLE: RosterSlot[] = ['RB', 'WR', 'TE'];

export const SLOT_COLORS: Record<RosterSlot, string> = {
  QB: 'var(--qb)',
  RB: 'var(--rb)',
  WR: 'var(--wr)',
  TE: 'var(--te)',
  K: 'var(--k)',
};

/** Which stats describe a position, in display order. */
/*
 * Points per game leads every line.
 *
 * It's a summary, which is the thing the projection was removed for being — but
 * it's a summary of what *happened*, not a guess at what will. Without it,
 * comparing "1.8 rec, 42 yds" against "4.6 rec, 56 yds" means doing half-PPR
 * arithmetic in your head five times a day, which rewards being quick with
 * numbers rather than knowing football. That's the failure this whole change
 * was meant to fix.
 */
export const SLOT_STATS: Record<RosterSlot, StatKey[]> = {
  QB: ['ppg', 'passYds', 'passTd', 'int'],
  // Backs catch passes in half-PPR, so their line has to show both.
  RB: ['ppg', 'rushAtt', 'rushYds', 'rec', 'td'],
  WR: ['ppg', 'rec', 'recYds', 'td'],
  TE: ['ppg', 'rec', 'recYds', 'td'],
  K: ['ppg', 'fgMade', 'patMade'],
};

export const STAT_LABELS: Record<StatKey, string> = {
  ppg: 'PPG',
  rec: 'REC',
  recYds: 'YDS',
  rushAtt: 'CAR',
  rushYds: 'RUSH',
  td: 'TD',
  passYds: 'YDS',
  passTd: 'TD',
  int: 'INT',
  fumLost: 'FUM',
  fgMade: 'FG',
  patMade: 'XP',
};

/**
 * Half-PPR, the most common league setting of that era.
 *
 * Field goals score by distance, so the banded keys carry the scoring and the
 * plain `fgMade` total is only a fallback for rows that lack the bands —
 * counting both would pay for every kick twice.
 */
const POINTS: Record<StatKey, number> = {
  rec: 0.5,
  recYds: 0.1,
  recTd: 6,
  rushYds: 0.1,
  rushTd: 6,
  passYds: 0.04,
  passTd: 4,
  int: -2,
  fumLost: -2,
  twoPt: 2,
  passTwoPt: 2,
  stTd: 6,
  fgMade0_39: 3,
  fgMade40_49: 4,
  fgMade50: 5,
  patMade: 1,
};

export function fantasyPoints(stats: Record<StatKey, number>): number {
  let total = 0;
  for (const [key, value] of Object.entries(stats)) {
    // A stat line also carries the opponent's code. Multiplying a string by a
    // weight yields NaN, and NaN spreads through every total it touches.
    if (typeof value !== 'number') continue;
    total += value * (POINTS[key] ?? 0);
  }
  // Only when the distance bands are missing entirely.
  const banded = stats.fgMade0_39 ?? stats.fgMade40_49 ?? stats.fgMade50;
  if (banded === undefined && stats.fgMade) total += stats.fgMade * 3;
  return Math.round(total * 10) / 10;
}

/** Fantasy managers, not NFL clubs — this is a league, and you're in it. */
export const TEAM_NAMES = [
  'Ludlow Ramblers', 'Harbor Wolves', 'Kettle Bandits', 'Old Mill Foundry',
  'Ninth Street Storm', 'Cobb County Hooligans', 'Pine Ridge Sentinels',
  'Fairview Mudcats', 'Iron Gate Blackbirds', 'Junction Union',
  'Elmwood Longhorns', 'Dunmore Anchors',
];
