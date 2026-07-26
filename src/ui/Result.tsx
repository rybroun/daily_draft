import type { MatchupResult, Player, RosterSlot, Score, SlotResult, StatLine } from '../core/types';
import { StatusTag } from './StatusTag';

/**
 * The line that matters most, and the one worth getting right.
 *
 * The margin already sits in the score bug above, so this says the thing the
 * number can't: whether the week was ever yours to win. One you never could
 * have swung is a different experience from one you threw away.
 */
const COUNT = ['no', 'one', 'two', 'three'];

function headline(score: Score, opponentName: string): string {
  // A round can ask for one, two or three picks, so the copy has to count.
  const picks = `your ${COUNT[score.slots.length] ?? score.slots.length} pick${score.slots.length === 1 ? '' : 's'}`;

  if (score.result === 'tied') return `A dead heat with ${opponentName}.`;

  if (score.result === 'won') {
    return score.alreadyDecided
      ? 'Never in doubt. Your picks were spare change.'
      : `${picks[0].toUpperCase()}${picks.slice(1)} took it off ${opponentName}.`;
  }

  // There is no "nothing would have won" case any more: every puzzle is built
  // with at least one winning line, so the points were always there.
  return 'The points were sitting on the wire.';
}

/** The verdict and the ledger — everything that fits beside the field. */
/** How narrow the way through was, said plainly. */
function solutions(score: Score, lines: { winning: number; total: number }): string {
  const { winning, total } = lines;
  if (score.result === 'won') {
    return winning === 1
      ? `You found the only line-up that won, out of ${total}.`
      : `One of ${winning} winning line-ups out of ${total}.`;
  }
  return winning === 1
    ? `Exactly one line-up out of ${total} would have won it.`
    : `${winning} of ${total} line-ups would have won it.`;
}

export function ResultSummary({
  score,
  opponentName,
  lines,
  canAdvance,
  complete,
  results,
  onNext,
}: {
  score: Score;
  opponentName: string;
  lines: { winning: number; total: number };
  canAdvance: boolean;
  complete: boolean;
  results: (MatchupResult | null)[];
  onNext: () => void;
}) {
  const won = results.filter((r) => r === 'won').length;
  return (
    <section className="result" aria-live="polite">
      <p className="result-headline">{headline(score, opponentName)}</p>

      {/*
        Your picks against the best available, as one bar. The gap is
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

      {/*
        The count is the whole chess-puzzle claim made good: there was always a
        way through, and this is how narrow it was.
      */}
      <p className="result-lines">{solutions(score, lines)}</p>
      {canAdvance ? (
        <button type="button" className="kickoff" onClick={onNext}>
          Next round
        </button>
      ) : complete ? (
        <p className="result-day">
          {won} of {results.length} today. Come back tomorrow.
        </p>
      ) : null}

      <p className="result-hint">Tap a pick to see what you passed on.</p>
    </section>
  );
}

/** One opening's board, shown in the sheet once the week has been played. */
export function SlotBoard({
  slot,
  colorFor,
  statLine,
}: {
  slot: SlotResult;
  colorFor: (slot: RosterSlot) => string;
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
