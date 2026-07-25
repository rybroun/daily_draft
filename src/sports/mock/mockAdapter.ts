import { hashString } from '../../core/random';
import type { Player, SportAdapter, SpotId } from '../../core/types';
import {
  FIRST_SEASON,
  FIRST_WEEK,
  FORMATION,
  LAST_SEASON,
  LAST_WEEK,
  OPENABLE,
  SLOT_STATS,
  STAT_LABELS,
  fantasyPoints,
} from './league';
import { makePlayer, makePool } from './players';
import { NAME_PAIRS } from './names';

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
      FORMATION.map((spot) => {
        const seed = `${season}:${week}:${spot.id}`;
        return [spot.id, makePlayer(seed, spot.slot, week, NAME_PAIRS[hashSpot(seed)])];
      }),
    ),

  candidates: (season, week, slot) =>
    makePool(`${season}:${week}:waiver:${slot}`, slot, week, POOL_SIZE),

  statKeys: (slot) => SLOT_STATS[slot] ?? [],

  formatStatLine: (line) =>
    ORDER.filter((key) => key in line.stats)
      .map((key) => `${line.stats[key]} ${STAT_LABELS[key]}`)
      .join(' · '),

  outcomeValue: (player) => Math.round(fantasyPoints(player.outcome.stats) * 10) / 10,
};

/** Display order for anything a stat line might contain. */
const ORDER = ['ppg', 'car', 'rec', 'ryd', 'pyd', 'td', 'ptd', 'int', 'fg', 'xp', 'sack'];

/**
 * Starters just need a stable name each; the waiver pools handle their own.
 *
 * FNV-1a rather than a multiply-and-add, which on seeds this similar kept
 * landing neighbouring spots on the same first name.
 */
const hashSpot = (seed: string) => hashString(`name:${seed}`) % NAME_PAIRS.length;
