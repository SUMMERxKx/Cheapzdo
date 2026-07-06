import { describe, expect, it } from "vitest";
import { computeBurndown } from "./burndown";

describe("computeBurndown", () => {
  const start = "2026-07-01";
  const end = "2026-07-08";

  it("ideal line falls from total to zero", () => {
    const tasks = [
      { doneAt: null, createdAt: "2026-07-01" },
      { doneAt: null, createdAt: "2026-07-01" },
    ];
    const pts = computeBurndown(tasks, start, end, new Date("2026-07-01"));
    expect(pts[0].ideal).toBe(2);
    expect(pts[pts.length - 1].ideal).toBe(0);
  });

  it("actual drops on the day a task finishes and stops at today", () => {
    const tasks = [
      { doneAt: "2026-07-02T10:00:00Z", createdAt: "2026-07-01" },
      { doneAt: null, createdAt: "2026-07-01" },
    ];
    const pts = computeBurndown(tasks, start, end, new Date("2026-07-03T12:00:00"));
    expect(pts[0].actual).toBe(2);
    expect(pts[2].actual).toBe(1);
    expect(pts[4].actual).toBeNull();
  });

  it("handles an empty sprint without dividing by zero", () => {
    const pts = computeBurndown([], start, start, new Date("2026-07-01"));
    expect(pts.length).toBeGreaterThan(0);
    expect(pts[0].ideal).toBe(0);
  });
});
