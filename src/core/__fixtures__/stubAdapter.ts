import type { Player, RosterSlot, SportAdapter, StatKey } from '../types';

/**
 * A deliberately meaningless adapter for core tests.
 *
 * Its slots and stats spell nothing — if a core test only passes against a real
 * sport's vocabulary, that's the bug this fixture is here to catch.
 */
export function stubAdapter(overrides: Partial<SportAdapter> = {}): SportAdapter {
  const players = (slot: RosterSlot, count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `${slot}-p${i}`,
      name: `Player ${slot}${i}`,
      team: `T${i % 4}`,
      stats: { alpha: i * 3, beta: 100 - i },
    }));

  return {
    id: 'stub',
    displayName: 'Stub',
    seasons: () => [1990, 1991, 1992, 1993],
    slots: () => ['SLOT_A', 'SLOT_B', 'SLOT_C'],
    statKeys: (): StatKey[] => ['alpha', 'beta'],
    candidates: (_season, slot) => players(slot, 10),
    formatStatLine: (player) => `${player.stats.alpha}/${player.stats.beta}`,
    seasonValue: (player) => player.stats.alpha,
    ...overrides,
  };
}
