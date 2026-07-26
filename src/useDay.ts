import { useCallback, useMemo, useState } from 'react';
import { ROUNDS, dayFor } from './core/day';
import { scorePicks } from './core/scoring';
import { recordPlay } from './core/streak';
import type { StreakState } from './core/streak';
import type {
  DateKey,
  Difficulty,
  MatchupResult,
  PlayerId,
  Puzzle,
  Score,
  SportAdapter,
} from './core/types';
import { loadGame, saveGame } from './storage/gameStore';
import type { SavedGame } from './storage/gameStore';

export interface Day {
  /** Which round is on screen: 0, 1 or 2. Stays at 2 once the day is done. */
  round: number;
  difficulty: Difficulty;
  puzzle: Puzzle;
  /** One entry per opening, `null` while that spot is still empty. */
  picks: (PlayerId | null)[];
  /** Null until this round has been played. */
  score: Score | null;
  /** Players you have already watched score, from rounds already played. */
  known: Set<PlayerId>;
  /** How each round finished, in order. `null` for rounds not yet played. */
  results: (MatchupResult | null)[];
  /** False until the intro has been dismissed. */
  started: boolean;
  /** True once all three rounds are played. */
  complete: boolean;
  /** True when this round is played but there's another to come. */
  canAdvance: boolean;
  streak: StreakState;
  start: () => void;
  fill: (openingIndex: number, playerId: PlayerId) => void;
  playRound: () => void;
  nextRound: () => void;
}

/**
 * A day of three rounds: easy, then medium, then hard.
 *
 * Every rule lives in `core/` — this only decides which round you're on and
 * where the answers are kept. The streak advances once, when the third round is
 * played, because the habit being rewarded is finishing the day.
 */
export function useDay(
  adapter: SportAdapter,
  today: DateKey,
  /** False for an archive day, which must not build a streak. */
  countsTowardStreak = true,
): Day {
  const [saved, setSaved] = useState(() => loadGame(window.localStorage));
  const [reviewing, setReviewing] = useState<number | null>(null);

  const day = saved.day?.date === today ? saved.day : null;
  const rounds = useMemo(() => day?.rounds ?? [], [day]);

  const played = rounds.filter((r) => r.locked).length;
  const complete = played >= ROUNDS.length;

  /*
   * The round on screen is the first unplayed one — except just after locking,
   * when it stays on the round you finished so its result can be read.
   */
  const round = reviewing ?? Math.min(played, ROUNDS.length - 1);
  const difficulty = ROUNDS[round];

  // One day, three rounds, one wire — built once and indexed by round.
  const built = useMemo(() => dayFor(adapter, today), [adapter, today]);
  const puzzle = built.rounds[round];

  const openings = puzzle.openings.length;
  const stored = rounds[round];

  /*
   * Answers carry forward. The openings nest and the wire never changes, so the
   * spot you filled in round one is still that spot in round two — and now you
   * know what its five candidates actually did. Keeping your old answer in place
   * makes the choice explicit: stand by it, or use what the reveal told you.
   */
  const picks = useMemo<(PlayerId | null)[]>(
    () =>
      Array.from(
        { length: openings },
        (_, i) => stored?.playerIds[i] ?? rounds[round - 1]?.playerIds[i] ?? null,
      ),
    [stored, openings, rounds, round],
  );

  const ready = picks.every((pick) => pick !== null);
  const locked = stored?.locked === true;

  const score = useMemo(() => {
    if (!locked) return null;
    try {
      return scorePicks(adapter, puzzle, picks as PlayerId[]);
    } catch {
      // Answers saved against a puzzle we can no longer build aren't worth crashing on.
      return null;
    }
  }, [adapter, puzzle, picks, locked]);

  /**
   * Players whose week you have already been shown.
   *
   * Only your own picks from rounds already played. The wire never changes, so
   * a player you started in round one is still on it in rounds two and three —
   * and you watched them score. Everyone else on that wire stays a question
   * mark, which is the whole shape of the day: you leave each round knowing
   * exactly one more number than you did, and nothing about what you passed on.
   */
  const known = useMemo(
    () => new Set(rounds.filter((entry) => entry.locked).flatMap((entry) => entry.playerIds)),
    [rounds],
  );

  /** How each round finished — read back by replaying its own puzzle. */
  const results = useMemo<(MatchupResult | null)[]>(
    () =>
      ROUNDS.map((_level, i) => {
        const entry = rounds[i];
        if (!entry?.locked) return null;
        try {
          return scorePicks(adapter, built.rounds[i], entry.playerIds).result;
        } catch {
          return null;
        }
      }),
    [adapter, built, rounds],
  );

  const commit = useCallback((next: SavedGame) => {
    setSaved(next);
    saveGame(window.localStorage, next);
  }, []);

  const write = useCallback(
    (nextRounds: SavedGame['day'] extends null ? never : { playerIds: PlayerId[]; locked?: boolean }[], streak = saved.streak, started = true) => {
      commit({ streak, day: { date: today, started, rounds: nextRounds } });
    },
    [commit, saved.streak, today],
  );

  const start = useCallback(() => {
    write(rounds, saved.streak, true);
  }, [write, rounds, saved.streak]);

  const fill = useCallback(
    (openingIndex: number, playerId: PlayerId) => {
      if (locked) return;
      const next = [...picks];
      next[openingIndex] = playerId;
      while (next.length > 0 && next[next.length - 1] === null) next.pop();

      const copy = [...rounds];
      copy[round] = { playerIds: next as PlayerId[] };
      write(copy);
    },
    [locked, picks, rounds, round, write],
  );

  const playRound = useCallback(() => {
    if (!ready || locked) return;
    const copy = [...rounds];
    copy[round] = { playerIds: picks as PlayerId[], locked: true };

    // The streak is for finishing the day, so it moves on the last round only.
    const finishing = copy.filter((r) => r.locked).length >= ROUNDS.length;
    write(copy, finishing && countsTowardStreak ? recordPlay(saved.streak, today) : saved.streak);
    setReviewing(round);
  }, [ready, locked, rounds, round, picks, write, countsTowardStreak, saved.streak, today]);

  const nextRound = useCallback(() => setReviewing(null), []);

  return {
    round,
    difficulty,
    puzzle,
    picks,
    score,
    known,
    results,
    started: day?.started === true,
    complete,
    canAdvance: locked && round < ROUNDS.length - 1,
    streak: saved.streak,
    start,
    fill,
    playRound,
    nextRound,
  };
}
