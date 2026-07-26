import { describe, expect, it } from 'vitest';
import { OPENINGS_FOR, WAIVERS_PER_OPENING, dateKey, dayFor } from '../../core/day';
import { scorePicks } from '../../core/scoring';
import { mockAdapter } from './mockAdapter';

const a = mockAdapter;
const seasons = a.seasons();
const everyWeek = seasons.flatMap((season) =>
  a.weeks(season).map((week) => ({ season, week })),
);
const days = (count: number) =>
  Array.from({ length: count }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));

describe('mockAdapter formation', () => {
  it('gives every spot on the field a distinct id', () => {
    const ids = a.formation().map((s) => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('offers enough openable slots to leave two independent openings', () => {
    const openable = new Set(
      a.formation().filter((s) => a.openableSlots().includes(s.slot)).map((s) => s.slot),
    );

    expect(openable.size).toBeGreaterThanOrEqual(OPENINGS_FOR.hard);
  });

  it('places every spot inside the field it is drawn on', () => {
    for (const spot of a.formation()) {
      expect(spot.x).toBeGreaterThanOrEqual(0);
      expect(spot.x).toBeLessThanOrEqual(100);
      expect(spot.y).toBeGreaterThanOrEqual(0);
      expect(spot.y).toBeLessThanOrEqual(100);
    }
  });
});

describe('mockAdapter rosters and waivers', () => {
  it('fills every spot on the field with an eligible starter', () => {
    for (const { season, week } of everyWeek.slice(0, 20)) {
      const roster = a.roster(season, week);

      for (const spot of a.formation()) {
        expect(roster.get(spot.id)?.slot).toBe(spot.slot);
      }
    }
  });

  it('always offers enough waiver candidates for an opening', () => {
    for (const { season, week } of everyWeek) {
      for (const slot of a.openableSlots()) {
        expect(a.candidates(season, week, slot).length).toBeGreaterThanOrEqual(
          WAIVERS_PER_OPENING,
        );
      }
    }
  });

  it('returns the same waiver board every time it is asked', () => {
    expect(a.candidates(2004, 7, 'RB')).toEqual(a.candidates(2004, 7, 'RB'));
  });

  it('gives every candidate in a pool a distinct id', () => {
    for (const { season, week } of everyWeek.slice(0, 30)) {
      for (const slot of a.openableSlots()) {
        const ids = a.candidates(season, week, slot).map((p) => p.id);

        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('offers a different waiver board each week', () => {
    const one = a.candidates(2004, 7, 'RB').map((p) => p.name);
    const next = a.candidates(2004, 8, 'RB').map((p) => p.name);

    expect(one).not.toEqual(next);
  });
});

describe('mockAdapter hidden information', () => {
  it('shows a candidate their record so far and nothing from the scored week', () => {
    for (const player of a.candidates(2004, 7, 'WR')) {
      expect(player.form.length).toBeGreaterThanOrEqual(2);
      for (const line of player.form) {
        expect(line.label).not.toBe(player.outcome.label);
      }
    }
  });

  it('values a week from what happened in it, never from the form on show', () => {
    const [player] = a.candidates(2004, 7, 'WR');
    const hotStreak = { ...player, form: [{ label: 'SEASON', stats: { ppg: 99 } }] };

    expect(a.outcomeValue(hotStreak, 'WR')).toBe(a.outcomeValue(player, 'WR'));
  });

  it('shows a stat line naming every number in it', () => {
    const [player] = a.candidates(2004, 7, 'RB');
    const line = a.formatStatLine(player.outcome, 'RB');

    for (const key of a.statKeys('RB')) {
      expect(line).toContain(String(player.outcome.stats[key]));
    }
  });

  it('spreads outcomes so a waiver board has a real best and worst', () => {
    for (const { season, week } of everyWeek.slice(0, 30)) {
      for (const slot of a.openableSlots()) {
        const values = a.candidates(season, week, slot).map((p) => a.outcomeValue(p, slot));

        expect(Math.max(...values)).toBeGreaterThan(Math.min(...values));
      }
    }
  });
});

describe('mockAdapter opponents and injuries', () => {
  const everyone = everyWeek
    .slice(0, 60)
    .flatMap(({ season, week }) => a.opponent(season, week).lineup.map((e) => e.player));

  it('fields a full opponent lineup with a manager name', () => {
    const rival = a.opponent(2004, 7);

    expect(rival.name.length).toBeGreaterThan(3);
    expect(rival.lineup).toHaveLength(a.formation().length);
    for (const entry of rival.lineup) {
      expect(entry.player.slot).toBe(entry.spot.slot);
    }
  });

  it('fields a different opponent each week', () => {
    expect(a.opponent(2004, 7).lineup.map((e) => e.player.name)).not.toEqual(
      a.opponent(2004, 8).lineup.map((e) => e.player.name),
    );
  });

  it('puts an injury tag on some players but nowhere near all of them', () => {
    const tagged = everyone.filter((p) => p.status !== undefined);

    expect(tagged.length).toBeGreaterThan(everyone.length * 0.08);
    expect(tagged.length).toBeLessThan(everyone.length * 0.35);
  });

  it('holds a player tagged OUT to nothing, which is why the tag is worth reading', () => {
    const out = everyone.filter((p) => p.status === 'OUT');

    expect(out.length).toBeGreaterThan(0);
    for (const player of out) {
      expect(a.outcomeValue(player, player.slot)).toBe(0);
      expect(a.projectedValue(player, player.slot)).toBe(0);
    }
  });

  it('still credits a tagged player with the form they built while healthy', () => {
    const out = everyone.filter((p) => p.status === 'OUT')[0];

    expect(out.form[0].stats.ppg).toBeGreaterThan(0);
  });

  it('projects from visible form and never from the week itself', () => {
    const [player] = a.candidates(2004, 7, 'WR');
    const blowUp = { ...player, outcome: { label: 'WEEK 7', stats: { rec: 99, ryd: 400, td: 5 } } };

    expect(a.projectedValue(blowUp, 'WR')).toBe(a.projectedValue(player, 'WR'));
  });

  it('projects a healthy player somewhere near their recent scoring', () => {
    for (const player of everyone.filter((p) => p.status === undefined).slice(0, 40)) {
      const [season, recent] = player.form.map((line) => line.stats.ppg);

      expect(a.projectedValue(player, player.slot)).toBeGreaterThanOrEqual(
        Math.min(season, recent) - 0.1,
      );
      expect(a.projectedValue(player, player.slot)).toBeLessThanOrEqual(
        Math.max(season, recent) + 0.1,
      );
    }
  });
});

describe('a year of mock puzzles', () => {
  it('produces a playable, scoreable puzzle every day', () => {
    for (const day of days(365)) {
      for (const puzzle of dayFor(a, day).rounds) {
        const picks = puzzle.openings.map(
          (spot) => puzzle.waivers.find((p) => p.slot === spot.slot)!.id,
        );
        const score = scorePicks(a, puzzle, picks);

        expect(puzzle.openings).toHaveLength(OPENINGS_FOR[puzzle.difficulty]);
        expect(score.points).toBeGreaterThanOrEqual(0);
        expect(score.points).toBeLessThanOrEqual(100);
        expect(puzzle.lines.winning).toBeGreaterThan(0);
      }
    }
  });

  it('never repeats the same day two days running', () => {
    const signatures = days(365).map((day) => {
      const [p] = dayFor(a, day).rounds;
      return `${p.season}|${p.week}|${p.waivers.map((c) => c.id).join(',')}`;
    });

    expect(signatures.filter((s, i) => i > 0 && s === signatures[i - 1])).toHaveLength(0);
  });

  /**
   * The design bet, stated as a test: form has to be worth reading, and it has
   * to be wrong often enough that reading it isn't the whole game. If either
   * number drifts out of range the mock has stopped posing a puzzle.
   */
  it('rewards reading the form without making it the answer', () => {
    let formWasRight = 0;
    let openings = 0;

    for (const day of days(365)) {
      const puzzle = dayFor(a, day).rounds[2];
      for (const spot of puzzle.openings) {
        const pool = puzzle.waivers.filter((p) => p.slot === spot.slot);
        const byForm = [...pool].sort((x, y) => y.form[0].stats.ppg - x.form[0].stats.ppg)[0];
        const byOutcome = [...pool].sort(
          (x, y) => a.outcomeValue(y, spot.slot) - a.outcomeValue(x, spot.slot),
        )[0];

        if (byForm.id === byOutcome.id) formWasRight++;
        openings++;
      }
    }

    const rate = formWasRight / openings;
    const luck = 1 / WAIVERS_PER_OPENING;

    expect(rate).toBeGreaterThan(luck * 1.5);
    expect(rate).toBeLessThan(0.7);
  });
});
