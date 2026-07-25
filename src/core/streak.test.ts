import { describe, expect, it } from 'vitest';
import { emptyStreak, recordPlay } from './streak';

describe('recordPlay', () => {
  it('starts a streak at one on the first day played', () => {
    expect(recordPlay(emptyStreak(), '2026-07-25')).toEqual({
      current: 1,
      best: 1,
      lastPlayed: '2026-07-25',
    });
  });

  it('extends the streak when the next day is played', () => {
    const after = recordPlay(recordPlay(emptyStreak(), '2026-07-25'), '2026-07-26');

    expect(after.current).toBe(2);
    expect(after.best).toBe(2);
  });

  it('extends across a month boundary', () => {
    const after = recordPlay(recordPlay(emptyStreak(), '2026-01-31'), '2026-02-01');

    expect(after.current).toBe(2);
  });

  it('restarts the streak when a day was missed', () => {
    let state = recordPlay(emptyStreak(), '2026-07-20');
    state = recordPlay(state, '2026-07-21');
    state = recordPlay(state, '2026-07-25');

    expect(state.current).toBe(1);
    expect(state.lastPlayed).toBe('2026-07-25');
  });

  it('remembers the longest streak after one is broken', () => {
    let state = recordPlay(emptyStreak(), '2026-07-20');
    state = recordPlay(state, '2026-07-21');
    state = recordPlay(state, '2026-07-22');
    state = recordPlay(state, '2026-07-25');

    expect(state.best).toBe(3);
  });

  it('ignores a second play on a day already recorded', () => {
    const once = recordPlay(emptyStreak(), '2026-07-25');

    expect(recordPlay(once, '2026-07-25')).toEqual(once);
  });

  it('ignores a day earlier than the one already recorded', () => {
    const state = recordPlay(emptyStreak(), '2026-07-25');

    expect(recordPlay(state, '2026-07-24')).toEqual(state);
  });
});
