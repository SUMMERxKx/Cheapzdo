import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Team = Tables<"teams">;

export async function listTeams(boardId: string): Promise<Result<Team[]>> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function createTeam(
  boardId: string,
  name: string,
  color: string
): Promise<Result<Team>> {
  const { data, error } = await supabase
    .from("teams")
    .insert({ board_id: boardId, name: name.trim(), color })
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function renameTeam(teamId: string, name: string): Promise<Result<null>> {
  const { error } = await supabase.from("teams").update({ name: name.trim() }).eq("id", teamId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function deleteTeam(teamId: string): Promise<Result<null>> {
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
