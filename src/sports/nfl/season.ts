import type { Player, RosterSlot, StatKey, StatLine } from '../../core/types';
import { SLOT_STATS, fantasyPoints } from './league';
import raw from './seasons.json';

/**
 * Turning the season table into players the engine can use.
 *
 * The rule that matters: nothing here may read week N when building form. Form
 * is weeks 1..N-1 and the outcome is week N, and the two are assembled by
 * separate functions so they can't accidentally meet.
 */

interface RawPlayer {
  id: string;
  name: string;
  team: string;
  pos: RosterSlot;
  weeks: Record<string, Record<string, number>>;
  status?: Record<string, { status: string; practice: string | null }>;
}

interface RawGame {
  opp: string;
  home: boolean;
  for: number;
  against: number;
  result: 'W' | 'L' | 'T';
}

interface RawSeason {
  year: number;
  /** False for seasons before the injury report was published — 2009 onward. */
  hasInjuryReport: boolean;
  players: RawPlayer[];
  /** Every side's result, by team then week. */
  games: Record<string, Record<string, RawGame>>;
}

// The JSON import infers a vast literal type; the shape is asserted here once.
const DATA = raw as unknown as { seasons: Record<string, RawSeason> };

const season = (year: number): RawSeason => DATA.seasons[String(year)];

export const seasonYears = Object.keys(DATA.seasons).map(Number).sort();
export const hasInjuryReport = (year: number) => season(year).hasInjuryReport;

/** Enough of a record that the season line and the last three can disagree. */
const MIN_GAMES = 4;

/** The designation as it appears on the field, shortest form that still reads. */
const TAG: Record<string, string> = {
  Out: 'OUT',
  Doubtful: 'D',
  Questionable: 'Q',
};

const perGame = (games: Record<string, number>[], key: StatKey) =>
  games.reduce((sum, g) => sum + (g[key] ?? 0), 0) / games.length;

/** A form line: the average game, headed by the average score. */
function averageOf(label: string, games: Record<string, number>[], slot: RosterSlot): StatLine {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const stats: Record<StatKey, number> = {};
  for (const key of SLOT_STATS[slot] ?? []) stats[key] = round1(perGame(games, key));
  // Last, and deliberately: `ppg` is now one of the slot's columns, and the
  // loop above would otherwise overwrite it with a lookup for a key the raw
  // week lines don't carry — quietly zeroing every projection downstream.
  stats.ppg = round1(games.reduce((sum, g) => sum + fantasyPoints(g), 0) / games.length);
  return { label, stats };
}

/*
 * The schedule used to be reconstructed by scanning every player's week lines
 * for an opponent code, with a note explaining that it had to be built from the
 * team's fixtures and not an individual's — reading it off one player's lines
 * would leak whether *they* played, and an absence would quietly announce an
 * injury. That care is no longer needed: the fixture now comes from the games
 * table, which is team-level by construction, so there is no player to leak.
 */

/**
 * A team's win–loss record going into a given week.
 *
 * Counted only from weeks strictly before the one being played, so it says
 * where a side stood at that moment and nothing about what happens next.
 *
 * This replaced a soft/even/hard colour on each fixture. The tint was a better
 * fantasy signal — a good team can still be generous to receivers — but it
 * was three unlabelled colours with no legend anywhere, so it read as
 * decoration. A record is plainer and it is at least self-explaining.
 */
const records = new Map<string, string>();

function recordThrough(year: number, week: number, team: string): string {
  const key = `${year}:${week}:${team}`;
  const cached = records.get(key);
  if (cached !== undefined) return cached;

  let won = 0;
  let lost = 0;
  let tied = 0;
  for (const [w, game] of Object.entries(season(year).games?.[team] ?? {})) {
    if (Number(w) >= week) continue;
    if (game.result === 'W') won++;
    else if (game.result === 'L') lost++;
    else tied++;
  }

  const record = tied > 0 ? `${won}–${lost}–${tied}` : `${won}–${lost}`;
  records.set(key, record);
  return record;
}

/**
 * How the league stood going into a given week, best record first.
 *
 * Context, not information: the puzzle is about five players on a wire, and
 * knowing that New England were 10-0 doesn't tell you what any of them did.
 * What it does is put you in the week — you're arriving at a season already in
 * progress, and a table is the fastest way anyone reads where one has got to.
 */
export function standingsFor(year: number, week: number) {
  const table = Object.keys(season(year).games ?? {}).map((team) => {
    let won = 0;
    let lost = 0;
    let tied = 0;
    let points = 0;
    for (const [w, game] of Object.entries(season(year).games?.[team] ?? {})) {
      if (Number(w) >= week) continue;
      if (game.result === 'W') won++;
      else if (game.result === 'L') lost++;
      else tied++;
      points += game.for;
    }
    const played = won + lost + tied;
    return { team, won, lost, tied, played, points, rate: played ? (won + tied / 2) / played : 0 };
  });

  return table
    .filter((row) => row.played > 0)
    // Record first, then points scored — an 8-2 that scores 300 is a better
    // read on "who's good" than an 8-2 that scores 180.
    .sort((a, b) => b.rate - a.rate || b.points - a.points)
    .map((row) => ({
      name: row.team,
      detail: row.tied > 0 ? `${row.won}–${row.lost}–${row.tied}` : `${row.won}–${row.lost}`,
    }));
}

/** The one game being picked for: who, where, and how they've gone so far. */
export function nextGameFor(year: number, week: number, team: string) {
  const game = season(year).games?.[team]?.[String(week)];
  // No fixture that week is a bye, and you can't start a bye.
  if (!game) return { label: 'BYE' };

  return {
    label: `${game.home ? 'vs' : 'at'} ${game.opp}`,
    detail: recordThrough(year, week, game.opp),
  };
}

/** Every game this player actually played before the given week. */
function priorGames(p: RawPlayer, week: number): Record<string, number>[] {
  return Object.entries(p.weeks)
    .filter(([w]) => Number(w) < week)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, line]) => line);
}

/** Whether the player is available to be fielded in that week at all. */
export function isActive(p: RawPlayer, week: number): boolean {
  const played = p.weeks[String(week)] !== undefined;
  const listed = p.status?.[String(week)] !== undefined;
  // Neither a line nor a designation means a bye, and you can't start a bye.
  return (played || listed) && priorGames(p, week).length >= MIN_GAMES;
}

export function toPlayer(p: RawPlayer, year: number, week: number): Player {
  const games = priorGames(p, week);
  const recent = games.slice(-3);
  const designation = p.status?.[String(week)];

  return {
    id: p.id,
    name: p.name,
    team: p.team,
    slot: p.pos,
    ...(designation ? { status: TAG[designation.status] ?? designation.status } : {}),
    form: [averageOf('Season', games, p.pos), averageOf('Last 3', recent, p.pos)],
    next: nextGameFor(year, week, p.team),
    outcome: {
      label: `Week ${week}`,
      // No line means they didn't play: a real zero, not missing data.
      stats: p.weeks[String(week)] ?? {},
    },
  };
}

/** What their form says they're worth, and nothing from the week itself. */
export function project(player: Player): number {
  const [season, recent] = player.form;
  const base = season.stats.ppg * 0.6 + recent.stats.ppg * 0.4;
  const discount =
    player.status === 'OUT' ? 0 : player.status === 'D' ? 0.35 : player.status === 'Q' ? 0.85 : 1;
  return Math.round(base * discount * 10) / 10;
}

/**
 * Everyone eligible at a position that week, best form first.
 *
 * Ordering by season form is what lets the roster take from the top and the
 * wire take from further down — which is what a waiver wire actually is.
 */
export function ranked(year: number, week: number, slot: RosterSlot): Player[] {
  return season(year).players
    .filter((p) => p.pos === slot && isActive(p, week))
    .map((p) => toPlayer(p, year, week))
    .sort((a, b) => b.form[0].stats.ppg - a.form[0].stats.ppg);
}

/**
 * How this player's real side fared that week.
 *
 * Shown only once the week has been played — it describes the result, so it has
 * no business anywhere near the pick.
 */
export function gameNote(team: string, year: number, week: number): string | null {
  const game = season(year).games?.[team]?.[String(week)];
  if (!game) return null;

  const verb = game.result === 'W' ? 'won' : game.result === 'L' ? 'lost' : 'tied';
  const where = game.home ? 'vs' : 'at';
  return `${team} ${verb} ${game.for}\u2013${game.against} ${where} ${game.opp}`;
}
