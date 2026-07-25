import type { Player, Score } from '../core/types';

interface ResultProps {
  score: Score;
  statLine: (player: Player) => string;
}

const ORDINALS = ['', 'Best', 'Second best', 'Third best', 'Fourth best', 'Fifth best'];

function verdict(score: Score): string {
  if (score.isBest) return 'Best on the board.';
  const ordinal = ORDINALS[score.picked.rank];
  return ordinal
    ? `${ordinal} available.`
    : `${score.picked.rank} of ${score.board.length} on the board.`;
}

function explanation(score: Score): string {
  const picked = score.picked.player.name;
  if (score.isBest) {
    return `Nobody on the slate outproduced ${picked}.`;
  }
  const gap = Math.round(score.valueBehindBest);
  return `${score.best.player.name} was worth ${gap} more than ${picked} that season.`;
}

/** The reveal: what the pick scored, and the whole board that explains why. */
export function Result({ score, statLine }: ResultProps) {
  const topValue = score.best.value;

  return (
    <section className="result" aria-live="polite">
      <div className="result-head">
        <p className="result-points">
          {score.points}
          <span className="result-points-of">/100</span>
        </p>
        <div>
          <p className="result-verdict">{verdict(score)}</p>
          <p className="result-why">{explanation(score)}</p>
        </div>
      </div>

      <h2 className="board-heading">How the season actually went</h2>
      <ol className="board">
        {score.board.map((entry) => {
          const isPick = entry.player.id === score.picked.player.id;
          return (
            <li
              key={entry.player.id}
              className={`board-row${isPick ? ' is-pick' : ''}${entry.rank === 1 ? ' is-best' : ''}`}
            >
              <span className="board-rank">{entry.rank}</span>
              <span className="board-name">
                {entry.player.name}
                <span className="board-team">{entry.player.team}</span>
                {isPick && <span className="board-tag">your pick</span>}
              </span>
              <span className="board-stats">{statLine(entry.player)}</span>
              {/* One decimal, because two seasons a point apart must not print equal. */}
              <span className="board-value">{entry.value.toFixed(1)}</span>
              <span
                className="board-bar"
                style={{ inlineSize: `${(entry.value / topValue) * 100}%` }}
              />
            </li>
          );
        })}
      </ol>
      <p className="board-note">
        Value is what that season was worth at this slot — the number the pick is scored on.
      </p>
    </section>
  );
}
