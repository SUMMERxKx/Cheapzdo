import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Comment = Tables<"comments">;

export async function listComments(parent: {
  boardId: string;
  taskId?: string;
  epicId?: string;
}): Promise<Result<Comment[]>> {
  let q = supabase
    .from("comments")
    .select("*")
    .eq("board_id", parent.boardId)
    .order("created_at", { ascending: true });
  if (parent.taskId) q = q.eq("task_id", parent.taskId);
  if (parent.epicId) q = q.eq("epic_id", parent.epicId);
  const { data, error } = await q;
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function addComment(input: {
  boardId: string;
  taskId?: string;
  epicId?: string;
  authorId: string;
  body: string;
}): Promise<Result<Comment>> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      board_id: input.boardId,
      task_id: input.taskId ?? null,
      epic_id: input.epicId ?? null,
      author_id: input.authorId,
      body: input.body.trim(),
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function deleteComment(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
