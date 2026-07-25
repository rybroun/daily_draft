import type { FieldSpot, Player, PlayerId, StatLine } from '../core/types';

interface WaiverBoardProps {
  opening: FieldSpot;
  candidates: Player[];
  pickedId: PlayerId | null;
  statLine: (line: StatLine, player: Player) => string;
  onPick: (playerId: PlayerId) => void;
}

/**
 * The waiver wire for one opening.
 *
 * Every number here is history. Nothing on this screen is from the week being
 * played — that's the game.
 */
export function WaiverBoard({
  opening,
  candidates,
  pickedId,
  statLine,
  onPick,
}: WaiverBoardProps) {
  return (
    <section className="waivers">
      <h2 className="waivers-heading">
        <span>
          Fill your <strong>{opening.slot}</strong>
        </span>
        <span className="waivers-note">form to date · nothing from this week</span>
      </h2>

      <ul className="waiver-list">
        {candidates.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              className={`waiver${player.id === pickedId ? ' is-picked' : ''}`}
              aria-pressed={player.id === pickedId}
              onClick={() => onPick(player.id)}
            >
              <span className="waiver-name">{player.name}</span>
              <span className="waiver-team">{player.team}</span>
              <span className="waiver-form">
                {player.form.map((line) => (
                  <span key={line.label} className="form-line">
                    <span className="form-label">{line.label}</span>
                    <span className="form-stats">{statLine(line, player)}</span>
                  </span>
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
