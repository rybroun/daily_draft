import type { FieldEntry, Player, SpotId } from '../core/types';

interface FieldProps {
  entries: FieldEntry[];
  /** Who the player has slotted into each opening, by spot. */
  filled: Map<SpotId, Player>;
  /** The opening currently being chosen for. */
  activeSpotId: SpotId | null;
  /** Set once the week has been played — every head shows what it produced. */
  pointsFor: ((player: Player) => number) | null;
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

/** The lineup, laid out where the adapter says each spot belongs. */
export function Field({ entries, filled, activeSpotId, pointsFor, onSpotTap }: FieldProps) {
  return (
    <div className="field" role="group" aria-label="Your lineup">
      <div className="field-turf" aria-hidden="true" />
      {entries.map(({ spot, player }) => {
        const chosen = filled.get(spot.id) ?? null;
        const occupant = player ?? chosen;
        const isOpening = player === null;
        const isActive = spot.id === activeSpotId;

        const classes = [
          'spot',
          isOpening ? 'is-opening' : 'is-starter',
          occupant ? 'is-filled' : 'is-empty',
          isActive ? 'is-active' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const label = occupant
          ? `${spot.slot} ${occupant.name}`
          : `Empty ${spot.slot}, tap to fill`;

        return (
          <div key={spot.id} className={classes} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
            <button
              type="button"
              className="spot-head"
              aria-label={label}
              disabled={!isOpening || pointsFor !== null}
              onClick={() => onSpotTap(spot.id)}
            >
              {occupant ? <Head /> : <span className="spot-plus">+</span>}
              {/* An empty opening already names its slot below — no need twice. */}
              {occupant && <span className="spot-slot">{spot.slot}</span>}
            </button>
            <span className="spot-name">{occupant ? onCard(occupant.name) : spot.slot}</span>
            {pointsFor && occupant && (
              <span className="spot-points">{pointsFor(occupant).toFixed(1)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
