import { useCallback, useMemo, useState } from 'react';
import { puzzleFor } from './core/puzzle';
import { scorePicks } from './core/scoring';
import { recordPlay } from './core/streak';
import type { StreakState } from './core/streak';
import type { DateKey, Difficulty, PlayerId, Puzzle, Score, SportAdapter } from './core/types';
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
export function useGame(
  adapter: SportAdapter,
  today: DateKey,
  /** Ask for a difficulty; null for whatever the day chose. */
  asked: Difficulty | null,
  /** False for an archive day or a practice difficulty — neither may streak. */
  countsTowardStreak = true,
): Game {
  const puzzle = useMemo(() => puzzleFor(adapter, today, asked ?? undefined), [adapter, today, asked]);
  const [saved, setSaved] = useState(() => loadGame(window.localStorage));

  const openings = puzzle.openings.length;

  /*
   * Picks belong to a date *and* a difficulty. Switching difficulty gives a
   * different puzzle with a different number of openings, so yesterday's answer
   * to a different question must not be carried into it.
   */
  const mine =
    saved.picks?.date === today && saved.picks.difficulty === puzzle.difficulty
      ? saved.picks
      : null;

  const picks = useMemo<(PlayerId | null)[]>(
    () => Array.from({ length: openings }, (_, i) => mine?.playerIds[i] ?? null),
    [mine, openings],
  );

  const ready = picks.every((pick) => pick !== null);

  /*
   * Whether the week has been played is its own stored fact rather than being
   * inferred from the streak. Inferring it meant an archive day — which must
   * not build a streak — could never show its result either.
   */
  const played = ready && mine?.locked === true;

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
        picks: { date: today, difficulty: puzzle.difficulty, playerIds: filled as PlayerId[] },
      });
    },
    [commit, saved.streak, today, puzzle.difficulty],
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
      streak: countsTowardStreak ? recordPlay(saved.streak, today) : saved.streak,
      picks: {
        date: today,
        difficulty: puzzle.difficulty,
        playerIds: picks as PlayerId[],
        locked: true,
      },
    });
  }, [ready, played, commit, saved.streak, today, picks, countsTowardStreak, puzzle.difficulty]);

  return { puzzle, picks, score, streak: saved.streak, ready, fill, clear, playWeek };
}
