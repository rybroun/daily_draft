# daily_draft

**The game is called Daily Waivers** (renamed 2026-07-26). The repo, directory and
package are still `daily_draft` — only the name the player sees changed, and renaming
the infrastructure is Ryan's call to make, not a side effect of a copy change.

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

   Adding a season is three commands: `python3 scripts/fetch_season.py <year>`, then
   `python3 scripts/fetch_headshots.py`, then `npm run data`.

   **Live seasons: 1999, 2001, 2007, 2015, 2021 and 2025.** nflverse player stats
   begin in 1999, so nothing earlier is reachable from this source — the eighties
   would need a different one. Three things vary by era and each has bitten once:
   **injury reports only exist from 2009**, seasons **from 2021 play eighteen weeks**
   rather than seventeen, and **division alignment has changed twice** (six divisions
   and no Houston before 2002; STL/SD/OAK became LA/LAC/LV from 2016). All three are
   handled per season and asserted by test.

3. **60 seconds, then done.** If a puzzle takes longer to play than that, the design is wrong.
4. **The wire is the only thing hidden.** Revised 2026-07-26 — this rule used to cover the
   whole screen, and Ryan narrowed it deliberately.

   A **candidate on the wire** shows form to date, the fixture, and an injury tag. Never a
   number from the week being played, and never a projection either: a projection is the
   optimal read of the visible evidence already computed, so printing one collapses the
   decision into "take the biggest number". If a candidate's scored week reaches the screen
   before you've locked in, the game is broken.

   **Everything else on the field is the real week**, before the pick as well as after —
   both lineups, both totals, and the bar you're chasing. Those sixteen players aren't on
   the wire, so what they did says nothing about what the five candidates will do. What it
   buys is a target that is exactly true: *need 26.5, find 26.5*. Showing projections there
   instead meant the scoreboard said 15.3 while the play-out scored you against 26.5, with
   nothing on screen to reconcile them.

   The one exception is a candidate you already started in a round you've finished and
   watched play out. You've seen that number, so it stays visible — that's the whole reason
   the three rounds share one wire.

   `projectedValue` still must never read `outcome`, and is still asserted by test — but
   nothing renders it now. See the note on the seam in `core/types.ts`.
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

**Public: https://daily-waivers.pages.dev** — Cloudflare Pages, free tier, no
account needed to play. This is the link to send people. `npm run deploy` builds
and publishes it; wrangler is already authenticated on this machine.

Chosen over Tailscale Funnel deliberately. Funnel works and is still on, but it
serves from this Mac, dies when the Mac does, and its `.ts.net` hostname gets
blocked by corporate DNS filters as VPN infrastructure — Ryan's own work laptop
couldn't reach it. A `.pages.dev` domain has none of those problems.

**Tailnet: https://bananas-mac-mini.tail6d208c.ts.net** — no port needed.

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
