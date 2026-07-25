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

## 2026-07-25 — Opponents, injuries, and a less blocky interface

Ryan's second pass after playing the waiver build: give the decision an opponent, make
injuries matter, and stop the interface looking like a stack of boxes.

### You're playing someone, and you can see everything they have

The waiver decision was previously made in a vacuum — pick the highest-scoring player, always.
With a specific opponent whose lineup, projections and injuries are fully visible, *how much
you need* becomes part of the question. Behind by 16 on projection means you need upside;
ahead with their WR1 ruled out means you can take the safe floor.

Their whole team is visible on purpose. This isn't hidden information — in a real league you
can always look at your opponent's roster, and looking is the skill.

Measured before shipping: the two picks change the result of the week **53%** of the time, and
picking the best available rather than the worst swings the win rate from **24% to 76%**. If
those numbers had come out flat, the matchup would have been decoration.

### Two scores, because they answer different questions

The headline is the matchup — did you beat them, and by how much. Underneath, the picks are
still scored 0–100 on their own merit against the best available. A week you lost with two
excellent picks is a different experience from one you lost by taking the worst of both
boards, and one number can't say both.

### The reveal says when a week was already decided

`Score.alreadyDecided` is true when the best possible picks and the worst possible picks land
on the same side of the result — when nothing you could have done mattered. This is the first
real answer to the "one week is mostly noise" risk. Being told *"never in doubt"* or *"nothing
on the wire changed that"* is honest; being told you were wrong when no choice existed is not.

### Injuries are pre-kickoff information, so they're allowed

`Player.status` ("OUT", "Q") sits alongside `form` on the visible side of the line, because an
injury designation genuinely is known before a week is played. It's the one piece of
information that is both freely available and decisive, which makes it the best possible
reward for looking carefully.

An OUT player scores exactly zero, and projects zero. On the wire that's a trap for anyone
reading only the form line; on the opponent's field it's the difference between needing a
big week and needing to not lose one. A questionable player is discounted harder in the
projection (×0.75) than they actually lose (×0.85), so careful reading is worth slightly more
than casual reading.

### `projectedValue` on the adapter, and it must never read `outcome`

Projections are shown before kickoff, so they have to be derivable from exactly what the
player can see. The mock blends the season line 60/40 with the last three and applies the
injury discount. A test constructs a player with an absurd `outcome` and asserts the
projection doesn't move.

### `slotColor` on the adapter

Position colours are a real convention — every fantasy service has trained its users to scan
for them, and Sleeper and Yahoo both go further and colour-code matchup quality per player.
Adopting the language costs nothing and makes a nine-man field readable at a glance.

It's sport-specific presentation, so it lives on the adapter beside `formatStatLine` rather
than being hardcoded in the UI. Core still has no opinion about what a colour means.

### Rows, not cards

The old interface was a stack of bordered boxes, which is what "blocky" meant. Replaced with
one surface per group and hairline dividers between rows. A list you can run your eye down
reads faster than a column of objects each asking to be examined separately, and it's how
every fantasy app lays out a roster.

Concretely: borders removed in favour of `--hairline`, position pills added, the right-hand
number given its own column with a unit label under it, and the stat line spanning the full
row width so it never folds onto a second line.

### One field, two teams, one tap

Rejected showing the opponent as a separate list. The field is the thing Ryan liked, and a
segmented control above it means scanning the opposition is the same act as reading your own
side — nothing new to learn, and their injuries show up as dimmed red heads where you can see
them in one glance rather than reading nine rows.

### Selection is the field itself

No popups and no tooltips — neither works on a phone. Tapping an open head sets which opening
the wire below is filling, and picking advances to the other one automatically. The field is
both the display and the control surface, so the whole game is two taps and a button.

## 2026-07-25 — Making it feel like a game rather than a dashboard

Ryan, on the rows-and-pills version: *"still very robotic."* Fair. It was a well-organised
utility screen, and the field was a green rectangle sitting on a grey page.

### The page is the stadium, not a page with a field on it

The single change that did most of the work. The turf gradient moved off the field element
and onto the whole stage: night sky at the top, floodlit grass through the middle, back down
into the dark where the wire begins. The field is edge-to-edge with no border or corner
radius, so there's nothing to mark where "the graphic" ends and "the app" starts.

The wire panels underneath went translucent with a blur, so the green tints up through them.
One continuous space instead of three stacked rooms.

The gradient belongs to `.stage`, not `body`. A `background-attachment: fixed` version looked
right in a screenshot and was wrong in the hand — the grass stays glued to the middle of the
viewport while the waiver list scrolls through it.

### Texture, because flat vectors read as diagrams

Mown stripes, yard lines, a vignette, a pool of floodlight on the grass, and a fine grain
drawn with an inline SVG turbulence filter. The grain is doing more than it looks: it's the
difference between a rendered pitch and a CSS gradient.

Heads got a shadow on the turf, a slot-coloured glow, and an inner highlight so they read as
objects standing on the ground rather than circles printed on it.

### Warm against cool

You are gold, the opponent is steel blue, and the matchup bar is one bar split between them.
Neither collides with the position colours. Everything of yours — your streak, your picks,
your filled openings, the kickoff button — carries the same warm accent, so ownership is
readable without a label.

### Motion, sparingly

A head drops into a slot when you pick it (keyed on the occupant, so React remounts the glyph
and it replays). The reveal boards resolve down the page on a 55ms stagger rather than
appearing at once — a week finishing, not a table loading. Everything is disabled wholesale
under `prefers-reduced-motion`.

The stagger caught a real lesson: the first screenshot of it showed rows 3–5 missing, because
the capture landed mid-animation. That's now an explicit check — wait for every board row to
settle at full opacity before believing the screen.

### Two bugs the visual pass exposed

The floodlight glow, inset negatively past the viewport, pushed the document 78px wider than
the screen — a sideways scroll on a phone. Fixed with `overflow-x: clip` on the stage, and
the play-through now asserts `scrollWidth <= innerWidth` on every run, because that class of
bug is invisible in a full-page screenshot.

## 2026-07-25 — Broadcast redesign

Ryan, after enabling the `frontend-design` plugin: *"the only thing I still like is the field."*
So the field survived untouched and everything around it was rebuilt.

### Direction: a telecast, not an app

The previous version borrowed its furniture from software — a segmented control, a list of
rows with a right-aligned number, a gradient progress bar, a metric strip of big-number-plus-
small-label. All of it competent and none of it about football.

This one borrows the *information structure* of a broadcast: the score bug, the colour-chipped
team block, the lower-third stat card. Not the skin — no fake TV chrome — just the way a
telecast decides what to make big and what to make a colour.

### Killing the monospace

`ui-monospace` on every figure was the loudest robotic signal in the interface, and it was
doing one real job: keeping digits aligned in columns. `font-variant-numeric: tabular-nums`
does that job in any typeface. There is now no monospace anywhere in the app.

### Typeface: Barlow, self-hosted

Barlow Condensed 700 for display — team codes, the need figure, headlines, the lock-in button
— against Barlow 400/600 for everything else. A slightly squared grotesque, which reads as
sports schedule rather than as a system font.

Self-hosted from three latin-subset woff2 files, 46 KB total, so the page still fetches
nothing at runtime and stays shareable by link. SIL Open Font License 1.1.

### The signature: what you still need

The one element the screen is built around. A single condensed figure under the score bug
saying how far behind you are — `NEED 16.4 TO WIN` — that falls as you fill each opening, and
resolves into `LOST BY 14.2` when the week is played.

No fantasy service shows this, because none of them pose a week as a puzzle with a fixed
number of decisions left. It states the actual stake of the next tap without the player
having to subtract two numbers, and it's the reason the matchup exists at all.

Everything else was kept deliberately quiet so this could be loud.

### Colour spines instead of pills-on-a-slab

Every row carries its position colour as a 3px spine down its left edge. It gives the list
rhythm and encodes position at the edge, where the eye already is, without boxing each player
into a container — which was the "blocky" problem in the first place.

### The ledger replaces the metric strip

`45 PICK SCORE / 13.3 YOUR TWO PICKS / 29.8 BEST AVAILABLE` was three numbers requiring a
subtraction. It's now two bars on a shared scale — what you took against what was there — so
the gap is seen rather than computed. The pick score dropped out entirely; the bars say it.

### Copy

"Play week 4" became "Lock in your lineup", which is what fantasy players actually call it.
The reveal headline stopped repeating the margin — that's in the score bug now — and says the
thing the number can't: whether the week was ever yours to win.

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
