# Roadmap — daily_draft

**Updated:** 2026-07-25 · **Lead:** daily-draft-prototype

Scaffolded today. The first milestone is a playable draft-board puzzle in the browser running
on mock data, with the sport-agnostic seam already in place.

## Now

| Item | Status | Updated | Notes |
|---|---|---|---|
| Vite + React + TS project scaffold | in progress | 2026-07-25 | Agent `daily-draft-prototype`. |
| Sport-agnostic core types and `SportAdapter` seam | in progress | 2026-07-25 | Core must never contain sport-specific strings. |
| `MockAdapter` with plausible invented players | in progress | 2026-07-25 | Deliberately not real data yet. |
| Playable puzzle UI — slate, pick, score, explanation | in progress | 2026-07-25 | First milestone. Must be fun to play twice. |
| Streak persisted in localStorage | in progress | 2026-07-25 | Survives refresh. |

## Next

| Item | Status | Updated | Notes |
|---|---|---|---|
| Decide which sport ships first | blocked | 2026-07-25 | Ryan's call. MLB has by far the best free historical data; NHL is patchy pre-1990; NBA has only 5 blurred positions. Everything about real data waits on this. |
| Scoring rule that works across sports | blocked | 2026-07-25 | Hardest open design problem — core can't know the sport. Needs a decision on how season stats become points. |
| Share-a-result mechanic | planned | 2026-07-25 | The Wordle loop. Only worth building once the game is fun. |

## Later

| Item | Status | Updated | Notes |
|---|---|---|---|
| First real sport adapter | planned | 2026-07-25 | Follows the sport decision. |
| Serve over Tailscale for phone testing | planned | 2026-07-25 | Blocked machine-wide on `tailscaled` not running. |
| Difficulty curve / puzzle quality tuning | planned | 2026-07-25 | Unknown until real data lands. |

## Shipped

| Item | Shipped | Notes |
|---|---|---|
| Project space scaffolded, brief and constraints written | 2026-07-25 | By the butler at intake. |
