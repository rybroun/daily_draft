# Brief — daily_draft

## What it is

A daily puzzle game that treats a historical week the way a chess puzzle treats a board
position. You're given a lineup on a field with two spots empty, and a waiver wire of players
who were really available. Every number on screen is form to date — nothing from the week
you're picking for. You fill both spots, the week is played, and you see what everyone did,
including the players you passed on.

It's a test of whether you can read form, shaped like a waiver claim.

## Why

Fantasy sports didn't exist for most of sport's history. This plays out what it would have
been — and turns one genuinely hard recurring judgement, *who's about to be good*, into a
60-second daily habit.

## Who it's for

Ryan first. Beyond that: people who know a sport's history well enough to have opinions about
it, and enjoy being told they're wrong.

## Shape of a puzzle

```
  ▣ DAILY DRAFT                                    ☾   3 DAY STREAK

  [YOU]  59.2            2015            75.6  [JUN]
                        WK  10
                  NEED  16.4  TO WIN
  ┌──────────────────────────────── JUN ────────────┐
  │   DST M. Hearn ⓠ        K T. Barrow             │  ← their
  │      RB I. Jessup   QB A. Xu    RB J. Cobb ⓠ    │    kicking
  │  WR G. Hollis ⒪  TE T. Lindqvist ⓠ  WR B. Oyelaran │  game, backs,
  │═════════════════ halfway ═══════════════════════│    catchers
  │  WR L. Nunes    ( + )      ( + )   WR Q. Vollmer│
  │                  WR         TE                  │  ← yours,
  │      RB F. Ashford  QB M. Dupree  RB Q. Fontaine│    mirrored
  │           K Z. Prokop     DST H. Vasquez        │
  └──────────────────────────── YOU ────────────────┘

           [ FILL YOUR OPEN SPOTS TO WIN ]

  Tap a gap → the camera pushes in, the wire rises over the pitch:

  FILL YOUR WR              Form to date. Nothing from this week.
  ▌WR  Curt Yeager   KEN                              14.7 PROJ
       SEASON  13.9 PPG · 5.8 REC · 79.7 YDS · 0.5 TD
       LAST 3  16.0 PPG · 6.2 REC · 86.9 YDS · 0.7 TD
  ▌WR  Emil Ashford  GRN  [OUT]                        0.0 PROJ
  …

→ Lock in the lineup. The pitch fills with what everyone actually did, and
  you find out whether you beat the Blackbirds.
```

## Decided

- **Waiver-wire format** — a lineup with two holes, one wire, pick both, see the week. Not a
  season-long draft and not a trivia reveal.
- **Partial information is the game.** You see form to date, projections and injury tags, and
  never the week itself. The puzzle is prediction, not recall.
- **You're playing someone.** A specific opponent, fully visible — their lineup, their
  projections, their injuries. How much you need depends on what they're fielding, and that's
  what turns two picks into a decision rather than two guesses.
- **Injuries are the sharpest edge.** An OUT tag is known before kickoff. Reading it on the
  wire avoids a trap; reading it on the opponent tells you the week is already half won.
- **Two openings, never the same position.** Two independent judgements per day.
- **Scored twice** — did you beat them, and how good were the picks on their own merit.
- **Visual first.** One pitch, both lineups, facing each other across the halfway line. The
  field is the interface *and* the control surface — you tap a gap to fill it.
- **One screen, never scrolled.** Detail rises over the pitch rather than sitting below a fold.
- **Web first.** Wordle model: fast to iterate, shareable by link, no app store.
- **Multi-sport from day one**, structurally. The engine is sport-agnostic; sports are
  adapters. The mock is a *fictional* football league, so the seam is proven, not assumed.
- No backend until something demands one.

## Success criteria — first milestone

**Met on 2026-07-25.** A playable puzzle in the browser, live on the tailnet: one pitch with
both lineups, two picks, a played week, a result against a named opponent, an explanation
against every alternative, and a streak that survives a refresh.

The next bar is harder and is the real one: *fun to play on the fourth consecutive day.*

## The known risk

A single week is mostly noise. The correct read will sometimes post 4 points while the
reckless one hits 30, and the game will call you wrong when you weren't. That tension is what
makes it feel like real fantasy and what could make it feel arbitrary.

Partly addressed: the reveal now says when a week was **already decided** — when no set of
picks could have changed the result either way. Being told you were beaten is fair; being
told you were wrong when you weren't is not. Whether that's enough is still unknown, and only
playing it will say.

## Open questions

| Question | Status | Notes |
|---|---|---|
| Which sport ships first? | **answered 2026-07-25 — football** | Confirmed by Ryan. The waiver-wire format wanted it all along: weekly scoring, a real waiver culture, positions on a field. |
| Where does real data come from? | **answered — nflverse** | Week-by-week game logs, CC-BY-4.0. 2007 and 2015 are in. One caveat that shapes which seasons are worth adding: **injury reports only exist from 2009**, and the injury read is one of the sharpest in the game, so pre-2009 seasons play a thinner version of it. |
| How do stats become a score? | answered structurally, open in content | `SportAdapter.outcomeValue` holds it, so core no longer needs it. The mock uses half-PPR fantasy points. A real sport still needs its own rule. |
| What makes a puzzle *good*? | open | The mock is tuned so reading the season line picks the winner ~39% of the time against 20% for guessing. Whether real data lands anywhere near that band is unknown. |
| Is one week too random to feel fair? | open | See "The known risk" above. Needs play, not design. |
| Solo streak, or leaderboards? | open | Streak only for now. |
| Does the projection column kill the puzzle? | open, and pressing | Each candidate shows a projection that is the optimal use of the visible information, so the dominant strategy is "read one column, take the biggest number". A football fan brings nothing a spreadsheet doesn't. Leading fix: show a floor-to-ceiling range instead of a point estimate, which would also give the "need X to win" figure teeth — trail by 20 and you must take variance. |
| Do the picks matter often enough? | open | They change the result of the week 53% of the time. The other 47%, nothing the player did mattered. Honest, and possibly fatal for something meant to be played daily. |
