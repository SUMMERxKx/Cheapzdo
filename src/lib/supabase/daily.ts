import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type DailyItem = Tables<"daily_items">;
export type DailyScope = "personal" | "team";

// Two lanes. Personal rows are scoped to the signed in user by RLS, team rows
// are shared with the whole board and can carry an assignee.
export async function listDailyItems(
  boardId: string,
  scope: DailyScope,
  userId: string
): Promise<Result<DailyItem[]>> {
  let q = supabase
    .from("daily_items")
    .select("*")
    .eq("board_id", boardId)
    .eq("scope", scope)
    .order("position", { ascending: true });
  if (scope === "personal") q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createDailyItem(input: {
  boardId: string;
  userId: string;
  title: string;
  position: string;
  scope: DailyScope;
  assigneeId?: string | null;
}): Promise<Result<DailyItem>> {
  // The client passes its local date so "today" follows the user, not the server.
  const localDate = new Date().toLocaleDateString("en-CA");
  const { data, error } = await supabase
    .from("daily_items")
    .insert({
      board_id: input.boardId,
      user_id: input.userId,
      title: input.title.trim(),
      position: input.position,
      for_date: localDate,
      scope: input.scope,
      assignee_id: input.scope === "team" ? input.assigneeId ?? null : null,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateDailyItem(
  id: string,
  updates: Partial<Pick<DailyItem, "title" | "is_done" | "position" | "assignee_id">>
): Promise<Result<null>> {
  const { error } = await supabase.from("daily_items").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteDailyItem(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("daily_items").delete().eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
