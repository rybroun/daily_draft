import { useCallback, useMemo, useState } from 'react';
import { dateKey } from './core/puzzle';
import type { Difficulty, Player, RosterSlot, StatKey, StatLine } from './core/types';
import { nflAdapter } from './sports/nfl/nflAdapter';
import { PuzzleScreen } from './ui/PuzzleScreen';
import { useGame } from './useGame';

/**
 * The only place a sport is chosen — and swapping the fictional league for the
 * real 2015 NFL season was exactly this one line, which is what the seam was
 * for. `mockAdapter` still exists and the core tests still run against it.
 */
const adapter = nflAdapter;

export default function App() {
  /*
   * Fixed at mount so the puzzle can't change under a player at midnight.
   *
   * `?date=YYYY-MM-DD` plays that day instead. Selection is date-seeded, so any
   * past or future day is already a real puzzle — this just lets you reach one
   * without waiting for it, which is the archive feature in embryo.
   */
  const asked = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('date');
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }, []);
  // Both must be computed unconditionally — a hook behind `??` is a hook that
  // sometimes doesn't run.
  const realToday = useMemo(() => dateKey(new Date()), []);
  const today = asked ?? realToday;
  /*
   * Asking for a difficulty makes it a practice run, the same way an archive
   * date does: the day's real puzzle is the one the date chose, and only that
   * one can build a streak.
   */
  const [chosen, setChosen] = useState<Difficulty | null>(null);
  const game = useGame(adapter, today, chosen, asked === null && chosen === null);

  const statLine = useCallback(
    (line: StatLine, player: Player) => adapter.formatStatLine(line, player.slot),
    [],
  );
  const projectionFor = useCallback(
    (player: Player, slot: RosterSlot) => adapter.projectedValue(player, slot),
    [],
  );
  const outcomeFor = useCallback(
    (player: Player, slot: RosterSlot) => adapter.outcomeValue(player, slot),
    [],
  );
  const colorFor = useCallback((slot: RosterSlot) => adapter.slotColor(slot), []);
  const statKeys = useCallback((slot: RosterSlot) => adapter.statKeys(slot), []);
  const statLabel = useCallback((key: StatKey) => adapter.statLabel(key), []);

  return (
    <PuzzleScreen
      puzzle={game.puzzle}
      picks={game.picks}
      score={game.score}
      streak={game.streak}
      ready={game.ready}
      statLine={statLine}
      statKeys={statKeys}
      statLabel={statLabel}
      projectionFor={projectionFor}
      outcomeFor={outcomeFor}
      colorFor={colorFor}
      difficulty={game.puzzle.difficulty}
      chosen={chosen}
      onChooseDifficulty={setChosen}
      onFill={game.fill}
      onPlayWeek={game.playWeek}
    />
  );
}
