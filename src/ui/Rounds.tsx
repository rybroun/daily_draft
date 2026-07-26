import { ROUNDS, OPENINGS_FOR } from '../core/puzzle';
import type { MatchupResult } from '../core/types';

interface RoundsProps {
  current: number;
  results: (MatchupResult | null)[];
}

const MARK: Record<MatchupResult, string> = { won: '✓', lost: '✕', tied: '=' };

/**
 * Where you are in the day's three problems.
 *
 * Replaces the difficulty toggle it grew out of: this isn't a setting, it's a
 * progress bar. You play all three, easiest first, and the marks are the day's
 * scorecard.
 */
export function Rounds({ current, results }: RoundsProps) {
  return (
    <ol className="rounds">
      {ROUNDS.map((level, i) => {
        const result = results[i];
        const state = result ? `is-${result}` : i === current ? 'is-now' : 'is-todo';
        return (
          <li key={level} className={`round ${state}`}>
            <span className="round-no">{i + 1}</span>
            <span className="round-name">{level}</span>
            <span className="round-moves">
              {result ? MARK[result] : `${OPENINGS_FOR[level]} spot${OPENINGS_FOR[level] === 1 ? '' : 's'}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
