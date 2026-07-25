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
2003 · WEEK 9                                    Streak: 12

        [WR]                            [ + ]      ← open
              [WR]            [ + ]                ← open
                       [QB]
              [RB]            [RB]
              [K]             [DST]

  Fill your WR              form to date · nothing from this week

  ○ Curt Yeager      KEN   SEASON  13.7 PPG · 4.8 REC · 53.1 YDS
                           LAST 3  10.8 PPG · 3.9 REC · 46.3 YDS
  ○ Ugo Ellery       CLV   SEASON  14.0 PPG · 4.1 REC · 59.1 YDS
                           LAST 3  14.5 PPG · 5.7 REC · 74.2 YDS
  …

→ Play the week. Then the field fills in with what everyone actually did.
```

## Decided

- **Waiver-wire format** — a lineup with two holes, one wire, pick both, see the week. Not a
  season-long draft and not a trivia reveal.
- **Partial information is the game.** You see form to date and never the week itself. The
  puzzle is prediction, not recall.
- **Two openings, never the same position.** Two independent judgements per day.
- **Scored on what actually happened**, against the best pair you could have picked.
- **Visual first.** A field with heads on it, not a list. The lineup is the interface.
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
makes it feel like real fantasy and what could make it feel arbitrary. Unresolved on purpose
— it needs play, not more design. The likely fix if it stings is showing the odds you beat or
lost to in the reveal, rather than only the outcome.

## Open questions

| Question | Status | Notes |
|---|---|---|
| Which sport ships first? | open | Deliberately deferred, though the waiver-wire format leans hard toward football: weekly scoring, a real waiver culture, and positions that map onto a field. The mock is a fictional gridiron league for that reason. Confirming it is still Ryan's call. |
| Where does real data come from? | open | Follows from the sport. Needs *week-by-week* box scores, not season totals — that's a harder requirement than the old season-based design had. Don't pick one yet. |
| How do stats become a score? | answered structurally, open in content | `SportAdapter.outcomeValue` holds it, so core no longer needs it. The mock uses half-PPR fantasy points. A real sport still needs its own rule. |
| What makes a puzzle *good*? | open | The mock is tuned so reading the season line picks the winner ~39% of the time against 20% for guessing. Whether real data lands anywhere near that band is unknown. |
| Is one week too random to feel fair? | open | See "The known risk" above. Needs play, not design. |
| Solo streak, or leaderboards? | open | Streak only for now. |
