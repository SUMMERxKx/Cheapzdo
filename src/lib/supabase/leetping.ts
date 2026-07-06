import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type GithubConnection = Tables<"github_connections">;
export type LeetPingEvent = Tables<"leetping_events">;

export async function getMyConnection(userId: string): Promise<Result<GithubConnection | null>> {
  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function saveConnection(input: {
  userId: string;
  githubUsername: string;
  repoFullName: string;
  shareToBoards: boolean;
}): Promise<Result<GithubConnection>> {
  const { data, error } = await supabase
    .from("github_connections")
    .upsert(
      {
        user_id: input.userId,
        github_username: input.githubUsername.trim(),
        repo_full_name: input.repoFullName.trim(),
        share_to_boards: input.shareToBoards,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function deleteConnection(userId: string): Promise<Result<null>> {
  const { error } = await supabase.from("github_connections").delete().eq("user_id", userId);
  if (error) return fail(fromPostgrestError(error));
  return ok(null);
}

export async function listLeetPingEvents(boardId: string): Promise<Result<LeetPingEvent[]>> {
  const { data, error } = await supabase
    .from("leetping_events")
    .select("*")
    .eq("board_id", boardId)
    .order("committed_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) return fail(fromPostgrestError(error));
  return ok(data ?? []);
}

// Ask the edge function to pull fresh commits from the connected repo. The
// user's JWT rides along automatically.
export async function syncNow(): Promise<Result<{ found: number; note?: string; error?: string }>> {
  const { data, error } = await supabase.functions.invoke("leetping-sync", { body: {} });
  if (error) {
    // The function returns readable errors as json bodies with error status codes.
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) {
        const body = (await ctx.json()) as { error?: string };
        if (body.error) return fail({ message: body.error });
      }
    } catch {
      // fall through to the generic message
    }
    return fail({ message: error.message ?? "Sync failed" });
  }
  return ok(data as { found: number; note?: string });
}
