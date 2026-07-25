import type { FieldSpot, Player, PlayerId, RosterSlot, StatLine } from '../core/types';
import { PlayerRow } from './PlayerRow';

interface WaiverBoardProps {
  opening: FieldSpot;
  candidates: Player[];
  pickedId: PlayerId | null;
  projectionFor: (player: Player, slot: RosterSlot) => number;
  colorFor: (slot: RosterSlot) => string;
  statLine: (line: StatLine, player: Player) => string;
  onPick: (playerId: PlayerId) => void;
}

/**
 * The waiver wire for one opening.
 *
 * Every number here is history or derived from it. Nothing on this screen comes
 * from the week being played — that's the game.
 */
export function WaiverBoard({
  opening,
  candidates,
  pickedId,
  projectionFor,
  colorFor,
  statLine,
  onPick,
}: WaiverBoardProps) {
  return (
    <section className="wire">
      <h2 className="wire-heading">
        <span className="wire-title">
          Fill your <strong style={{ color: colorFor(opening.slot) }}>{opening.slot}</strong>
        </span>
        <span className="wire-note">Form to date. Nothing from this week.</span>
      </h2>

      <div className="rows">
        {candidates.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            color={colorFor(player.slot)}
            figure={projectionFor(player, opening.slot)}
            figureLabel="proj"
            form={player.form}
            statLine={statLine}
            selected={player.id === pickedId}
            onClick={() => onPick(player.id)}
          />
        ))}
      </div>
    </section>
  );
}
