import type { Player, PlayerId } from '../core/types';

interface SlateProps {
  candidates: Player[];
  statLine: (player: Player) => string;
  pickedId: PlayerId | null;
  onPick: (playerId: PlayerId) => void;
}

/** The draft board before the pick: six names, tap one. */
export function Slate({ candidates, statLine, pickedId, onPick }: SlateProps) {
  return (
    <ul className="slate">
      {candidates.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            className="candidate"
            disabled={pickedId !== null}
            aria-pressed={pickedId === player.id}
            onClick={() => onPick(player.id)}
          >
            <span className="candidate-name">{player.name}</span>
            <span className="candidate-team">{player.team}</span>
            <span className="candidate-stats">{statLine(player)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
