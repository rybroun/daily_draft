import { useCallback, useMemo, useState } from 'react';
import { puzzleFor } from './core/puzzle';
import { scorePick } from './core/scoring';
import { recordPlay } from './core/streak';
import type { StreakState } from './core/streak';
import type { DateKey, PlayerId, Puzzle, Score, SportAdapter } from './core/types';
import { loadGame, saveGame } from './storage/gameStore';

export interface Game {
  puzzle: Puzzle;
  /** Null until today's pick is made. */
  score: Score | null;
  streak: StreakState;
  pick: (playerId: PlayerId) => void;
}

/**
 * Wires the engine to the browser: today's puzzle, the saved pick, the streak.
 *
 * Every rule lives in `core/` — this only decides when to call it and where the
 * answer is kept.
 */
export function useGame(adapter: SportAdapter, today: DateKey): Game {
  const puzzle = useMemo(() => puzzleFor(adapter, today), [adapter, today]);
  const [saved, setSaved] = useState(() => loadGame(window.localStorage));

  const pickedId = saved.lastPick?.date === today ? saved.lastPick.playerId : null;

  const score = useMemo(() => {
    if (pickedId === null) return null;
    // A stored pick from a puzzle we can no longer build isn't worth crashing on.
    if (!puzzle.candidates.some((player) => player.id === pickedId)) return null;
    return scorePick(adapter, puzzle, pickedId);
  }, [adapter, puzzle, pickedId]);

  const pick = useCallback(
    (playerId: PlayerId) => {
      // One pick a day. A second tap after the reveal must not restreak.
      if (pickedId !== null) return;

      const next = {
        streak: recordPlay(saved.streak, today),
        lastPick: { date: today, playerId },
      };
      setSaved(next);
      saveGame(window.localStorage, next);
    },
    [pickedId, saved.streak, today],
  );

  return { puzzle, score, streak: saved.streak, pick };
}
