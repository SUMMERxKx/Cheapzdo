import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Enums, Tables } from "./database.types";

export type Epic = Tables<"epics">;
export type EpicRollup = { epic_id: string; task_count: number; done_count: number; pct_done: number };
export type Priority = Enums<"item_priority">;

// Epics for one arc, or the backlog when arcId is null.
export async function listEpics(boardId: string, arcId: string | null): Promise<Result<Epic[]>> {
  let q = supabase
    .from("epics")
    .select("*")
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("position", { ascending: true });
  q = arcId === null ? q.is("arc_id", null) : q.eq("arc_id", arcId);
  const { data, error } = await q;
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

// Every epic on the board, for pickers.
export async function listAllEpics(boardId: string): Promise<Result<Epic[]>> {
  const { data, error } = await supabase
    .from("epics")
    .select("*")
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("position", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function getEpicRollups(boardId: string): Promise<Result<EpicRollup[]>> {
  const { data, error } = await supabase
    .from("epic_rollups")
    .select("epic_id, task_count, done_count, pct_done")
    .eq("board_id", boardId);
  if (error) return fail(fromPostgrestError(error));
  return ok((data ?? []) as EpicRollup[]);
}

export async function createEpic(input: {
  boardId: string;
  title: string;
  arcId: string | null;
  typeId: string | null;
  statusId: string | null;
  priority: Priority;
  assigneeId: string | null;
  description: string | null;
  position: string;
  createdBy: string;
}): Promise<Result<Epic>> {
  const { data, error } = await supabase
    .from("epics")
    .insert({
      board_id: input.boardId,
      title: input.title.trim(),
      arc_id: input.arcId,
      type_id: input.typeId,
      status_id: input.statusId,
      priority: input.priority,
      assignee_id: input.assigneeId,
      description: input.description,
      position: input.position,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateEpic(
  id: string,
  updates: Partial<Pick<Epic, "title" | "arc_id" | "type_id" | "status_id" | "priority" | "assignee_id" | "description" | "position">>
): Promise<Result<null>> {
  const { error } = await supabase.from("epics").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

// Epic delete is RESTRICT while tasks reference it. Surface a clear message.
export async function deleteEpic(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("epics").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return fail({ message: "This epic still has tasks. Move them to another epic first." });
    }
    return fail(fromPostgrestError(error));
  }
  return ok(null);
}
