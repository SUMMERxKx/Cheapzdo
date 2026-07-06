import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Sprint = Tables<"sprints">;

export async function listSprints(boardId: string): Promise<Result<Sprint[]>> {
  const { data, error } = await supabase
    .from("sprints")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

// Close the sprint and hand the active flag to the next one. Returns the next
// sprint id, or null when this was the last sprint of the arc.
export async function closeSprint(
  sprintId: string,
  moveIncomplete: boolean
): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc("close_sprint", {
    p_sprint: sprintId,
    p_move_incomplete: moveIncomplete,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok((data as string | null) ?? null);
}
