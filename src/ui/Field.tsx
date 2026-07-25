import type { FieldEntry, FieldSpot, Opponent, Player, RosterSlot, SpotId } from '../core/types';

export type Side = 'you' | 'them';

interface FieldProps {
  entries: FieldEntry[];
  opponent: Opponent;
  side: Side;
  onSideChange: (side: Side) => void;
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
 * edge and show the black behind it. Panning as far as the ground allows and no
 * further is what a real camera does anyway.
 */
const pan = (from: number, to: number) => {
  const wanted = to - from;
  const most = from * (ZOOM - 1);
  const least = (100 - from) * (1 - ZOOM);
  return Math.max(least, Math.min(most, wanted));
};

export function Field({
  entries,
  opponent,
  side,
  onSideChange,
  filled,
  zoomedOn,
  figureFor,
  revealed,
  colorFor,
  onSpotTap,
}: FieldProps) {
  const showing: FieldEntry[] =
    side === 'you' ? entries : opponent.lineup.map((e) => ({ spot: e.spot, player: e.player }));

  /*
   * Push in on the tapped spot: scale about the spot itself so it doesn't slide
   * out from under the finger, then carry it up the frame to make room.
   */
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
      {/* The same two chips as the score bug, so the identities stay learned. */}
      <div className="sides" role="tablist" aria-label="Which lineup to show">
        {(['you', 'them'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={side === option}
            className={`sides-tab is-${option}${side === option ? ' is-on' : ''}`}
            onClick={() => onSideChange(option)}
          >
            {option === 'you' ? 'Your lineup' : opponent.name}
          </button>
        ))}
      </div>

      <div className="field-frame">
        <div
          className={`field${zoomedOn ? ' is-zoomed' : ''}`}
          style={camera}
          role="group"
          aria-label={side === 'you' ? 'Your lineup' : opponent.name}
        >
          <div className="field-turf" aria-hidden="true" />

          {showing.map(({ spot, player }) => {
            const chosen = filled.get(spot.id) ?? null;
            const occupant = player ?? chosen;
            const isOpening = side === 'you' && player === null;
            const color = colorFor(spot.slot);
            const focused = zoomedOn?.id === spot.id;

            const classes = [
              'spot',
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
            // with a board behind it is.
            const tappable = side === 'you' && (isOpening || (revealed && chosen !== null));

            return (
              <div key={spot.id} className={classes} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
                <button
                  type="button"
                  className="spot-head"
                  style={{ '--slot-color': color } as React.CSSProperties}
                  aria-label={occupant ? `${spot.slot} ${occupant.name}` : `Empty ${spot.slot}`}
                  disabled={!tappable}
                  onClick={() => onSpotTap(spot.id)}
                >
                  {occupant ? <Head key={occupant.id} /> : <span className="spot-plus">+</span>}
                </button>

                <span className="spot-name">
                  {occupant ? onCard(occupant.name) : spot.slot}
                  {occupant?.status && (
                    <span className={`spot-status is-${occupant.status.toLowerCase()}`}>
                      {occupant.status}
                    </span>
                  )}
                </span>

                {occupant && (
                  <span className={`spot-figure${revealed ? ' is-final' : ''}`}>
                    {figureFor(occupant, spot.slot).toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
