# daily_draft

A daily habit game: a chess-puzzle for fantasy sports history. One puzzle a day.

> *"It's week 9. Two holes in your lineup and a waiver wire. Who do you start?"*

You're shown a lineup on a field with two spots empty, and a waiver wire of players who were
really available that week. Every number you can see is history — form to date, nothing from
the week itself. You fill both spots, the week is played, and you find out what each of them
actually did, including the ones you passed on. Come back tomorrow.

The puzzle is prediction under partial information, not recall. You are not being asked who
was good; you are being asked who was about to be.

## Non-negotiables

1. **Sport-agnostic core.** The puzzle engine must never know what a "running back" is.
   Sports plug in behind `SportAdapter`. Other sports have to fit without changing engine
   code. This is the single most important design constraint.
2. **Mock data for now.** No real dataset is wired up yet — the sport is deliberately
   undecided. `MockAdapter` is a *fictional* gridiron league: real football positions so the
   field reads correctly, invented players, clubs and seasons. Do not go pick a data source
   or start scraping.
3. **60 seconds, then done.** If a puzzle takes longer to play than that, the design is wrong.
4. **The player never sees the week they're picking for.** Form to date is all they get. If a
   number from the scored week reaches the screen before the reveal, the game is broken.

## Stack

- **Vite + React + TypeScript** — web first, no app store, shareable by link
- **No backend.** Puzzles are generated client-side from an adapter. Streaks live in
  `localStorage`. Add a server only when something genuinely requires one.
- **Vitest** for the engine. The scoring and puzzle-selection logic is where bugs will hide,
  and it's pure — test it directly.

## Architecture

```
src/
  core/           sport-agnostic. Zero sport-specific code.
    types.ts      Player, Puzzle, FieldSpot, SportAdapter, Score
    puzzle.ts     deterministic daily puzzle selection (date → puzzle)
    scoring.ts    given the picks + the boards, produce a score
    streak.ts     pure streak arithmetic over calendar days
    random.ts     seeded PRNG. There is no Math.random in the engine.
  sports/
    mock/         MockAdapter — an invented football league
    (real adapters arrive later, behind the same interface)
  storage/        localStorage read/write, tolerant of corrupt data
  ui/             React components. Presentational; no game rules here.
  useGame.ts      wires engine to browser. Calls core; never reimplements it.
  App.tsx         the only file that names a sport
```

The seam that matters:

```ts
interface SportAdapter {
  id: SportId;
  displayName: string;
  seasons(): number[];
  weeks(season: number): number[];

  formation(): FieldSpot[];                 // slot + x/y. Core never reads x/y.
  openableSlots(): RosterSlot[];            // which spots may be left empty

  roster(season, week): Map<SpotId, Player>;          // who's already starting
  candidates(season, week, slot): Player[];           // the waiver pool

  statKeys(slot: RosterSlot): StatKey[];
  formatStatLine(line: StatLine, slot: RosterSlot): string;
  outcomeValue(player: Player, slot: RosterSlot): number;
}
```

Core imports `SportAdapter`. Core never imports a sport.

`outcomeValue` is where the open question *how do stats become points* lives. Core cannot
read a stat, so something must turn a line into a comparable number — and that something is
per-sport, which is why it sits on the adapter and not in `scoring.ts`.

A `Player` carries `form: StatLine[]` (visible when picking) and `outcome: StatLine` (hidden
until the reveal). Nothing in the UI may render `outcome` before the week is played.

## Rules

- **Puzzle selection is deterministic from the date.** Same day, same puzzle, everywhere. No
  randomness at play time — seed from the date string so it's reproducible and testable.
- Scoring must be explainable. After the reveal, the player has to see *why* their picks
  scored what they did against every alternative they passed on.
- No sport-specific strings in `core/`. If you're writing "running back" in a core file, stop.
  Format words — *waiver*, *opening*, *field*, *week* — are fine: they're this game's own
  vocabulary and mean the same thing in every sport. Position and stat names are not.
- The two openings never share a slot. Two of the same position would turn two independent
  decisions into one combined one, which is a different puzzle.

## Running it

```bash
npm install
npm run dev      # vite dev server
npm test         # vitest
npm run build
```

Serve it on `0.0.0.0`, not `127.0.0.1` — see the Tailscale section of `~/CLAUDE.md`.

## Open questions — do not invent answers

Which sport ships first, where real data comes from, and how scoring converts season stats
into points are all **undecided**. They're logged in `BRIEF.md`. If your work needs one of
them answered, say so rather than guessing.
