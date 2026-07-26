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
  picks: { date: '2026-07-25', playerIds: ['rb-3', 'wr-1'] },
};

const fresh = (): SavedGame => ({ streak: emptyStreak(), picks: null });

describe('gameStore', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  it('starts a first-time player with an empty streak and no picks', () => {
    expect(loadGame(storage)).toEqual(fresh());
  });

  it('reads back what it saved, so a refresh keeps the streak', () => {
    saveGame(storage, played);

    expect(loadGame(storage)).toEqual(played);
  });

  it('remembers which difficulty the picks were made against', () => {
    saveGame(storage, {
      streak: emptyStreak(),
      picks: { date: '2026-07-26', difficulty: 'hard', playerIds: ['a', 'b', 'c'] },
    });

    expect(loadGame(storage).picks?.difficulty).toBe('hard');
  });

  it('remembers that a week was locked in, not just what was picked', () => {
    const locked: SavedGame = {
      streak: emptyStreak(),
      picks: { date: '2026-07-26', playerIds: ['a', 'b'], locked: true },
    };
    saveGame(storage, locked);

    expect(loadGame(storage).picks?.locked).toBe(true);
  });

  it('treats a set of picks with no lock as still open', () => {
    saveGame(storage, {
      streak: emptyStreak(),
      picks: { date: '2026-07-26', playerIds: ['a', 'b'] },
    });

    expect(loadGame(storage).picks?.locked).toBeUndefined();
  });

  it('keeps a half-finished set of picks, so one pick survives a refresh', () => {
    const halfway: SavedGame = {
      streak: emptyStreak(),
      picks: { date: '2026-07-25', playerIds: ['rb-3'] },
    };
    saveGame(storage, halfway);

    expect(loadGame(storage)).toEqual(halfway);
  });

  it('falls back to an empty game when the stored value is not JSON', () => {
    storage.poison('{not json');

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('falls back to an empty game when the stored shape is wrong', () => {
    storage.poison(JSON.stringify({ streak: 'twelve' }));

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('falls back to an empty game when the saved picks are not a list of players', () => {
    storage.poison(
      JSON.stringify({ streak: emptyStreak(), picks: { date: '2026-07-25', playerIds: 'rb-3' } }),
    );

    expect(loadGame(storage)).toEqual(fresh());
  });

  it('survives storage that refuses to read', () => {
    expect(loadGame(new FakeStorage(true))).toEqual(fresh());
  });

  it('survives storage that refuses to write', () => {
    expect(() => saveGame(new FakeStorage(true), played)).not.toThrow();
  });
});
