import type {
  FieldSpot,
  Player,
  PlayerId,
  Puzzle,
  RankedPlayer,
  Score,
  SlotResult,
  SportAdapter,
} from './types';

/**
 * Score a set of picks against the openings they were made for.
 *
 * Core never reads a stat. It asks the adapter what each week was worth and only
 * compares those numbers, so the same rule holds for any sport.
 *
 * Points are where the picks landed, together, between the worst possible set
 * and the best possible set. Openings are scored as one decision because that's
 * how the puzzle is posed: fill both, get judged on both.
 */
export function scorePicks(
  adapter: SportAdapter,
  puzzle: Puzzle,
  pickedIds: PlayerId[],
): Score {
  if (pickedIds.length !== puzzle.openings.length) {
    throw new Error(
      `${pickedIds.length} picks for ${puzzle.openings.length} openings on ${puzzle.date}`,
    );
  }

  const slots = puzzle.openings.map((spot, i) => resolve(adapter, puzzle, spot, pickedIds[i]));

  const total = sum(slots.map((slot) => slot.picked.value));
  const bestPossible = sum(slots.map((slot) => slot.best.value));
  const floor = sum(slots.map((slot) => slot.board[slot.board.length - 1].value));

  return {
    slots,
    // No spread means every set of picks was equally right, so none was wrong.
    points:
      bestPossible === floor ? 100 : Math.round(((total - floor) / (bestPossible - floor)) * 100),
    total,
    bestPossible,
    isPerfect: slots.every((slot) => slot.picked.rank === 1),
  };
}

function resolve(
  adapter: SportAdapter,
  puzzle: Puzzle,
  spot: FieldSpot,
  pickedId: PlayerId,
): SlotResult {
  const board = rankBoard(
    adapter,
    puzzle.waivers.filter((player) => player.slot === spot.slot),
    spot,
  );

  const picked = board.find((entry) => entry.player.id === pickedId);
  if (!picked) {
    const onBoard = puzzle.waivers.some((player) => player.id === pickedId);
    throw new Error(
      onBoard
        ? `${pickedId} is not eligible for the ${spot.slot} opening`
        : `${pickedId} is not on the ${puzzle.date} waiver board`,
    );
  }

  return { spot, picked, best: board[0], board };
}

/** The candidates ordered by what their week was actually worth, best first. */
function rankBoard(adapter: SportAdapter, players: Player[], spot: FieldSpot): RankedPlayer[] {
  const valued = players
    .map((player) => ({ player, value: adapter.outcomeValue(player, spot.slot) }))
    .sort((a, b) => b.value - a.value);

  // Competition ranking: equal weeks share a rank, and the next one skips.
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

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
