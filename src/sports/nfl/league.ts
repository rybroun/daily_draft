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

/**
 * Where the eight stand, read from the line of scrimmage backwards.
 *
 * Receivers and the tight end on the line, the backs behind it, the passer
 * deepest of the three — which is the shape anyone who watches the sport reads
 * without being told, and the reason a handoff looks like a handoff.
 *
 * The kicker is off on the touchline rather than in the formation, because he
 * never is in one. A sport that fields a defensive unit would put it on the
 * other touchline, at the mirror of these coordinates.
 *
 * These are display coordinates and the binding constraint is legibility, not
 * realism. A name plate is 5.5rem wide, so two spots collide unless they are
 * either that far apart across, or a plate's height apart down. That is why the
 * backs are split wide rather than tucked either side of the passer: at x30/x70
 * they shared a column with him and had to be a full row away, which pushed the
 * line of scrimmage over the halfway and into the opponent's receivers. Out at
 * x24/x76 they clear him across, so he can sit just behind them.
 *
 * The browser suite fails if any two players overlap, or if any two sharing a
 * column come within 8px, on a 667-tall phone as well as a tall one.
 */
export const FORMATION: FieldSpot[] = [
  { id: 'wr1', slot: 'WR', x: 12, y: 58 },
  { id: 'wr2', slot: 'WR', x: 36, y: 58 },
  { id: 'te1', slot: 'TE', x: 63, y: 58 },
  { id: 'wr3', slot: 'WR', x: 88, y: 58 },
  { id: 'rb1', slot: 'RB', x: 24, y: 73 },
  { id: 'rb2', slot: 'RB', x: 76, y: 73 },
  { id: 'qb1', slot: 'QB', x: 50, y: 81 },
  { id: 'k1', slot: 'K', x: 12, y: 93 },
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

/**
 * What each column means, for anyone who hasn't played fantasy football.
 *
 * The short labels are the ones every scoring page uses and they stay — but
 * "CAR" and "PPG" are jargon, and a game that opens with a table of them is
 * asking for knowledge it never taught. Shown on request, not by default.
 */
export const STAT_MEANINGS: Record<StatKey, string> = {
  ppg: 'Fantasy points per game — the one number that decides this',
  rec: 'Catches per game',
  recYds: 'Receiving yards per game',
  rushAtt: 'Carries per game — how often they get the ball',
  rushYds: 'Rushing yards per game',
  td: 'Touchdowns per game',
  passYds: 'Passing yards per game',
  passTd: 'Touchdown passes per game',
  int: 'Interceptions thrown per game — lower is better',
  fumLost: 'Fumbles lost per game — lower is better',
  fgMade: 'Field goals made per game',
  patMade: 'Extra points made per game',
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
