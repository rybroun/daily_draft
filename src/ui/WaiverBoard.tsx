import type { Player, PlayerId, RosterSlot, StatLine } from '../core/types';
import { PlayerRow } from './PlayerRow';

interface WaiverBoardProps {
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
  candidates,
  pickedId,
  projectionFor,
  colorFor,
  statLine,
  onPick,
}: WaiverBoardProps) {
  return (
    <div className="rows">
      {candidates.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          color={colorFor(player.slot)}
          figure={projectionFor(player, player.slot)}
          figureLabel="proj"
          form={player.form}
          statLine={statLine}
          selected={player.id === pickedId}
          onClick={() => onPick(player.id)}
        />
      ))}
    </div>
  );
}
