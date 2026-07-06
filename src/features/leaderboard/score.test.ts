import { describe, expect, it } from "vitest";
import { teamScores, UNASSIGNED_TEAM } from "./score";
import type { LeaderboardRow } from "@/lib/supabase/leaderboardApi";

function row(partial: Partial<LeaderboardRow>): LeaderboardRow {
  return {
    user_id: partial.user_id ?? "u",
    display_name: partial.display_name ?? "User",
    team_id: partial.team_id ?? null,
    assigned: partial.assigned ?? 1,
    done: partial.done ?? 0,
    active: partial.active ?? 0,
    todo: partial.todo ?? 0,
    completion: partial.completion ?? 0,
    priority: partial.priority ?? 0,
    momentum: partial.momentum ?? 0,
    total: partial.total ?? 0,
  };
}

describe("teamScores", () => {
  it("averages member totals so team size does not buy points", () => {
    const rows = [
      row({ user_id: "a", team_id: "t1", total: 80 }),
      row({ user_id: "b", team_id: "t1", total: 60 }),
      row({ user_id: "c", team_id: "t2", total: 90 }),
    ];
    const scores = teamScores(rows);
    expect(scores[0].teamId).toBe("t2");
    expect(scores[0].total).toBe(90);
    expect(scores[1].teamId).toBe("t1");
    expect(scores[1].total).toBe(70);
  });

  it("excludes members with nothing assigned from the average", () => {
    const rows = [
      row({ user_id: "a", team_id: "t1", total: 80 }),
      row({ user_id: "b", team_id: "t1", total: 0, assigned: 0 }),
    ];
    const scores = teamScores(rows);
    expect(scores[0].total).toBe(80);
    expect(scores[0].memberCount).toBe(1);
  });

  it("buckets team-less members under unassigned", () => {
    const rows = [
      row({ user_id: "a", team_id: null, total: 50 }),
      row({ user_id: "b", team_id: "t1", total: 40 }),
    ];
    const scores = teamScores(rows);
    const ids = scores.map((s) => s.teamId);
    expect(ids).toContain(UNASSIGNED_TEAM);
    expect(ids).toContain("t1");
  });

  it("breaks total ties by average completion", () => {
    const rows = [
      row({ user_id: "a", team_id: "t1", total: 70, completion: 20 }),
      row({ user_id: "b", team_id: "t2", total: 70, completion: 45 }),
    ];
    const scores = teamScores(rows);
    expect(scores[0].teamId).toBe("t2");
  });
});
