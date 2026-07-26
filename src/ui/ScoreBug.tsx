import type { Difficulty, MatchupResult } from '../core/types';

interface ScoreBugProps {
  opponentName: string;
  season: number;
  week: number;
  difficulty: Difficulty;
  yourTotal: number;
  opponentTotal: number;
  /** Set once the week is played; until then these are projections. */
  result: MatchupResult | null;
  margin: number;
}

/** Broadcast shorthand: a manager's team becomes three letters on a chip. */
const code = (name: string) => name.split(' ')[0].slice(0, 3).toUpperCase();

/**
 * The scoreline, borrowed from a telecast rather than a dashboard.
 *
 * Underneath it sits the one number this whole game is about: what you still
 * need. It falls as you fill each opening, so the stake of the next pick is
 * never something you have to work out for yourself.
 */
export function ScoreBug({
  opponentName,
  season,
  week,
  difficulty,
  yourTotal,
  opponentTotal,
  result,
  margin,
}: ScoreBugProps) {
  const need = opponentTotal - yourTotal;

  return (
    <section className={`bug${result ? ` is-${result}` : ''}`}>
      <div className="bug-line">
        <span className="bug-team is-you">
          <span className="bug-chip">You</span>
          <span className="bug-score">{yourTotal.toFixed(1)}</span>
        </span>

        {/* When the match is, kept between the two scores where a broadcast puts it. */}
        <span className="bug-when">
          <span className="bug-season">{season}</span>
          <span className="bug-week">Wk {week}</span>
          <span className={`bug-grade is-${difficulty}`}>{difficulty}</span>
        </span>

        <span className="bug-team is-them">
          <span className="bug-score">{opponentTotal.toFixed(1)}</span>
          <span className="bug-chip" title={opponentName}>
            {code(opponentName)}
          </span>
        </span>
      </div>

      <p className="need" aria-live="polite">
        {result ? (
          <>
            <span className="need-verb">{VERB[result]}</span>
            {result !== 'tied' && <span className="need-figure">{Math.abs(margin).toFixed(1)}</span>}
          </>
        ) : need > 0 ? (
          <>
            <span className="need-verb">Need</span>
            <span className="need-figure">{need.toFixed(1)}</span>
            <span className="need-tail">to win</span>
          </>
        ) : (
          <>
            <span className="need-verb">Up</span>
            <span className="need-figure">{Math.abs(need).toFixed(1)}</span>
            <span className="need-tail">on projection</span>
          </>
        )}
      </p>
    </section>
  );
}

const VERB: Record<MatchupResult, string> = {
  won: 'Won by',
  lost: 'Lost by',
  tied: 'Tied',
};
