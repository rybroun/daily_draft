import { describe, expect, it } from 'vitest';
import { stubAdapter } from './__fixtures__/stubAdapter';
import { OPENINGS, WAIVERS_PER_OPENING, dateKey, puzzleFor } from './puzzle';

describe('dateKey', () => {
  it('formats a date as YYYY-MM-DD in local time', () => {
    expect(dateKey(new Date(1981, 8, 4))).toBe('1981-09-04');
  });
});

describe('puzzleFor', () => {
  const adapter = stubAdapter();
  const days = (count: number) =>
    Array.from({ length: count }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));

  it('returns the same puzzle for the same date', () => {
    const a = puzzleFor(adapter, '2026-07-25');
    const b = puzzleFor(adapter, '2026-07-25');

    expect(b.season).toBe(a.season);
    expect(b.week).toBe(a.week);
    expect(b.openings.map((s) => s.id)).toEqual(a.openings.map((s) => s.id));
    expect(b.waivers.map((p) => p.id)).toEqual(a.waivers.map((p) => p.id));
  });

  it('varies the puzzle across dates', () => {
    const seen = new Set(
      days(60).map((day) => {
        const p = puzzleFor(adapter, day);
        return `${p.season}|${p.week}|${p.waivers.map((c) => c.id).join(',')}`;
      }),
    );

    expect(seen.size).toBeGreaterThan(30);
  });

  it('only ever picks a season and week the adapter offers', () => {
    for (const day of days(40)) {
      const puzzle = puzzleFor(adapter, day);

      expect(adapter.seasons()).toContain(puzzle.season);
      expect(adapter.weeks(puzzle.season)).toContain(puzzle.week);
    }
  });

  it('lays out the whole formation, filled except for the openings', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');

    expect(puzzle.field).toHaveLength(adapter.formation().length);
    expect(puzzle.field.filter((e) => e.player === null)).toHaveLength(OPENINGS);
    for (const entry of puzzle.field) {
      expect(entry.player === null || entry.player.slot === entry.spot.slot).toBe(true);
    }
  });

  it('opens exactly the spots it left empty on the field', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');
    const empty = puzzle.field.filter((e) => e.player === null).map((e) => e.spot.id);

    expect(puzzle.openings.map((s) => s.id).sort()).toEqual(empty.sort());
  });

  it('only ever opens a spot the adapter allows to be opened', () => {
    for (const day of days(40)) {
      for (const opening of puzzleFor(adapter, day).openings) {
        expect(adapter.openableSlots()).toContain(opening.slot);
      }
    }
  });

  it('never opens two spots of the same slot, so each opening is its own choice', () => {
    for (const day of days(40)) {
      const slots = puzzleFor(adapter, day).openings.map((s) => s.slot);

      expect(new Set(slots).size).toBe(slots.length);
    }
  });

  it('stocks the waiver board with eligible candidates for every opening', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');

    expect(puzzle.waivers).toHaveLength(OPENINGS * WAIVERS_PER_OPENING);
    for (const opening of puzzle.openings) {
      const eligible = puzzle.waivers.filter((p) => p.slot === opening.slot);

      expect(eligible).toHaveLength(WAIVERS_PER_OPENING);
    }
  });

  it('draws every waiver candidate from the adapter, without repeats', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');
    const ids = puzzle.waivers.map((p) => p.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const opening of puzzle.openings) {
      const offered = adapter
        .candidates(puzzle.season, puzzle.week, opening.slot)
        .map((p) => p.id);

      for (const player of puzzle.waivers.filter((p) => p.slot === opening.slot)) {
        expect(offered).toContain(player.id);
      }
    }
  });

  it('names the team you have to beat and what they are fielding', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');
    const expected = adapter.opponent(puzzle.season, puzzle.week);

    expect(puzzle.opponent.name).toBe(expected.name);
    expect(puzzle.opponent.lineup.map((e) => e.player.id)).toEqual(
      expected.lineup.map((e) => e.player.id),
    );
  });

  it('fields a different opponent lineup each week', () => {
    const a = puzzleFor(adapter, '2026-07-25');
    const b = adapter.opponent(a.season, a.week + 1);

    expect(a.opponent.lineup.map((e) => e.player.id)).not.toEqual(
      b.lineup.map((e) => e.player.id),
    );
  });

  it('never shows the scored week among the stats a player can see', () => {
    const puzzle = puzzleFor(adapter, '2026-07-25');

    for (const player of puzzle.waivers) {
      for (const line of player.form) {
        expect(line).not.toBe(player.outcome);
        expect(line.label).not.toBe(player.outcome.label);
      }
    }
  });

  it('refuses an adapter with no seasons', () => {
    expect(() => puzzleFor(stubAdapter({ seasons: () => [] }), '2026-07-25')).toThrow(/season/i);
  });

  it('refuses an adapter with no weeks', () => {
    expect(() => puzzleFor(stubAdapter({ weeks: () => [] }), '2026-07-25')).toThrow(/week/i);
  });

  it('refuses a formation without enough openable spots', () => {
    const cramped = stubAdapter({ openableSlots: () => ['SLOT_A'] });

    expect(() => puzzleFor(cramped, '2026-07-25')).toThrow(/openable/i);
  });

  it('refuses a slot with nothing to choose between', () => {
    const bare = stubAdapter({ candidates: () => [] });

    expect(() => puzzleFor(bare, '2026-07-25')).toThrow(/candidate/i);
  });
});
