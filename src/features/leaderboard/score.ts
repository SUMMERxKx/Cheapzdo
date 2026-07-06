import type { LeaderboardRow } from "@/lib/supabase/leaderboardApi";

// Team scores roll up from member scores. A team's score is the average of its
// members' totals so team size never buys points. Members with nothing assigned
// are excluded from the average. Members without a team land in the Unassigned
// bucket so nobody disappears from the comparison.
export const UNASSIGNED_TEAM = "__unassigned__";

export interface TeamScore {
  teamId: string;
  total: number;
  memberCount: number;
  avgCompletion: number;
  members: LeaderboardRow[];
}

export function teamScores(rows: LeaderboardRow[]): TeamScore[] {
  const groups = new Map<string, LeaderboardRow[]>();
  for (const row of rows) {
    if (row.assigned === 0) continue;
    const key = row.team_id ?? UNASSIGNED_TEAM;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const scores: TeamScore[] = [];
  for (const [teamId, members] of groups) {
    const total = Math.round(
      members.reduce((sum, m) => sum + m.total, 0) / members.length
    );
    const avgCompletion =
      members.reduce((sum, m) => sum + (m.completion ?? 0), 0) / members.length;
    scores.push({ teamId, total, memberCount: members.length, avgCompletion, members });
  }

  // Tie break on average completion, then keep a stable name-ish order by id.
  scores.sort(
    (a, b) => b.total - a.total || b.avgCompletion - a.avgCompletion || a.teamId.localeCompare(b.teamId)
  );
  return scores;
}
