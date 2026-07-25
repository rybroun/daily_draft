import type { FieldSpot, Player, RosterSlot, SportAdapter, SpotId, StatKey } from '../types';

const SPOTS: FieldSpot[] = [
  { id: 'a1', slot: 'SLOT_A', x: 20, y: 20 },
  { id: 'a2', slot: 'SLOT_A', x: 80, y: 20 },
  { id: 'b1', slot: 'SLOT_B', x: 50, y: 50 },
  { id: 'c1', slot: 'SLOT_C', x: 20, y: 80 },
  { id: 'd1', slot: 'SLOT_D', x: 80, y: 80 },
];

const player = (id: string, slot: RosterSlot, outcome: number): Player => ({
  id,
  name: `Player ${id}`,
  team: 'T',
  slot,
  form: [{ label: 'BEFORE', stats: { alpha: outcome / 2 } }],
  outcome: { label: 'WEEK', stats: { alpha: outcome } },
});

/**
 * A deliberately meaningless adapter for core tests.
 *
 * Its slots and stats spell nothing — if a core test only passes against a real
 * sport's vocabulary, that's the bug this fixture is here to catch.
 */
export function stubAdapter(overrides: Partial<SportAdapter> = {}): SportAdapter {
  return {
    id: 'stub',
    displayName: 'Stub',
    seasons: () => [1990, 1991, 1992, 1993],
    weeks: () => [1, 2, 3, 4, 5, 6],
    formation: () => SPOTS,
    openableSlots: () => ['SLOT_A', 'SLOT_B', 'SLOT_C'],
    roster: (_season, week) =>
      new Map<SpotId, Player>(
        SPOTS.map((spot) => [spot.id, player(`starter-${spot.id}-${week}`, spot.slot, 10)]),
      ),
    candidates: (_season, week, slot) =>
      Array.from({ length: 8 }, (_, i) => player(`${slot}-w${week}-${i}`, slot, i * 4)),
    statKeys: (): StatKey[] => ['alpha'],
    formatStatLine: (line) => `${line.label} ${line.stats.alpha}`,
    outcomeValue: (candidate) => candidate.outcome.stats.alpha,
    ...overrides,
  };
}
