import type { PlayerId, Puzzle, RankedPlayer, Score, SportAdapter } from './types';

/**
 * Score a pick against the slate it was made from.
 *
 * Core never reads a stat. It asks the adapter what each season was worth and
 * only compares those numbers, so the same rule holds for any sport.
 *
 * Points are the pick's position between the worst and the best player on the
 * slate: taking the best is 100, taking the worst is 0. That's deliberately
 * relative — the question the puzzle asks is "who was the best of *these*",
 * not "how good was this season in the abstract".
 */
export function scorePick(
  adapter: SportAdapter,
  puzzle: Puzzle,
  pickedId: PlayerId,
): Score {
  const board = rankBoard(adapter, puzzle);

  const picked = board.find((entry) => entry.player.id === pickedId);
  if (!picked) {
    throw new Error(`${pickedId} is not on the ${puzzle.date} slate`);
  }

  const best = board[0];
  const worst = board[board.length - 1];
  const spread = best.value - worst.value;

  return {
    picked,
    best,
    board,
    // No spread means every choice was equally right, so none of them was wrong.
    points: spread === 0 ? 100 : Math.round(((picked.value - worst.value) / spread) * 100),
    isBest: picked.rank === 1,
    valueBehindBest: best.value - picked.value,
  };
}

/** The slate ordered by what each season was actually worth, best first. */
function rankBoard(adapter: SportAdapter, puzzle: Puzzle): RankedPlayer[] {
  const valued = puzzle.candidates
    .map((player) => ({ player, value: adapter.seasonValue(player, puzzle.slot) }))
    .sort((a, b) => b.value - a.value);

  // Competition ranking: equal seasons share a rank, and the next one skips.
  let rank = 0;
  let previous: number | null = null;
  return valued.map((entry, index) => {
    if (previous === null || entry.value !== previous) {
      rank = index + 1;
      previous = entry.value;
    }
    return { ...entry, rank };
  });
}
