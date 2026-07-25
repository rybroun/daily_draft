import { useCallback, useMemo, useState } from 'react';
import { puzzleFor } from './core/puzzle';
import { scorePicks } from './core/scoring';
import { recordPlay } from './core/streak';
import type { StreakState } from './core/streak';
import type { DateKey, PlayerId, Puzzle, Score, SportAdapter } from './core/types';
import { loadGame, saveGame } from './storage/gameStore';
import type { SavedGame } from './storage/gameStore';

export interface Game {
  puzzle: Puzzle;
  /** One entry per opening, `null` while that spot is still empty. */
  picks: (PlayerId | null)[];
  /** Null until the week has been played. */
  score: Score | null;
  streak: StreakState;
  /** True once every opening is filled and the week can be played. */
  ready: boolean;
  fill: (openingIndex: number, playerId: PlayerId) => void;
  clear: (openingIndex: number) => void;
  playWeek: () => void;
}

/**
 * Wires the engine to the browser: today's puzzle, the picks so far, the streak.
 *
 * Every rule lives in `core/` — this only decides when to call it and where the
 * answer is kept.
 */
export function useGame(adapter: SportAdapter, today: DateKey): Game {
  const puzzle = useMemo(() => puzzleFor(adapter, today), [adapter, today]);
  const [saved, setSaved] = useState(() => loadGame(window.localStorage));

  const openings = puzzle.openings.length;

  const picks = useMemo<(PlayerId | null)[]>(() => {
    const stored = saved.picks?.date === today ? saved.picks.playerIds : [];
    return Array.from({ length: openings }, (_, i) => stored[i] ?? null);
  }, [saved.picks, today, openings]);

  const ready = picks.every((pick) => pick !== null);

  // The week is played exactly when the streak is recorded, so one flag does
  // both jobs and there's no second piece of state to fall out of step.
  const played = ready && saved.streak.lastPlayed === today;

  const score = useMemo(() => {
    if (!played) return null;
    try {
      return scorePicks(adapter, puzzle, picks as PlayerId[]);
    } catch {
      // Picks saved against a puzzle we can no longer build aren't worth crashing on.
      return null;
    }
  }, [adapter, puzzle, picks, played]);

  const commit = useCallback(
    (next: SavedGame) => {
      setSaved(next);
      saveGame(window.localStorage, next);
    },
    [],
  );

  const setPicks = useCallback(
    (next: (PlayerId | null)[]) => {
      // Trailing empties are dropped so a half-filled board stores as a short list.
      const filled = [...next];
      while (filled.length > 0 && filled[filled.length - 1] === null) filled.pop();

      commit({
        streak: saved.streak,
        picks: { date: today, playerIds: filled as PlayerId[] },
      });
    },
    [commit, saved.streak, today],
  );

  const fill = useCallback(
    (openingIndex: number, playerId: PlayerId) => {
      if (played) return;
      const next = [...picks];
      next[openingIndex] = playerId;
      setPicks(next);
    },
    [played, picks, setPicks],
  );

  const clear = useCallback(
    (openingIndex: number) => {
      if (played) return;
      const next = [...picks];
      next[openingIndex] = null;
      setPicks(next);
    },
    [played, picks, setPicks],
  );

  const playWeek = useCallback(() => {
    // One week a day. A second tap after the reveal must not restreak.
    if (!ready || played) return;
    commit({
      streak: recordPlay(saved.streak, today),
      picks: { date: today, playerIds: picks as PlayerId[] },
    });
  }, [ready, played, commit, saved.streak, today, picks]);

  return { puzzle, picks, score, streak: saved.streak, ready, fill, clear, playWeek };
}
