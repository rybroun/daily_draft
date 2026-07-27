import type { Player, PlayerId, RosterSlot, StatKey, StatLine } from '../core/types';
import { StatusTag } from './StatusTag';

interface WaiverBoardProps {
  candidates: Player[];
  pickedId: PlayerId | null;
  /** Players you've already watched score, in a round you've finished. */
  known: Set<PlayerId>;
  /** What one actually scored. Only ever called for a player in `known`. */
  outcomeFor: (player: Player) => number;
  /** Where that score finished among this wire's five, for `known` players. */
  standingOf: Map<PlayerId, string>;
  statKeys: (slot: RosterSlot) => StatKey[];
  statLabel: (key: StatKey) => string;
  onPick: (playerId: PlayerId) => void;
}

/** The same face that stands on the field, so a row reads as the same person. */
function Head({ player }: { player: Player }) {
  if (player.image) {
    return <img className="pick-face-img" src={player.image} alt="" loading="lazy" decoding="async" />;
  }
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
  known,
  outcomeFor,
  standingOf,
  statKeys,
  statLabel,
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
        return (
          <button
            key={player.id}
            type="button"
            className={`pick${player.id === pickedId ? ' is-picked' : ''}`}
            style={{ '--cols': columns.length } as React.CSSProperties}
            aria-pressed={player.id === pickedId}
            onClick={() => onPick(player.id)}
          >
            <span className="pick-face">
              <Head player={player} />
            </span>

            {/*
              Who they are and who they're about to play, on one line. It used
              to be three: name, then position and club under it, then the
              fixture pushed out to the right margin — which spread five short
              facts across the full width of a phone and made the card taller
              than the numbers that are the point of it.
            */}
            <span className="pick-line">
              <span className="pick-name">
                {player.name}
                {player.status && <StatusTag status={player.status} />}
              </span>
              <span className="pick-pos">{player.slot}</span>
              <span className="pick-team">{player.team}</span>
              {/* Fixture and record travel together, hard against the right. */}
              {player.next && (
                <span className="pick-fixture">
                  <span className="pick-at">{player.next.label}</span>
                  {player.next.detail && (
                    <span className="pick-record">{player.next.detail}</span>
                  )}
                </span>
              )}

              {/*
                What they scored, but only for someone you started in a round
                you've already played and watched play out. It's the one thing
                you carry out of a round, and the reason the wire is worth
                re-reading rather than re-guessing.
              */}
              {known.has(player.id) && (
                <>
                  <span className="pick-scored">{outcomeFor(player).toFixed(1)}</span>
                  {standingOf.has(player.id) && (
                    <span className="pick-standing">{standingOf.get(player.id)}</span>
                  )}
                </>
              )}
            </span>

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
