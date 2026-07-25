import type { FieldEntry, FieldSpot, Opponent, Player, RosterSlot, SpotId } from '../core/types';

interface FieldProps {
  entries: FieldEntry[];
  opponent: Opponent;
  /** Who the player has slotted into each opening, by spot. */
  filled: Map<SpotId, Player>;
  /** The spot the camera is pushed in on, if any. */
  zoomedOn: FieldSpot | null;
  /** Before the week this is a projection; after, what they actually did. */
  figureFor: (player: Player, slot: RosterSlot) => number;
  revealed: boolean;
  colorFor: (slot: RosterSlot) => string;
  onSpotTap: (spotId: SpotId) => void;
}

/** Lineup-card style, so a long surname doesn't wrap under its own head. */
const onCard = (name: string) => {
  const [first, ...rest] = name.split(' ');
  return rest.length === 0 ? name : `${first[0]}. ${rest.join(' ')}`;
};

/** Broadcast shorthand: a manager's team becomes three letters. */
const code = (name: string) => name.split(' ')[0].slice(0, 3).toUpperCase();

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

export function Field({
  entries,
  opponent,
  filled,
  zoomedOn,
  figureFor,
  revealed,
  colorFor,
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
      at: { x: e.spot.x, y: e.spot.y },
      theirs: false,
    })),
    ...opponent.lineup.map((e) => ({
      spot: e.spot,
      player: e.player,
      at: { x: 100 - e.spot.x, y: 100 - e.spot.y },
      theirs: true,
    })),
  ];

  const camera = zoomedOn
    ? ({
        '--ox': zoomedOn.x,
        '--oy': zoomedOn.y,
        '--zx': pan(zoomedOn.x, 50),
        '--zy': pan(zoomedOn.y, FOCUS_Y),
        '--zoom': ZOOM,
      } as React.CSSProperties)
    : undefined;

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
          <div className="halfway" aria-hidden="true" />
          <span className="half-tag is-them">{code(opponent.name)}</span>
          <span className="half-tag is-you">You</span>

          {placed.map(({ spot, player, at, theirs }) => {
            const chosen = theirs ? null : (filled.get(spot.id) ?? null);
            const occupant = player ?? chosen;
            const isOpening = !theirs && player === null;
            const color = colorFor(spot.slot);
            const focused = !theirs && zoomedOn?.id === spot.id;

            const classes = [
              'spot',
              theirs ? 'is-theirs' : 'is-ours',
              isOpening ? 'is-opening' : 'is-set',
              occupant ? 'is-filled' : 'is-empty',
              focused ? 'is-focused' : '',
              zoomedOn && !focused ? 'is-hushed' : '',
              !zoomedOn && isOpening && !occupant ? 'is-active' : '',
              occupant?.status ? `has-${occupant.status.toLowerCase()}` : '',
            ]
              .filter(Boolean)
              .join(' ');

            // Before the week only your openings are tappable; after, any spot
            // of yours with a board behind it is.
            const tappable = !theirs && (isOpening || (revealed && chosen !== null));

            return (
              <div
                key={`${theirs ? 'x' : 'o'}-${spot.id}`}
                className={classes}
                style={{ left: `${at.x}%`, top: `${at.y}%` }}
              >
                <button
                  type="button"
                  className="spot-head"
                  style={{ '--slot-color': color } as React.CSSProperties}
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

                  {occupant && (
                    <span className={`spot-figure${revealed ? ' is-final' : ''}`}>
                      {figureFor(occupant, spot.slot).toFixed(1)}
                    </span>
                  )}
                </button>

                <span className="spot-name">
                  {occupant ? onCard(occupant.name) : spot.slot}
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
