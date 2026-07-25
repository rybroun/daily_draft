# Roadmap — daily_draft

**Updated:** 2026-07-25 · **Lead:** daily-draft-prototype

The game is a **waiver-wire puzzle against a named opponent**. Your lineup on a field with two
holes, their lineup one tap away, a wire showing form and injury tags but never the week
itself. Fill both spots, play the week, find out whether you beat them.

Three builds today: the season-slate prototype, the waiver redesign, and this pass — opponents,
injuries, projections, and an interface rebuilt around rows instead of boxes. What's in `Now`
is judgement, not code.

## Now

| Item | Status | Updated | Notes |
|---|---|---|---|
| Play it for a few days and judge whether it's fun | in progress | 2026-07-25 | **Live at https://bananas-mac-mini.tail6d208c.ts.net** (tailnet only). The prototype exists to answer this and nothing else. |
| Decide whether one week is too random to feel fair | in progress | 2026-07-25 | Partly addressed: the reveal now says when a week was already decided either way. Whether that's enough needs play, not design. |
| Confirm football as the shipping sport | blocked | 2026-07-25 | **Ryan's call.** Everything about the design now assumes weekly scoring, a waiver culture and positions on a field. The mock is a fictional gridiron league. Confirming it unblocks the data question. |
| Find week-by-week historical data | blocked | 2026-07-25 | **Unblocks once the sport is confirmed.** Needs weekly box scores plus historical injury designations — the injury layer is now load-bearing, not decoration. |

## Next

| Item | Status | Updated | Notes |
|---|---|---|---|
| First real sport adapter | planned | 2026-07-25 | One file behind the existing interface. Follows the sport and data decisions. |
| Share-a-result mechanic | planned | 2026-07-25 | The Wordle loop, and the matchup gives it something to say: "beat the Blackbirds by 14.2". Only worth building once the game is fun. |
| Matchup-quality colour coding per candidate | planned | 2026-07-25 | Sleeper and Yahoo both tint each player by how their opponent has fared against that position. Would add a second readable signal to the wire. |
| Puzzle archive / play a past week | planned | 2026-07-25 | Selection is already date-seeded, so any past date is already playable. |

## Later

| Item | Status | Updated | Notes |
|---|---|---|---|
| Difficulty tuning | planned | 2026-07-25 | Currently: season form picks the winner ~39% of the time against 20% for guessing, and the picks decide the matchup 53% of weeks. Real data may not land in that band. |
| More than two openings, or two of the same position | parked | 2026-07-25 | Deliberately excluded — same-slot openings turn two independent judgements into one combined optimisation, which is a different game. |

## Shipped

| Item | Shipped | Notes |
|---|---|---|
| Both teams on one field, facing off | 2026-07-25 | Opponent's formation rotated about the centre; tabs gone. Positions grouped into three bands by role. Their injuries are now on screen rather than a tap away. |
| Light by default, dark by choice | 2026-07-25 | Not tied to `prefers-color-scheme` — a dark phone still opens the game in daylight. Toggle in the masthead, remembered across visits. |
| Light theme, with dark as a token swap | 2026-07-25 | Same match at three o'clock instead of under floodlights. Palette on light/dark tokens; `slotColor` returns CSS vars so the theme owns position colours. Both schemes play through green. |
| Live on the tailnet | 2026-07-25 | https://bananas-mac-mini.tail6d208c.ts.net — LaunchAgent keeps `vite preview` on 4173, `tailscale serve` proxies 443. `npm run build` is the deploy. Verified by playing the live URL through in a browser. |
| Single screen, no scroll, with a camera | 2026-07-25 | Field owns the viewport; the wire rises over it when you tap a gap and the camera pushes in on that spot. Same panel shows the board after the reveal. |
| Broadcast redesign — everything except the field | 2026-07-25 | Score bug, colour spines, self-hosted Barlow, no monospace anywhere. Signature is the live "need" figure that falls as you fill each opening. |
| Full-bleed stadium treatment — the page *is* the field | 2026-07-25 | Turf gradient owns the whole stage, translucent panels over it, mown stripes, floodlight, grain, head shadows. |
| Opponent matchup — named team, full lineup, win/loss result | 2026-07-25 | Picks change the outcome 53% of weeks; best-vs-worst picks swing the win rate 24%→76%. |
| Injury designations as visible pre-kickoff information | 2026-07-25 | OUT scores and projects zero. A trap on the wire, an edge on the opponent's field. |
| Projections from visible form only | 2026-07-25 | `projectedValue` never reads `outcome`, asserted by test. |
| "Already decided" honesty in the reveal | 2026-07-25 | Says when no pick could have changed the result — the first real answer to the one-week-is-noise risk. |
| Interface rebuilt around rows, not boxes | 2026-07-25 | Hairline dividers, position colour pills, matchup bar, one field with a two-team toggle. |
| Selection through the field itself | 2026-07-25 | Tap an open head to choose which opening the wire fills. No popups, no tooltips. |
| Waiver-wire redesign — field, two openings, hidden outcomes | 2026-07-25 | Replaced the single-slot season puzzle. |
| `MockAdapter` — a fictional gridiron league | 2026-07-25 | Invented players and clubs, real football positions. |
| 74 Vitest tests + a 48-check browser play-through | 2026-07-25 | Written test-first. Includes tests pinning the design bets: form must beat guessing without being the answer, projections must not see the future, the need figure must fall as you pick, every candidate must be visible without scrolling a panel, the zoomed field must still cover its frame, and no state may scroll in either direction. |
| Vite + React + TS scaffold, Vitest, `0.0.0.0` dev server | 2026-07-25 | |
| Streak persisted in `localStorage` | 2026-07-25 | Survives refresh, including a half-filled lineup. Corrupt storage degrades to a fresh game. |
| First prototype — single slot, season scoring | 2026-07-25 | Superseded the same day. Proved the loop and the adapter seam. |
| Project space scaffolded, brief and constraints written | 2026-07-25 | By the butler at intake. |
