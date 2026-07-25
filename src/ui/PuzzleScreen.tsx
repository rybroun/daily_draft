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
import { explainSlot } from './explainSlot';
import { ResultSummary, SlotBoard } from './Result';
import { ScoreBug } from './ScoreBug';
import { Sheet } from './Sheet';
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
  const [openSpotId, setOpenSpotId] = useState<SpotId | null>(null);

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

  const pick = (playerId: PlayerId) => {
    if (openIndex === -1) return;
    onFill(openIndex, playerId);

    // Straight on to whatever is still empty, so the lineup fills in two taps.
    const next = puzzle.openings.findIndex((_, i) => i !== openIndex && picks[i] === null);
    setOpenSpotId(next === -1 ? null : puzzle.openings[next].id);
  };

  return (
    <main className="screen">
      <header className="masthead">
        <p className="masthead-title">Daily Draft</p>
        <p className="masthead-week">{puzzle.season} season</p>
        <p className="streak" title={`Longest streak: ${streak.best}`}>
          {streak.current}
          <span className="streak-label">day{streak.current === 1 ? '' : 's'}</span>
        </p>
      </header>

      <ScoreBug
        opponentName={puzzle.opponent.name}
        week={puzzle.week}
        yourTotal={totals.yours}
        opponentTotal={totals.theirs}
        result={score?.result ?? null}
        margin={score?.margin ?? 0}
      />

      <div className="stage">
        <div className="stage-light" aria-hidden="true" />

        <Field
          entries={puzzle.field}
          opponent={puzzle.opponent}
          side={side}
          onSideChange={(next) => {
            setSide(next);
            setOpenSpotId(null);
          }}
          filled={filled}
          zoomedOn={openSpot}
          figureFor={figureFor}
          revealed={score !== null}
          colorFor={colorFor}
          onSpotTap={(spotId) => setOpenSpotId(spotId === openSpotId ? null : spotId)}
        />

        {score ? (
          <ResultSummary score={score} opponentName={puzzle.opponent.name} />
        ) : (
          <div className="foot">
            <button type="button" className="kickoff" disabled={!ready} onClick={onPlayWeek}>
              {ready ? 'Lock in your lineup' : 'Tap a gap to fill it'}
            </button>
          </div>
        )}

        <Sheet
          open={openSpot !== null}
          title={
            openSpot && (
              <>
                {score ? 'What you passed on at ' : 'Fill your '}
                <strong style={{ color: colorFor(openSpot.slot) }}>{openSpot.slot}</strong>
              </>
            )
          }
          note={
            score && openIndex !== -1
              ? explainSlot(score.slots[openIndex])
              : 'Form to date. Nothing from this week.'
          }
          onClose={() => setOpenSpotId(null)}
        >
          {openSpot &&
            (score ? (
              <SlotBoard slot={score.slots[openIndex]} colorFor={colorFor} statLine={statLine} />
            ) : (
              <WaiverBoard
                candidates={puzzle.waivers.filter((p) => p.slot === openSpot.slot)}
                pickedId={picks[openIndex]}
                projectionFor={projectionFor}
                colorFor={colorFor}
                statLine={statLine}
                onPick={pick}
              />
            ))}
        </Sheet>
      </div>
    </main>
  );
}
