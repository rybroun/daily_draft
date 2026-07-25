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

const played: SavedGame = {
  streak: recordPlay(emptyStreak(), '2026-07-25'),
  lastPick: { date: '2026-07-25', playerId: 'p3' },
};

describe('gameStore', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  it('starts a first-time player with an empty streak and no pick', () => {
    expect(loadGame(storage)).toEqual({ streak: emptyStreak(), lastPick: null });
  });

  it('reads back what it saved, so a refresh keeps the streak', () => {
    saveGame(storage, played);

    expect(loadGame(storage)).toEqual(played);
  });

  it('falls back to an empty game when the stored value is not JSON', () => {
    storage.poison('{not json');

    expect(loadGame(storage)).toEqual({ streak: emptyStreak(), lastPick: null });
  });

  it('falls back to an empty game when the stored shape is wrong', () => {
    storage.poison(JSON.stringify({ streak: 'twelve' }));

    expect(loadGame(storage)).toEqual({ streak: emptyStreak(), lastPick: null });
  });

  it('survives storage that refuses to read', () => {
    const broken = new FakeStorage(true);

    expect(loadGame(broken)).toEqual({ streak: emptyStreak(), lastPick: null });
  });

  it('survives storage that refuses to write', () => {
    const broken = new FakeStorage(true);

    expect(() => saveGame(broken, played)).not.toThrow();
  });
});
