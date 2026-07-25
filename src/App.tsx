import { useCallback, useMemo } from 'react';
import { dateKey } from './core/puzzle';
import type { Player, StatLine } from './core/types';
import { mockAdapter } from './sports/mock/mockAdapter';
import { PuzzleScreen } from './ui/PuzzleScreen';
import { useGame } from './useGame';

/**
 * The only place a sport is chosen. Swapping `mockAdapter` for a real one is the
 * whole cost of shipping a sport.
 */
const adapter = mockAdapter;

export default function App() {
  // Fixed at mount so the puzzle can't change under a player at midnight.
  const today = useMemo(() => dateKey(new Date()), []);
  const game = useGame(adapter, today);

  const statLine = useCallback(
    (line: StatLine, player: Player) => adapter.formatStatLine(line, player.slot),
    [],
  );
  const pointsFor = useCallback((player: Player) => adapter.outcomeValue(player, player.slot), []);

  return (
    <PuzzleScreen
      leagueName={adapter.displayName}
      puzzle={game.puzzle}
      picks={game.picks}
      score={game.score}
      streak={game.streak}
      ready={game.ready}
      statLine={statLine}
      pointsFor={pointsFor}
      onFill={game.fill}
      onClear={game.clear}
      onPlayWeek={game.playWeek}
    />
  );
}
