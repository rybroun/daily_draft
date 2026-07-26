/*
 * Merges the raw nflverse pulls in `data/` into the single compact file the
 * app bundles. Run with `npm run data:2015` after refreshing `data/`.
 *
 * Two things happen here rather than at runtime, because they're facts about
 * the source rather than about the game:
 *   - positions the formation can't field are dropped
 *   - "Probable" is discarded, because in 2015 it meant almost nothing (2,553
 *     of 5,009 rows, nearly all of whom played) and would poison the one read
 *     the game most rewards
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KEPT_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K']);
const REAL_DESIGNATIONS = new Set(['Out', 'Doubtful', 'Questionable']);

const stats = JSON.parse(readFileSync('data/nfl-2015.json', 'utf8'));
const injuries = JSON.parse(readFileSync('data/nfl-2015-injuries.json', 'utf8'));

const statusById = new Map();
for (const entry of injuries.players) {
  const weeks = {};
  for (const [week, row] of Object.entries(entry.weeks ?? {})) {
    if (!REAL_DESIGNATIONS.has(row.status)) continue;
    weeks[week] = { status: row.status, practice: row.practice ?? null };
  }
  if (Object.keys(weeks).length > 0) statusById.set(entry.id, weeks);
}

const players = stats.players
  .filter((p) => KEPT_POSITIONS.has(p.pos))
  .map((p) => {
    // Drop empty week objects — a line with no stats is a DNP, not a zero game.
    // Also fold rushing and receiving scores into one `td`: a running back's
    // line otherwise carries two different numbers both labelled YDS and two
    // both labelled TD, which is unreadable at a glance.
    const weeks = Object.fromEntries(
      Object.entries(p.weeks)
        .filter(([, line]) => Object.keys(line).length > 0)
        .map(([w, line]) => {
          const td = (line.rushTd ?? 0) + (line.recTd ?? 0) + (line.stTd ?? 0);
          return [w, td > 0 && p.pos !== 'QB' ? { ...line, td } : line];
        }),
    );
    const status = statusById.get(p.id);
    return {
      id: p.id,
      name: p.name,
      team: p.team,
      pos: p.pos,
      weeks,
      ...(status ? { status } : {}),
    };
  })
  .filter((p) => Object.keys(p.weeks).length >= 4);

const out = {
  season: stats.season,
  weeks: stats.weeks,
  source: stats.source,
  licence: stats.licence,
  players,
};

mkdirSync('src/sports/nfl2015', { recursive: true });
writeFileSync('src/sports/nfl2015/season2015.json', JSON.stringify(out));

const designations = players.reduce(
  (n, p) => n + Object.keys(p.status ?? {}).length,
  0,
);
const byPos = players.reduce((m, p) => ({ ...m, [p.pos]: (m[p.pos] ?? 0) + 1 }), {});
console.log(`players ${players.length}`, byPos);
console.log(`designations kept ${designations}`);
console.log(`bytes ${JSON.stringify(out).length.toLocaleString()}`);
