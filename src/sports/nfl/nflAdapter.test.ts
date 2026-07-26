import { describe, expect, it } from 'vitest';
import { WAIVERS_PER_OPENING, dateKey, puzzleFor } from '../../core/puzzle';
import { scorePicks } from '../../core/scoring';
import { fantasyPoints } from './league';
import { nflAdapter as a } from './nflAdapter';

const SEASONS = a.seasons();
const SEASON = 2015;
/** Every (season, week) the adapter will ever be asked for. */
const everyWeek = SEASONS.flatMap((s) => a.weeks(s).map((w) => ({ season: s, week: w })));

describe('the 2015 season is really 2015', () => {
  it('knows what Julio Jones did in week 9', () => {
    // 10 catches, 137 yards, no score, at Atlanta in 2015.
    const julio = a
      .candidates(SEASON, 9, 'WR')
      .concat([...a.roster(SEASON, 9).values()], a.opponent(SEASON, 9).lineup.map((e) => e.player))
      .find((p) => p.name === 'Julio Jones');

    // He may or may not be dealt into this week's league, but if he is, his
    // week is the real one.
    if (julio) {
      expect(julio.outcome.stats.rec).toBe(10);
      expect(julio.outcome.stats.recYds).toBe(137);
    }
  });

  it('offers only weeks with enough history behind them to read', () => {
    for (const season of SEASONS) {
      expect(Math.min(...a.weeks(season))).toBeGreaterThanOrEqual(7);
      expect(Math.max(...a.weeks(season))).toBe(17);
    }
  });

  it('knows what Tom Brady did in 2007', () => {
    // The 50-touchdown season. If the era is wrong, this is the tell.
    const brady = everyWeek
      .filter(({ season }) => season === 2007)
      .flatMap(({ season, week }) => [...a.roster(season, week).values()])
      .find((p) => p.name === 'Tom Brady');

    if (brady) expect(brady.form[0].stats.ppg).toBeGreaterThan(15);
  });
});

describe('every week can be played', () => {
  it('has a full wire at every openable slot', () => {
    for (const { season, week } of everyWeek) {
      for (const slot of a.openableSlots()) {
        expect(a.candidates(season, week, slot).length).toBeGreaterThanOrEqual(
          WAIVERS_PER_OPENING,
        );
      }
    }
  });

  it('fields a full lineup on both sides', () => {
    for (const { season, week } of everyWeek) {
      const yours = a.roster(season, week);
      for (const spot of a.formation()) {
        expect(yours.get(spot.id)?.slot).toBe(spot.slot);
      }
      expect(a.opponent(season, week).lineup).toHaveLength(a.formation().length);
    }
  });

  it('never has one player in two places at once', () => {
    for (const { season, week } of everyWeek) {
      const seen = new Set<string>();
      const claim = (id: string) => {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      };
      for (const [, p] of a.roster(season, week)) claim(p.id);
      for (const e of a.opponent(season, week).lineup) claim(e.player.id);
      for (const slot of a.openableSlots()) {
        for (const p of a.candidates(season, week, slot)) claim(p.id);
      }
    }
  });

  it('gives the same league for the same week every time it is asked', () => {
    const once = a.candidates(SEASON, 9, 'RB').map((p) => p.id);

    expect(a.candidates(SEASON, 9, 'RB').map((p) => p.id)).toEqual(once);
  });
});

describe('form is history and nothing else', () => {
  /** Every candidate the adapter will ever hand out, across the season. */
  const everyone = everyWeek.flatMap(({ season, week }) =>
    a.openableSlots().flatMap((slot) =>
      a.candidates(season, week, slot).map((player) => ({ player, week })),
    ),
  );

  it('never lets the scored week into the form lines', () => {
    for (const { player, week } of everyone) {
      for (const line of player.form) {
        expect(line.label).not.toBe(player.outcome.label);
      }
      expect(player.outcome.label).toBe(`Week ${week}`);
    }
  });

  it('projects from form alone, never from what happened', () => {
    const [sample] = everyone;
    const blowUp = {
      ...sample.player,
      outcome: { label: sample.player.outcome.label, stats: { rec: 20, recYds: 400, td: 4 } },
    };

    expect(a.projectedValue(blowUp, blowUp.slot)).toBe(
      a.projectedValue(sample.player, sample.player.slot),
    );
  });

  it('only offers players with enough games behind them to have form', () => {
    for (const { player } of everyone) {
      expect(player.form[0].stats.ppg).toBeGreaterThan(0);
    }
  });

  it('scores a week from the real stat line', () => {
    for (const { player, week } of everyone.slice(0, 200)) {
      expect(a.outcomeValue(player, player.slot)).toBe(fantasyPoints(player.outcome.stats));
      expect(player.outcome.label).toBe(`Week ${week}`);
    }
  });
});

describe('the injury report, where one was published', () => {
  // nflverse publishes injury reports from 2009 onward. 2007 simply has none,
  // and the game degrades to no designations rather than inventing any.
  const lineups = everyWeek
    .filter(({ season }) => season >= 2009)
    .flatMap(({ season, week }) => [
      ...[...a.roster(season, week).values()],
      ...a.opponent(season, week).lineup.map((e) => e.player),
    ]);

  it('turns up often enough to be worth reading, and not so often it is noise', () => {
    const tagged = lineups.filter((p) => p.status !== undefined);
    const rate = tagged.length / lineups.length;

    // Real 2015 rates for skill players, once "Probable" is discarded.
    expect(rate).toBeGreaterThan(0.02);
    expect(rate).toBeLessThan(0.25);
  });

  it('never shows the abolished Probable designation', () => {
    for (const p of lineups) {
      expect(['OUT', 'D', 'Q', undefined]).toContain(p.status);
    }
  });

  it('projects a ruled-out player at nothing', () => {
    const out = lineups.filter((p) => p.status === 'OUT');

    expect(out.length).toBeGreaterThan(0);
    for (const p of out) expect(a.projectedValue(p, p.slot)).toBe(0);
  });

  it('never puts more than one ruled-out player on a single slate', () => {
    for (const { season, week } of everyWeek) {
      for (const slot of a.openableSlots()) {
        const out = a.candidates(season, week, slot).filter((p) => p.status === 'OUT');

        expect(out.length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('a year of real puzzles', () => {
  const days = Array.from({ length: 365 }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));

  it('produces a playable, scoreable puzzle every day', () => {
    for (const day of days) {
      const puzzle = puzzleFor(a, day);
      const picks = puzzle.openings.map(
        (spot) => puzzle.waivers.find((p) => p.slot === spot.slot)!.id,
      );
      const score = scorePicks(a, puzzle, picks);

      expect(SEASONS).toContain(puzzle.season);
      expect(score.points).toBeGreaterThanOrEqual(0);
      expect(score.points).toBeLessThanOrEqual(100);
      expect(Number.isFinite(score.yourTotal)).toBe(true);
    }
  });

  it('puts up totals a real fantasy week would recognise', () => {
    const totals = days.map((day) => {
      const puzzle = puzzleFor(a, day);
      const picks = puzzle.openings.map(
        (spot) => puzzle.waivers.find((p) => p.slot === spot.slot)!.id,
      );
      return scorePicks(a, puzzle, picks).opponentTotal;
    });
    const mean = totals.reduce((x, y) => x + y, 0) / totals.length;

    // Eight starters in half-PPR. Wildly outside this and the scoring is wrong.
    expect(mean).toBeGreaterThan(50);
    expect(mean).toBeLessThan(130);
  });
});

describe('the two form lines actually say different things', () => {
  /*
   * The whole puzzle is the tension between a steady season line and a hot or
   * cold recent one. If they agree, there is nothing to read — which is exactly
   * what happened when the season opened at week 4 and every candidate had
   * played precisely three games.
   */
  it('gives most candidates a season line and a last-three that differ', () => {
    const candidates = everyWeek.flatMap(({ season, week }) =>
      a.openableSlots().flatMap((slot) => a.candidates(season, week, slot)),
    );
    const differ = candidates.filter(
      (p) => p.form[0].stats.ppg !== p.form[1].stats.ppg,
    );

    expect(differ.length / candidates.length).toBeGreaterThan(0.9);
  });
});

describe('both seasons are in the rotation', () => {
  it('offers every season it holds', () => {
    expect(SEASONS).toEqual([2007, 2015]);
  });

  it('deals from both across a year of dates', () => {
    const days = Array.from({ length: 365 }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));
    const dealt = new Set(days.map((day) => puzzleFor(a, day).season));

    expect(dealt).toEqual(new Set(SEASONS));
  });

  it('keeps the eras apart — no Chargers of Los Angeles in 2007', () => {
    const teams = new Set(
      everyWeek
        .filter(({ season }) => season === 2007)
        .flatMap(({ season, week }) => [...a.roster(season, week).values()])
        .map((p) => p.team),
    );

    expect(teams).not.toContain('LAC');
    expect(teams).not.toContain('LV');
    expect(teams).not.toContain('LA');
  });
});
