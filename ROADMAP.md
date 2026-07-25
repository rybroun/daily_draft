# Roadmap — daily_draft

**Updated:** 2026-07-25 · **Lead:** daily-draft-prototype

The game was redesigned today, after the first prototype was playable. It is no longer
"pick the best season from a slate" — it's a **waiver-wire puzzle**: a lineup on a field with
two holes, a wire of players shown only their form to date, and a week that gets played to
find out whether you read it right. Prediction under partial information, not recall.

The prototype for the new design is built and played through. What's in `Now` is judgement,
not code.

## Now

| Item | Status | Updated | Notes |
|---|---|---|---|
| Play it for a few days and judge whether it's fun | in progress | 2026-07-25 | The prototype exists to answer this and nothing else. Ryan can't reach it from his phone yet — see the Tailscale row. |
| Decide whether one week is too random to feel fair | blocked | 2026-07-25 | **Unblocks by playing it for a week.** A correct read can post 4 points while a reckless one hits 30. Known and deliberate. If it stings, the fix is showing the odds you beat rather than only the outcome. |
| Confirm football as the shipping sport | blocked | 2026-07-25 | **Ryan's call.** The waiver format leans hard toward football — weekly scoring, a real waiver culture, positions on a field. The mock is already a fictional gridiron league. Confirming it unblocks the data question. |
| Find week-by-week historical data | blocked | 2026-07-25 | **Unblocks once the sport is confirmed.** The redesign raised the bar: this needs weekly box scores, not season totals. Season-summary sources like Lahman no longer suffice. |

## Next

| Item | Status | Updated | Notes |
|---|---|---|---|
| First real sport adapter | planned | 2026-07-25 | One file behind the existing interface. Follows the sport and data decisions. |
| Share-a-result mechanic | planned | 2026-07-25 | The Wordle loop. Only worth building once the game is fun. |
| Puzzle archive / play a past week | planned | 2026-07-25 | Selection is already date-seeded, so any past date is already playable. |

## Later

| Item | Status | Updated | Notes |
|---|---|---|---|
| Serve over Tailscale for phone testing | blocked | 2026-07-25 | **Unblocks when Ryan opens Tailscale.app and signs in once** — `tailscaled` isn't running machine-wide and the auth needs a GUI no agent can drive. Confirmed still down today. Until then the dev server is localhost-only and Ryan can only see screenshots. |
| Difficulty tuning | planned | 2026-07-25 | The mock is tuned so season form picks the winner ~39% of the time against 20% for guessing. Real data may not land in that band. |
| More than two openings, or two of the same position | parked | 2026-07-25 | Deliberately excluded — same-slot openings turn two independent judgements into one combined optimisation, which is a different game. |

## Shipped

| Item | Shipped | Notes |
|---|---|---|
| Waiver-wire redesign — field, two openings, hidden outcomes | 2026-07-25 | Replaced the single-slot season puzzle. Core, mock and UI all rewritten. |
| Field visual — lineup of heads, openings marked, reveal in place | 2026-07-25 | Coordinates come from the adapter, so core still never learns what a running back is. |
| Hidden-information model | 2026-07-25 | `Player.form` is visible, `Player.outcome` is not. A browser check asserts no week-of stat reaches the screen before the reveal. |
| Set scoring across both openings | 2026-07-25 | Your pair against the best possible pair, 0–100. |
| `MockAdapter` — a fictional gridiron league | 2026-07-25 | Invented players and clubs, real football positions. Form and outcome are noisy readings of a hidden true level. |
| 56 Vitest tests + a 31-check browser play-through | 2026-07-25 | Written test-first. Includes a test that pins the design bet: form must beat guessing without being the answer. |
| Vite + React + TS scaffold, Vitest, `0.0.0.0` dev server | 2026-07-25 | |
| Streak persisted in `localStorage` | 2026-07-25 | Survives refresh, including a half-filled lineup. Corrupt storage degrades to a fresh game. |
| First prototype — single slot, season scoring | 2026-07-25 | Superseded the same day by the redesign. Proved the loop and the adapter seam. |
| Project space scaffolded, brief and constraints written | 2026-07-25 | By the butler at intake. |
