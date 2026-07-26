import { useMemo, useState } from 'react';
import type { StreakState } from '../core/streak';
import type {
  Difficulty,
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
import { explainSlot } from './explainSlot';
import { Mark } from './Mark';
import { ThemeToggle } from './ThemeToggle';
import { DifficultyPicker } from './DifficultyPicker';
import { ResultSummary, SlotBoard } from './Result';
import { ScoreBug } from './ScoreBug';
import { Sheet } from './Sheet';
import { WaiverBoard } from './WaiverBoard';
import { applyTheme, storedTheme } from '../theme';
import type { Theme } from '../theme';

interface PuzzleScreenProps {
  puzzle: Puzzle;
  picks: (PlayerId | null)[];
  score: Score | null;
  streak: StreakState;
  ready: boolean;
  statLine: (line: StatLine, player: Player) => string;
  statKeys: (slot: RosterSlot) => StatKey[];
  statLabel: (key: StatKey) => string;
  projectionFor: (player: Player, slot: RosterSlot) => number;
  outcomeFor: (player: Player, slot: RosterSlot) => number;
  colorFor: (slot: RosterSlot) => string;
  difficulty: Difficulty;
  chosen: Difficulty | null;
  onChooseDifficulty: (difficulty: Difficulty | null) => void;
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
  statKeys,
  statLabel,
  projectionFor,
  outcomeFor,
  colorFor,
  difficulty,
  chosen,
  onChooseDifficulty,
  onFill,
  onPlayWeek,
}: PuzzleScreenProps) {
  const [openSpotId, setOpenSpotId] = useState<SpotId | null>(null);
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
        <Mark />
        <p className="masthead-title">Daily Draft</p>
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

      <ScoreBug
        opponentName={puzzle.opponent.name}
        season={puzzle.season}
        week={puzzle.week}
        yourTotal={totals.yours}
        opponentTotal={totals.theirs}
        result={score?.result ?? null}
        margin={score?.margin ?? 0}
      />

      <DifficultyPicker
        current={difficulty}
        chosen={chosen}
        onChoose={(next) => {
          onChooseDifficulty(next);
          setOpenSpotId(null);
        }}
        disabled={score !== null}
      />

      <div className="stage">
        <div className="stage-light" aria-hidden="true" />

        <Field
          entries={puzzle.field}
          opponent={puzzle.opponent}
          filled={filled}
          zoomedOn={openSpot}
          figureFor={figureFor}
          revealed={score !== null}
          colorFor={colorFor}
          onSpotTap={(spotId) => setOpenSpotId(spotId === openSpotId ? null : spotId)}
        />

        {score ? (
          <ResultSummary score={score} opponentName={puzzle.opponent.name} lines={puzzle.lines} />
        ) : (
          <div className="foot">
            <button type="button" className="kickoff" disabled={!ready} onClick={onPlayWeek}>
              {ready
                ? 'Lock in your lineup'
                : `Fill your open spot${puzzle.openings.length === 1 ? '' : 's'} to win`}
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
                statKeys={statKeys}
                statLabel={statLabel}
                colorFor={colorFor}
                onPick={pick}
              />
            ))}
        </Sheet>
      </div>
    </main>
  );
}
