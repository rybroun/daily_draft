import type { MatchupResult } from '../core/types';

interface MatchupBarProps {
  opponentName: string;
  yourTotal: number;
  opponentTotal: number;
  /** Set once the week is played; until then these are projections. */
  result: MatchupResult | null;
}

const VERDICT: Record<MatchupResult, string> = {
  won: 'Won',
  lost: 'Lost',
  tied: 'Tied',
};

/**
 * You against them, as one bar.
 *
 * Before kickoff it's projections, which is what makes the waiver decision a
 * decision — you can see how much you need. After, it's the result.
 */
export function MatchupBar({
  opponentName,
  yourTotal,
  opponentTotal,
  result,
}: MatchupBarProps) {
  const combined = yourTotal + opponentTotal;
  const yourShare = combined === 0 ? 50 : (yourTotal / combined) * 100;

  return (
    <section className={`matchup${result ? ` is-${result}` : ''}`}>
      <div className="matchup-teams">
        <div className="matchup-side">
          <p className="matchup-label">You</p>
          <p className="matchup-score">{yourTotal.toFixed(1)}</p>
        </div>

        <p className="matchup-state">
          {result ? VERDICT[result] : 'Projected'}
        </p>

        <div className="matchup-side is-them">
          <p className="matchup-label">{opponentName}</p>
          <p className="matchup-score">{opponentTotal.toFixed(1)}</p>
        </div>
      </div>

      <div className="matchup-bar" aria-hidden="true">
        <span className="matchup-fill" style={{ inlineSize: `${yourShare}%` }} />
      </div>
    </section>
  );
}
