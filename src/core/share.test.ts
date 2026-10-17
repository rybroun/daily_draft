import { describe, expect, it } from 'vitest';
import { dayFor } from './day';
import { shareText } from './share';
import { stubAdapter } from './__fixtures__/stubAdapter';

describe('shareText', () => {
  it('prints one glyph per round, in the order they were played', () => {
    const text = shareText({ date: '2026-10-17', results: ['won', 'lost', 'won'], streak: 0 });

    expect(text).toContain('🟩⬛🟩');
  });

  it('gives won, tied and lost their own glyph', () => {
    const text = shareText({ date: '2026-10-17', results: ['won', 'tied', 'lost'], streak: 0 });
    const glyphs = [...'🟩🟨⬛'];

    expect(text).toContain(glyphs.join(''));
    expect(new Set(glyphs).size).toBe(3);
  });

  it('tallies wins only — a tie is not half a win', () => {
    const text = shareText({ date: '2026-10-17', results: ['won', 'tied', 'tied'], streak: 0 });

    expect(text).toContain('1/3');
  });

  it('names the day, because the day is which puzzle it was', () => {
    const text = shareText({ date: '2026-10-17', results: ['won', 'won', 'won'], streak: 0 });

    expect(text).toContain('2026-10-17');
    expect(text).toContain('3/3');
  });

  it('says nothing about a streak of nothing', () => {
    const none = shareText({ date: '2026-10-17', results: ['lost'], streak: 0 });
    const some = shareText({ date: '2026-10-17', results: ['won'], streak: 4 });

    expect(none.toLowerCase()).not.toContain('streak');
    expect(some).toContain('Streak 4');
  });

  it('appends a link only when given one', () => {
    const bare = shareText({ date: '2026-10-17', results: ['won'], streak: 0 });
    const linked = shareText({
      date: '2026-10-17',
      results: ['won'],
      streak: 0,
      url: 'example.test',
    });

    expect(bare).not.toContain('example.test');
    expect(linked.trimEnd().endsWith('example.test')).toBe(true);
  });

  it('refuses a result list that is empty', () => {
    expect(() => shareText({ date: '2026-10-17', results: [], streak: 0 })).toThrow();
  });

  /*
   * The one that matters.
   *
   * Every player gets the same day, so a share string is read by someone who
   * has not played it yet. Anything in it that narrows down the week — the
   * season, the week number, the opponent, a player's name — is a spoiler they
   * can act on: with a season and a week, the real box scores are a search away
   * and the puzzle is solved before it's opened.
   */
  it('leaks nothing about the day it describes', () => {
    const adapter = stubAdapter();
    const day = dayFor(adapter, '2026-10-17');
    const text = shareText({ date: '2026-10-17', results: ['won', 'won', 'lost'], streak: 3 });

    expect(text).not.toContain(String(day.season));
    expect(text).not.toContain(day.rounds[0].opponent.name);

    const named = day.rounds.flatMap((round) => [
      ...round.waivers,
      ...round.field.map((entry) => entry.player).filter((player) => player !== null),
      ...round.opponent.lineup.map((entry) => entry.player),
    ]);
    expect(named.length).toBeGreaterThan(0);
    for (const player of named) {
      expect(text).not.toContain(player.name);
    }

    /*
     * And the whole string, pinned.
     *
     * Checking the week by hunting for its digits can't work — the stub's week
     * was 2 and the tally reads "2/3". Pinning the entire output is stronger
     * than any such search: if every character is accounted for by the date,
     * the glyphs and the streak, then the week isn't in there and neither is
     * anything else that wasn't passed in.
     */
    expect(text).toBe('Daily Waivers 2026-10-17\n🟩🟩⬛ 2/3\nStreak 3\n');
  });
});
