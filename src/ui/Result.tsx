import type { Player, Score, SlotResult, StatLine } from '../core/types';

interface ResultProps {
  score: Score;
  statLine: (line: StatLine, player: Player) => string;
}

function verdict(score: Score): string {
  if (score.isPerfect) return 'Perfect week.';
  if (score.points >= 80) return 'About as good as the wire allowed.';
  if (score.points >= 55) return 'A good week, with something left behind.';
  if (score.points >= 25) return 'You left a lot of it on the wire.';
  if (score.points > 0) return 'Almost everything was still on the wire.';
  return 'The worst of both boards.';
}

function explain(slot: SlotResult): string {
  if (slot.picked.rank === 1) {
    return `Nobody on the ${slot.spot.slot} wire beat ${slot.picked.player.name}.`;
  }
  const gap = (slot.best.value - slot.picked.value).toFixed(1);
  return `${slot.best.player.name} would have been ${gap} more.`;
}

/** The reveal: what the week produced, and every alternative that explains it. */
export function Result({ score, statLine }: ResultProps) {
  return (
    <section className="result" aria-live="polite">
      <div className="result-head">
        <p className="result-points">
          {score.points}
          <span className="result-points-of">/100</span>
        </p>
        <div>
          <p className="result-verdict">{verdict(score)}</p>
          <p className="result-why">
            Your two picks scored <strong>{score.total.toFixed(1)}</strong>. The best pair on
            the wire scored <strong>{score.bestPossible.toFixed(1)}</strong>.
          </p>
        </div>
      </div>

      {score.slots.map((slot) => (
        <div key={slot.spot.id} className="slot-result">
          <h2 className="slot-heading">
            {slot.spot.slot} <span className="slot-why">{explain(slot)}</span>
          </h2>

          <ol className="board">
            {slot.board.map((entry) => {
              const isPick = entry.player.id === slot.picked.player.id;
              const classes = [
                'board-row',
                isPick ? 'is-pick' : '',
                entry.rank === 1 ? 'is-best' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li key={entry.player.id} className={classes}>
                  <span className="board-rank">{entry.rank}</span>
                  <span className="board-name">
                    {entry.player.name}
                    <span className="board-team">{entry.player.team}</span>
                    {isPick && <span className="board-tag">yours</span>}
                  </span>
                  {/* One decimal, because two weeks a point apart must not print equal. */}
                  <span className="board-value">{entry.value.toFixed(1)}</span>
                  <span className="board-stats">
                    {statLine(entry.player.outcome, entry.player)}
                  </span>
                  <span
                    className="board-bar"
                    style={{ inlineSize: `${(entry.value / (slot.best.value || 1)) * 100}%` }}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      <p className="board-note">
        Every one of those weeks was hidden when you picked. All you had was the form.
      </p>
    </section>
  );
}
