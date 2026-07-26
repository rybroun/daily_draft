import type { MatchupResult } from '../core/types';

interface ScoreBugProps {
  opponentName: string;
  season: number;
  week: number;
  yourTotal: number;
  opponentTotal: number;
  /** Set once the week is played; until then these are projections. */
  result: MatchupResult | null;
  margin: number;
}

/**
 * The scoreline, borrowed from a telecast rather than a dashboard.
 *
 * Underneath it sits the one number this whole game is about: what your
 * openings have to produce between them. It holds still while you pick — it
 * counts only the starters already on the field, so it states the target
 * rather than scoring your answer as you type it.
 */
export function ScoreBug({
  opponentName,
  season,
  week,
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
        </span>

        <span className="bug-team is-them">
          <span className="bug-score">{opponentTotal.toFixed(1)}</span>
          {/* Their name in full is a hover away; three letters of it said nothing. */}
          <span className="bug-chip" title={opponentName}>
            Them
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
            <span className="need-tail">off the wire</span>
          </>
        ) : (
          <>
            <span className="need-verb">Up</span>
            <span className="need-figure">{Math.abs(need).toFixed(1)}</span>
            <span className="need-tail">before the wire</span>
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
