import type { Player, RosterSlot, Score, SlotResult, StatLine } from '../core/types';
import { SlotPill, StatusTag } from './PlayerRow';

interface ResultProps {
  score: Score;
  opponentName: string;
  colorFor: (slot: RosterSlot) => string;
  statLine: (line: StatLine, player: Player) => string;
}

/**
 * The line that matters most, and the one worth getting right.
 *
 * A week you never could have swung is a different experience from one you
 * threw away, and saying so is the honest answer to the fact that a single week
 * is mostly noise.
 */
function headline(score: Score, opponentName: string): string {
  const margin = Math.abs(score.margin).toFixed(1);

  if (score.result === 'tied') return `Dead heat with ${opponentName}.`;

  if (score.result === 'won') {
    if (score.alreadyDecided) return `Beat ${opponentName} by ${margin} — never in doubt.`;
    return `Beat ${opponentName} by ${margin}.`;
  }

  if (!score.couldHaveWon) return `${opponentName} beat you by ${margin}. Nothing on the wire changed that.`;
  return `Lost to ${opponentName} by ${margin} — and the wire had the points.`;
}

function explain(slot: SlotResult): string {
  if (slot.picked.rank === 1) {
    return `Nobody on the ${slot.spot.slot} wire beat ${slot.picked.player.name}.`;
  }
  const gap = (slot.best.value - slot.picked.value).toFixed(1);
  return `${slot.best.player.name} would have been ${gap} more.`;
}

/** The reveal: what the week produced, and every alternative that explains it. */
export function Result({ score, opponentName, colorFor, statLine }: ResultProps) {
  return (
    <section className="result" aria-live="polite">
      <p className="result-headline">{headline(score, opponentName)}</p>

      <div className="result-meta">
        <span>
          <strong>{score.points}</strong>
          <span className="result-meta-label">pick score</span>
        </span>
        <span>
          <strong>{score.total.toFixed(1)}</strong>
          <span className="result-meta-label">your two picks</span>
        </span>
        <span>
          <strong>{score.bestPossible.toFixed(1)}</strong>
          <span className="result-meta-label">best available</span>
        </span>
      </div>

      {score.slots.map((slot) => (
        <div key={slot.spot.id} className="slot-result">
          <h2 className="slot-heading">
            <SlotPill slot={slot.spot.slot} color={colorFor(slot.spot.slot)} />
            <span className="slot-why">{explain(slot)}</span>
          </h2>

          <ol className="rows is-board">
            {slot.board.map((entry) => {
              const isPick = entry.player.id === slot.picked.player.id;
              const classes = [
                'row',
                'is-result',
                isPick ? 'is-yours' : '',
                entry.rank === 1 ? 'is-best' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li key={entry.player.id} className={classes}>
                  <span className="row-rank">{entry.rank}</span>

                  <span className="row-identity">
                    <span className="row-name">
                      {entry.player.name}
                      {entry.player.status && <StatusTag status={entry.player.status} />}
                      {isPick && <span className="row-yours">yours</span>}
                    </span>
                    <span className="row-team">{entry.player.team}</span>
                  </span>

                  <span className="row-figure">
                    {/* One decimal, because two weeks a point apart must not print equal. */}
                    <span className="row-figure-value">{entry.value.toFixed(1)}</span>
                    <span className="row-figure-label">pts</span>
                  </span>

                  <span className="row-form">
                    <span className="form-line">
                      <span className="form-label">ACTUAL</span>
                      <span className="form-stats">
                        {statLine(entry.player.outcome, entry.player)}
                      </span>
                    </span>
                  </span>

                  <span
                    className="row-bar"
                    style={{ inlineSize: `${(entry.value / (slot.best.value || 1)) * 100}%` }}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      ))}

      <p className="result-note">
        Every one of those weeks was hidden when you picked. All you had was the form and the
        injury report.
      </p>
    </section>
  );
}
