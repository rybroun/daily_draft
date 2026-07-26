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
| Colours mean production, and the two needs stopped disagreeing | 2026-07-26 | The screen said "Need 15.3" while picking and "you needed 26.5" at the reveal — both right, measuring different things: the first is against the opponent's *projection*, the second against what they actually scored (125.2 against a projected 108.3). The scoreboard now marks its figures `proj` and reads "Need ~15.3 on projection", and the play-out opens with what they actually scored. Heads are coloured by production banded within position, not by position — which the label already said — and an unplayed pick gets its own neutral rather than the team orange, so "mine" and "unknown" stop looking alike. Your picks are marked by a ring instead, since hue can't mean two things. Named **Daily Waivers**; end zones read You / Opponent. |
| The scoreline is painted on the end zones | 2026-07-26 | The bar above the field is gone; each side's total sits at that side's end of the ground, and what you still need — or how it finished — sits on your own paint. The top is now just the mark, which week of history this is, and the round strip. The field went 640px → 712px and row clearance 24–41px → 34–50px. While the wire is open your end zone is behind it, so the sheet header carries the need figure too. |
| Mid-day you learn only what you played; the day ends with the full board | 2026-07-26 | The post-round panel printed the best score available and named who you should have taken — with two rounds left on the same wire, that was the answer handed over before the question. Rounds one and two now tell you only what your own picks scored, in the play-out, and those players carry their real number afterwards while everyone else stays a question mark. **After round three the ranked board comes back in full** — every candidate on every wire, what they scored, yours marked — because by then there is nothing left to spoil. The "already decided" line moved into the play-out. |
| Two halves you can tell apart, and no leftover difficulty labels | 2026-07-26 | Their half sits in shade and yours in sun, a hard tonal step at the 50 instead of a tint that faded out through the middle and left the line with nothing behind it. The intro card was the last place still promising Easy/Medium/Hard; it now reads its rounds off the same list the round strip uses, so it can't drift again. |
| Spacing reworked from measurements, and `?reset` | 2026-07-26 | The backfield sat 20% apart while a name plate is 92px wide — those two always collided, on every phone, and a check now fails if any two players overlap. End zones cut from 12% to 8.5% (ten yards of a hundred-and-twenty is 8.3%); score bug, masthead and foot tightened. Row clearance at 390×844 went 17px → 24–41px, and a 667-tall phone went from overlapping to fitting. `?reset` clears the day and rewrites the URL, since there was otherwise no way back to round one. |
| Them, not NIN; Round 1/2/3, not easy/medium/hard | 2026-07-26 | The invented league names were cut to three letters, which produced NIN for Ninth Street Storm — undecipherable and naming nothing you'd recognise. End zone and scoreline now read "Them" against "You"; the full name survives spelled out in the intro and result headline, and on the chip's title. Rounds are numbered: difficulty is still what the engine searches for, but as a label it told the player how hard to find the answer before they'd looked. |
| The field reads as a gridiron, not a pitch | 2026-07-26 | End zones painted at each end in the two teams' colours with the names across them, replacing a pair of sideline chips; yard lines confined between the goal lines; the 50 reduced from a five-pixel slab to a heavier yard line; a split midfield logo whose halves say which way the field runs. Rows compressed into the ground between the zones — a display transform in `Field.tsx`, so the adapter's formation coordinates are untouched. End-zone paint got its own tokens: the team colours are tuned for chips and turned each zone into a lamp in dark mode. |
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
