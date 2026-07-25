import { useMemo, useState } from 'react';
import type { StreakState } from '../core/streak';
import type {
  Player,
  PlayerId,
  Puzzle,
  RosterSlot,
  Score,
  SpotId,
  StatLine,
} from '../core/types';
import { Field } from './Field';
import type { Side } from './Field';
import { MatchupBar } from './MatchupBar';
import { Result } from './Result';
import { WaiverBoard } from './WaiverBoard';

interface PuzzleScreenProps {
  puzzle: Puzzle;
  picks: (PlayerId | null)[];
  score: Score | null;
  streak: StreakState;
  ready: boolean;
  statLine: (line: StatLine, player: Player) => string;
  projectionFor: (player: Player, slot: RosterSlot) => number;
  outcomeFor: (player: Player, slot: RosterSlot) => number;
  colorFor: (slot: RosterSlot) => string;
  onFill: (openingIndex: number, playerId: PlayerId) => void;
  onPlayWeek: () => void;
}

export function PuzzleScreen({
  puzzle,
  picks,
  score,
  streak,
  ready,
  statLine,
  projectionFor,
  outcomeFor,
  colorFor,
  onFill,
  onPlayWeek,
}: PuzzleScreenProps) {
  const [side, setSide] = useState<Side>('you');
  const [openIndex, setOpenIndex] = useState(0);

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

  // Before the week the field shows projections; after, what actually happened.
  const figureFor = score ? outcomeFor : projectionFor;

  const totals = useMemo(() => {
    if (score) return { yours: score.yourTotal, theirs: score.opponentTotal };

    const yours = puzzle.field.reduce((sum, entry) => {
      const player = entry.player ?? filled.get(entry.spot.id) ?? null;
      return sum + (player ? projectionFor(player, entry.spot.slot) : 0);
    }, 0);
    const theirs = puzzle.opponent.lineup.reduce(
      (sum, entry) => sum + projectionFor(entry.player, entry.spot.slot),
      0,
    );
    return { yours, theirs };
  }, [score, puzzle, filled, projectionFor]);

  const activeSpot = puzzle.openings[openIndex];

  return (
    <main className="screen">
      <header className="masthead">
        <p className="masthead-title">daily draft</p>
        <p className="masthead-week">
          {puzzle.season} · Week {puzzle.week}
        </p>
        <p className="streak" title={`Longest streak: ${streak.best}`}>
          <span className="streak-mark" aria-hidden="true">
            ▲
          </span>
          {streak.current}
        </p>
      </header>

      <MatchupBar
        opponentName={puzzle.opponent.name}
        yourTotal={totals.yours}
        opponentTotal={totals.theirs}
        result={score?.result ?? null}
      />

      <Field
        entries={puzzle.field}
        opponent={puzzle.opponent}
        side={side}
        onSideChange={setSide}
        filled={filled}
        activeSpotId={score || side === 'them' ? null : activeSpot.id}
        figureFor={figureFor}
        revealed={score !== null}
        colorFor={colorFor}
        onSpotTap={(spotId) => {
          const index = puzzle.openings.findIndex((spot) => spot.id === spotId);
          if (index !== -1) setOpenIndex(index);
        }}
      />

      {score ? (
        <Result
          score={score}
          opponentName={puzzle.opponent.name}
          colorFor={colorFor}
          statLine={statLine}
        />
      ) : (
        <>
          <WaiverBoard
            opening={activeSpot}
            candidates={puzzle.waivers.filter((p) => p.slot === activeSpot.slot)}
            pickedId={picks[openIndex]}
            projectionFor={projectionFor}
            colorFor={colorFor}
            statLine={statLine}
            onPick={(playerId) => {
              onFill(openIndex, playerId);
              // Move to whatever is still empty, so two taps fills the lineup.
              const next = puzzle.openings.findIndex((_, i) => i !== openIndex && picks[i] === null);
              if (next !== -1) setOpenIndex(next);
            }}
          />

          <button type="button" className="kickoff" disabled={!ready} onClick={onPlayWeek}>
            {ready ? `Play week ${puzzle.week}` : 'Fill both spots to play the week'}
          </button>
        </>
      )}
    </main>
  );
}
