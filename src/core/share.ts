import type { DateKey, MatchupResult } from './types';

export interface ShareInput {
  /** Which day this was. The day *is* the puzzle's identity. */
  date: DateKey;
  /** How each round finished, in the order they were played. */
  results: MatchupResult[];
  /** The streak after finishing. Zero prints nothing. */
  streak: number;
  /** Where to send a reader. Left out, the line is left off. */
  url?: string;
}

/**
 * One glyph per result.
 *
 * Green, yellow and black rather than green, yellow and red: red reads as an
 * error when a lost round is an ordinary outcome, and the three differ in
 * lightness as well as hue, so they survive being read by someone who can't
 * separate red from green.
 */
const GLYPH: Record<MatchupResult, string> = { won: '🟩', tied: '🟨', lost: '⬛' };

/**
 * The day's result, as something worth pasting into a message.
 *
 * It says the day, how each round went, and the streak — and deliberately
 * nothing else. Every player gets the same day, so this string is read by
 * people who haven't played it yet: the season, the week, the opponent or a
 * single player's name would each narrow the week down far enough to look the
 * real box scores up, which solves the puzzle before it's opened. The glyphs
 * carry the brag; the day carries the comparison. Nothing else is needed for
 * either.
 *
 * Pure, and in core, because what may be said about a finished day is a rule of
 * the game rather than a detail of the screen it's shown on.
 */
export function shareText({ date, results, streak, url }: ShareInput): string {
  if (results.length === 0) {
    throw new Error(`no rounds to share for ${date}`);
  }

  const won = results.filter((result) => result === 'won').length;
  const lines = [
    `Daily Waivers ${date}`,
    `${results.map((result) => GLYPH[result]).join('')} ${won}/${results.length}`,
  ];

  // A streak of nothing isn't a streak, which is how the screen reads it too.
  if (streak > 0) lines.push(`Streak ${streak}`);
  if (url) lines.push(url);

  return `${lines.join('\n')}\n`;
}
