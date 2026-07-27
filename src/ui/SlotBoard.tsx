import type { Player, SlotResult, StatLine } from '../core/types';
import { StatusTag } from './StatusTag';

/**
 * One opening's board: every candidate that was on that wire, ranked by what
 * the week turned out to be worth.
 *
 * Only ever reachable once all three rounds are played. Shown after round one
 * it would name the best receiver available while you still had two rounds left
 * to pick a receiver — which is the answer, handed over before the question.
 * At the end of the day it's the payoff instead: the whole slate, and what you
 * were choosing between all along.
 */
export function SlotBoard({
  slot,
  statLine,
}: {
  slot: SlotResult;
  statLine: (line: StatLine, player: Player) => string;
}) {
  return (
    <ol className="rows is-board">
      {slot.board.map((entry, i) => {
        const isPick = entry.player.id === slot.picked.player.id;
        const classes = ['row', 'is-result', isPick ? 'is-yours' : '', entry.rank === 1 ? 'is-best' : '']
          .filter(Boolean)
          .join(' ');

        return (
          <li
            key={entry.player.id}
            className={classes}
            // Staggered so the board resolves down the panel instead of
            // appearing at once — the week finishing, not a table loading.
            style={
              {
                '--i': i,
                /*
                  The board is already ordered by what the week was worth and
                  the rank is printed beside every row, so the spine says the
                  same thing a third time. It marks your own pick instead.
                */
                '--spine': isPick ? 'var(--you)' : 'var(--avatar)',
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
                <span className="form-label">Actual</span>
                <span className="form-stats">{statLine(entry.player.outcome, entry.player)}</span>
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
  );
}
