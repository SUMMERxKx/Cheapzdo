import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Database } from "./database.types";

// Friends data layer. Every write is a SECURITY DEFINER rpc that checks
// auth.uid(), reads go through list rpcs because the profiles select policy is
// self or shares-a-board only. The UI never touches the friendships table.
export type SearchUser =
  Database["public"]["Functions"]["search_users"]["Returns"][number];
export type Friend =
  Database["public"]["Functions"]["list_friends"]["Returns"][number];
export type FriendRequest =
  Database["public"]["Functions"]["list_friend_requests"]["Returns"][number];
export type FriendRole = Database["public"]["Enums"]["board_role"];

export async function searchUsers(q: string): Promise<Result<SearchUser[]>> {
  const { data, error } = await supabase.rpc("search_users", { p_q: q });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function listFriends(): Promise<Result<Friend[]>> {
  const { data, error } = await supabase.rpc("list_friends", {});
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function listFriendRequests(): Promise<Result<FriendRequest[]>> {
  const { data, error } = await supabase.rpc("list_friend_requests", {});
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function sendFriendRequest(addresseeId: string): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("send_friend_request", {
    p_addressee: addresseeId,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok(data as string);
}

export async function respondFriendRequest(
  requestId: string,
  accept: boolean
): Promise<Result<null>> {
  const { error } = await supabase.rpc("respond_friend_request", {
    p_request: requestId,
    p_accept: accept,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function removeFriend(otherId: string): Promise<Result<null>> {
  const { error } = await supabase.rpc("remove_friend", { p_other: otherId });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function blockUser(otherId: string): Promise<Result<null>> {
  const { error } = await supabase.rpc("block_user", { p_other: otherId });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function unblockUser(otherId: string): Promise<Result<null>> {
  const { error } = await supabase.rpc("unblock_user", { p_other: otherId });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

// Drop an accepted friend straight into a board with a role. Owner only, guarded
// server side. Used by the members panel picker.
export async function inviteFriend(
  boardId: string,
  friendId: string,
  role: FriendRole
): Promise<Result<null>> {
  const { error } = await supabase.rpc("invite_friend", {
    p_board: boardId,
    p_friend: friendId,
    p_role: role,
  });
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
