/*
 * Merges every `data/nfl-<year>.json` (and its injury file, where one exists)
 * into the single file the app bundles. Run with `npm run data`.
 *
 * Two things happen here rather than at runtime, because they're facts about
 * the source rather than about the game:
 *   - positions the formation can't field are dropped
 *   - "Probable" is discarded. In 2015 it meant almost nothing — 2,553 of 5,009
 *     rows, nearly all of whom played — and it was abolished after that season.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';

const KEPT_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K']);
const REAL_DESIGNATIONS = new Set(['Out', 'Doubtful', 'Questionable']);

const years = readdirSync('data')
  .map((f) => /^nfl-(\d{4})\.json$/.exec(f)?.[1])
  .filter(Boolean)
  .sort();

const seasons = {};

for (const year of years) {
  const stats = JSON.parse(readFileSync(`data/nfl-${year}.json`, 'utf8'));

  const statusById = new Map();
  const injuryPath = `data/nfl-${year}-injuries.json`;
  if (existsSync(injuryPath)) {
    for (const entry of JSON.parse(readFileSync(injuryPath, 'utf8')).players) {
      const weeks = {};
      for (const [week, row] of Object.entries(entry.weeks ?? {})) {
        if (!REAL_DESIGNATIONS.has(row.status)) continue;
        weeks[week] = { status: row.status, practice: row.practice ?? null };
      }
      if (Object.keys(weeks).length > 0) statusById.set(entry.id, weeks);
    }
  }

  const players = stats.players
    .filter((p) => KEPT_POSITIONS.has(p.pos))
    .map((p) => {
      // Drop empty week objects — a line with no stats is a DNP, not a zero
      // game. Fold rushing and receiving scores into one `td`, since a back's
      // line otherwise carries two numbers labelled YDS and two labelled TD.
      const weeks = Object.fromEntries(
        Object.entries(p.weeks)
          .filter(([, line]) => Object.keys(line).length > 0)
          .map(([w, line]) => {
            const td = (line.rushTd ?? 0) + (line.recTd ?? 0) + (line.stTd ?? 0);
            return [w, td > 0 && p.pos !== 'QB' ? { ...line, td } : line];
          }),
      );
      const status = statusById.get(p.id);
      return { id: p.id, name: p.name, team: p.team, pos: p.pos, weeks, ...(status ? { status } : {}) };
    })
    .filter((p) => Object.keys(p.weeks).length >= 4);

  // How every side fared that week, for the reveal.
  let games = {};
  const gamesPath = `data/nfl-${year}-games.json`;
  if (existsSync(gamesPath)) {
    games = JSON.parse(readFileSync(gamesPath, 'utf8')).games ?? {};
  }

  seasons[year] = {
    year: Number(year),
    hasInjuryReport: statusById.size > 0,
    players,
    games,
  };

  const designations = players.reduce((n, p) => n + Object.keys(p.status ?? {}).length, 0);
  console.log(
    `${year}: ${players.length} players, ${designations} designations, ` +
      `${Object.keys(games).length} teams' results` +
      (statusById.size ? '' : ' (no injury report published for this season)'),
  );
}

mkdirSync('src/sports/nfl', { recursive: true });
const json = JSON.stringify({ seasons });
writeFileSync('src/sports/nfl/seasons.json', json);
console.log(`bundled ${Object.keys(seasons).join(', ')} — ${json.length.toLocaleString()} bytes`);
