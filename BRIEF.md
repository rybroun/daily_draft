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
2003 · WEEK 4                                            Streak: 12

  You                     PROJECTED           Junction Blackbirds
  59.2                                                       75.6
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░

  [ Your lineup ]  [ Junction Blackbirds ]     ← one tap to scan theirs

        (WR)                            ( + )      ← open
     L. Nunes                            WR
        6.5
              (WR)              ( + )               ← open
          Q. Vollmer             TE
             7.4
                       (QB)
                    M. Dupree
                      20.6
              (RB)            (RB)   …

  Fill your WR                form to date · nothing from this week

  WR  Curt Yeager   KEN                                  14.7 PROJ
      SEASON  13.9 PPG · 5.8 REC · 79.7 YDS · 0.5 TD
      LAST 3  16.0 PPG · 6.2 REC · 86.9 YDS · 0.7 TD
  WR  Emil Ashford  GRN  [OUT]                            0.0 PROJ
      SEASON   8.9 PPG · 3.4 REC · 42.0 YDS · 0.5 TD
  …

→ Play the week. The field fills in with what everyone actually did, and you
  find out whether you beat the Blackbirds.
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
- **Visual first.** A field with heads on it, not a list. The lineup is the interface, and one
  tap flips it to the opponent's.
- **Web first.** Wordle model: fast to iterate, shareable by link, no app store.
- **Multi-sport from day one**, structurally. The engine is sport-agnostic; sports are
  adapters. The mock is a *fictional* football league, so the seam is proven, not assumed.
- No backend until something demands one.

## Success criteria — first milestone

A playable puzzle in the browser: a field rendered from mock data, two picks, a simulated
week, a score, an explanation against every alternative, and a streak that survives a
refresh. Fun to play twice in a row.

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
| Which sport ships first? | open | Deliberately deferred, though the waiver-wire format leans hard toward football: weekly scoring, a real waiver culture, and positions that map onto a field. The mock is a fictional gridiron league for that reason. Confirming it is still Ryan's call. |
| Where does real data come from? | open | Follows from the sport. Needs *week-by-week* box scores, not season totals — that's a harder requirement than the old season-based design had. Don't pick one yet. |
| How do stats become a score? | answered structurally, open in content | `SportAdapter.outcomeValue` holds it, so core no longer needs it. The mock uses half-PPR fantasy points. A real sport still needs its own rule. |
| What makes a puzzle *good*? | open | The mock is tuned so reading the season line picks the winner ~39% of the time against 20% for guessing. Whether real data lands anywhere near that band is unknown. |
| Is one week too random to feel fair? | open | See "The known risk" above. Needs play, not design. |
| Solo streak, or leaderboards? | open | Streak only for now. |
