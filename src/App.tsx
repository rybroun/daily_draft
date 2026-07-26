import { useCallback, useMemo } from 'react';
import { dateKey } from './core/puzzle';
import type { Player, RosterSlot, StatLine } from './core/types';
import { nflAdapter } from './sports/nfl2015/nflAdapter';
import { PuzzleScreen } from './ui/PuzzleScreen';
import { useGame } from './useGame';

/**
 * The only place a sport is chosen — and swapping the fictional league for the
 * real 2015 NFL season was exactly this one line, which is what the seam was
 * for. `mockAdapter` still exists and the core tests still run against it.
 */
const adapter = nflAdapter;

export default function App() {
  // Fixed at mount so the puzzle can't change under a player at midnight.
  const today = useMemo(() => dateKey(new Date()), []);
  const game = useGame(adapter, today);

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

  return (
    <PuzzleScreen
      puzzle={game.puzzle}
      picks={game.picks}
      score={game.score}
      streak={game.streak}
      ready={game.ready}
      statLine={statLine}
      projectionFor={projectionFor}
      outcomeFor={outcomeFor}
      colorFor={colorFor}
      onFill={game.fill}
      onPlayWeek={game.playWeek}
    />
  );
}
