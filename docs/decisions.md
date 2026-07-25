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

## 2026-07-25 — Building the prototype

### `SportAdapter` gained a `seasonValue(player, slot)` method

The interface sketched in `CLAUDE.md` gave core no way to tell one season from another — it
can read a `Player`'s stats but is forbidden from knowing what any of them mean. Something
has to turn a stat line into a comparable number, and it can't be core.

So the adapter answers it. Core asks "what was this season worth at this slot?" and only ever
compares the numbers that come back. This is the deliberate place to put the open question
*how do season stats become a score* — the answer is per-sport, so it lives per-sport. Core
stayed sport-agnostic and the open question stayed open, rather than one being sacrificed for
the other.

### Scoring is relative to the slate, not absolute

Points are where the pick landed between the worst and the best player on that slate: taking
the best is 100, the worst is 0. Rejected scoring against some league-wide baseline, which
would need a notion of "average" that core can't have and that varies by era.

Relative scoring also matches the question the puzzle actually asks — *who was the best of
these six*, not *how good was this season in the abstract*. It has one known consequence: a
slate of six identical seasons scores 100 for any pick. That's correct; there was no wrong
answer to give.

### The reveal is the whole ranked board

"Explainable" was a stated rule, so the result doesn't just say 32/100. It ranks every
candidate by what their season was worth, shows each one's stat line beside its value, marks
the pick and the best available, and draws the value as a bar so the gap is seen and not just
read. The player can check the engine's work.

### The mock league is not a disguised real sport

`MockAdapter` invents a league with slots (`ANCHOR`, `WING`, `PIVOT`, `WARDEN`) and stats
(`SCR`/`STP`, `SET`, `RTG`) that belong to no real game, rather than mocking up MLB. Two
reasons: it keeps the sport decision genuinely open, and it proves the adapter seam instead
of assuming it — if anything in `core/` had quietly grown a baseball assumption, an invented
sport would break and a fake MLB wouldn't.

Its stats are generated so each one only partly follows a player's overall quality. That's
deliberate: the slate's volume leader is *not* the best pick about 37% of days, which is what
leaves a puzzle to solve rather than a sorting exercise.

### Corrupt storage loses the streak rather than the game

`loadGame` returns a fresh game on unparseable, wrong-shaped, or unavailable storage, and
`saveGame` swallows write failures. Losing a streak is a bad day; being unable to play at all
is worse. Nothing in the storage layer throws.

## Open — deliberately not decided

Which sport ships first and where real data comes from. Logged in `BRIEF.md`. Agents must not
invent answers to these.

*How season stats convert to a score* is no longer an engine-level blocker — `seasonValue`
holds it behind the adapter — but the first real sport adapter still has to answer it, and
that answer is Ryan's.
