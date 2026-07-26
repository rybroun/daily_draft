import type { Puzzle, SportAdapter } from './types';

/** How many complete line-ups beat the opponent, out of how many exist. */
export interface Lines {
  winning: number;
  total: number;
}

/**
 * Every way this puzzle could have been filled, and how many of them win.
 *
 * This is what makes it a puzzle rather than a wager: a chess problem always
 * has a solution, and the number of solutions *is* the difficulty. One winning
 * line out of a hundred is hard; ten out of twenty-five is not.
 *
 * The count is exhaustive rather than sampled — at five candidates per opening
 * and at most three openings there are 125 line-ups, which is nothing.
 */
export function countWinningLines(adapter: SportAdapter, puzzle: Puzzle): Lines {
  const starters = puzzle.field
    .filter((entry) => entry.player !== null)
    .reduce((sum, entry) => sum + adapter.outcomeValue(entry.player!, entry.spot.slot), 0);

  const opponent = puzzle.opponent.lineup.reduce(
    (sum, entry) => sum + adapter.outcomeValue(entry.player, entry.spot.slot),
    0,
  );

  const pools = puzzle.openings.map((spot) =>
    puzzle.waivers
      .filter((player) => player.slot === spot.slot)
      .map((player) => adapter.outcomeValue(player, spot.slot)),
  );

  let winning = 0;
  let total = 0;
  const walk = (depth: number, running: number) => {
    if (depth === pools.length) {
      total += 1;
      if (starters + running > opponent) winning += 1;
      return;
    }
    for (const value of pools[depth]) walk(depth + 1, running + value);
  };
  walk(0, 0);

  return { winning, total };
}
