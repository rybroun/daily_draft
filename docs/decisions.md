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

## 2026-07-25 — One screen, and a camera

Ryan: *"maybe it's more of an animation, you click on WR and it zooms in and gives you your
options. Would love it as 1 page no scroll."*

### The field is the page; detail comes to you

Nothing scrolls. `.screen` owns `100dvh` as a flex column and the field takes whatever height
is left over, so there is no fold and nothing below it. The waiver list — the one thing that
can't fit alongside the field — lives in a panel that rises over the bottom of the pitch when
you tap a gap, and drops when you've picked.

This turned out to fix a structural problem rather than just a visual one. Previously the
field and the wire competed for the same vertical space and both lost: the field was cropped
to make room, and the wire still ran off the bottom. Now each gets a full turn.

### The camera

Tapping a gap scales the field 1.45× about the tapped spot and carries it up the frame, while
every other spot drops to 28% opacity. Scaling about the spot itself matters — anchoring
anywhere else slides the target out from under the finger mid-animation.

The pan is clamped to the touchline. Centring on a wide receiver at x=17% would otherwise pull
the turf away from the left edge and show the black behind it, so the camera pans as far as
the ground allows and stops, which is what a real one does. A browser check asserts the field
still covers its frame on every run.

### The reveal reuses the same panel

After the week, tapping either of your picks opens its board in the same sheet. One gesture,
two meanings, both "show me this spot in detail" — so there is nothing new to learn between
the decision and the payoff. The summary that stays on screen is the verdict and the ledger;
the boards are now something you go and look at rather than scroll past.

### Two bugs the layout exposed

The sheet initially cut off the fifth candidate — which is frequently the injured trap, so it
was hiding the puzzle rather than just some data. There is now a check that measures every
candidate row against the panel's visible box.

And a screenshot is not proof of "no scroll": the page can fit while a panel inside it
silently scrolls. Every state in the play-through now asserts `scrollHeight <= innerHeight`
*and* that the rows are within their container.

## 2026-07-25 — Daylight

Ryan: *"I'd like this to be, like, a light fun game. Maybe there's a dark mode, but let's
design in light mode."*

### Same match, three o'clock kickoff

Rather than lightening the night theme — which produces grey mush — the whole palette follows
from moving the fixture to a Sunday afternoon. Sky above, sunlit grass, chalked white lines,
and shadows that *fall* instead of glows that bloom. Every value in the light theme is
derivable from that one decision, which is why it hangs together.

Dark mode is the same match under floodlights, and is now a token swap rather than a second
stylesheet. Components read tokens only.

### Position colours moved into CSS

`slotColor` now returns `var(--wr)` rather than a hex string. The adapter still owns *which*
colour a position gets; the theme owns what that colour actually is, because the same position
has to read on white grass at three o'clock and on dark grass at night, and those are not the
same value. Core is unaffected — it was always an opaque string.

Tight ends broke the fantasy convention and went violet. Orange is now the player's own team
colour, and two oranges at pill size is one too many.

### Labels, not text, on grass

Bright turf makes bare white text unreadable and bare dark text muddy, so every name on the
field sits on a small white label. It reads at any brightness and, as a side effect, looks
more like a game and less like a chart.

### One real bug the light theme exposed

At the reveal every head shows a figure, and all nine were being painted in the team colour —
so "yours" stopped meaning anything at exactly the moment it matters most. The team colour is
now reserved for the two you actually picked; everyone else gets a neutral chip.

Worth noting this was equally wrong in the dark theme and had shipped unnoticed. Rebuilding
the palette is what surfaced it.

## 2026-07-25 — One field, two teams

Ryan: condense it, put both teams on the field facing each other instead of behind two tabs,
and line the positions up by what they do.

### The matchup is the picture

Both lineups now sit on one pitch, the opponent's being the same formation rotated 180° about
the centre so they face you across the halfway line. The tab switch is gone.

This is strictly better than the toggle it replaces. Their injuries were previously a tap
away, which meant the information that most changes your decision was the information you had
to remember to go and look at. It is now simply on screen: four tagged players on their side,
readable without touching anything.

The mirror is presentational — the adapter still describes one half, and the UI rotates the
other. One formation, one source of truth.

### The formation says what each player does

Three bands instead of a scattered spread: catchers on the front line, the backfield behind
with the passer in the middle, the kicking game apart at the back. Position is now legible
from where somebody stands, which is the whole point of putting them on a field rather than
in a list.

### Sides, said three ways

A bold halfway line, a warm wash on your end against a cool one on theirs, and a chip at each
sideline. Any one of the three alone was ambiguous at a glance; together it's unmistakable
without a word of explanation.

### The mark

A "D" in a solid block, top left, drawn as a path rather than set in type so it renders
identically before the webfont lands and at any size.

Ryan asked for a well-known sports publication's logo. Declined: it's a real company's
trademark, and putting it on this would read as their product when it has nothing to do with
them. The mark above is the same idea — a single bold letterform in a solid block — belonging
to this game and to nobody else.

## 2026-07-25 — Light is the default, not the device's

Ryan opened the hosted build on his phone and got the dark theme, because the theme was wired
to `prefers-color-scheme` and his phone lives in dark appearance.

That was the wrong hook. The system setting is about reading apps at night; this is a Sunday
afternoon, and most phones sit in dark permanently — so following the device would mean almost
nobody ever sees the version the game was designed as. Light is now unconditional, dark is an
opt-in toggle in the masthead, and the choice is remembered. The theme is applied before first
paint, so there's no flash of the wrong one.

The regression guard is the check that matters: a browser emulating a **dark device** must
still open the game in **light**.

### Three smaller notes from the same look

The season moved out of the masthead and onto the scoreline, stacked over the week, where a
broadcast puts it. The masthead is now just the mark and the toggle.

The streak said "0 DAYS" to a first-time player, which is a label for a thing that hasn't
happened. It now says nothing until there is a streak, then "1 DAY STREAK". Kept rather than
removed — the daily return is the whole habit — it just needed to stop announcing zero.

The waiting button said "Tap a gap to fill it", which describes the gesture rather than the
point. It now says "Fill your open spots to win". Ryan's words were "fill your open players";
*spots* are what get filled and players are what fill them.

## 2026-07-26 — Taking the projection away

Ryan on the waiver panel: it reads as a wall of monospace, add avatars, and
*"I wanna get away from the projected, because I do think that gives quite a bit
away... maybe we can give other things like who they're playing in the next couple
weeks and other data that might be part of that projected number."*

That is the fix this project has needed since the design conversation, arrived at
independently from the other side.

### The projection was the answer, pre-computed

Every candidate carried a projected score that was the optimal read of everything
else on the card. Shown it, the dominant strategy was to take the biggest number,
and a football fan brought nothing a spreadsheet didn't. It's gone from the wire.

What replaces it is what it was *made of*: the season line, the recent line, the
injury report — and now the run of fixtures, tinted by how generous each defence
has been to that position through the prior weeks. Not "he'll score 12" but "he
has the softest secondary in the league next, and he's trending up".

### Points per game stays

The one summary that survives, and deliberately. It summarises what *happened*
rather than guessing what will. Without it, comparing "1.8 rec, 42 yds" against
"4.6 rec, 56 yds" means half-PPR arithmetic in your head five times a day — which
rewards being quick with numbers rather than knowing football, the exact failure
this change exists to remove.

### Fixtures come from the team, not the player

Reading a player's upcoming schedule off their own game lines would leak whether
they played. An absence in week N+1 would quietly announce an injury the player
isn't supposed to know about. Schedules are built per team instead.

### Cards, not rows

Avatars in the position colour, name and team stacked, and the two form lines as
an aligned table under one set of column headings rather than a run of
comma-separated text. The columns are what makes it scannable — the previous
version read as monospace because it was a uniform run of glyphs, not because of
the typeface.

### Three bugs, all of the same shape

Adding the opponent code to each stat line meant `fantasyPoints` multiplied a
string by a weight, and NaN spread silently through every projection and total.
Non-numeric values are skipped now.

Adding `ppg` to a slot's columns made the averaging loop overwrite the computed
value with a lookup for a key the raw lines don't carry — zeroing every
projection downstream. It's computed last now, with a comment saying why.

And re-fetching the seasons overwrote the 2015 injury file with an empty one: the
injuries release names its column `game_type` where the stats release names the
same thing `season_type`, so the filter matched nothing. Restored, and the
practice wording is matched on its leading word because the source writes
"Participation in Practice" for full and limited but "Participate In Practice"
for DNP — an exact-match table silently drops two of the three.

## 2026-07-26 — Making it a puzzle, not a wager

Ryan: *"something on the wire should always allow the user to win. Think of this like a chess
puzzle — they have to make a set number of moves that is perfect."*

This is the fix for the problem that has been sitting at the top of the roadmap since the
design conversation: on 58% of days nothing the player picked could change the result. Tuning
the opponent closer would have improved the odds. Guaranteeing a solution removes the problem.

### Every day has at least one winning line-up

`puzzleFor` no longer takes the first arrangement it draws. It searches — up to sixty
(season, week) draws in a seeded order — for one where at least one complete set of picks
beats the opponent, and where the *number* of winning sets falls in the band for that day's
difficulty. Measured over a year: **zero unwinnable days** on both adapters, and the bands are
hit on 364 of 365 days. The search costs 90ms for a whole year, so a single day is free.

### Difficulty is how many spots you have to get right

One, two or three openings — easy, medium, hard. It reads as counter-intuitive (three
openings means more points available) and it isn't: more openings means more ways to drop
one. The numbers bear it out. On easy about 59% of the five possible line-ups win. On hard
about 2.8% of a hundred and twenty-five do, which is three or four exact answers.

### The count is the reveal

*"Exactly one line-up out of 125 would have won it."* That single line is the chess-puzzle
claim made good — it tells the player there was always a way through and exactly how narrow
it was. It also retires a piece of copy: there is no longer a "nothing on the wire would have
won this" case, because that can no longer happen.

### Difficulty is capped by the formation, not enforced on it

An adapter with two openable positions has no "hard". Rather than refuse the day, the
difficulty drops to the hardest the formation supports. The earlier version threw, which is
the wrong answer to a sport that simply has fewer positions to stream.

## 2026-07-26 — A difficulty toggle, and what it costs

Ryan wanted to try all three rather than wait for the day to serve them.

Picking a difficulty is a **practice run**: it doesn't build a streak. The day's real puzzle is
the one the date chose, and letting a player shop for an easy day when the hard one is going
badly would empty the streak of meaning. Same rule the `?date=` archive already follows.

### Each difficulty is a different puzzle, necessarily

Switching also switches the week and the matchup. That's not a shortcut — it falls out of the
guarantee. A hard day needs a matchup where about three of a hundred and twenty-five line-ups
win; the same matchup cannot simultaneously be one where three of five do. The search finds a
different arrangement for each, so "today" is really three puzzles and you play one for the
streak.

### Picks are keyed to the puzzle, not the day

Storage now records which difficulty a set of picks was made against. Without that, filling
two spots on medium and switching to hard would carry two answers into a three-question
puzzle — stale picks for a question that was never asked.

## 2026-07-26 — A day is three rounds

Ryan: *"can you make it so there's an intro? So it's easy mode, and then you have to play it
medium, hard — three steps. Less like toggle these, and more like welcome to the thing, round
one, easy."*

The difficulty toggle shipped an hour earlier and is already gone. It was a setting; this is a
session. A day now opens on a card, then runs easy → medium → hard, and the scorecard across
the top is where the toggle used to be — the same three chips, no longer a control.

### The streak is for finishing, not for playing

It advances once, when the third round is locked. Rewarding round one would make the other two
optional, and the whole point of the ladder is that it's a ladder.

### Losing a round doesn't stop you

You always play all three. A daily game that ends when you get one wrong is a daily game most
people play for ten seconds. The day's result is how many you won, not whether you were
perfect.

### Refreshing carries you forward

Mid-day, a reload puts you on the next unplayed round rather than replaying the reveal you
just read. Which round you're on is derived from what's locked in storage; only the brief
"look at what just happened" pause is component state, and it isn't worth persisting.

### The intro earns its place by saying one thing

That every round can be won. It's the promise the whole design rests on and it was previously
only discoverable by finishing a round and reading the line count.

### One harness lesson, twice

The browser script broke three times on the same thing: after a pick, the wire advances itself
to the next gap, so tapping that gap's head *closes* it. Correct product behaviour, wrong
assumption in the test. The helper is now a state machine that reads the screen rather than a
fixed sequence that assumes one — worth the rewrite, because fixtures drop it into the middle
of a day and a script that always expects to start at the intro fails in ways that look like
product bugs.

## 2026-07-26 — One wire, three rounds

Ryan, after playing it: *"I won, but I only got the player that had seven points, and there was
someone that had twenty three. You didn't tell me who had twenty three. So now going into the
second, I know there's someone with twenty three... as long as the players are all the same, I
can take another guess or keep my seven."*

That turns three separate puzzles into one you learn your way through, and it's a much better
game than what it replaced.

### The day is one matchup

Same season, same week, same opponent, same lineup, and — the part that matters — the same
waiver wire. What round one's reveal told you about those five players is still true in rounds
two and three.

### The openings nest

Round one opens a spot. Round two opens that spot and one more. Round three opens all three.
Your earlier answer is carried in, so round two starts with round one's pick already placed:
stand by it, or use what you now know. That's the choice Ryan described, and it only exists
because the wire holds still.

It gets harder because each round takes another of your own starters off the field, so more of
your total has to come off the wire — not because the wire gets meaner.

### The reveal names names

*"You didn't tell me who had twenty three"* was the actual bug. The summary said "best there
32.0" and left the name in a panel you had to know to open. Every round now names the best
available at each opening, in the open. It isn't a spoiler — the wire doesn't change, so that
name is the whole mechanism.

### The search now has to satisfy three rounds at once

One matchup has to work three times over at three different sizes, which is a stronger
constraint than three separate puzzles each working once. Measured over a year: zero rounds
with no way to win, and 11 of 1,095 rounds outside their band on the real data.

## 2026-07-26 — The week plays out

Ryan: *"right now it kinda goes to a screen that says you won or not — it just adjusts the top
bar. I'd love there to be a flow."*

Locking a round now takes over the screen and walks the week: what you needed off the wire,
then each player you took and what they actually did — their line, and how their real side
fared that day — and finally whether it was enough. Tapping skips a beat, so it never holds
anyone up.

### Beats are 1.25 seconds

A three-pick round plays out in about six. The first pass was 1.9s and a hard round took nine
seconds, which is a sixth of the minute the whole game is meant to take.

### The overlay is opaque, not a scrim

At 95% the summary underneath stayed readable — you could see who you should have taken before
the sequence got there. There's now a browser check that does a hit test on the best-available
name and fails if anything but the overlay is on top of it, because "looks covered" and "is
covered" are different claims.

### `gameNote` is a method, not a field

Whether a player's real side won that week describes the week being scored, so putting it on
`Player` would leave it one careless render away from appearing next to a pick that hasn't been
made yet. It's an optional adapter method the reveal calls and nothing else does.

### The data came from a cheaper model

Ryan asked for Sonnet where the work was mechanical, and fetching 2007 and 2015 game results
was exactly that. Verified here rather than taken on trust: every game agrees from both sides,
the era-correct team codes join to the player data in both directions with no strays, and the
spot checks land — New England 38–35 at the Giants in week 17 of 2007, Minnesota 35–17 on the
day Adrian Peterson ran for 296.

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
