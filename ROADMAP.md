# Roadmap — daily_draft

**Updated:** 2026-07-25 · **Lead:** daily-draft-prototype

The playable prototype is up: a deterministic daily puzzle on mock data, with the
sport-agnostic seam proven by an adapter that is deliberately not a real sport. What's left
in `Now` is not code — it's the two decisions that everything real depends on.

## Now

| Item | Status | Updated | Notes |
|---|---|---|---|
| Decide which sport ships first | blocked | 2026-07-25 | **Ryan's call — unblocks by picking one.** MLB has by far the best free historical data (Lahman, 1871→present); NHL is patchy pre-1990; NBA has only 5 blurred positions. Nothing real can start until this lands. |
| How season stats become a score, for a real sport | blocked | 2026-07-25 | **Unblocks once the sport is chosen.** The engine no longer needs an answer — `SportAdapter.seasonValue` holds it per-sport — but the first real adapter does. |
| Play it for a few days and judge whether it's fun | planned | 2026-07-25 | The prototype exists to answer this. Blocked on being reachable from Ryan's phone. |

## Next

| Item | Status | Updated | Notes |
|---|---|---|---|
| First real sport adapter | planned | 2026-07-25 | One file behind the existing interface. Follows the sport decision. |
| Share-a-result mechanic | planned | 2026-07-25 | The Wordle loop. Only worth building once the game is fun. |
| Puzzle archive / play a past day | planned | 2026-07-25 | Selection is already date-seeded, so any past date is already playable. |

## Later

| Item | Status | Updated | Notes |
|---|---|---|---|
| Serve over Tailscale for phone testing | blocked | 2026-07-25 | **Unblocks when Ryan opens Tailscale.app and signs in once** — `tailscaled` isn't running machine-wide and the auth needs a GUI no agent can drive. Until then the dev server is localhost-only. |
| Difficulty curve / puzzle quality tuning | planned | 2026-07-25 | Mock slates currently hide the best pick behind the volume leader ~37% of days. Whether real data does that on its own is unknown. |

## Shipped

| Item | Shipped | Notes |
|---|---|---|
| Vite + React + TS scaffold at the repo root | 2026-07-25 | Plus Vitest. `npm run dev` binds `0.0.0.0`. |
| Sport-agnostic core and the `SportAdapter` seam | 2026-07-25 | `core/` has zero sport-specific code or strings, checked by a fixture adapter that spells nothing. |
| Deterministic date-seeded puzzle selection | 2026-07-25 | `core/puzzle.ts`. No `Math.random` in the engine at all. |
| Slate-relative scoring with an explanation | 2026-07-25 | `core/scoring.ts`. Ranks the whole board so the pick can be argued against every alternative. |
| `MockAdapter` — an invented league | 2026-07-25 | Deliberately not MLB/NHL/NBA, so the seam is proven rather than assumed. |
| Playable puzzle UI — slate, pick, score, reveal | 2026-07-25 | Phone-first. Played through end to end in a real browser. |
| Streak persisted in `localStorage` | 2026-07-25 | Survives refresh; corrupt or blocked storage degrades to a fresh game rather than crashing. |
| 42 Vitest tests over `core/`, the mock adapter and storage | 2026-07-25 | Written test-first. |
| Project space scaffolded, brief and constraints written | 2026-07-25 | By the butler at intake. |
