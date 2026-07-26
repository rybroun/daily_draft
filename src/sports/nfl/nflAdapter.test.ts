import { describe, expect, it } from 'vitest';
import { WAIVERS_PER_OPENING, dateKey, dayFor } from '../../core/day';
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
      for (const puzzle of dayFor(a, day).rounds) {
        const picks = puzzle.openings.map(
          (spot) => puzzle.waivers.find((p) => p.slot === spot.slot)!.id,
        );
        const score = scorePicks(a, puzzle, picks);

        expect(SEASONS).toContain(puzzle.season);
        expect(score.points).toBeGreaterThanOrEqual(0);
        expect(score.points).toBeLessThanOrEqual(100);
        expect(Number.isFinite(score.yourTotal)).toBe(true);
        expect(puzzle.lines.winning).toBeGreaterThan(0);
      }
    }
  });

  it('puts up totals a real fantasy week would recognise', () => {
    const totals = days.map((day) => {
      const [puzzle] = dayFor(a, day).rounds;
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

describe('a day is one matchup that gets harder', () => {
  const day = dayFor(a, '2026-07-26');

  it('runs three rounds on the same week and the same opponent', () => {
    for (const puzzle of day.rounds) {
      expect(puzzle.season).toBe(day.rounds[0].season);
      expect(puzzle.week).toBe(day.rounds[0].week);
      expect(puzzle.opponent.name).toBe(day.rounds[0].opponent.name);
    }
  });

  it('opens one more spot each round, keeping the earlier ones', () => {
    expect(day.rounds.map((p) => p.openings.length)).toEqual([1, 2, 3]);
    for (let i = 1; i < day.rounds.length; i++) {
      const before = day.rounds[i - 1].openings.map((s) => s.id);
      expect(day.rounds[i].openings.map((s) => s.id).slice(0, i)).toEqual(before);
    }
  });

  it('offers the very same five players for a spot in every round it is open', () => {
    for (let i = 1; i < day.rounds.length; i++) {
      for (const spot of day.rounds[i - 1].openings) {
        const before = day.rounds[i - 1].waivers.filter((p) => p.slot === spot.slot);
        const now = day.rounds[i].waivers.filter((p) => p.slot === spot.slot);

        expect(now.map((p) => p.id)).toEqual(before.map((p) => p.id));
      }
    }
  });

  it('gives every round at least one way to win', () => {
    for (const puzzle of day.rounds) {
      expect(puzzle.lines.winning).toBeGreaterThan(0);
    }
  });

  it('leans on you harder each round by taking another starter away', () => {
    const filled = day.rounds.map((p) => p.field.filter((e) => e.player !== null).length);

    expect(filled[0]).toBeGreaterThan(filled[1]);
    expect(filled[1]).toBeGreaterThan(filled[2]);
  });
});

describe('both seasons are in the rotation', () => {
  it('offers every season it holds', () => {
    expect(SEASONS).toEqual([2007, 2015]);
  });

  it('deals from both across a year of dates', () => {
    const days = Array.from({ length: 365 }, (_, i) => dateKey(new Date(2026, 0, 1 + i)));
    const dealt = new Set(days.map((day) => dayFor(a, day).season));

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

describe('the next game, and who it is against', () => {
  const everyCandidate = everyWeek.flatMap(({ season, week }) =>
    (['QB', 'RB', 'WR', 'TE', 'K'] as const).flatMap((slot) =>
      a.candidates(season, week, slot).map((p) => ({ p, season, week })),
    ),
  );

  it('names one game, not a run of three — you are only picking for this week', () => {
    for (const { p } of everyCandidate) {
      expect(p.next).toBeDefined();
      // A single object. A list would be the old three-fixture strip.
      expect(Array.isArray(p.next)).toBe(false);
    }
  });

  it('says whether it is home or away, and against whom', () => {
    for (const { p } of everyCandidate) {
      expect(p.next!.label).toMatch(/^(vs|at) [A-Z]{2,3}$|^BYE$/);
    }
  });

  it('carries the opponent record instead of an unexplained colour', () => {
    for (const { p } of everyCandidate) {
      if (p.next!.label === 'BYE') continue;
      // "4–6" or "4–6–1", en dashes, no W/L letters.
      expect(p.next!.detail).toMatch(/^\d+–\d+(–\d+)?$/);
    }
  });

  it('counts that record only from weeks already played', () => {
    // A record through week N can never total more than N-1 games.
    for (const { p, week } of everyCandidate) {
      if (p.next!.label === 'BYE') continue;
      const played = p.next!.detail!.split('–').reduce((n, x) => n + Number(x), 0);
      expect(played).toBeLessThanOrEqual(week - 1);
    }
  });

  it('agrees with the result the reveal prints for that same game', () => {
    // The wire says who they play; the reveal says how it went. Same fixture.
    for (const { p, season, week } of everyCandidate.slice(0, 400)) {
      const note = a.gameNote!(p, season, week);
      if (p.next!.label === 'BYE') {
        expect(note).toBeNull();
        continue;
      }
      const opponent = p.next!.label.split(' ')[1];
      expect(note).toContain(opponent);
    }
  });
});

describe('the league is grouped the way football groups it', () => {
  const SEASON_WEEKS = everyWeek.filter(({ week }) => week === 10);

  it('puts all thirty-two clubs in eight divisions of four', () => {
    for (const { season, week } of SEASON_WEEKS) {
      const table = a.standings!(season, week);
      const divisions = new Map<string, string[]>();
      for (const row of table) {
        const group = divisions.get(row.group!) ?? [];
        group.push(row.name);
        divisions.set(row.group!, group);
      }

      expect(divisions.size).toBe(8);
      for (const clubs of divisions.values()) expect(clubs).toHaveLength(4);
      expect(table).toHaveLength(32);
      expect(new Set(table.map((r) => r.name)).size).toBe(32);
    }
  });

  it('names the divisions the way the league does', () => {
    const groups = new Set(a.standings!(2015, 10).map((r) => r.group));
    expect(groups).toEqual(
      new Set([
        'AFC East', 'AFC North', 'AFC South', 'AFC West',
        'NFC East', 'NFC North', 'NFC South', 'NFC West',
      ]),
    );
  });

  it('leads each division with the best record in it', () => {
    for (const { season, week } of SEASON_WEEKS) {
      const rate = (record: string) => {
        const [w, l, t = 0] = record.split('–').map(Number);
        return (w + t / 2) / (w + l + t);
      };
      const byGroup = new Map<string, { name: string; detail: string }[]>();
      for (const row of a.standings!(season, week)) {
        byGroup.set(row.group!, [...(byGroup.get(row.group!) ?? []), row]);
      }
      for (const rows of byGroup.values()) {
        const best = Math.max(...rows.map((r) => rate(r.detail)));
        expect(rate(rows[0].detail)).toBe(best);
      }
    }
  });

  it('counts only the weeks already played', () => {
    for (const { season, week } of everyWeek) {
      for (const row of a.standings!(season, week)) {
        const played = row.detail.split('–').reduce((n, x) => n + Number(x), 0);
        expect(played).toBeLessThanOrEqual(week - 1);
      }
    }
  });
});

describe('the week as a moment in time', () => {
  it('has a number one for every week the game can deal', () => {
    for (const { season, week } of everyWeek) {
      const moment = a.moment!(season, week);
      // The song is always there; a headline only where one was verified.
      expect(moment[0].label).toBe('No. 1 song');
      expect(moment[0].detail).toMatch(/^“.+” by .+$/);
    }
  });

  it('carries a headline only where one was checked, never an invented one', () => {
    const withNews = everyWeek
      .map(({ season, week }) => ({ season, week, lines: a.moment!(season, week) }))
      .filter(({ lines }) => lines.some((l) => l.label === 'In the news'));

    // Sparse on purpose — the file says so, and a blank week shows one line.
    expect(withNews.length).toBeGreaterThan(0);
    for (const { lines } of withNews) {
      expect(lines).toHaveLength(2);
      expect(lines[1].detail.length).toBeGreaterThan(10);
    }
  });

  it('puts the week Paris was attacked in the week it was attacked', () => {
    // 13 November 2015, which is the Friday before week 10's Sunday.
    const week10 = a.moment!(2015, 10);
    expect(week10.map((l) => l.detail).join(' ')).toContain('Paris');
    expect(a.moment!(2015, 9).some((l) => l.label === 'In the news')).toBe(false);
  });

  it('knows Adele saw out 2015 and Alicia Keys saw out 2007', () => {
    // Both held number one from mid-November to the end of the season.
    expect(a.moment!(2015, 17)[0].detail).toContain('Hello');
    expect(a.moment!(2015, 17)[0].detail).toContain('Adele');
    expect(a.moment!(2007, 17)[0].detail).toContain('No One');
    expect(a.moment!(2007, 17)[0].detail).toContain('Alicia Keys');
  });

  it('changes when the chart changed', () => {
    // "The Hills" gave way to "Hello" for the chart of 14 November 2015, which
    // is week 10 — the first Sunday after it.
    expect(a.moment!(2015, 9)[0].detail).toContain('The Hills');
    expect(a.moment!(2015, 10)[0].detail).toContain('Hello');
    // And "Crank That" to "Kiss Kiss" for 10 November 2007, week 10.
    expect(a.moment!(2007, 9)[0].detail).toContain('Crank That');
    expect(a.moment!(2007, 10)[0].detail).toContain('Kiss Kiss');
  });
});
