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

        <ol className="intro-rounds">
          <li>
            <span>1</span> Easy — one spot
          </li>
          <li>
            <span>2</span> Medium — two spots
          </li>
          <li>
            <span>3</span> Hard — three spots
          </li>
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
