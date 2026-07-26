import { describe, expect, it } from 'vitest';
import { stubAdapter } from './__fixtures__/stubAdapter';
import { scorePicks } from './scoring';
import type { FieldSpot, Player, Puzzle } from './types';

const SPOT_A: FieldSpot = { id: 'a1', slot: 'SLOT_A', x: 0, y: 0 };
const SPOT_B: FieldSpot = { id: 'b1', slot: 'SLOT_B', x: 0, y: 0 };

const candidate = (slot: string, i: number, outcome: number): Player => ({
  id: `${slot}-${i}`,
  name: `Player ${slot}${i}`,
  team: 'T',
  slot,
  form: [{ label: 'BEFORE', stats: { alpha: 0 } }],
  outcome: { label: 'WEEK', stats: { alpha: outcome } },
});

const SPOT_C: FieldSpot = { id: 'c1', slot: 'SLOT_C', x: 0, y: 0 };

/**
 * A two-opening puzzle whose candidates produced exactly the values given.
 *
 * `starters` is what the rest of your lineup produced and `rivals` is what the
 * opponent's whole team produced, both as raw values so a matchup can be set up
 * to land exactly on the margin a test cares about.
 */
const puzzleWith = (
  slotA: number[],
  slotB: number[],
  starters = 0,
  rivals = 0,
): Puzzle => ({
  date: '2026-07-25',
  sportId: 'stub',
  season: 1990,
  week: 4,
  difficulty: 'medium',
  lines: { winning: 1, total: 25 },
  field: [
    { spot: SPOT_A, player: null },
    { spot: SPOT_B, player: null },
    { spot: SPOT_C, player: candidate('SLOT_C', 0, starters) },
  ],
  openings: [SPOT_A, SPOT_B],
  waivers: [
    ...slotA.map((v, i) => candidate('SLOT_A', i, v)),
    ...slotB.map((v, i) => candidate('SLOT_B', i, v)),
  ],
  opponent: {
    name: 'Stub Rivals',
    lineup: [{ spot: SPOT_C, player: candidate('rival', 0, rivals) }],
  },
});

const adapter = stubAdapter();

describe('scorePicks', () => {
  it('gives a perfect score for taking the best at every opening', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50, 30], [4, 8]), ['SLOT_A-1', 'SLOT_B-1']);

    expect(score.points).toBe(100);
    expect(score.isPerfect).toBe(true);
    expect(score.total).toBe(58);
    expect(score.bestPossible).toBe(58);
  });

  it('gives no points for taking the worst at every opening', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50, 30], [4, 8]), ['SLOT_A-0', 'SLOT_B-0']);

    expect(score.points).toBe(0);
    expect(score.isPerfect).toBe(false);
  });

  it('scores the openings together, not one of them', () => {
    // Best at SLOT_A, worst at SLOT_B: half the available ground covered.
    const score = scorePicks(adapter, puzzleWith([0, 100], [0, 100]), ['SLOT_A-1', 'SLOT_B-0']);

    expect(score.points).toBe(50);
    expect(score.total).toBe(100);
    expect(score.bestPossible).toBe(200);
  });

  it('reports each opening separately so both can be explained', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50, 30], [4, 8]), ['SLOT_A-2', 'SLOT_B-0']);

    expect(score.slots).toHaveLength(2);
    expect(score.slots[0].spot.id).toBe('a1');
    expect(score.slots[0].picked.player.id).toBe('SLOT_A-2');
    expect(score.slots[0].picked.rank).toBe(2);
    expect(score.slots[0].best.player.id).toBe('SLOT_A-1');
    expect(score.slots[1].picked.rank).toBe(2);
  });

  it('ranks only the candidates that were eligible for that opening', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50, 30], [4, 8]), ['SLOT_A-0', 'SLOT_B-0']);

    expect(score.slots[0].board.map((r) => r.player.id)).toEqual([
      'SLOT_A-1',
      'SLOT_A-2',
      'SLOT_A-0',
    ]);
    expect(score.slots[1].board).toHaveLength(2);
  });

  it('shares a rank between candidates whose weeks were worth the same', () => {
    const score = scorePicks(adapter, puzzleWith([50, 50, 10], [4, 8]), ['SLOT_A-0', 'SLOT_B-1']);

    expect(score.slots[0].board.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(score.isPerfect).toBe(true);
  });

  it('is perfect when nothing available would have scored more', () => {
    const score = scorePicks(adapter, puzzleWith([40, 40], [8, 8]), ['SLOT_A-1', 'SLOT_B-0']);

    expect(score.points).toBe(100);
    expect(score.isPerfect).toBe(true);
  });

  it('ranks by the adapter, not by any stat core picked out itself', () => {
    const inverted = stubAdapter({ outcomeValue: (p) => -p.outcome.stats.alpha });

    const score = scorePicks(inverted, puzzleWith([10, 50, 30], [4, 8]), [
      'SLOT_A-0',
      'SLOT_B-0',
    ]);

    expect(score.isPerfect).toBe(true);
  });

  it('rejects a pick that is not on the waiver board', () => {
    expect(() =>
      scorePicks(adapter, puzzleWith([10, 50], [4, 8]), ['nobody', 'SLOT_B-0']),
    ).toThrow(/nobody/);
  });

  it('rejects a pick that is not eligible for any opening it was made for', () => {
    expect(() =>
      scorePicks(adapter, puzzleWith([10, 50], [4, 8]), ['SLOT_B-1', 'SLOT_B-0']),
    ).toThrow(/SLOT_A/);
  });

  it('rejects a set of picks that does not fill every opening', () => {
    expect(() => scorePicks(adapter, puzzleWith([10, 50], [4, 8]), ['SLOT_A-0'])).toThrow(
      /openings/i,
    );
  });
});

describe('scorePicks against the opponent', () => {
  it('counts the whole lineup, not only the picks', () => {
    // starters 30 + picks 50 + 8 = 88
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 70), [
      'SLOT_A-1',
      'SLOT_B-1',
    ]);

    expect(score.yourTotal).toBe(88);
    expect(score.total).toBe(58);
    expect(score.opponentTotal).toBe(70);
  });

  it('wins the week when your lineup outscores theirs', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 70), [
      'SLOT_A-1',
      'SLOT_B-1',
    ]);

    expect(score.result).toBe('won');
    expect(score.margin).toBe(18);
  });

  it('loses the week when it does not, and says by how much', () => {
    // starters 30 + worst picks 14 = 44 against 70
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 70), [
      'SLOT_A-0',
      'SLOT_B-0',
    ]);

    expect(score.result).toBe('lost');
    expect(score.margin).toBe(-26);
  });

  it('calls a dead heat a tie rather than a win', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 88), [
      'SLOT_A-1',
      'SLOT_B-1',
    ]);

    expect(score.result).toBe('tied');
    expect(score.margin).toBe(0);
  });

  it('says when the best available picks would have won it', () => {
    // best picks reach 88, worst reach 44; they scored 70.
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 70), [
      'SLOT_A-0',
      'SLOT_B-0',
    ]);

    expect(score.result).toBe('lost');
    expect(score.couldHaveWon).toBe(true);
    expect(score.alreadyDecided).toBe(false);
  });

  it('says when no pick could have won it', () => {
    // even the best picks only reach 88; they scored 200.
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 200), [
      'SLOT_A-1',
      'SLOT_B-1',
    ]);

    expect(score.couldHaveWon).toBe(false);
    expect(score.alreadyDecided).toBe(true);
  });

  it('says when no pick could have lost it', () => {
    // even the worst picks reach 44; they scored 10.
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 10), [
      'SLOT_A-0',
      'SLOT_B-0',
    ]);

    expect(score.result).toBe('won');
    expect(score.alreadyDecided).toBe(true);
  });

  it('does not call a week decided when the picks swung it', () => {
    const score = scorePicks(adapter, puzzleWith([10, 50], [4, 8], 30, 70), [
      'SLOT_A-1',
      'SLOT_B-1',
    ]);

    expect(score.result).toBe('won');
    expect(score.alreadyDecided).toBe(false);
  });

  it('scores the picks on their own merit regardless of the matchup', () => {
    const winnable = scorePicks(adapter, puzzleWith([0, 100], [0, 100], 0, 1), [
      'SLOT_A-1',
      'SLOT_B-0',
    ]);
    const hopeless = scorePicks(adapter, puzzleWith([0, 100], [0, 100], 0, 9999), [
      'SLOT_A-1',
      'SLOT_B-0',
    ]);

    expect(winnable.points).toBe(50);
    expect(hopeless.points).toBe(50);
  });
});
