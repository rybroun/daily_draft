import { OPENINGS_FOR, ROUNDS } from '../core/day';
import { Mark } from './Mark';

interface IntroProps {
  season: number;
  week: number;
  opponentName: string;
  streak: number;
  onStart: () => void;
}

/**
 * The card the day opens on.
 *
 * It exists to say three things before anything else: which week of history
 * you're in, that there are three rounds and they get harder, and that every
 * one of them can be won. That last part is the promise the whole game rests on.
 */
export function Intro({ season, week, opponentName, streak, onStart }: IntroProps) {
  return (
    <div className="intro">
      <div className="intro-card">
        <Mark />

        <p className="intro-eyebrow">
          {season} · Week {week}
        </p>
        <h1 className="intro-title">Three rounds. Each one gets harder.</h1>
        <p className="intro-body">
          You're playing <strong>{opponentName}</strong>. Fill the gaps in your lineup off the
          waiver wire, using nothing but form and the injury report. There is always at least
          one set of picks that wins — the hard part is finding it.
        </p>

        {/*
          Read off the same list the round strip uses rather than written out
          again. Spelled out by hand, this card was still promising "Easy,
          Medium, Hard" long after the game had stopped saying it anywhere else.
        */}
        <ol className="intro-rounds">
          {ROUNDS.map((level, i) => (
            <li key={level}>
              {/* Worded exactly as the round strip words it, since this is a
                  preview of that strip and not a second way of saying it. */}
              <span className="intro-round-name">Round {i + 1}</span>
              <span className="intro-round-spots">
                {OPENINGS_FOR[level]} spot{OPENINGS_FOR[level] === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ol>

        <button type="button" className="kickoff" onClick={onStart}>
          Start round 1
        </button>

        {streak > 0 && (
          <p className="intro-streak">
            {streak} day{streak === 1 ? '' : 's'} in a row. Finish all three to keep it.
          </p>
        )}
      </div>
    </div>
  );
}
