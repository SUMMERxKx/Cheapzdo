import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type DailyItem = Tables<"daily_items">;

// The daily list is a rolling personal list per board. RLS already scopes rows
// to the signed in user, the filters here are for clarity and index use.
export async function listDailyItems(boardId: string, userId: string): Promise<Result<DailyItem[]>> {
  const { data, error } = await supabase
    .from("daily_items")
    .select("*")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createDailyItem(input: {
  boardId: string;
  userId: string;
  title: string;
  position: string;
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
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateDailyItem(
  id: string,
  updates: Partial<Pick<DailyItem, "title" | "is_done" | "position">>
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
