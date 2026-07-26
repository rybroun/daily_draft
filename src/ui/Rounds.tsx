import { ROUNDS, OPENINGS_FOR } from '../core/day';
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
 * progress bar. You play all three in order, and the marks are the day's
 * scorecard.
 *
 * Numbered rather than labelled easy/medium/hard. The difficulty is still what
 * the engine searches for, but as a label it was telling the player how hard to
 * find it before they'd looked — and the spot count underneath already says
 * what actually changes between them.
 */
export function Rounds({ current, results }: RoundsProps) {
  return (
    <ol className="rounds">
      {ROUNDS.map((level, i) => {
        const result = results[i];
        const state = result ? `is-${result}` : i === current ? 'is-now' : 'is-todo';
        return (
          <li key={level} className={`round ${state}`}>
            <span className="round-name">Round {i + 1}</span>
            <span className="round-moves">
              {result ? MARK[result] : `${OPENINGS_FOR[level]} spot${OPENINGS_FOR[level] === 1 ? '' : 's'}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
