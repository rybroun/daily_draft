import { useEffect, useState } from 'react';
import type { Player, Puzzle, Score, StatLine } from '../core/types';

interface RoundRevealProps {
  puzzle: Puzzle;
  score: Score;
  /**
   * The bar you were actually chasing, handed in rather than re-derived.
   *
   * It has to be the same arithmetic the scoreboard did, or the two disagree
   * again — and by the time this renders, the picks it excludes have joined
   * the set of things you know, so recomputing it here would give a different
   * answer from the one you were playing against a second ago.
   */
  need: number;
  statLine: (line: StatLine, player: Player) => string;
  gameNote: (player: Player) => string | null;
  onDone: () => void;
}

/**
 * How long each beat holds.
 *
 * A pick beat carries a name, a number, a stat line and how their real side
 * fared — four things, so it gets longer than the target it opens on. Tapping
 * skips, so this is the pace for someone reading rather than a ceiling.
 */
const OPENING_MS = 1600;
const PICK_MS = 2300;

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
  need,
  statLine,
  gameNote,
  onDone,
}: RoundRevealProps) {
  // Beat 0 is the target, then one per pick, then the verdict.
  const beats = score.slots.length + 2;
  const [beat, setBeat] = useState(0);
  const onVerdict = beat === beats - 1;

  useEffect(() => {
    if (beat >= beats) {
      onDone();
      return;
    }
    /*
     * The verdict is where it stops. It used to time out to the summary a beat
     * later, under a label reading "tap to continue" — so the one line telling
     * you whether you won flashed past on its way somewhere you didn't ask for.
     */
    if (onVerdict) return;
    const timer = setTimeout(() => setBeat((b) => b + 1), beat === 0 ? OPENING_MS : PICK_MS);
    return () => clearTimeout(timer);
  }, [beat, beats, onVerdict, onDone]);

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
        {/*
          What they actually scored comes first, because it is why this number
          is not the one the scoreboard showed while you were picking. That was
          their projection; this is the week.
        */}
        <p className="reveal-need">
          <span className="reveal-theirs">They scored {score.opponentTotal.toFixed(1)}</span>
          <span className="reveal-label">You needed</span>
          <span className="reveal-need-figure">{Math.max(0, need).toFixed(1)}</span>
          <span className="reveal-label">off the wire</span>
        </p>

        <ul className="reveal-picks">
          {shown.map((slot) => {
            const player = slot.picked.player;
            const note = gameNote(player);
            return (
              <li key={slot.spot.id} className="reveal-pick">
                <span className="reveal-slot">{slot.spot.slot}</span>
                <span className="reveal-name">{player.name}</span>
                <span className="reveal-points">{slot.picked.value.toFixed(1)}</span>
                <span className="reveal-stats">{statLine(player.outcome, player)}</span>
                {note && <span className="reveal-note">{note}</span>}
              </li>
            );
          })}
        </ul>

        {beat >= beats - 1 && (
          <>
            <p className={`reveal-verdict is-${score.result}`}>
              {score.result === 'tied'
                ? 'Dead heat'
                : `${score.result === 'won' ? 'Won' : 'Lost'} by ${Math.abs(score.margin).toFixed(1)}`}
            </p>
            {/*
              A week nothing could have swung is a different experience from one
              you threw away, and being told which is fair where being told you
              were wrong is not. This line used to live in the summary panel
              under the field; the panel is gone, the honesty isn't.
            */}
            {score.alreadyDecided && (
              <p className="reveal-decided">This one was over before you picked.</p>
            )}
          </>
        )}

        <p className={`reveal-skip${onVerdict ? ' is-waiting' : ''}`}>
          {onVerdict ? 'Tap to continue' : 'Tap to skip'} · {puzzle.season} week {puzzle.week}
        </p>
      </div>
    </div>
  );
}
