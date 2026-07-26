import type { Player, PlayerId, RosterSlot, StatKey, StatLine } from '../core/types';
import { StatusTag } from './StatusTag';

interface WaiverBoardProps {
  candidates: Player[];
  pickedId: PlayerId | null;
  statKeys: (slot: RosterSlot) => StatKey[];
  statLabel: (key: StatKey) => string;
  colorFor: (slot: RosterSlot) => string;
  onPick: (playerId: PlayerId) => void;
}

/** The same anonymous head that stands on the field, so a row reads as a person. */
function Head() {
  return (
    <svg className="pick-head" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="12" r="6.5" />
      <path d="M4.5 30a11.5 11.5 0 0 1 23 0" />
    </svg>
  );
}

/**
 * The waiver wire for one opening.
 *
 * There is deliberately no projected score here. A projection is the optimal
 * read of everything on this card already computed — show it and the game
 * collapses into "take the biggest number". What's shown instead is what a
 * projection is *made of*: the season line, the recent line, the injury report,
 * and the one game they're about to play with the record of the side they're
 * playing. The synthesis is the player's job; it's the only job.
 */
export function WaiverBoard({
  candidates,
  pickedId,
  statKeys,
  statLabel,
  colorFor,
  onPick,
}: WaiverBoardProps) {
  const columns = candidates.length ? statKeys(candidates[0].slot) : [];

  return (
    <div className="picks">
      {/* Column headings once for the list, rather than repeated on every card. */}
      <div className="picks-head" style={{ '--cols': columns.length } as React.CSSProperties}>
        <span className="pick-cell is-label" />
        {columns.map((key) => (
          <span key={key} className="pick-cell">
            {statLabel(key)}
          </span>
        ))}
      </div>
      {candidates.map((player) => {
        const color = colorFor(player.slot);
        return (
          <button
            key={player.id}
            type="button"
            className={`pick${player.id === pickedId ? ' is-picked' : ''}`}
            style={
              { '--slot-color': color, '--cols': columns.length } as React.CSSProperties
            }
            aria-pressed={player.id === pickedId}
            onClick={() => onPick(player.id)}
          >
            <span className="pick-face">
              <Head />
            </span>

            <span className="pick-who">
              <span className="pick-name">
                {player.name}
                {player.status && <StatusTag status={player.status} />}
              </span>
              <span className="pick-meta">
                <span className="pick-pos" style={{ color }}>
                  {player.slot}
                </span>
                {player.team}
              </span>
            </span>

            {player.next && (
              <span className="pick-next">
                <span className="fixture">{player.next.label}</span>
                {player.next.detail && (
                  <span className="fixture-detail">{player.next.detail}</span>
                )}
              </span>
            )}

            {/* An aligned table, not a run of text — the columns are the point. */}
            <span className="pick-table">
              {player.form.map((line: StatLine) => (
                <span key={line.label} className="pick-row">
                  <span className="pick-cell is-label">{line.label}</span>
                  {columns.map((key) => (
                    <span key={key} className="pick-cell">
                      {line.stats[key] ?? 0}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
