/**
 * Sport-agnostic vocabulary for the puzzle engine.
 *
 * Nothing in `core/` may know what a sport is. Slots and stat keys are opaque
 * strings the engine passes back to the adapter without interpreting them, and
 * a spot's coordinates are opaque numbers it never reads at all.
 */

/** Identifies a sport. Values are supplied by adapters, never by core. */
export type SportId = string;

/** A roster position. Opaque to core — "RB", "LW", "PG" all look the same here. */
export type RosterSlot = string;

/** A single stat's key. Opaque to core. */
export type StatKey = string;

export type PlayerId = string;

/** Identifies one place in a formation, so two of the same slot stay distinct. */
export type SpotId = string;

/** A calendar day in `YYYY-MM-DD`, the seed for a day's puzzle. */
export type DateKey = string;

/**
 * One block of stats under a heading.
 *
 * The heading is the adapter's word — "SEASON", "LAST 3" — and core never reads
 * either the label or the numbers. They exist to be shown to the player.
 */
export interface StatLine {
  label: string;
  stats: Record<StatKey, number>;
}

export interface Player {
  id: PlayerId;
  name: string;
  /** Short club label shown beside the name. */
  team: string;
  /** Which opening this player is eligible to fill. */
  slot: RosterSlot;
  /**
   * Availability, in the adapter's own words — "OUT", "Q". Opaque to core, and
   * known *before* kickoff, so it's legitimately part of what you get to see.
   */
  status?: string;
  /**
   * What the player is allowed to see before deciding. Everything here is
   * history up to the puzzle's week — never anything from the week itself.
   */
  form: StatLine[];
  /**
   * The one game being picked for, in the adapter's own words — who it's
   * against (`label`) and one fact about them (`detail`). Schedules and
   * standings are both published in advance, so this is legitimately visible.
   * Opaque to core.
   *
   * Singular on purpose. It used to be a run of three fixtures, which is what
   * you'd want for a trade; the question here is only ever about this week.
   */
  next?: { label: string; detail?: string };
  /** What actually happened in the scored week. Hidden until the reveal. */
  outcome: StatLine;
}

/**
 * One place on the field.
 *
 * `x` and `y` are display coordinates in the adapter's own space. Core carries
 * them from the adapter to the UI and never looks inside.
 */
export interface FieldSpot {
  id: SpotId;
  slot: RosterSlot;
  x: number;
  y: number;
}

/** A spot and whoever is standing in it — `null` while it's an opening. */
export interface FieldEntry {
  spot: FieldSpot;
  player: Player | null;
}

/**
 * The team you're up against this week.
 *
 * Their lineup is fully visible, injuries and all, because that's what makes a
 * waiver decision a decision: how much you need depends on what they're fielding.
 */
export interface Opponent {
  name: string;
  lineup: { spot: FieldSpot; player: Player }[];
}

export interface SportAdapter {
  id: SportId;
  displayName: string;
  seasons(): number[];
  weeks(season: number): number[];

  /** Every place on the field, in display order. */
  formation(): FieldSpot[];
  /** Which slots the puzzle is allowed to leave open. */
  openableSlots(): RosterSlot[];

  /** Who was already locked into each spot that week. */
  roster(season: number, week: number): Map<SpotId, Player>;
  /** Who you're playing, and what they're fielding. */
  opponent(season: number, week: number): Opponent;
  /** The waiver pool eligible for one slot that week. */
  candidates(season: number, week: number, slot: RosterSlot): Player[];

  /** Which stats to show for this slot, in display order. */
  statKeys(slot: RosterSlot): StatKey[];
  formatStatLine(line: StatLine, slot: RosterSlot): string;
  /** The short heading for one stat, e.g. "REC". Opaque to core. */
  statLabel(key: StatKey): string;
  /**
   * A colour for a position.
   *
   * Nothing renders this today: the field colours heads by what they're
   * producing rather than what they play, since the position is already written
   * beside every name. Kept on the seam because it's a legitimate thing for a
   * sport to know about itself, and a sport whose positions aren't labelled in
   * words would need it back.
   */
  slotColor(slot: RosterSlot): string;

  /**
   * What the player's actual week was worth at that slot, higher is better.
   *
   * This is the seam that keeps core sport-agnostic. Turning a stat line into a
   * number is a per-sport question, so it lives here rather than in scoring.
   * Core only ever compares the numbers.
   */
  outcomeValue(player: Player, slot: RosterSlot): number;

  /**
   * What the week looks like it will be worth, from visible form alone.
   *
   * Never reads `outcome`, and asserted by test. Nothing renders it now: the
   * field shows the real week and the wire shows no number at all, because a
   * projection is the optimal read of the visible evidence already computed and
   * printing one collapses the decision into "take the biggest number".
   *
   * Kept on the seam because it is the natural place for a sport to express
   * that reading, and because any ordering or tiering the engine might want
   * later has to come from visible form rather than from `outcome`.
   */
  projectedValue(player: Player, slot: RosterSlot): number;

  /**
   * How the real league stood going into this week, best first. Optional, and
   * for the opening card only — it grounds you in a season already in progress
   * and says nothing about what any candidate is about to do.
   */
  standings?(season: number, week: number): { name: string; detail: string }[];

  /**
   * Who has been best at each position so far, for the same opening card.
   *
   * Must be built from visible form only — it's shown before a single pick is
   * made, so a leaderboard that peeked at the scored week would be handing over
   * the answer dressed as background.
   */
  leaders?(
    season: number,
    week: number,
  ): { slot: RosterSlot; players: { name: string; team: string; detail: string }[] }[];

  /**
   * One line on how this player's real side fared that week — "Seattle won
   * 30–13 at Baltimore". Optional, and for the reveal only.
   *
   * Deliberately a method rather than a field on `Player`: it describes the
   * week being scored, so putting it on the player object would put it one
   * careless render away from leaking before the pick is made.
   */
  gameNote?(player: Player, season: number, week: number): string | null;
}

/** How many spots you have to get right: one, two or three. */
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Puzzle {
  date: DateKey;
  sportId: SportId;
  season: number;
  week: number;
  difficulty: Difficulty;
  /**
   * How many complete line-ups beat the opponent, out of how many exist.
   *
   * Always at least one. A puzzle you cannot win isn't a puzzle, and this is
   * the promise the day is built around.
   */
  lines: { winning: number; total: number };
  /** The whole field. Openings carry a `null` player. */
  field: FieldEntry[];
  /** The spots to fill, in display order. Never two of the same slot. */
  openings: FieldSpot[];
  /** Every player on the waiver board, across all the openings. */
  waivers: Player[];
  /** Who you have to beat. */
  opponent: Opponent;
}

/** One candidate's standing once the week was played. */
export interface RankedPlayer {
  player: Player;
  value: number;
  /** 1 is the best available. Ties share a rank. */
  rank: number;
}

/** How one opening turned out. */
export interface SlotResult {
  spot: FieldSpot;
  picked: RankedPlayer;
  best: RankedPlayer;
  /** Every candidate for this opening, best first. */
  board: RankedPlayer[];
}

export type MatchupResult = 'won' | 'lost' | 'tied';

export interface Score {
  /** One per opening, in the puzzle's opening order. */
  slots: SlotResult[];
  /** 0–100 across every opening together: how well the picks were made. */
  points: number;
  /** What the picks alone produced. */
  total: number;
  /** What the best possible set of picks would have produced. */
  bestPossible: number;
  /** True when nothing available would have scored more. */
  isPerfect: boolean;

  /** The whole lineup, picks included. */
  yourTotal: number;
  opponentTotal: number;
  result: MatchupResult;
  /** Your total minus theirs. Negative when you lost. */
  margin: number;
  /** Whether the best available picks would have won it. */
  couldHaveWon: boolean;
  /**
   * True when no set of picks could have changed the result — the rest of the
   * lineup had already settled it either way. Worth saying out loud: it's the
   * difference between being beaten and being punished for a coin flip.
   */
  alreadyDecided: boolean;
}
