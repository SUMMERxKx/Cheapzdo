import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import { createBoardSchema, type CreateBoardInput } from "./schemas/board";
import type { Tables } from "./database.types";

// Reference implementation of the data access pattern every entity follows.
// The UI calls these, never supabase.from directly. Inputs are validated with
// zod, outputs come back as a typed Result.
export type Board = Tables<"boards">;

// Boards the signed in user belongs to. RLS returns only their boards.
export async function listMyBoards(): Promise<Result<Board[]>> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function getBoard(boardId: string): Promise<Result<Board>> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

// Owner only per RLS. Arc size and sprint length here are defaults for future arcs.
export async function updateBoard(
  boardId: string,
  updates: { name?: string; arc_size?: number; sprint_length_days?: number }
): Promise<Result<null>> {
  const { error } = await supabase.from("boards").update(updates).eq("id", boardId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

// Owner only per RLS. Cascades everything on the board, the UI double confirms.
export async function deleteBoard(boardId: string): Promise<Result<null>> {
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

// PostgREST can briefly drop a function from its schema cache right after a
// migration, or when a paused free tier project is waking up. That surfaces as a
// PGRST202 "could not find the function" error. It means the call never reached
// the database, so no board was created and retrying once is safe.
function isSchemaCacheMiss(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST202" || /schema cache/i.test(error.message ?? "");
}

// Create a board through the atomic RPC, which also seeds statuses, types, the
// first arc, and its sprints, and adds the caller as owner.
export async function createBoard(
  input: CreateBoardInput
): Promise<Result<string>> {
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) {
    return fail({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const args = {
    p_name: parsed.data.name,
    p_arc_size: parsed.data.arcSize,
    p_sprint_length: parsed.data.sprintLengthDays,
    // Only send a start when the user picked one, otherwise the RPC uses today.
    ...(parsed.data.startDate ? { p_start: parsed.data.startDate } : {}),
  };
  let { data, error } = await supabase.rpc("create_board", args);
  if (error && isSchemaCacheMiss(error)) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ({ data, error } = await supabase.rpc("create_board", args));
  }
  if (error) return fail(fromPostgrestError(error));
  return ok(data as string);
}
