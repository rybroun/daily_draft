# Brief — daily_draft

## What it is

A daily puzzle game that treats historical sports seasons the way a chess puzzle treats a
board position. You're given a season, one roster slot, and a slate of players who were
really available. You draft one. You're scored on what they actually did.

It's a quiz on who you know, shaped like a draft.

## Why

Fantasy sports didn't exist in 1981. This plays out what it would have been — and turns
recall of a sport's history into a 60-second daily habit.

## Who it's for

Ryan first. Beyond that: people who know a sport's history well enough to have opinions about
it, and enjoy being told they're wrong.

## Shape of a puzzle

```
1981 MLB · RIGHT FIELD

  ○ Dwight Evans      BOS
  ○ Tony Armas        OAK
  ○ Reggie Jackson    NYY
  ○ Dave Winfield     NYY
  ○ Pedro Guerrero    LAD
  ○ Jack Clark        SFG

→ Scored on actual 1981 production.   Streak: 12
```

## Decided

- **Draft-board format** — one slot, a slate of candidates, pick the best. Not a week-long
  roster build, not a guess-the-player reveal.
- **Web first.** Wordle model: fast to iterate, shareable by link, no app store.
- **Multi-sport from day one**, structurally. The engine is sport-agnostic; sports are
  adapters.
- **Mock data to start.** Get the UI and the feel right before touching a real dataset.
- No backend until something demands one.

## Success criteria — first milestone

A playable puzzle in the browser: a slate rendered from mock data, a pick, a score, an
explanation of why, and a streak that survives a refresh. Fun to play twice in a row.

## Open questions

| Question | Status | Notes |
|---|---|---|
| Which sport ships first? | open | Deliberately deferred. MLB has the best historical data (Lahman, 1871→present, free); NHL is patchier pre-1990; NBA has only five blurred positions. |
| Where does real data come from? | open | Follows from the sport. Don't pick one yet. |
| How do season stats become a score? | open | Needs a rule that works across sports without the core knowing the sport. Hardest open design problem. |
| What makes a puzzle *good*? | open | Do good slates fall out of data automatically, or need curation? Unknown until real data lands. |
| Solo streak, or leaderboards? | open | Streak only for now. |
