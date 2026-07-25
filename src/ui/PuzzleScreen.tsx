import { useMemo } from 'react';
import type { StreakState } from '../core/streak';
import type { Player, PlayerId, Puzzle, Score, SpotId, StatLine } from '../core/types';
import { Field } from './Field';
import { Result } from './Result';
import { WaiverBoard } from './WaiverBoard';

interface PuzzleScreenProps {
  leagueName: string;
  puzzle: Puzzle;
  picks: (PlayerId | null)[];
  score: Score | null;
  streak: StreakState;
  ready: boolean;
  statLine: (line: StatLine, player: Player) => string;
  pointsFor: (player: Player) => number;
  onFill: (openingIndex: number, playerId: PlayerId) => void;
  onClear: (openingIndex: number) => void;
  onPlayWeek: () => void;
}

export function PuzzleScreen({
  leagueName,
  puzzle,
  picks,
  score,
  streak,
  ready,
  statLine,
  pointsFor,
  onFill,
  onClear,
  onPlayWeek,
}: PuzzleScreenProps) {
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

  // Work the openings in order; the first still-empty one is what you're filling.
  const activeIndex = picks.findIndex((pick) => pick === null);
  const openIndex = activeIndex === -1 ? puzzle.openings.length - 1 : activeIndex;
  const activeSpot = puzzle.openings[openIndex];

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
        <span className="prompt-slot">Week {puzzle.week}</span>
      </h1>
      <p className="prompt-sub">
        {score
          ? 'The week as it happened. Come back tomorrow.'
          : 'Two holes in your lineup and a waiver wire. Fill them before kickoff.'}
      </p>

      <Field
        entries={puzzle.field}
        filled={filled}
        activeSpotId={score ? null : activeSpot.id}
        pointsFor={score ? pointsFor : null}
        onSpotTap={(spotId) => {
          const index = puzzle.openings.findIndex((spot) => spot.id === spotId);
          if (index !== -1) onClear(index);
        }}
      />

      {score ? (
        <Result score={score} statLine={statLine} />
      ) : (
        <>
          <WaiverBoard
            opening={activeSpot}
            candidates={puzzle.waivers.filter((p) => p.slot === activeSpot.slot)}
            pickedId={picks[openIndex]}
            statLine={statLine}
            onPick={(playerId) => onFill(openIndex, playerId)}
          />

          <button
            type="button"
            className="kickoff"
            disabled={!ready}
            onClick={onPlayWeek}
          >
            {ready ? `Play week ${puzzle.week}` : 'Fill both spots to play the week'}
          </button>
        </>
      )}
    </main>
  );
}
