import type { FieldEntry, Opponent, Player, RosterSlot, SpotId } from '../core/types';

export type Side = 'you' | 'them';

interface FieldProps {
  entries: FieldEntry[];
  opponent: Opponent;
  side: Side;
  onSideChange: (side: Side) => void;
  /** Who the player has slotted into each opening, by spot. */
  filled: Map<SpotId, Player>;
  /** The opening currently being chosen for. */
  activeSpotId: SpotId | null;
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

/**
 * The lineup, laid out where the adapter says each spot belongs.
 *
 * One field, two teams, one tap between them — scanning the opposition is the
 * same act as reading your own side, so it costs nothing to learn.
 */
export function Field({
  entries,
  opponent,
  side,
  onSideChange,
  filled,
  activeSpotId,
  figureFor,
  revealed,
  colorFor,
  onSpotTap,
}: FieldProps) {
  const showing: FieldEntry[] =
    side === 'you' ? entries : opponent.lineup.map((e) => ({ spot: e.spot, player: e.player }));

  return (
    <div className="pitch">
      <div className="sides" role="tablist" aria-label="Which lineup to show">
        {(['you', 'them'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={side === option}
            className={`sides-tab${side === option ? ' is-on' : ''}`}
            onClick={() => onSideChange(option)}
          >
            {option === 'you' ? 'Your lineup' : opponent.name}
          </button>
        ))}
      </div>

      <div className="field" role="group" aria-label={side === 'you' ? 'Your lineup' : opponent.name}>
        <div className="field-turf" aria-hidden="true" />

        {showing.map(({ spot, player }) => {
          const chosen = filled.get(spot.id) ?? null;
          const occupant = player ?? chosen;
          const isOpening = side === 'you' && player === null;
          const color = colorFor(spot.slot);

          const classes = [
            'spot',
            isOpening ? 'is-opening' : 'is-set',
            occupant ? 'is-filled' : 'is-empty',
            spot.id === activeSpotId ? 'is-active' : '',
            occupant?.status ? `has-${occupant.status.toLowerCase()}` : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={spot.id} className={classes} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
              <button
                type="button"
                className="spot-head"
                style={{ '--slot-color': color } as React.CSSProperties}
                aria-label={occupant ? `${spot.slot} ${occupant.name}` : `Empty ${spot.slot}`}
                disabled={!isOpening || revealed}
                onClick={() => onSpotTap(spot.id)}
              >
                {occupant ? <Head /> : <span className="spot-plus">+</span>}
              </button>

              <span className="spot-name">
                {occupant ? onCard(occupant.name) : spot.slot}
                {occupant?.status && <span className={`spot-status is-${occupant.status.toLowerCase()}`}>{occupant.status}</span>}
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
  );
}
