import { useState } from 'react';
import { OPENINGS_FOR, ROUNDS } from '../core/day';
import type { RosterSlot } from '../core/types';
import { Mark } from './Mark';

interface IntroProps {
  season: number;
  week: number;
  /** How the real league stood going in, best first. Empty if the sport can't say. */
  standings: { name: string; detail: string }[];
  /** Who's been best at each position so far. Empty if the sport can't say. */
  leaders: { slot: RosterSlot; players: { name: string; team: string; detail: string }[] }[];
  streak: number;
  onStart: () => void;
}

/** Enough of the table to read the week at a glance, not enough to study. */
const SHOWN = 6;

/**
 * The two cards the day opens on.
 *
 * Split because they answer different questions and were fighting over one
 * screen. The first says what the game is, and mentions no season, week or
 * opponent — none of that means anything until you know what you're being
 * asked to do. The second drops you into the week.
 *
 * The opponent's name was on the first card and has gone. It's an invented
 * league side, so "you're playing the Ludlow Ramblers" read as though you were
 * supposed to recognise them.
 */
export function Intro({ season, week, standings, leaders, streak, onStart }: IntroProps) {
  const [briefing, setBriefing] = useState(false);
  const top = standings.slice(0, SHOWN);

  if (!briefing) {
    return (
      <div className="intro">
        <div className="intro-card">
          <Mark />

          <p className="intro-eyebrow">Daily Waivers</p>
          <h1 className="intro-title">Own the waiver wire.</h1>
          <p className="intro-body">
            A week out of football's past, with holes in your lineup. Five names sit on the
            wire for each one, and all you get is their form so far, who they're about to
            play, and the injury report — never anything from the week itself.
          </p>
          <p className="intro-body">
            Fill the holes and the week plays out. There is always at least one set of picks
            that wins it. The hard part is finding it.
          </p>

          <ol className="intro-rounds">
            {ROUNDS.map((level, i) => (
              <li key={level}>
                <span className="intro-round-name">Round {i + 1}</span>
                <span className="intro-round-spots">
                  {OPENINGS_FOR[level]} spot{OPENINGS_FOR[level] === 1 ? '' : 's'} to fill
                </span>
              </li>
            ))}
          </ol>

          <button type="button" className="kickoff" onClick={() => setBriefing(true)}>
            Get started
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

  return (
    <div className="intro">
      <div className="intro-card is-briefing">
        <p className="intro-eyebrow">
          {season} · Week {week}
        </p>
        <h1 className="intro-title">Where the season stood.</h1>

        {/*
          You're being dropped into a week years ago with no idea whether it's
          early or late, who's running away with it, or who has collapsed. None
          of this says anything about the five players on the wire — it's the
          furniture of the moment, not a clue.
        */}
        {top.length > 0 && (
          <div className="intro-block">
            <p className="intro-block-head">Best records going in</p>
            <ol className="intro-table">
              {top.map((row) => (
                <li key={row.name}>
                  <span className="intro-team">{row.name}</span>
                  <span className="intro-record">{row.detail}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {leaders.length > 0 && (
          <div className="intro-block">
            <p className="intro-block-head">Leading their position, per game</p>
            <ul className="intro-leaders">
              {leaders.map((group) => (
                <li key={group.slot}>
                  <span className="intro-slot">{group.slot}</span>
                  <span className="intro-names">
                    {group.players.map((p) => (
                      <span key={p.name} className="intro-leader">
                        {p.name}
                        <span className="intro-leader-figure">{p.detail}</span>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="button" className="kickoff" onClick={onStart}>
          Start round 1
        </button>
      </div>
    </div>
  );
}
