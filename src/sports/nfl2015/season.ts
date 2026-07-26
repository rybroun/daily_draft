import type { Player, RosterSlot, StatKey, StatLine } from '../../core/types';
import { SLOT_STATS, fantasyPoints } from './league';
import raw from './season2015.json';

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

// The JSON import infers a vast literal type; the shape is asserted here once.
const SEASON = raw as unknown as { season: number; weeks: number[]; players: RawPlayer[] };

/** Enough of a record that the season line and the last three can disagree. */
const MIN_GAMES = 4;

/** The designation as it appears on the field, shortest form that still reads. */
const TAG: Record<string, string> = {
  Out: 'OUT',
  Doubtful: 'D',
  Questionable: 'Q',
};

export const players = SEASON.players;
export const seasonYear = SEASON.season;

const perGame = (games: Record<string, number>[], key: StatKey) =>
  games.reduce((sum, g) => sum + (g[key] ?? 0), 0) / games.length;

/** A form line: the average game, headed by the average score. */
function averageOf(label: string, games: Record<string, number>[], slot: RosterSlot): StatLine {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const stats: Record<StatKey, number> = {
    ppg: round1(games.reduce((sum, g) => sum + fantasyPoints(g), 0) / games.length),
  };
  for (const key of SLOT_STATS[slot] ?? []) stats[key] = round1(perGame(games, key));
  return { label, stats };
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

export function toPlayer(p: RawPlayer, week: number): Player {
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
export function ranked(week: number, slot: RosterSlot): Player[] {
  return SEASON.players
    .filter((p) => p.pos === slot && isActive(p, week))
    .map((p) => toPlayer(p, week))
    .sort((a, b) => b.form[0].stats.ppg - a.form[0].stats.ppg);
}
