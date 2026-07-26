# daily_draft

A daily habit game: a chess-puzzle for fantasy sports history. One puzzle a day.

> *"It's week 9. You're 16 points behind the Blackbirds on projection, their WR1 is OUT, and
> you have two holes to fill. Who do you start?"*

You're shown your lineup on a field with two spots empty, the team you're playing that week,
and a waiver wire. Every number you can see is history or derived from it — form to date,
projections, injury tags — and nothing from the week itself. You fill both spots, the week is
played, and the field fills in with what everyone actually did. Come back tomorrow.

The puzzle is prediction under partial information, not recall. You are not being asked who
was good; you are being asked who was about to be, against a specific opponent.

## Non-negotiables

1. **Sport-agnostic core.** The puzzle engine must never know what a "running back" is.
   Sports plug in behind `SportAdapter`. Other sports have to fit without changing engine
   code. This is the single most important design constraint.
2. **Football, and real data.** Ryan confirmed the sport on 2026-07-25 and lifted the
   mock-only rule at the same time. Live seasons: **2007 and 2015 NFL**, from nflverse
   (CC-BY-4.0). `MockAdapter` stays — it's a *fictional* league that proves the seam holds
   for a sport that doesn't exist, and the core tests run against it — but it is no longer
   the only adapter.

   Adding a season is two commands: `python3 scripts/fetch_season.py <year>` then
   `npm run data`. **Injury reports only exist from 2009 onward**, so earlier seasons play
   without designations rather than with invented ones.
3. **60 seconds, then done.** If a puzzle takes longer to play than that, the design is wrong.
4. **The player never sees the week they're picking for.** Form to date, projections and
   injury tags are all they get. If a number from the scored week reaches the screen before
   the reveal, the game is broken. `projectedValue` must never read `outcome`.
5. **The decision is against an opponent, not in a vacuum.** How much you need depends on what
   they're fielding, which is why their lineup and their injuries are fully visible.

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
    types.ts      Player, Puzzle, FieldSpot, Opponent, SportAdapter, Score
    puzzle.ts     deterministic daily puzzle selection (date → puzzle)
    scoring.ts    given the picks + the boards, produce a score
    streak.ts     pure streak arithmetic over calendar days
    random.ts     seeded PRNG. There is no Math.random in the engine.
  sports/
    mock/         MockAdapter — an invented football league, proof of the seam
    nfl/          the real thing: 2007 and 2015, behind the same interface
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
  opponent(season, week): Opponent;                   // who you're playing
  candidates(season, week, slot): Player[];           // the waiver pool

  statKeys(slot: RosterSlot): StatKey[];
  formatStatLine(line: StatLine, slot: RosterSlot): string;
  slotColor(slot: RosterSlot): string;                // position colour convention

  outcomeValue(player: Player, slot: RosterSlot): number;   // reads outcome
  projectedValue(player: Player, slot: RosterSlot): number; // must NOT read outcome
}
```

Core imports `SportAdapter`. Core never imports a sport.

`outcomeValue` is where the open question *how do stats become points* lives. Core cannot
read a stat, so something must turn a line into a comparable number — and that something is
per-sport, which is why it sits on the adapter and not in `scoring.ts`.

A `Player` carries `form: StatLine[]` and an optional `status` (both visible when picking) and
`outcome: StatLine` (hidden until the reveal). Nothing in the UI may render `outcome` before
the week is played. `status` is the exception that proves the rule: an injury designation is
known *before* kickoff, so it's legitimately part of what you get to see — and it's the sharpest
edge in the game, both on the wire and on the opponent's field.

`FieldSpot` carries `x`/`y` display coordinates. Core passes them through and never reads them.

## Rules

- **Puzzle selection is deterministic from the date.** Same day, same puzzle, everywhere. No
  randomness at play time — seed from the date string so it's reproducible and testable.
- Scoring must be explainable. After the reveal, the player has to see *why* their picks
  scored what they did against every alternative they passed on.
- **Say when a week was already decided.** If no pick could have changed the result, the
  reveal says so. A single week is mostly noise, and being told you were beaten is fair where
  being told you were wrong is not.
- No sport-specific strings in `core/`. If you're writing "running back" in a core file, stop.
  Format words — *waiver*, *opening*, *field*, *week* — are fine: they're this game's own
  vocabulary and mean the same thing in every sport. Position and stat names are not.
- The two openings never share a slot. Two of the same position would turn two independent
  decisions into one combined one, which is a different puzzle.

## Running it

```bash
npm install
npm run dev      # vite dev server on 0.0.0.0:5173
npm test         # vitest
npm run build    # → dist/, which is what's live
```

## It's live

**https://bananas-mac-mini.tail6d208c.ts.net** — tailnet only, no port needed.

`npm run build` *is* the deploy. A LaunchAgent
(`~/Library/LaunchAgents/com.rybroun.daily-draft.plist`) keeps `vite preview` up on port
4173 with `KeepAlive`, and `tailscale serve` proxies 443 to it. Preview reads `dist/` from
disk per request, so a rebuild goes live immediately with no restart.

```bash
launchctl print gui/$(id -u)/com.rybroun.daily-draft   # is it up
tailscale serve status                                  # what's proxied
tail -f .serve.log                                      # server output
```

Two other services already sit on ports 4200 and 8888 — **never run `tailscale serve reset`**,
it would take those down too. Never use `tailscale funnel`; that publishes to the open
internet.

`vite.config.ts` allows `.ts.net` hosts, which preview would otherwise reject when the Host
header is a MagicDNS name rather than localhost.

## Open questions — do not invent answers

Which sport ships first, where real data comes from, and how scoring converts season stats
into points are all **undecided**. They're logged in `BRIEF.md`. If your work needs one of
them answered, say so rather than guessing.
