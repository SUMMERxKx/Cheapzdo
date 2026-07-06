import { describe, expect, it } from "vitest";
import { parseFromMessage, parseFromPath } from "../../../supabase/functions/leetping-sync/parse";

describe("parseFromMessage", () => {
  it("reads a problem url anywhere in the message", () => {
    const p = parseFromMessage("solved it, see https://leetcode.com/problems/two-sum/ for details");
    expect(p?.slug).toBe("two-sum");
    expect(p?.title).toBe("Two Sum");
  });

  it("reads numbered directory style messages", () => {
    expect(parseFromMessage("0001-two-sum")?.slug).toBe("two-sum");
    expect(parseFromMessage("124. binary-tree-maximum-path-sum")?.slug).toBe(
      "binary-tree-maximum-path-sum"
    );
  });

  it("reads verb prefixed messages", () => {
    expect(parseFromMessage("Add solution - Two Sum")?.title).toBe("Two Sum");
    expect(parseFromMessage("Solved: Median of Two Sorted Arrays")?.slug).toBe(
      "median-of-two-sorted-arrays"
    );
  });

  it("ignores leethub runtime messages so the path fallback can run", () => {
    expect(parseFromMessage("Time: 52 ms (73.67%), Space: 42.1 MB (12.42%) - LeetHub")).toBeNull();
    expect(parseFromMessage("Attach NOTES - LeetHub")).toBeNull();
    expect(parseFromMessage("Create README - LeetHub")).toBeNull();
  });

  it("reads a lone slug", () => {
    expect(parseFromMessage("valid-parentheses")?.title).toBe("Valid Parentheses");
  });
});

describe("parseFromPath", () => {
  it("reads leethub directory layouts with language", () => {
    const p = parseFromPath("0001-two-sum/0001-two-sum.py");
    expect(p?.slug).toBe("two-sum");
    expect(p?.language).toBe("Python");
  });

  it("reads difficulty folders", () => {
    const p = parseFromPath("Medium/longest-substring-without-repeating-characters/solution.cpp");
    expect(p?.difficulty).toBe("Medium");
    expect(p?.language).toBe("C++");
  });

  it("reads flat single file repos", () => {
    const p = parseFromPath("two-sum.ts");
    expect(p?.slug).toBe("two-sum");
    expect(p?.language).toBe("TypeScript");
  });

  it("returns null for non problem files", () => {
    expect(parseFromPath("README.md")).toBeNull();
  });
});
