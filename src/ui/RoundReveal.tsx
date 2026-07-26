import { useEffect, useState } from 'react';
import type { Player, Puzzle, Score, StatLine } from '../core/types';

interface RoundRevealProps {
  puzzle: Puzzle;
  score: Score;
  statLine: (line: StatLine, player: Player) => string;
  colorFor: (slot: string) => string;
  gameNote: (player: Player) => string | null;
  onDone: () => void;
}

/**
 * How long each beat holds.
 *
 * Long enough to read a name and a number, short enough that a three-pick round
 * plays out in about six seconds. The whole game is meant to take a minute.
 */
const BEAT_MS = 1250;

/**
 * The week playing out, one beat at a time.
 *
 * The result used to arrive by quietly re-rendering the scoreline, which is the
 * least interesting way to deliver the only moment the game has. This walks it:
 * what you needed, then each player you picked and what they actually did, then
 * whether it was enough.
 *
 * Tapping anywhere skips ahead a beat, so it never holds anyone up.
 */
export function RoundReveal({
  puzzle,
  score,
  statLine,
  colorFor,
  gameNote,
  onDone,
}: RoundRevealProps) {
  // Beat 0 is the target, then one per pick, then the verdict.
  const beats = score.slots.length + 2;
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (beat >= beats) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setBeat((b) => b + 1), BEAT_MS);
    return () => clearTimeout(timer);
  }, [beat, beats, onDone]);

  const needed = score.opponentTotal - (score.yourTotal - score.total);
  const shown = score.slots.slice(0, Math.max(0, Math.min(beat, score.slots.length)));

  return (
    <div
      className="reveal"
      role="button"
      tabIndex={0}
      aria-label="Skip ahead"
      onClick={() => setBeat((b) => b + 1)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setBeat((b) => b + 1);
      }}
    >
      <div className="reveal-inner">
        <p className="reveal-need">
          <span className="reveal-label">You needed</span>
          <span className="reveal-need-figure">{Math.max(0, needed).toFixed(1)}</span>
          <span className="reveal-label">off the wire</span>
        </p>

        <ul className="reveal-picks">
          {shown.map((slot) => {
            const player = slot.picked.player;
            const note = gameNote(player);
            return (
              <li key={slot.spot.id} className="reveal-pick">
                <span className="reveal-slot" style={{ color: colorFor(slot.spot.slot) }}>
                  {slot.spot.slot}
                </span>
                <span className="reveal-name">{player.name}</span>
                <span className="reveal-points">{slot.picked.value.toFixed(1)}</span>
                <span className="reveal-stats">{statLine(player.outcome, player)}</span>
                {note && <span className="reveal-note">{note}</span>}
              </li>
            );
          })}
        </ul>

        {beat > score.slots.length && (
          <p className={`reveal-verdict is-${score.result}`}>
            {score.result === 'tied'
              ? 'Dead heat'
              : `${score.result === 'won' ? 'Won' : 'Lost'} by ${Math.abs(score.margin).toFixed(1)}`}
          </p>
        )}

        <p className="reveal-skip">
          {beat >= beats - 1 ? 'Tap to continue' : 'Tap to skip'} · {puzzle.season} week{' '}
          {puzzle.week}
        </p>
      </div>
    </div>
  );
}
