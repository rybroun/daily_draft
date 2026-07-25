/**
 * Seeded randomness. There is no `Math.random` anywhere in the engine — a day's
 * puzzle has to come out the same on every device, forever.
 */

/** FNV-1a, 32-bit. Turns a seed string into a well-spread integer. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, and good enough to shuffle a six-man slate. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** Partial Fisher–Yates: the first `count` of a shuffled copy, no repeats. */
export function drawWithoutReplacement<T>(
  items: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const pool = [...items];
  const taken = Math.min(count, pool.length);
  for (let i = 0; i < taken; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, taken);
}
