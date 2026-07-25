import { describe, expect, it } from 'vitest';
import { stubAdapter } from './__fixtures__/stubAdapter';
import { SLATE_SIZE, dateKey, puzzleFor } from './puzzle';

describe('dateKey', () => {
  it('formats a date as YYYY-MM-DD in local time', () => {
    expect(dateKey(new Date(1981, 8, 4))).toBe('1981-09-04');
  });
});

describe('puzzleFor', () => {
  const adapter = stubAdapter();

  it('returns the same puzzle for the same date', () => {
    const a = puzzleFor(adapter, '2026-07-25');
    const b = puzzleFor(adapter, '2026-07-25');

    expect(b.season).toBe(a.season);
    expect(b.slot).toBe(a.slot);
    expect(b.candidates.map((p) => p.id)).toEqual(a.candidates.map((p) => p.id));
  });

  it('varies the puzzle across dates', () => {
    const seen = new Set(
      Array.from({ length: 60 }, (_, i) => {
        const p = puzzleFor(adapter, dateKey(new Date(2026, 0, 1 + i)));
        return `${p.season}|${p.slot}|${p.candidates.map((c) => c.id).join(',')}`;
      }),
    );

    expect(seen.size).toBeGreaterThan(30);
  });

  it('gives two adapters different puzzles on the same date', () => {
    const other = stubAdapter({ id: 'stub-2' });
    const signature = (p: ReturnType<typeof puzzleFor>) =>
      `${p.season}|${p.slot}|${p.candidates.map((c) => c.id).join(',')}`;

    const a = puzzleFor(adapter, '2026-07-25');
    const b = puzzleFor(other, '2026-07-25');

    expect(signature(a)).not.toBe(signature(b));
  });

  it('only ever picks a season and slot the adapter offers', () => {
    for (let i = 0; i < 40; i++) {
      const puzzle = puzzleFor(adapter, dateKey(new Date(2026, 0, 1 + i)));

      expect(adapter.seasons()).toContain(puzzle.season);
      expect(adapter.slots(puzzle.season)).toContain(puzzle.slot);
    }
  });

  it('draws a full slate of distinct candidates from the adapter', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');
    const available = adapter.candidates(puzzle.season, puzzle.slot).map((p) => p.id);

    expect(puzzle.candidates).toHaveLength(SLATE_SIZE);
    expect(new Set(puzzle.candidates.map((p) => p.id)).size).toBe(SLATE_SIZE);
    for (const candidate of puzzle.candidates) {
      expect(available).toContain(candidate.id);
    }
  });

  it('takes every candidate when the adapter offers fewer than a full slate', () => {
    const thin = stubAdapter({
      candidates: () => [
        { id: 'a', name: 'A', team: 'T', stats: { alpha: 1 } },
        { id: 'b', name: 'B', team: 'T', stats: { alpha: 2 } },
      ],
    });

    expect(puzzleFor(thin, '2026-07-25').candidates).toHaveLength(2);
  });

  it('carries the adapter identity and the slot stat keys', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');

    expect(puzzle.sportId).toBe('stub');
    expect(puzzle.date).toBe('2026-07-25');
    expect(puzzle.statKeys).toEqual(adapter.statKeys(puzzle.slot));
  });

  it('refuses a slot with nothing to choose between', () => {
    const empty = stubAdapter({ candidates: () => [] });

    expect(() => puzzleFor(empty, '2026-07-25')).toThrow(/candidate/i);
  });

  it('refuses an adapter with no seasons', () => {
    const empty = stubAdapter({ seasons: () => [] });

    expect(() => puzzleFor(empty, '2026-07-25')).toThrow(/season/i);
  });
});
