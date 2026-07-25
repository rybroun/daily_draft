# Handoff — daily_draft prototype

You are the lead agent on this project. You own it. The butler that scaffolded this space
does not build here and will not be writing code alongside you.

## Read these first, in order

1. `CLAUDE.md` (this directory) — the project's binding constraints
2. `BRIEF.md` — what the game is, and what is deliberately undecided
3. `docs/decisions.md` — why each choice was made
4. `ROADMAP.md` — your current board
5. `~/CLAUDE.md` — machine-wide house engineering standards. **Part 1 applies to you.**
   Part 2 is butler-only; skip it.

## The task

Build a **playable prototype** of the daily draft-board puzzle, on mock data.

Done means all of this is true:

1. Vite + React + TypeScript scaffolded **in this directory** — `src/` at the repo root,
   alongside the existing `CLAUDE.md`. Do not nest the app in a subdirectory.
2. `src/core/` — sport-agnostic types, the `SportAdapter` interface, deterministic
   date-seeded puzzle selection, and scoring. **Zero sport-specific code or strings in
   `core/`.** This is the project's most important constraint.
3. `src/sports/mock/` — a `MockAdapter` with invented players and plausible stat lines,
   real-feeling enough to actually play against.
4. `src/ui/` — the puzzle screen: the slate, a pick, a score, and a clear explanation of
   *why* that pick scored what it did against the alternatives. Presentational only — no
   game rules in UI components.
5. Streak persisted in `localStorage`, surviving a refresh.
6. Vitest tests for `core/`. Scoring and puzzle selection are pure logic and are where bugs
   will hide — write those tests first where you can.

## Verify before you claim anything works

- `npm run build` succeeds
- `npm test` passes — and you have read the actual output
- `npm run dev` serves and you have loaded the page and played it through: slate renders,
  pick registers, score appears with its explanation, streak increments and survives a reload

Ryan cannot see your terminal. Your report *is* the truth to him. If something fails, say so
and show the output.

## Check-in protocol — how the butler sees you

The butler runs at `~` and periodically checks on this project to update Ryan's dashboard.
It reads your **`ROADMAP.md`** and your **git history**. That is the only channel. Nothing
you say in your own session reaches it.

So:

- **Update `ROADMAP.md` in the same commit that does the work.** Not afterward. A stale
  roadmap makes Ryan decide against fiction.
- Move finished `Now` rows down to `Shipped` with the date. Bump `**Updated:**` at the top.
- Statuses are exactly: `planned` · `in progress` · `blocked` · `done` · `parked`.
  Anything else is dropped by the aggregator and your work becomes invisible.
- **Every `blocked` row must say in Notes what would unblock it.** A blocked row with no
  note is the one thing that wastes Ryan's attention entirely.
- Commit and push to `origin main` as you go. Don't sit on a week of uncommitted work —
  that's already bitten two other projects on this machine.
- Append what you decided, and why, to `docs/decisions.md`.

## Do not

- Pick a sport, choose a real data source, or scrape anything. Which sport ships first is
  Ryan's open decision. Deferring it is the entire reason the mock adapter exists.
- Invent answers to the open questions in `BRIEF.md`. If your work genuinely needs one
  answered, mark it `blocked` in `ROADMAP.md` with the specific question, and tell Ryan.
- Add a backend, auth, or a database.

## Talking to Ryan

He is on his phone, via remote control. Lead with the answer. Ask in tappable multiple
choice, not open questions. Never leave him a terminal command to run — you have permissions
to do it yourself.
