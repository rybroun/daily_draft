import { describe, expect, it } from 'vitest';
import { stubAdapter } from './__fixtures__/stubAdapter';
import { scorePick } from './scoring';
import type { Puzzle } from './types';

/** A slate whose candidates are worth exactly the values given, best unknown to core. */
const slate = (values: number[]): Puzzle => ({
  date: '2026-07-25',
  sportId: 'stub',
  season: 1990,
  slot: 'SLOT_A',
  statKeys: ['alpha'],
  candidates: values.map((alpha, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    team: 'T',
    stats: { alpha },
  })),
});

const adapter = stubAdapter();

describe('scorePick', () => {
  it('gives full points for the best player on the slate', () => {
    const score = scorePick(adapter, slate([10, 90, 40]), 'p1');

    expect(score.points).toBe(100);
    expect(score.picked.rank).toBe(1);
    expect(score.isBest).toBe(true);
    expect(score.valueBehindBest).toBe(0);
  });

  it('gives no points for the worst player on the slate', () => {
    const score = scorePick(adapter, slate([10, 90, 40]), 'p0');

    expect(score.points).toBe(0);
    expect(score.picked.rank).toBe(3);
    expect(score.isBest).toBe(false);
  });

  it('scores a middling pick by where it landed between worst and best', () => {
    const score = scorePick(adapter, slate([0, 25, 100]), 'p1');

    expect(score.points).toBe(25);
    expect(score.picked.rank).toBe(2);
    expect(score.valueBehindBest).toBe(75);
  });

  it('names the best available player so the pick can be explained against it', () => {
    const score = scorePick(adapter, slate([10, 90, 40]), 'p0');

    expect(score.best.player.id).toBe('p1');
    expect(score.best.value).toBe(90);
  });

  it('returns the whole slate ranked best first', () => {
    const score = scorePick(adapter, slate([10, 90, 40]), 'p0');

    expect(score.board.map((r) => r.player.id)).toEqual(['p1', 'p2', 'p0']);
    expect(score.board.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('shares a rank between players whose seasons were worth the same', () => {
    const score = scorePick(adapter, slate([50, 50, 10]), 'p0');

    expect(score.board.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(score.isBest).toBe(true);
  });

  it('gives full points when every candidate was worth the same', () => {
    const score = scorePick(adapter, slate([40, 40, 40]), 'p2');

    expect(score.points).toBe(100);
    expect(score.isBest).toBe(true);
  });

  it('ranks by the adapter, not by any stat core picked out itself', () => {
    const inverted = stubAdapter({ seasonValue: (player) => -player.stats.alpha });

    const score = scorePick(inverted, slate([10, 90, 40]), 'p0');

    expect(score.isBest).toBe(true);
    expect(score.board.map((r) => r.player.id)).toEqual(['p0', 'p2', 'p1']);
  });

  it('rejects a pick that is not on the slate', () => {
    expect(() => scorePick(adapter, slate([10, 90]), 'nobody')).toThrow(/nobody/);
  });
});
