import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Enums, Tables } from "./database.types";

export type Task = Tables<"tasks">;
export type Priority = Enums<"item_priority">;

// Tasks for one sprint, or the board backlog when sprintId is null.
export async function listTasks(boardId: string, sprintId: string | null): Promise<Result<Task[]>> {
  let q = supabase
    .from("tasks")
    .select("*")
    .eq("board_id", boardId)
    .is("archived_at", null)
    .order("position", { ascending: true });
  q = sprintId === null ? q.is("sprint_id", null) : q.eq("sprint_id", sprintId);
  const { data, error } = await q;
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createTask(input: {
  boardId: string;
  epicId: string;
  sprintId: string | null;
  title: string;
  typeId: string | null;
  statusId: string | null;
  priority: Priority;
  assigneeId: string | null;
  isBlocker: boolean;
  description: string | null;
  position: string;
  createdBy: string;
}): Promise<Result<Task>> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      board_id: input.boardId,
      epic_id: input.epicId,
      sprint_id: input.sprintId,
      title: input.title.trim(),
      type_id: input.typeId,
      status_id: input.statusId,
      priority: input.priority,
      assignee_id: input.assigneeId,
      is_blocker: input.isBlocker,
      description: input.description,
      position: input.position,
      created_by: input.createdBy,
    })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      Task,
      | "title"
      | "epic_id"
      | "sprint_id"
      | "type_id"
      | "status_id"
      | "priority"
      | "assignee_id"
      | "is_blocker"
      | "description"
      | "position"
    >
  >
): Promise<Result<null>> {
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

// Kanban drop goes through the move_task RPC so permission and the write happen
// in one round trip.
export async function moveTask(input: {
  taskId: string;
  statusId: string | null;
  position: string;
}): Promise<Result<null>> {
  const { error } = await supabase.rpc("move_task", {
    p_item: input.taskId,
    p_status: input.statusId,
    p_position: input.position,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteTask(id: string): Promise<Result<null>> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
