# Roadmap — daily_draft

**Updated:** 2026-07-26 · **Lead:** daily-draft-prototype

The game is a **waiver-wire puzzle against a named opponent**, played as three rounds off one
shared wire. Your lineup on a field with holes in it, their lineup facing you, a wire showing
form, fixtures and injury tags but never the week itself. Fill the holes, play the week, find
out whether you beat them — then do it again with one more hole.

The sport is settled: **NFL, on real nflverse data for 2007 and 2015**. What's in `Now` is
judgement about whether it's fun, which is a question only play can answer.

## Now

| Item | Status | Updated | Notes |
|---|---|---|---|
| Play it on real data and judge whether it's fun | in progress | 2026-07-26 | **Live at https://bananas-mac-mini.tail6d208c.ts.net** (tailnet only). 2007 and 2015, weeks 7–17. The prototype exists to answer this and nothing else. |
| Decide whether one week is too random to feel fair | in progress | 2026-07-26 | Largely answered structurally: every round is now guaranteed winnable off the wire, so no day is decided before you play it. Whether it *feels* fair still needs play. |

## Next

| Item | Status | Updated | Notes |
|---|---|---|---|
| Trivia beyond the score in the play-out | planned | 2026-07-26 | The reveal currently gives the factual result ("NYG lost 14–20 at WAS"). Ryan asked for "the trivia of that moment in sports" — a career day, a streak, what the game meant. Needs a source nflverse doesn't carry. |
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
| The wire card shows one game, a record, and no projection anywhere | 2026-07-26 | Next-three-fixtures strip cut to the single game being picked for, and the unlabelled soft/even/hard tint replaced by the opposing side's record going in. Column headings pinned; rows tightened so all five candidates fit without scrolling at 390×844. |
| A pick wears a question mark, and the need figure holds still | 2026-07-26 | The field printed a projection over the player you had just taken off the wire, and the need figure fell by exactly that projection — handing back by subtraction the number the wire deliberately withholds. Now `?` until the reveal, and the need states the target off the wire. |
| The play-out holds on the verdict, inside the phone column | 2026-07-26 | Was `position: fixed`, so it spilled across the whole window on desktop; now absolute against the 34rem column. Beats slowed to 1.6s/2.3s, and the verdict no longer times out to the summary under a label reading "tap to continue". |
| The week plays out instead of quietly updating the scoreline | 2026-07-26 | Full-screen sequence: what you needed → each pick, its points, its stat line and how their real side fared → the verdict. Tap to skip. `gameNote` is an adapter method, not a `Player` field, so it can't leak before the pick. |
| Every round guaranteed winnable | 2026-07-26 | Replaced difficulty tuning with a proof: all line-ups are enumerated and the day is rejected unless each round has at least one winning combination inside its band. Zero unwinnable days over a year on both adapters. This retired *"make the picks decide the week more often"* — it was 53%, it is now 100%. |
| A day is three rounds off one shared wire | 2026-07-26 | Welcome → easy (1 spot) → medium (2) → hard (3), openings nested and the wire unchanged throughout, so what round one's reveal taught you is still true in round three. Answers carry forward. Streak advances only on finishing all three. |
| The projection column removed | 2026-07-26 | It handed over the optimal use of visible information. Replaced with its inputs — upcoming fixtures, defence difficulty, recent form — so the player does the synthesis. Retired the open question about what to do with it. |
| First real sport adapter — NFL on nflverse data | 2026-07-26 | 2007 and 2015, weeks 7–17. Era-correct team codes recovered from `game_id`; injury designations 2009+; game results for the reveal. One adapter file behind the existing interface, exactly as the seam intended. |
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
