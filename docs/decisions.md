# Decisions — daily_draft

## 2026-07-25 — Intake

Decisions made with Ryan at intake. Each of these was a real fork, so the reasoning matters
more than the choice.

### Draft-board format, not roster-build or reveal

One slot, a slate of real candidates, pick the best, get scored. Rejected a week-long roster
build (a missed day punishes the habit) and a Wordle-style stat reveal (that's a trivia game,
not a drafting game). The draft board is closest to the chess-puzzle framing that started
this: one position, one defensible answer, instant feedback.

### Web first

Wordle model — fastest to playable, shareable by link, no app store review. Mobile via Expo
stays open for later; it matches the stack precedent on this machine and push notifications
are a real habit lever. But proving the game is fun comes first.

### Multi-sport from day one — structurally, not in content

Ryan explicitly deferred choosing a sport. Rather than treat that as a blocker, the *engine*
is built sport-agnostic from the first commit: sports live behind a `SportAdapter` interface
and the core never contains sport-specific code. Choosing a sport later then costs one
adapter, not a rewrite.

### Mock data first

No real dataset until the UI feels right. This deliberately defers the project's biggest
unknown — whether good puzzle slates fall out of historical data automatically or need
hand-curation — rather than letting it block a playable prototype.

### Deterministic daily puzzles

Puzzle selection seeds from the date string, so the same day yields the same puzzle for
everyone, and puzzle generation stays reproducible and testable. No randomness at play time.

### No backend

Client-side generation, `localStorage` streaks. A server gets added when something actually
requires one, not in anticipation.

## Open — deliberately not decided

Which sport ships first, where real data comes from, and how season stats convert to a score.
Logged in `BRIEF.md`. Agents must not invent answers to these.
