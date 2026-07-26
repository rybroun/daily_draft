import type { Difficulty } from '../core/types';

interface DifficultyPickerProps {
  /** What the puzzle on screen actually is. */
  current: Difficulty;
  /** Non-null when the player asked for it rather than the date choosing. */
  chosen: Difficulty | null;
  onChoose: (difficulty: Difficulty | null) => void;
  disabled: boolean;
}

const ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const MOVES: Record<Difficulty, string> = { easy: '1 spot', medium: '2 spots', hard: '3 spots' };

/**
 * One, two or three spots to get right.
 *
 * Picking one makes it a practice run. The day's real puzzle is the one the
 * date chose, and only that one builds a streak — otherwise you could shop for
 * an easy day whenever the hard one wasn't going well.
 */
export function DifficultyPicker({
  current,
  chosen,
  onChoose,
  disabled,
}: DifficultyPickerProps) {
  return (
    <div className="grades" role="group" aria-label="Difficulty">
      {ORDER.map((level) => (
        <button
          key={level}
          type="button"
          className={`grade is-${level}${current === level ? ' is-on' : ''}`}
          aria-pressed={current === level}
          disabled={disabled}
          // Tapping the one you're already on hands the day back to the date.
          onClick={() => onChoose(chosen === level ? null : level)}
        >
          {level}
          <span className="grade-moves">{MOVES[level]}</span>
        </button>
      ))}
      {chosen !== null && <span className="grades-note">Practice · no streak</span>}
    </div>
  );
}
