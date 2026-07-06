import { describe, it, expect } from "vitest";
import { firstKey, keyBetween, keysBetween } from "./fractionalIndex";

describe("fractionalIndex", () => {
  it("makes a first key and keeps order when inserting after it", () => {
    const a = firstKey();
    const b = keyBetween(a, null);
    expect(a < b).toBe(true);
  });

  it("inserts between two keys and preserves ordering", () => {
    const a = firstKey();
    const c = keyBetween(a, null);
    const b = keyBetween(a, c);
    expect(a < b).toBe(true);
    expect(b < c).toBe(true);
  });

  it("survives many inserts in the same slot without collision", () => {
    let lo = firstKey();
    const hi = keyBetween(lo, null);
    const seen = new Set<string>([lo, hi]);
    for (let i = 0; i < 80; i++) {
      const mid = keyBetween(lo, hi);
      expect(seen.has(mid)).toBe(false);
      expect(lo < mid && mid < hi).toBe(true);
      seen.add(mid);
      lo = mid;
    }
  });

  it("generates N ordered keys", () => {
    const keys = keysBetween(null, null, 5);
    expect(keys).toHaveLength(5);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });
});
