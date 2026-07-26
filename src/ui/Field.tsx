import type {
  FieldEntry,
  FieldSpot,
  MatchupResult,
  Opponent,
  Player,
  PlayerId,
  RosterSlot,
  SpotId,
} from '../core/types';

interface FieldProps {
  entries: FieldEntry[];
  opponent: Opponent;
  /** Who the player has slotted into each opening, by spot. */
  filled: Map<SpotId, Player>;
  /** The spot the camera is pushed in on, if any. */
  zoomedOn: FieldSpot | null;
  /** Before the week this is a projection; after, what they actually did. */
  figureFor: (player: Player, slot: RosterSlot) => number;
  /** What a player actually scored — only ever read for `known` players. */
  outcomeFor: (player: Player, slot: RosterSlot) => number;
  /** Players you have already watched score in an earlier round. */
  known: Set<PlayerId>;
  revealed: boolean;
  /** True once the day is finished and the boards may be opened. */
  reviewable: boolean;
  /**
   * The scoreline, which is painted in the end zones rather than sitting in a
   * bar above the field. Each side's total belongs at that side's end of the
   * ground, and the game gets the bar's height back.
   */
  scoreline: {
    yours: number;
    theirs: number;
    /** What your openings still have to produce. Null once the week is played. */
    need: number | null;
    result: MatchupResult | null;
    margin: number;
  };
  onSpotTap: (spotId: SpotId) => void;
}

/** Lineup-card style, so a long surname doesn't wrap under its own head. */
const onCard = (name: string) => {
  const [first, ...rest] = name.split(' ');
  return rest.length === 0 ? name : `${first[0]}. ${rest.join(' ')}`;
};

/** A head: circle for the skull, arc for the shoulders. Deliberately anonymous. */
function Head() {
  return (
    <svg className="head-glyph" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="12" r="6.5" />
      <path d="M4.5 30a11.5 11.5 0 0 1 23 0" />
    </svg>
  );
}

/** Where a zoomed spot should sit: high enough to clear the sheet below it. */
const FOCUS_Y = 26;
const ZOOM = 1.45;

/**
 * How much of each end is end zone.
 *
 * The formation spans y 9–91, which would run straight through them, so the
 * lineups are compressed into the ground between. The adapter's coordinates are
 * left alone — they describe a formation, not a canvas — and the mapping lives
 * here because where the paint goes is a display question.
 *
 * Ten yards of a hundred-and-twenty is 8.3%. This runs a little deeper than
 * that because the paint carries the scoreline, and the field can afford it now
 * that the bar above it is gone.
 *
 * Published to CSS as `--endzone` rather than written down again there. The
 * paint, the goal lines and this mapping have to agree or players stand in the
 * end zone, and three copies of one number do not stay agreed.
 */
const END_ZONE = 10;
const onGround = (y: number) => END_ZONE + (y / 100) * (100 - END_ZONE * 2);

/**
 * How far the camera may pan before the turf runs out.
 *
 * Centring on a spot near an edge would otherwise pull the field away from that
 * edge and show what's behind it. Panning as far as the ground allows and no
 * further is what a real camera does anyway.
 */
const pan = (from: number, to: number) => {
  const wanted = to - from;
  const most = from * (ZOOM - 1);
  const least = (100 - from) * (1 - ZOOM);
  return Math.max(least, Math.min(most, wanted));
};

interface Placed {
  spot: FieldSpot;
  player: Player | null;
  /** Where to draw it — the opponent's half is this rotated about the centre. */
  at: { x: number; y: number };
  theirs: boolean;
}

/**
 * How a head is coloured: by what they're producing, not by what they play.
 *
 * Position was the old colour code, but the position is already written next to
 * every name, so the colour was saying a second time what the label already
 * said. What it wasn't saying is the thing you actually scan a field for —
 * who's carrying it and who isn't.
 *
 * `unknown` is its own colour rather than yours. Your pick used to wear the
 * team orange, which made "mine" and "not yet known" the same colour on a
 * screen where they are the two most different things.
 */
type Band = 'high' | 'mid' | 'low' | 'unknown';

/**
 * Banded within position across both lineups, never across all of them: seven
 * points is a fine day for a kicker and a wasted one for a quarterback, so a
 * single league-wide ramp would just colour the field by position again.
 */
function bandsFor(figures: { key: string; slot: string; value: number | null }[]): Map<string, Band> {
  const bands = new Map<string, Band>();
  const bySlot = new Map<string, { key: string; value: number }[]>();

  for (const f of figures) {
    if (f.value === null) {
      bands.set(f.key, 'unknown');
      continue;
    }
    const group = bySlot.get(f.slot) ?? [];
    group.push({ key: f.key, value: f.value });
    bySlot.set(f.slot, group);
  }

  for (const group of bySlot.values()) {
    const ranked = [...group].sort((a, b) => b.value - a.value);
    const third = Math.ceil(ranked.length / 3);
    ranked.forEach((entry, i) => {
      bands.set(entry.key, i < third ? 'high' : i < ranked.length - third ? 'mid' : 'low');
    });
  }

  return bands;
}

export function Field({
  entries,
  opponent,
  filled,
  zoomedOn,
  figureFor,
  outcomeFor,
  known,
  revealed,
  reviewable,
  scoreline,
  onSpotTap,
}: FieldProps) {
  /*
   * Both lineups on one pitch. The opponent's is the same formation rotated
   * 180° about the centre, so they face you across the halfway line — which is
   * what a matchup looks like, and it replaces a tab you had to remember to tap.
   */
  const placed: Placed[] = [
    ...entries.map((e) => ({
      spot: e.spot,
      player: e.player,
      at: { x: e.spot.x, y: onGround(e.spot.y) },
      theirs: false,
    })),
    ...opponent.lineup.map((e) => ({
      spot: e.spot,
      player: e.player,
      at: { x: 100 - e.spot.x, y: onGround(100 - e.spot.y) },
      theirs: true,
    })),
  ];

  /*
   * The figure a head is showing, or null when it's showing a question mark.
   * One place, so the colour and the number can never disagree about a player.
   */
  const figureOf = (entry: Placed): number | null => {
    const occupant = entry.player ?? (entry.theirs ? null : (filled.get(entry.spot.id) ?? null));
    if (!occupant) return null;
    const isOpening = !entry.theirs && entry.player === null;
    if (isOpening && !revealed) {
      return known.has(occupant.id) ? outcomeFor(occupant, entry.spot.slot) : null;
    }
    return figureFor(occupant, entry.spot.slot);
  };

  const keyOf = (entry: Placed) => `${entry.theirs ? 'x' : 'o'}-${entry.spot.id}`;
  const bands = bandsFor(
    placed
      .filter((entry) => entry.player ?? (!entry.theirs && filled.has(entry.spot.id)))
      .map((entry) => ({ key: keyOf(entry), slot: entry.spot.slot, value: figureOf(entry) })),
  );

  // The camera has to aim at where a spot is drawn, not where the formation
  // says it is, or a zoom would centre on bare turf a few percent away.
  const focus = zoomedOn ? onGround(zoomedOn.y) : 0;
  const ground = { '--endzone': `${END_ZONE}%` } as React.CSSProperties;
  const camera = zoomedOn
    ? ({
        ...ground,
        '--ox': zoomedOn.x,
        '--oy': focus,
        '--zx': pan(zoomedOn.x, 50),
        '--zy': pan(focus, FOCUS_Y),
        '--zoom': ZOOM,
      } as React.CSSProperties)
    : ground;

  return (
    <div className="pitch">
      <div className="field-frame">
        <div
          className={`field${zoomedOn ? ' is-zoomed' : ''}`}
          style={camera}
          role="group"
          aria-label="The matchup"
        >
          <div className="field-turf" aria-hidden="true" />
          {/* Yard lines belong between the goal lines, not through the paint. */}
          <div className="field-lines" aria-hidden="true" />
          <div className="halfway" aria-hidden="true" />

          {/*
            The end zones. They're what makes this read as a gridiron rather
            than a pitch, and they're also the clearest place to say whose end
            is whose — painted where it is on a real field.
          */}
          {/*
            "Opponent", not the team's initials. The league's names are
            invented, and cutting one to three letters produced things like NIN
            for Ninth Street Storm — a code you can't decipher that names
            nothing you'd recognise. The full name is still a hover away, and
            spelled out in the intro and the result.
          */}
          <div className="endzone is-them">
            {/* Their invented league name is still a hover away, as it was on
                the chip this replaced. */}
            <span className="endzone-word" title={opponent.name}>
              Opponent
            </span>
            <span className="endzone-total">
              {scoreline.theirs.toFixed(1)}
              {scoreline.result === null && <span className="endzone-proj">proj</span>}
            </span>
          </div>
          <div className={`endzone is-you${scoreline.result ? ` is-${scoreline.result}` : ''}`}>
            <span className="endzone-word">You</span>
            {/*
              What you still need, or how it finished — on your own paint, since
              it's the only number here you can do anything about.
            */}
            <span className="endzone-call">
              {scoreline.result ? (
                scoreline.result === 'tied' ? (
                  'Dead heat'
                ) : (
                  <>
                    {scoreline.result === 'won' ? 'Won by' : 'Lost by'}{' '}
                    <strong>{Math.abs(scoreline.margin).toFixed(1)}</strong>
                  </>
                )
              ) : scoreline.need !== null && scoreline.need > 0 ? (
                /*
                  "On projection", and not a rounded figure dressed as a target.
                  Their total up there is a forecast, so this is too — and when
                  they beat it, the play-out opens on a bigger number than this
                  one. Said flat, that reads as the game contradicting itself.
                */
                <>
                  Need <strong>~{scoreline.need.toFixed(1)}</strong> on projection
                </>
              ) : (
                <>
                  Up <strong>{Math.abs(scoreline.need ?? 0).toFixed(1)}</strong> on projection
                </>
              )}
            </span>
            <span className="endzone-total">
              {scoreline.yours.toFixed(1)}
              {scoreline.result === null && <span className="endzone-proj">proj</span>}
            </span>
          </div>

          {/*
            Midfield logo, split across the 50: their colour on their side of it,
            yours on yours. The two halves say which way the field runs without
            another label to read.
          */}
          <div className="midfield" aria-hidden="true">
            <span className="midfield-half is-them" />
            <span className="midfield-half is-you" />
            {/* The same D as the masthead, so midfield carries the game's mark. */}
            <svg className="midfield-mark" viewBox="0 0 32 32">
              <path d="M10 7h6.4c5.4 0 8.6 3.4 8.6 9s-3.2 9-8.6 9H10V7zm5.1 4.3v9.4h1.1c2.7 0 4.2-1.7 4.2-4.7s-1.5-4.7-4.2-4.7h-1.1z" />
            </svg>
          </div>

          {placed.map((entry) => {
            const { spot, player, at, theirs } = entry;
            const chosen = theirs ? null : (filled.get(spot.id) ?? null);
            const occupant = player ?? chosen;
            const isOpening = !theirs && player === null;
            const band = occupant ? (bands.get(keyOf(entry)) ?? 'unknown') : 'unknown';
            const focused = !theirs && zoomedOn?.id === spot.id;

            const classes = [
              'spot',
              theirs ? 'is-theirs' : 'is-ours',
              isOpening ? 'is-opening' : 'is-set',
              occupant ? 'is-filled' : 'is-empty',
              `is-${band}`,
              focused ? 'is-focused' : '',
              zoomedOn && !focused ? 'is-hushed' : '',
              !zoomedOn && isOpening && !occupant ? 'is-active' : '',
              occupant?.status ? `has-${occupant.status.toLowerCase()}` : '',
            ]
              .filter(Boolean)
              .join(' ');

            // Your own unplayed openings while there's a round left, and your
            // own picks again once the day is done and the boards open up.
            const tappable =
              !theirs && isOpening && (!revealed || (reviewable && chosen !== null));

            return (
              <div
                key={`${theirs ? 'x' : 'o'}-${spot.id}`}
                className={classes}
                style={{ left: `${at.x}%`, top: `${at.y}%` }}
              >
                <button
                  type="button"
                  className="spot-head"
                  style={{ '--slot-color': `var(--band-${band})` } as React.CSSProperties}
                  aria-label={
                    occupant
                      ? `${theirs ? opponent.name : 'You'}, ${spot.slot} ${occupant.name}`
                      : `Empty ${spot.slot}`
                  }
                  disabled={!tappable}
                  onClick={() => onSpotTap(spot.id)}
                >
                  {/* Keyed on the occupant so a fresh pick visibly drops into the slot. */}
                  {occupant ? <Head key={occupant.id} /> : <span className="spot-plus">+</span>}

                  {/*
                    A player taken off the wire wears a question mark until the
                    week is played. Everyone else's figure is a projection, and
                    projections were deliberately taken off the wire — printing
                    one over the head you just picked would hand back exactly
                    the number the card refused to show you.
                  */}
                  {occupant &&
                    (isOpening && !revealed ? (
                      /*
                        You already watched this one play, in a round you've
                        finished — so the number is yours to keep. Anyone else
                        in an opening is still the question being asked.
                      */
                      known.has(occupant.id) ? (
                        <span className="spot-figure is-known">
                          {outcomeFor(occupant, spot.slot).toFixed(1)}
                        </span>
                      ) : (
                        <span
                          className="spot-figure is-unknown"
                          aria-label="Unknown until the week is played"
                        >
                          ?
                        </span>
                      )
                    ) : (
                      <span className={`spot-figure${revealed ? ' is-final' : ''}`}>
                        {figureFor(occupant, spot.slot).toFixed(1)}
                      </span>
                    ))}
                </button>

                <span className="spot-name">
                  {/*
                    The position in words. It used to be colour-coded too, which
                    said the same thing twice and spent the field's whole palette
                    doing it — the colours mean production now.
                  */}
                  <span className="spot-pos">{spot.slot}</span>
                  {occupant && <span className="spot-who">{onCard(occupant.name)}</span>}
                  {occupant?.status && (
                    <span className={`spot-status is-${occupant.status.toLowerCase()}`}>
                      {occupant.status}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
