import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type WorkItemType = Tables<"work_item_types">;

const IN_USE = "That type is in use. Move its items to another type first.";

export async function listTypes(boardId: string): Promise<Result<WorkItemType[]>> {
  const { data, error } = await supabase
    .from("work_item_types")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createType(input: {
  boardId: string;
  name: string;
  icon: string;
  color: string;
}): Promise<Result<WorkItemType>> {
  const { data: existing } = await supabase
    .from("work_item_types")
    .select("position")
    .eq("board_id", input.boardId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("work_item_types")
    .insert({
      board_id: input.boardId,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      position: nextPos,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateType(
  id: string,
  updates: { name?: string; icon?: string; color?: string }
): Promise<Result<null>> {
  const { error } = await supabase.from("work_item_types").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteType(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("work_item_types").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return fail({ message: IN_USE });
    return fail(fromPostgrestError(error));
  }
  return ok(null);
}
