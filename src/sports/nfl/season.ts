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

interface RawSeason {
  year: number;
  /** False for seasons before the injury report was published — 2009 onward. */
  hasInjuryReport: boolean;
  players: RawPlayer[];
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

/**
 * Who each team played, week by week.
 *
 * Built from the team's own fixtures rather than an individual's, deliberately.
 * Reading a player's schedule off *their* lines would leak whether they played
 * — an absence in week N+1 would quietly announce an injury the player is not
 * supposed to know about yet.
 */
const schedules = new Map<number, Map<string, Map<number, string>>>();

function schedule(year: number): Map<string, Map<number, string>> {
  const cached = schedules.get(year);
  if (cached) return cached;

  const table = new Map<string, Map<number, string>>();
  for (const p of season(year).players) {
    for (const [week, line] of Object.entries(p.weeks)) {
      const opp = line.opp as unknown as string | undefined;
      if (!opp) continue;
      if (!table.has(p.team)) table.set(p.team, new Map());
      table.get(p.team)!.set(Number(week), opp);
    }
  }
  schedules.set(year, table);
  return table;
}

/**
 * How generous each defence has been to a position, through the prior weeks.
 *
 * This is the substance behind a projection: not "he'll score 12" but "he's
 * facing the softest secondary in the league". Computed from weeks before the
 * one being played, so it leaks nothing.
 */
const defences = new Map<string, Map<string, 'soft' | 'even' | 'hard'>>();

function defenceTiers(year: number, week: number, slot: RosterSlot) {
  const key = `${year}:${week}:${slot}`;
  const cached = defences.get(key);
  if (cached) return cached;

  const allowed = new Map<string, { points: number; games: number }>();
  for (const p of season(year).players) {
    if (p.pos !== slot) continue;
    for (const [w, line] of Object.entries(p.weeks)) {
      const opp = line.opp as unknown as string | undefined;
      if (!opp || Number(w) >= week) continue;
      const row = allowed.get(opp) ?? { points: 0, games: 0 };
      row.points += fantasyPoints(line);
      allowed.set(opp, row);
    }
  }
  for (const [team, games] of schedule(year)) {
    const played = [...games.keys()].filter((w) => w < week).length;
    const row = allowed.get(team);
    if (row) row.games = played;
  }

  const ranked = [...allowed.entries()]
    .filter(([, r]) => r.games > 0)
    .map(([team, r]) => ({ team, per: r.points / r.games }))
    .sort((a, b) => b.per - a.per);

  const tiers = new Map<string, 'soft' | 'even' | 'hard'>();
  const third = Math.ceil(ranked.length / 3);
  ranked.forEach(({ team }, i) => {
    tiers.set(team, i < third ? 'soft' : i < third * 2 ? 'even' : 'hard');
  });
  defences.set(key, tiers);
  return tiers;
}

/** The next three fixtures, with how kind each defence has been so far. */
export function fixturesFor(year: number, week: number, team: string, slot: RosterSlot) {
  const games = schedule(year).get(team);
  const tiers = defenceTiers(year, week, slot);

  return [week, week + 1, week + 2]
    .filter((w) => w <= 17)
    .map((w) => {
      const opp = games?.get(w);
      if (!opp) return { label: 'BYE' as const, tone: 'even' as const };
      return { label: `${w === week ? '' : ''}${opp}`, tone: tiers.get(opp) ?? 'even' };
    });
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
    fixtures: fixturesFor(year, week, p.team, p.pos),
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
