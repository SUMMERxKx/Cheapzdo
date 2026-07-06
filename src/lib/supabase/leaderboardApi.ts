import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";

// One row per member with assigned work, straight from the leaderboard RPC.
// Scoring happens in the database: completion out of 50, priority impact out of
// 30, momentum out of 20, total out of 100.
export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  team_id: string | null;
  assigned: number;
  done: number;
  active: number;
  todo: number;
  completion: number | null;
  priority: number | null;
  momentum: number | null;
  total: number;
}

export async function fetchLeaderboard(
  boardId: string,
  sprintId: string | null
): Promise<Result<LeaderboardRow[]>> {
  const { data, error } = await supabase.rpc("leaderboard", {
    p_board: boardId,
    p_sprint: sprintId ?? undefined,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok((data ?? []) as LeaderboardRow[]);
}
