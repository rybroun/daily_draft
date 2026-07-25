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

## 2026-07-25 — The waiver-wire redesign

Ryan saw the first prototype and changed the game. It is no longer "pick the best season from
a slate". It's a lineup on a field with two holes, a waiver wire, and a week that gets played.

### The puzzle is prediction, not recall

The old game showed full-season stats and asked which was best — a lookup, answerable by
anyone who knew the history. The new game shows only form *to date* and asks who is about to
be good. You can be right and lose.

This is the change that makes the game worth playing rather than merely knowable, and it is
also the riskiest thing about it. A single week is mostly noise. That tension is logged as an
open question in `BRIEF.md` rather than designed away, because it needs play to settle.

### Two openings, never the same position

Two decisions a day rather than one, but with distinct slots. Two of the same position would
turn two independent judgements into one combined optimisation — pick the best *pair* from a
shared pool — which is a different and more mathematical puzzle than the one intended.
`chooseOpenings` enforces it and a test pins it.

### The field is the interface

Ryan asked for it visually: heads on a field, names underneath, blanks where the openings are.
Coordinates for each spot come from `SportAdapter.formation()`, so a sport describes its own
shape and `core/` still never learns what a running back is. Core carries `x`/`y` from the
adapter to the UI without reading them.

At the reveal the whole field fills in with what everyone produced, including the starters you
never chose. That's the "was I right" moment, and putting it on the field rather than in a
list is the reason the redesign happened.

### Hidden information is a type, not a convention

`Player.form` is a list of stat lines the player may see; `Player.outcome` is one line they
may not, until the week is played. Keeping them as separate fields rather than one bag of
stats means "don't leak the future" is checkable rather than remembered — and the browser
play-through asserts no week-of stat reaches the screen before the reveal.

### Scoring is the pair against the best possible pair

Both openings are scored as one decision, 0–100 between the worst possible set of picks and
the best. `seasonValue` became `outcomeValue` — same seam, now asked about a week.

### The mock became a fictional football league

Ryan chose this over keeping positions abstract. A field only reads correctly with real
football positions, and a waiver-wire game is hard to judge if you don't know what any
position does. Players, clubs and seasons stay invented, so the sport decision stays open and
the adapter seam is still proven by a sport that doesn't exist.

Each player has a hidden true level. The season line, the last-three line, and the week itself
are three readings of it with increasing noise — 1.4, 3.4 and 5.4 fantasy points of spread.
That is the entire puzzle expressed as three numbers: form is worth reading, small samples
lie, and one week is mostly weather.

Tuned so the season-form leader is the right pick **39%** of the time against **20%** for
guessing. A test asserts that rate stays between "clearly better than luck" and 70%; outside
that band the mock has stopped posing a puzzle.

### Stat lines are generated backwards from the points

A week's points are drawn first, then decomposed into receptions, yards and touchdowns that
add up to them. The scoring rule reads those numbers back, so what's on screen always equals
what the pick is judged on — there's no hidden score to drift out of step with the display.

Three bugs this caught in review, all visible on screen before they were fixed: touchdowns
that a nothing game couldn't have paid for (`0 REC · 0 YDS · 2 TD`), a pile-up of players
averaging exactly 0.0, and averages whose stats didn't add up to the PPG printed beside them.

## Open — deliberately not decided

Which sport ships first and where real data comes from. Logged in `BRIEF.md`. Agents must not
invent answers to these.

*How stats convert to a score* is no longer an engine-level blocker — `outcomeValue` holds it
behind the adapter — but the first real sport adapter still has to answer it, and that answer
is Ryan's.

The redesign narrowed the sport question without closing it. A waiver-wire puzzle wants weekly
scoring, a real waiver culture, and positions that sit on a field, which is football on every
count — and it raised the data bar from season totals to week-by-week box scores. Ryan has
still not said the word, so no agent should act as though he has.

Whether one week is too random to feel fair is now the most important open question in the
project, and only playing it will answer it.
