import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Arc = Tables<"arcs">;

export async function listArcs(boardId: string): Promise<Result<Arc[]>> {
  const { data, error } = await supabase
    .from("arcs")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

// Start the next arc through the atomic RPC. Null args fall back to the board's
// defaults inside the function.
export async function startNewArc(input: {
  boardId: string;
  arcSize?: number;
  sprintLengthDays?: number;
}): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("create_arc", {
    p_board: input.boardId,
    p_arc_size: input.arcSize,
    p_sprint_length: input.sprintLengthDays,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok(data as string);
}
