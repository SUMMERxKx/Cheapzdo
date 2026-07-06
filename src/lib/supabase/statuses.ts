import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Enums, Tables } from "./database.types";

export type BoardStatus = Tables<"board_statuses">;
export type StatusCategory = Enums<"status_category">;

// A status that is referenced by tasks or epics cannot be deleted, the composite
// foreign keys are ON DELETE RESTRICT. Surface that clearly.
const IN_USE = "That status is in use. Move its items to another status first.";

export async function listStatuses(boardId: string): Promise<Result<BoardStatus[]>> {
  const { data, error } = await supabase
    .from("board_statuses")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createStatus(input: {
  boardId: string;
  name: string;
  category: StatusCategory;
  color: string;
}): Promise<Result<BoardStatus>> {
  const { data: existing } = await supabase
    .from("board_statuses")
    .select("position")
    .eq("board_id", input.boardId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("board_statuses")
    .insert({
      board_id: input.boardId,
      name: input.name.trim(),
      category: input.category,
      color: input.color,
      position: nextPos,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateStatus(
  id: string,
  updates: { name?: string; color?: string; category?: StatusCategory }
): Promise<Result<null>> {
  const { error } = await supabase.from("board_statuses").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteStatus(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("board_statuses").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return fail({ message: IN_USE });
    return fail(fromPostgrestError(error));
  }
  return ok(null);
}

// Swap two rows' positions. UNIQUE(board_id, position) blocks a direct swap, so
// route one row through a temporary slot.
export async function swapStatusPositions(
  a: { id: string; position: number },
  b: { id: string; position: number }
): Promise<Result<null>> {
  const temp = 1_000_000 + Math.max(a.position, b.position);
  const s1 = await supabase.from("board_statuses").update({ position: temp }).eq("id", a.id);
  if (s1.error) return fail(fromPostgrestError(s1.error));
  const s2 = await supabase.from("board_statuses").update({ position: a.position }).eq("id", b.id);
  if (s2.error) return fail(fromPostgrestError(s2.error));
  const s3 = await supabase.from("board_statuses").update({ position: b.position }).eq("id", a.id);
  if (s3.error) return fail(fromPostgrestError(s3.error));
  return ok(null);
}
