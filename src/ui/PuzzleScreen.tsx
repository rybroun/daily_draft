import { useMemo, useState } from 'react';
import type { StreakState } from '../core/streak';
import type {
  MatchupResult,
  Player,
  PlayerId,
  Puzzle,
  RosterSlot,
  Score,
  SpotId,
  StatKey,
  StatLine,
} from '../core/types';
import { Field } from './Field';
import { Mark } from './Mark';
import { ThemeToggle } from './ThemeToggle';
import { Rounds } from './Rounds';
import { SlotBoard } from './SlotBoard';
import { explainSlot } from './explainSlot';
import { RoundReveal } from './RoundReveal';
import { Sheet } from './Sheet';
import { WaiverBoard } from './WaiverBoard';
import { applyTheme, storedTheme } from '../theme';
import type { Theme } from '../theme';

interface PuzzleScreenProps {
  puzzle: Puzzle;
  picks: (PlayerId | null)[];
  score: Score | null;
  /** Players you've already watched score, from rounds already played. */
  known: Set<PlayerId>;
  streak: StreakState;
  ready: boolean;
  statLine: (line: StatLine, player: Player) => string;
  statKeys: (slot: RosterSlot) => StatKey[];
  statLabel: (key: StatKey) => string;
  projectionFor: (player: Player, slot: RosterSlot) => number;
  outcomeFor: (player: Player, slot: RosterSlot) => number;
  colorFor: (slot: RosterSlot) => string;
  round: number;
  results: (MatchupResult | null)[];
  canAdvance: boolean;
  complete: boolean;
  onNextRound: () => void;
  gameNote: (player: Player) => string | null;
  onFill: (openingIndex: number, playerId: PlayerId) => void;
  onPlayWeek: () => void;
}

export function PuzzleScreen({
  puzzle,
  picks,
  score,
  known,
  streak,
  ready,
  statLine,
  statKeys,
  statLabel,
  projectionFor,
  outcomeFor,
  colorFor,
  round,
  results,
  canAdvance,
  complete,
  onNextRound,
  gameNote,
  onFill,
  onPlayWeek,
}: PuzzleScreenProps) {
  const [openSpotId, setOpenSpotId] = useState<SpotId | null>(null);
  /** Non-null while the week is playing out for the round just locked in. */
  const [playingOut, setPlayingOut] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(storedTheme);

  const byId = useMemo(
    () => new Map(puzzle.waivers.map((player) => [player.id, player])),
    [puzzle.waivers],
  );

  const filled = useMemo(() => {
    const map = new Map<SpotId, Player>();
    puzzle.openings.forEach((spot, i) => {
      const player = picks[i] === null ? undefined : byId.get(picks[i]!);
      if (player) map.set(spot.id, player);
    });
    return map;
  }, [puzzle.openings, picks, byId]);

  const openIndex = puzzle.openings.findIndex((spot) => spot.id === openSpotId);
  const openSpot = openIndex === -1 ? null : puzzle.openings[openIndex];

  // Before the week the field shows projections; after, what actually happened.
  const figureFor = score ? outcomeFor : projectionFor;

  /*
   * Before the week, your total counts only the starters already on the field —
   * never the players you took off the wire.
   *
   * It used to include them, so the need figure fell by exactly the pick's
   * projection the moment you made it. That gave the number back by
   * subtraction: fill a spot, watch the figure drop, and you have read the
   * projection the wire card deliberately withholds. Held still, the figure
   * becomes the target instead — the same one the reveal opens on.
   */
  const totals = useMemo(() => {
    if (score) return { yours: score.yourTotal, theirs: score.opponentTotal };

    const yours = puzzle.field.reduce(
      (sum, entry) => sum + (entry.player ? projectionFor(entry.player, entry.spot.slot) : 0),
      0,
    );
    const theirs = puzzle.opponent.lineup.reduce(
      (sum, entry) => sum + projectionFor(entry.player, entry.spot.slot),
      0,
    );
    return { yours, theirs };
  }, [score, puzzle, projectionFor]);

  const pick = (playerId: PlayerId) => {
    if (openIndex === -1) return;
    onFill(openIndex, playerId);

    // Straight on to whatever is still empty, so the lineup fills in two taps.
    const next = puzzle.openings.findIndex((_, i) => i !== openIndex && picks[i] === null);
    setOpenSpotId(next === -1 ? null : puzzle.openings[next].id);
  };

  return (
    <main className="screen">
      {/*
        The mark, which week of history this is, and your streak. The scoreline
        used to sit under this in a bar of its own; it's painted on the end zones
        now, and the field has the height back.
      */}
      <header className="masthead">
        <Mark />
        <p className="masthead-when">
          {puzzle.season} · Wk {puzzle.week}
        </p>
        <span className="masthead-spacer" />
        <ThemeToggle
          theme={theme}
          onToggle={() => {
            const next = theme === 'light' ? 'dark' : 'light';
            applyTheme(next);
            setTheme(next);
          }}
        />
        {/* A streak of nothing isn't a streak, so it says nothing until it is one. */}
        {streak.current > 0 && (
          <p className="streak" title={`Longest streak: ${streak.best}`}>
            {streak.current}
            <span className="streak-label">day streak</span>
          </p>
        )}
      </header>

      <Rounds current={round} results={results} />

      <div className="stage">
        <div className="stage-light" aria-hidden="true" />

        <Field
          entries={puzzle.field}
          opponent={puzzle.opponent}
          filled={filled}
          zoomedOn={openSpot}
          figureFor={figureFor}
          outcomeFor={outcomeFor}
          known={known}
          revealed={score !== null}
          reviewable={complete}
          scoreline={{
            yours: totals.yours,
            theirs: totals.theirs,
            need: score ? null : totals.theirs - totals.yours,
            result: score?.result ?? null,
            margin: score?.margin ?? 0,
          }}
          colorFor={colorFor}
          onSpotTap={(spotId) => setOpenSpotId(spotId === openSpotId ? null : spotId)}
        />

        {/*
          One strip at the foot, whatever state the round is in.

          There used to be a panel here after the week was played: your total
          against the best that had been available, the name of whoever you
          should have taken, and how many line-ups would have won. It squashed
          the field, and worse, it answered the next two rounds. Knowing the
          best score on the wire tells you whether to stand pat or gamble —
          which is the decision the day is made of, so the game shouldn't make
          it for you. What you scored, you saw in the play-out. The rest is
          yours to guess at.
        */}
        <div className="foot">
          {score ? (
            canAdvance ? (
              <button type="button" className="kickoff" onClick={onNextRound}>
                Next round
              </button>
            ) : complete ? (
              <div className="day-done">
                <p className="day-tally">
                  {results.filter((r) => r === 'won').length} of {results.length} today. Come back
                  tomorrow.
                </p>
                {/* The boards are only reachable now, so say so. */}
                <p className="day-hint">Tap any pick to see the whole wire ranked.</p>
              </div>
            ) : null
          ) : (
            <button
              type="button"
              className="kickoff"
              disabled={!ready}
              onClick={() => {
                onPlayWeek();
                setPlayingOut(round);
                setOpenSpotId(null);
              }}
            >
              {ready
                ? 'Lock in your lineup'
                : `Fill your open spot${puzzle.openings.length === 1 ? '' : 's'} to win`}
            </button>
          )}
        </div>

        {/*
          The sheet is the wire while there's a round left to play, and the
          board once there isn't.

          It used to become the board after *every* round, which named the best
          receiver on the wire while you still had two rounds in which to pick a
          receiver. The wire never changes, so that was the answer to the rounds
          you hadn't played yet. Held back until the day is done, it's the payoff
          it was meant to be.
        */}
        {(() => {
          const reviewing = complete && score !== null && openIndex !== -1;
          return (
            <Sheet
              open={openSpot !== null}
              title={
                openSpot && (
                  <>
                    {reviewing ? 'What you passed on at ' : 'Fill your '}
                    <strong style={{ color: colorFor(openSpot.slot) }}>{openSpot.slot}</strong>
                  </>
                )
              }
              note={
                reviewing
                  ? explainSlot(score.slots[openIndex])
                  : /*
                      Your end zone is behind this panel while it's open, and
                      what you need is the one number you're picking against.
                    */
                    `Need ${Math.max(0, totals.theirs - totals.yours).toFixed(1)} off the wire. ` +
                    'Form to date, nothing from this week.'
              }
              onClose={() => setOpenSpotId(null)}
            >
              {openSpot &&
                (reviewing ? (
                  <SlotBoard
                    slot={score.slots[openIndex]}
                    colorFor={colorFor}
                    statLine={statLine}
                  />
                ) : (
                  <WaiverBoard
                    candidates={puzzle.waivers.filter((p) => p.slot === openSpot.slot)}
                    pickedId={picks[openIndex]}
                    known={known}
                    outcomeFor={(player) => outcomeFor(player, player.slot)}
                    statKeys={statKeys}
                    statLabel={statLabel}
                    colorFor={colorFor}
                    onPick={pick}
                  />
                ))}
            </Sheet>
          );
        })()}
      </div>

      {playingOut === round && score && (
        <RoundReveal
          puzzle={puzzle}
          score={score}
          statLine={statLine}
          colorFor={colorFor}
          gameNote={gameNote}
          onDone={() => setPlayingOut(null)}
        />
      )}
    </main>
  );
}
