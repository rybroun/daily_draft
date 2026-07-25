# daily_draft

A daily habit game: a chess-puzzle for fantasy sports history. One puzzle a day.

> *"It's the 1981 MLB season. Who do you draft as your right fielder?"*

You're shown a real historical season, one roster slot, and a slate of players who were
actually available. You pick one. You're scored on what that player actually did that season.
Come back tomorrow.

## Non-negotiables

1. **Sport-agnostic core.** The puzzle engine must never know what a "right fielder" is.
   Sports plug in behind `SportAdapter`. MLB, NHL, and NBA all have to fit without changing
   engine code. This is the single most important design constraint.
2. **Mock data for now.** No real dataset is wired up yet — the sport is deliberately
   undecided. Build against `MockAdapter` and make the UI right first. Do not go pick a data
   source or start scraping.
3. **60 seconds, then done.** If a puzzle takes longer to play than that, the design is wrong.

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
    types.ts      Player, Puzzle, RosterSlot, SportAdapter, Score
    scoring.ts    given a pick + the slate, produce a score
    puzzle.ts     deterministic daily puzzle selection (date → puzzle)
  sports/
    mock/         MockAdapter — invented players, plausible stat lines
    (mlb/ nhl/ nba/ arrive later, behind the same interface)
  ui/             React components. Presentational; no game rules here.
  App.tsx
```

The seam that matters:

```ts
interface SportAdapter {
  id: SportId;
  displayName: string;
  seasons(): number[];
  slots(season: number): RosterSlot[];     // "RF", "LW", "PG" — opaque to core
  statKeys(slot: RosterSlot): StatKey[];   // which stats to show for this slot
  candidates(season: number, slot: RosterSlot): Player[];
  formatStatLine(player: Player, slot: RosterSlot): string;
}
```

Core imports `SportAdapter`. Core never imports a sport.

## Rules

- **Puzzle selection is deterministic from the date.** Same day, same puzzle, everywhere. No
  randomness at play time — seed from the date string so it's reproducible and testable.
- Scoring must be explainable. After a pick, the player has to see *why* their answer scored
  what it did against the alternatives.
- No sport-specific strings in `core/`. If you're writing "outfield" in a core file, stop.

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
