import { useMemo } from 'react';
import { dateKey } from './core/puzzle';
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
  const { puzzle, score, streak, pick } = useGame(adapter, today);

  const statLine = useMemo(
    () => (player: Parameters<typeof adapter.formatStatLine>[0]) =>
      adapter.formatStatLine(player, puzzle.slot),
    [puzzle.slot],
  );

  return (
    <PuzzleScreen
      leagueName={adapter.displayName}
      puzzle={puzzle}
      score={score}
      streak={streak}
      statLine={statLine}
      onPick={pick}
    />
  );
}
