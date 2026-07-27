/**
 * Where a score finished among the five it was chosen from — "3rd of 5".
 *
 * The one thing a played round hands forward. It says whether to stand pat or
 * gamble without saying which of the others to gamble on: a player who came
 * fourth tells you to look again, and nothing about where to look.
 *
 * Ties share a place, as they do on the board itself, so two identical weeks
 * both read "tied 1st" rather than one of them being quietly demoted.
 */
export function standing(rank: number, of: number, tied: boolean): string {
  return `${tied ? 'tied ' : ''}${ordinal(rank)} of ${of}`;
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}
