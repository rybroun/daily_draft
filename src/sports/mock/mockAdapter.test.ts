import { describe, expect, it } from 'vitest';
import { SLATE_SIZE, dateKey, puzzleFor } from '../../core/puzzle';
import { scorePick } from '../../core/scoring';
import { mockAdapter } from './mockAdapter';

const everySlot = mockAdapter
  .seasons()
  .flatMap((season) => mockAdapter.slots(season).map((slot) => ({ season, slot })));

describe('mockAdapter', () => {
  it('offers seasons and slots to build puzzles from', () => {
    expect(mockAdapter.seasons().length).toBeGreaterThan(10);
    expect(mockAdapter.slots(mockAdapter.seasons()[0]).length).toBeGreaterThan(1);
  });

  it('always has enough candidates to fill a slate', () => {
    for (const { season, slot } of everySlot) {
      expect(mockAdapter.candidates(season, slot).length).toBeGreaterThanOrEqual(SLATE_SIZE);
    }
  });

  it('returns the same players every time it is asked', () => {
    const { season, slot } = everySlot[7];

    expect(mockAdapter.candidates(season, slot)).toEqual(mockAdapter.candidates(season, slot));
  });

  it('gives every candidate in a slot a distinct id', () => {
    for (const { season, slot } of everySlot) {
      const ids = mockAdapter.candidates(season, slot).map((p) => p.id);

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('gives every candidate the stats its slot displays', () => {
    for (const { season, slot } of everySlot) {
      for (const player of mockAdapter.candidates(season, slot)) {
        for (const key of mockAdapter.statKeys(slot)) {
          expect(typeof player.stats[key]).toBe('number');
        }
      }
    }
  });

  it('shows a stat line naming every stat value', () => {
    const { season, slot } = everySlot[3];
    const player = mockAdapter.candidates(season, slot)[0];

    const line = mockAdapter.formatStatLine(player, slot);

    for (const key of mockAdapter.statKeys(slot)) {
      expect(line).toContain(String(player.stats[key]));
    }
  });

  it('spreads season value so a slate has a real best and worst', () => {
    for (const { season, slot } of everySlot) {
      const values = mockAdapter
        .candidates(season, slot)
        .map((p) => mockAdapter.seasonValue(p, slot));

      expect(Math.max(...values)).toBeGreaterThan(Math.min(...values));
    }
  });

  it('fields a different cast each season', () => {
    const [first, second] = mockAdapter.seasons();
    const slot = mockAdapter.slots(first)[0];

    const a = mockAdapter.candidates(first, slot).map((p) => p.name);
    const b = mockAdapter.candidates(second, slot).map((p) => p.name);

    expect(a).not.toEqual(b);
  });
});

describe('a year of mock puzzles', () => {
  const days = Array.from({ length: 365 }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));

  it('produces a playable, scoreable puzzle every day', () => {
    for (const day of days) {
      const puzzle = puzzleFor(mockAdapter, day);
      const score = scorePick(mockAdapter, puzzle, puzzle.candidates[0].id);

      expect(puzzle.candidates).toHaveLength(SLATE_SIZE);
      expect(score.points).toBeGreaterThanOrEqual(0);
      expect(score.points).toBeLessThanOrEqual(100);
      expect(score.board).toHaveLength(SLATE_SIZE);
    }
  });

  it('rarely repeats the same slate two days running', () => {
    const signatures = days.map((day) => {
      const p = puzzleFor(mockAdapter, day);
      return `${p.season}|${p.slot}|${p.candidates.map((c) => c.id).join(',')}`;
    });

    const repeats = signatures.filter((sig, i) => i > 0 && sig === signatures[i - 1]);

    expect(repeats).toHaveLength(0);
  });
});
