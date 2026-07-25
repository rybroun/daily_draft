import { hashString } from '../../core/random';
import type { Player, SportAdapter, SpotId } from '../../core/types';
import {
  FIRST_SEASON,
  FIRST_WEEK,
  FORMATION,
  LAST_SEASON,
  LAST_WEEK,
  OPENABLE,
  SLOT_COLORS,
  SLOT_STATS,
  STAT_LABELS,
  fantasyPoints,
} from './league';
import { makePlayer, makePool, projectPoints } from './players';
import { NAME_PAIRS, TEAM_NAMES } from './names';

/**
 * An invented football league, standing in until a real sport is chosen.
 *
 * The positions and the field are real football so the lineup reads correctly,
 * but every player, club and season is fabricated. It exists so the waiver-wire
 * puzzle can be built and played before anyone commits to a dataset, and so the
 * adapter seam is proven by a sport that doesn't exist.
 */

/** Deeper than a slate needs, so the same names don't come round every week. */
const POOL_SIZE = 7;

export const mockAdapter: SportAdapter = {
  id: 'mock',
  displayName: 'Mock Football League',

  seasons: () =>
    Array.from({ length: LAST_SEASON - FIRST_SEASON + 1 }, (_, i) => FIRST_SEASON + i),

  weeks: () => Array.from({ length: LAST_WEEK - FIRST_WEEK + 1 }, (_, i) => FIRST_WEEK + i),

  formation: () => FORMATION,

  openableSlots: () => OPENABLE,

  roster: (season, week) =>
    new Map<SpotId, Player>(
      FORMATION.map((spot) => [spot.id, starter(`${season}:${week}:${spot.id}`, spot.slot, week)]),
    ),

  opponent: (season, week) => ({
    name: TEAM_NAMES[hashString(`rival:${season}:${week}`) % TEAM_NAMES.length],
    lineup: FORMATION.map((spot) => ({
      spot,
      player: starter(`${season}:${week}:rival:${spot.id}`, spot.slot, week),
    })),
  }),

  candidates: (season, week, slot) =>
    makePool(`${season}:${week}:waiver:${slot}`, slot, week, POOL_SIZE),

  statKeys: (slot) => SLOT_STATS[slot] ?? [],

  formatStatLine: (line) =>
    ORDER.filter((key) => key in line.stats)
      .map((key) => `${line.stats[key]} ${STAT_LABELS[key]}`)
      .join(' · '),

  outcomeValue: (player) => Math.round(fantasyPoints(player.outcome.stats) * 10) / 10,

  projectedValue: (player) => projectPoints(player),

  slotColor: (slot) => SLOT_COLORS[slot] ?? 'var(--dst)',
};

/** A player already in somebody's lineup — theirs or yours. */
const starter = (seed: string, slot: string, week: number): Player =>
  makePlayer(seed, slot, week, NAME_PAIRS[hashSpot(seed)]);

/** Display order for anything a stat line might contain. */
const ORDER = ['ppg', 'car', 'rec', 'ryd', 'pyd', 'td', 'ptd', 'int', 'fg', 'xp', 'sack'];

/**
 * Starters just need a stable name each; the waiver pools handle their own.
 *
 * FNV-1a rather than a multiply-and-add, which on seeds this similar kept
 * landing neighbouring spots on the same first name.
 */
const hashSpot = (seed: string) => hashString(`name:${seed}`) % NAME_PAIRS.length;
