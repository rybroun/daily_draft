/**
 * Name and club pools for the invented league.
 *
 * Nothing here is a real player or a real team. The point is only that a lineup
 * reads like a lineup instead of like `Player 3`.
 */

export const FIRST_NAMES = [
  'Alvin', 'Bernie', 'Cesar', 'Dale', 'Emil', 'Franco', 'Gordie', 'Hal',
  'Ike', 'Jules', 'Karl', 'Lonnie', 'Marv', 'Nate', 'Orlando', 'Pete',
  'Quincy', 'Rudy', 'Sal', 'Terry', 'Ugo', 'Vince', 'Wally', 'Xavier',
  'Yuri', 'Zeke', 'Arno', 'Bo', 'Curt', 'Dex', 'Elmo', 'Fitz',
  'Gus', 'Hank', 'Ivo', 'Jonas', 'Kip', 'Leland', 'Mack', 'Norris',
  'Omari', 'Pierce', 'Rashad', 'Sonny', 'Tobias', 'Vaughn', 'Wes', 'Zane',
];

export const LAST_NAMES = [
  'Abbott', 'Barrow', 'Castellan', 'Devine', 'Ellery', 'Fontaine', 'Gable',
  'Hollis', 'Ingram', 'Janack', 'Kovar', 'Lindqvist', 'Marchetti', 'Nunes',
  'Oyelaran', 'Prokop', 'Quillen', 'Renner', 'Salvatore', 'Thibault',
  'Ulrich', 'Vasquez', 'Whitlock', 'Xu', 'Yeager', 'Zorn', 'Ashford',
  'Bellamy', 'Cobb', 'Dupree', 'Eskildsen', 'Farrow', 'Greaves', 'Hearn',
  'Ivarsson', 'Jessup', 'Kalani', 'Ludlow', 'Moretti', 'Nakagawa',
  'Okafor', 'Petrosyan', 'Roche', 'Stovall', 'Tiernan', 'Vollmer',
];

export const CLUBS = [
  'AKR', 'BRC', 'CLV', 'DUN', 'ELM', 'FAI',
  'GRN', 'HRB', 'IRO', 'JOP', 'KEN', 'LDG',
];

/** Every first/last combination, for the fixed starters around the openings. */
export const NAME_PAIRS: string[] = FIRST_NAMES.flatMap((first) =>
  LAST_NAMES.map((last) => `${first} ${last}`),
);
