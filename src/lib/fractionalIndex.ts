import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

// Ordering keys for lists and boards. We store a string position and compute a
// new key between two neighbors when an item moves, so a reorder is one write
// and never renumbers the whole list. Double precision numbers were rejected
// because they run out of room after about fifty inserts in the same slot.

// A key for the very first item in an empty list.
export function firstKey(): string {
  return generateKeyBetween(null, null);
}

// A key that sorts between the given neighbors. Pass null for an open end.
export function keyBetween(
  before: string | null,
  after: string | null
): string {
  return generateKeyBetween(before, after);
}

// N evenly spaced keys between two neighbors, handy for seeding a list.
export function keysBetween(
  before: string | null,
  after: string | null,
  count: number
): string[] {
  return generateNKeysBetween(before, after, count);
}
