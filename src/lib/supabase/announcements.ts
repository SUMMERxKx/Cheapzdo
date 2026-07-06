import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Announcement = Tables<"announcements">;

// Pinned first, then newest.
export async function listAnnouncements(boardId: string): Promise<Result<Announcement[]>> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("board_id", boardId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createAnnouncement(input: {
  boardId: string;
  authorId: string;
  title: string;
  body: string | null;
}): Promise<Result<Announcement>> {
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      board_id: input.boardId,
      author_id: input.authorId,
      title: input.title.trim(),
      body: input.body,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Pick<Announcement, "title" | "body" | "is_pinned" | "pinned_at">>
): Promise<Result<null>> {
  const { error } = await supabase.from("announcements").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteAnnouncement(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
