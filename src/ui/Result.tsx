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
 * The margin already sits in the score bug above, so this says the thing the
 * number can't: whether the week was ever yours to win. One you never could
 * have swung is a different experience from one you threw away.
 */
function headline(score: Score, opponentName: string): string {
  if (score.result === 'tied') return `A dead heat with ${opponentName}.`;

  if (score.result === 'won') {
    return score.alreadyDecided
      ? 'Never in doubt. Your picks were spare change.'
      : `Your two picks took it off ${opponentName}.`;
  }

  if (!score.couldHaveWon) return 'Nothing on the wire would have won this one.';
  return 'The points were sitting on the wire.';
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

      {/*
        Your two picks against the best two available, as one bar. The gap is
        the whole judgement, so it's shown as a length rather than a third
        number the reader has to subtract for themselves.
      */}
      <div className="ledger">
        <div className="ledger-row">
          <span className="ledger-label">You took</span>
          <span className="ledger-track">
            <span
              className="ledger-fill is-you"
              style={{ inlineSize: `${(score.total / (score.bestPossible || 1)) * 100}%` }}
            />
          </span>
          <span className="ledger-value">{score.total.toFixed(1)}</span>
        </div>
        <div className="ledger-row">
          <span className="ledger-label">Best there</span>
          <span className="ledger-track">
            <span className="ledger-fill is-best" style={{ inlineSize: '100%' }} />
          </span>
          <span className="ledger-value">{score.bestPossible.toFixed(1)}</span>
        </div>
      </div>

      {score.slots.map((slot) => (
        <div key={slot.spot.id} className="slot-result">
          <h2 className="slot-heading">
            <SlotPill slot={slot.spot.slot} color={colorFor(slot.spot.slot)} />
            <span className="slot-why">{explain(slot)}</span>
          </h2>

          <ol className="rows is-board">
            {slot.board.map((entry, i) => {
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
                <li
                  key={entry.player.id}
                  className={classes}
                  // Staggered so the board resolves down the page instead of
                  // appearing all at once — the week finishing, not a table loading.
                  style={
                    {
                      '--i': i,
                      '--spine': colorFor(entry.player.slot),
                    } as React.CSSProperties
                  }
                >
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
