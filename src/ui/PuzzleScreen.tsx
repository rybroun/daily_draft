import type { StreakState } from '../core/streak';
import type { Player, PlayerId, Puzzle, Score } from '../core/types';
import { Result } from './Result';
import { Slate } from './Slate';

interface PuzzleScreenProps {
  leagueName: string;
  puzzle: Puzzle;
  score: Score | null;
  streak: StreakState;
  statLine: (player: Player) => string;
  onPick: (playerId: PlayerId) => void;
}

export function PuzzleScreen({
  leagueName,
  puzzle,
  score,
  streak,
  statLine,
  onPick,
}: PuzzleScreenProps) {
  return (
    <main className="screen">
      <header className="masthead">
        <p className="masthead-title">daily draft</p>
        <p className="streak" title={`Longest streak: ${streak.best}`}>
          <span className="streak-flame" aria-hidden="true">
            ▲
          </span>
          {streak.current}
        </p>
      </header>

      <h1 className="prompt">
        <span className="prompt-season">
          {puzzle.season} {leagueName}
        </span>
        <span className="prompt-slot">{puzzle.slot}</span>
      </h1>
      <p className="prompt-sub">
        {score
          ? 'Scored on what they actually did. Come back tomorrow.'
          : 'One slot. Six seasons that really happened. Draft the best one.'}
      </p>

      {/* The result board already lists every candidate, so it replaces the slate. */}
      {score ? (
        <Result score={score} statLine={statLine} />
      ) : (
        <Slate
          candidates={puzzle.candidates}
          statLine={statLine}
          pickedId={null}
          onPick={onPick}
        />
      )}
    </main>
  );
}
