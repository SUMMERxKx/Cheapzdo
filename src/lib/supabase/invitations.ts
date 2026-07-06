import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import { generateInviteToken, hashInviteToken, inviteLink } from "./inviteToken";
import type { Enums, Tables } from "./database.types";

export type Invitation = Tables<"invitations">;
export type InviteRole = Exclude<Enums<"board_role">, "owner">;

// Create an invitation and return the shareable link. The raw token exists only
// in this return value, the database stores its hash. Email delivery arrives
// with SMTP in phase 10, until then the owner copies the link.
export async function createInvitation(input: {
  boardId: string;
  email: string;
  role: InviteRole;
  teamId?: string | null;
}): Promise<Result<{ link: string; invitation: Invitation }>> {
  const token = generateInviteToken();
  const tokenHash = await hashInviteToken(token);
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      board_id: input.boardId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      team_id: input.teamId ?? null,
      token_hash: tokenHash,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      return fail({ message: "There is already a pending invite for that email. Revoke it first." });
    }
    return fail(fromPostgrestError(error));
  }
  return ok({ link: inviteLink(token), invitation: data });
}

export async function listPendingInvitations(boardId: string): Promise<Result<Invitation[]>> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

export async function revokeInvitation(invitationId: string): Promise<Result<null>> {
  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}
