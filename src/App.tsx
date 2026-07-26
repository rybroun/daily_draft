import { useCallback, useMemo } from 'react';
import { dateKey } from './core/day';
import type { Player, RosterSlot, StatKey, StatLine } from './core/types';
import { nflAdapter } from './sports/nfl/nflAdapter';
import { PuzzleScreen } from './ui/PuzzleScreen';
import { useDay } from './useDay';
import { Intro } from './ui/Intro';

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
  const day = useDay(adapter, today, asked === null);

  const statLine = useCallback(
    (line: StatLine, player: Player) => adapter.formatStatLine(line, player.slot),
    [],
  );
  const outcomeFor = useCallback(
    (player: Player, slot: RosterSlot) => adapter.outcomeValue(player, slot),
    [],
  );
  const gameNote = useCallback(
    (player: Player) =>
      adapter.gameNote?.(player, day.puzzle.season, day.puzzle.week) ?? null,
    [day.puzzle.season, day.puzzle.week],
  );
  const statKeys = useCallback((slot: RosterSlot) => adapter.statKeys(slot), []);
  const statLabel = useCallback((key: StatKey) => adapter.statLabel(key), []);

  if (!day.started) {
    return (
      <Intro
        season={day.puzzle.season}
        week={day.puzzle.week}
        standings={adapter.standings?.(day.puzzle.season, day.puzzle.week) ?? []}
        leaders={adapter.leaders?.(day.puzzle.season, day.puzzle.week) ?? []}
        streak={day.streak.current}
        onStart={day.start}
      />
    );
  }

  return (
    <PuzzleScreen
      puzzle={day.puzzle}
      picks={day.picks}
      score={day.score}
      known={day.known}
      streak={day.streak}
      ready={day.picks.every((p) => p !== null)}
      statLine={statLine}
      statKeys={statKeys}
      statLabel={statLabel}
      outcomeFor={outcomeFor}
      round={day.round}
      results={day.results}
      canAdvance={day.canAdvance}
      complete={day.complete}
      onNextRound={day.nextRound}
      gameNote={gameNote}
      onFill={day.fill}
      onPlayWeek={day.playRound}
    />
  );
}
