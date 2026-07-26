import { beforeEach, describe, expect, it } from 'vitest';
import { emptyStreak, recordPlay } from '../core/streak';
import { STORAGE_KEY, loadGame, saveGame } from './gameStore';
import type { SavedGame } from './gameStore';

/** A stand-in for `localStorage` we can corrupt and break on purpose. */
class FakeStorage {
  private data = new Map<string, string>();
  private readonly failing: boolean;

  constructor(failing = false) {
    this.failing = failing;
  }

  getItem(key: string): string | null {
    if (this.failing) throw new Error('storage unavailable');
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failing) throw new Error('quota exceeded');
    this.data.set(key, value);
  }

  poison(value: string): void {
    this.data.set(STORAGE_KEY, value);
  }
}

const midDay: SavedGame = {
  streak: recordPlay(emptyStreak(), '2026-07-26'),
  day: {
    date: '2026-07-26',
    started: true,
    rounds: [{ playerIds: ['a'], locked: true }, { playerIds: ['b', 'c'] }],
  },
};

const fresh = (): SavedGame => ({ streak: emptyStreak(), day: null });

describe('gameStore', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  it('starts a first-time player with an empty streak and no day', () => {
    expect(loadGame(storage)).toEqual(fresh());
  });

  it('reads back a day in progress, so a refresh keeps your place', () => {
    saveGame(storage, midDay);

    expect(loadGame(storage)).toEqual(midDay);
  });

  it('remembers which rounds were locked in and which are still open', () => {
    saveGame(storage, midDay);
    const back = loadGame(storage);

    expect(back.day?.rounds[0].locked).toBe(true);
    expect(back.day?.rounds[1].locked).toBeUndefined();
  });

  it('treats a day with no start flag as one that has not been opened', () => {
    saveGame(storage, { streak: emptyStreak(), day: { date: '2026-07-26', rounds: [] } });

    expect(loadGame(storage).day?.started).toBeUndefined();
  });

  it('falls back to an empty game when the stored value is not JSON', () => {
    storage.poison('{not json');

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('falls back to an empty game when the stored shape is wrong', () => {
    storage.poison(JSON.stringify({ streak: 'twelve' }));

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('falls back to an empty game when a round is not a list of players', () => {
    storage.poison(
      JSON.stringify({
        streak: emptyStreak(),
        day: { date: '2026-07-26', rounds: [{ playerIds: 'a' }] },
      }),
    );

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('falls back to an empty game when a previous version is still stored', () => {
    // v2 kept a single `picks` object and no rounds, so it can't be read.
    storage.poison(
      JSON.stringify({ streak: emptyStreak(), picks: { date: '2026-07-26', playerIds: ['a'] } }),
    );

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('survives storage that refuses to read', () => {
    expect(loadGame(new FakeStorage(true))).toEqual(fresh());
  });

  it('survives storage that refuses to write', () => {
    expect(() => saveGame(new FakeStorage(true), midDay)).not.toThrow();
  });
});
