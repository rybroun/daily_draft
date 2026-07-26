import { useState } from 'react';
import { OPENINGS_FOR, ROUNDS } from '../core/day';
import type { RosterSlot } from '../core/types';
import { Mark } from './Mark';

interface IntroProps {
  season: number;
  week: number;
  /** How the real league stood going in, grouped and best first. */
  standings: { name: string; group?: string; detail: string }[];
  /** Who's been best at each position so far. Empty if the sport can't say. */
  leaders: { slot: RosterSlot; players: { name: string; team: string; detail: string }[] }[];
  /** What else was true that week, outside the sport. Pure flavour. */
  moment: { label: string; detail: string }[];
  streak: number;
  onStart: () => void;
}

/**
 * One club per division: the leaders, and nothing below them.
 *
 * Football is tracked by division, but eight tables of four is a page, not a
 * card. The top of each is where a fan's eye goes anyway.
 */
function leadEachDivision(table: { name: string; group?: string; detail: string }[]) {
  const seen = new Set<string>();
  return table.filter((row) => {
    if (!row.group || seen.has(row.group)) return false;
    seen.add(row.group);
    return true;
  });
}

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
export function Intro({ season, week, standings, leaders, moment, streak, onStart }: IntroProps) {
  const [briefing, setBriefing] = useState(false);
  const top = leadEachDivision(standings);

  if (!briefing) {
    return (
      <div className="intro">
        <div className="intro-card">
          <Mark />

          <p className="intro-eyebrow">Daily Waivers</p>
          <h1 className="intro-title">Own the waiver wire.</h1>
          {/*
            Two sentences. It ran to two paragraphs explaining what you'd be
            shown and what you wouldn't, which the game itself says the moment
            you open the wire — and reading the manual is not the hook.
          */}
          <p className="intro-body">
            It's a week out of football's past. You're heading into Sunday with holes in
            your lineup and one waiver wire between you and your opponent.
          </p>
          <p className="intro-body is-promise">
            There is always a lineup that wins. Find it.
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
        <h1 className="intro-title is-tight">Where things stood.</h1>

        {/*
          The world outside the sport, first. A date is an abstraction until
          something you remember is attached to it, and the song does that
          faster than any table underneath it can.
        */}
        {moment.length > 0 && (
          <div className="intro-block">
            {moment.map((row) => (
              <p key={row.label} className="intro-moment">
                <span className="intro-moment-label">{row.label}</span>
                <span className="intro-moment-detail">{row.detail}</span>
              </p>
            ))}
          </div>
        )}

        {/*
          You're being dropped into a week years ago with no idea whether it's
          early or late, who's running away with it, or who has collapsed. None
          of this says anything about the five players on the wire — it's the
          furniture of the moment, not a clue.
        */}
        {/*
          One run of chips rather than eight labelled rows. Still every division
          leader — the grouping is what picks the eight — but the division names
          were four rows of furniture around eight facts.
        */}
        {top.length > 0 && (
          <div className="intro-block">
            <p className="intro-block-head">Leading each division</p>
            <ol className="intro-table">
              {top.map((row) => (
                <li key={row.name} title={row.group}>
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
