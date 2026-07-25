/**
 * Sport-agnostic vocabulary for the puzzle engine.
 *
 * Nothing in `core/` may know what a sport is. Slots and stat keys are opaque
 * strings the engine passes back to the adapter without interpreting them.
 */

/** Identifies a sport. Values are supplied by adapters, never by core. */
export type SportId = string;

/** A roster position. Opaque to core — "RF", "LW", "PG" all look the same here. */
export type RosterSlot = string;

/** A single stat's key. Opaque to core. */
export type StatKey = string;

export type PlayerId = string;

/** A calendar day in `YYYY-MM-DD`, the seed for a day's puzzle. */
export type DateKey = string;

export interface Player {
  id: PlayerId;
  name: string;
  /** Short club label shown beside the name. */
  team: string;
  /** Season stat line, keyed by the adapter's own stat keys. */
  stats: Record<StatKey, number>;
}

export interface SportAdapter {
  id: SportId;
  displayName: string;
  seasons(): number[];
  slots(season: number): RosterSlot[];
  /** Which stats to show for this slot, in display order. */
  statKeys(slot: RosterSlot): StatKey[];
  candidates(season: number, slot: RosterSlot): Player[];
  formatStatLine(player: Player, slot: RosterSlot): string;
  /**
   * How much that player's season was worth at that slot, higher is better.
   *
   * This is the seam that keeps core sport-agnostic. Turning a stat line into a
   * number is a per-sport question, so it lives here rather than in scoring.
   * Core only ever compares the numbers.
   */
  seasonValue(player: Player, slot: RosterSlot): number;
}

export interface Puzzle {
  date: DateKey;
  sportId: SportId;
  season: number;
  slot: RosterSlot;
  /** Stats to show for every candidate, in display order. */
  statKeys: StatKey[];
  candidates: Player[];
}

/** One candidate's standing on the board, once the season played out. */
export interface RankedPlayer {
  player: Player;
  value: number;
  /** 1 is the best pick available. Ties share a rank. */
  rank: number;
}

export interface Score {
  picked: RankedPlayer;
  best: RankedPlayer;
  /** Every candidate, best first. */
  board: RankedPlayer[];
  /** 0–100: where the pick landed between the worst and best available. */
  points: number;
  /** True when nothing on the slate outproduced the pick. */
  isBest: boolean;
  /** How much value was left on the board. 0 when the pick was the best. */
  valueBehindBest: number;
}
