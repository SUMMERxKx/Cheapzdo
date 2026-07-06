import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Enums } from "./database.types";

export type BoardRole = Enums<"board_role">;

export interface RosterMember {
  user_id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  role: BoardRole;
  team_id: string | null;
}

// Member list through the board_roster RPC so emails never leave auth.users.
export async function getRoster(boardId: string): Promise<Result<RosterMember[]>> {
  const { data, error } = await supabase.rpc("board_roster", { p_board: boardId });
  if (error) return fail(fromPostgrestError(error));
  return ok((data ?? []) as RosterMember[]);
}

// The caller's own role on a board, null when not a member.
export async function getMyRole(boardId: string): Promise<Result<BoardRole | null>> {
  const { data, error } = await supabase.rpc("board_role", { b: boardId });
  if (error) return fail(fromPostgrestError(error));
  return ok((data as BoardRole | null) ?? null);
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole
): Promise<Result<null>> {
  const { error } = await supabase
    .from("board_members")
    .update({ role })
    .eq("board_id", boardId)
    .eq("user_id", userId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function removeMember(boardId: string, userId: string): Promise<Result<null>> {
  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("board_id", boardId)
    .eq("user_id", userId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function assignMemberTeam(
  boardId: string,
  userId: string,
  teamId: string | null
): Promise<Result<null>> {
  const { error } = await supabase
    .from("board_members")
    .update({ team_id: teamId })
    .eq("board_id", boardId)
    .eq("user_id", userId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
