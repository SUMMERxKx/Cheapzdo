// LeetPing sync. Reads recent commits from the caller's connected LeetCode sync
// repo through the public GitHub API, parses solves, and fans events out to the
// boards the caller belongs to. Writes use the service role because the
// leetping_events table has no client write policy on purpose.
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseFromMessage, parseFromPath, type ParsedSolve } from "./parse.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

interface GhCommit {
  sha: string;
  html_url: string;
  commit?: { message?: string; author?: { date?: string } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Identify the caller from their JWT. The platform already rejected requests
  // without one, this resolves who it is.
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) return json({ error: "Sign in first" }, 401);
  const uid = userData.user.id;

  const { data: conn } = await admin
    .from("github_connections")
    .select("repo_full_name, share_to_boards")
    .eq("user_id", uid)
    .maybeSingle();
  if (!conn?.repo_full_name) return json({ error: "Connect a GitHub repo first" }, 400);
  if (!/^[\w.-]+\/[\w.-]+$/.test(conn.repo_full_name)) {
    return json({ error: "That repo name does not look like owner/name" }, 400);
  }

  const ghHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "arcflow-leetping",
  };
  const ghToken = Deno.env.get("GITHUB_TOKEN");
  if (ghToken) ghHeaders["Authorization"] = `Bearer ${ghToken}`;

  const res = await fetch(
    `https://api.github.com/repos/${conn.repo_full_name}/commits?per_page=30`,
    { headers: ghHeaders }
  );
  if (res.status === 404) return json({ error: "Repo not found. Is it public?" }, 404);
  if (res.status === 403 || res.status === 429) {
    return json({ error: "GitHub rate limit hit. Try again in a bit." }, 429);
  }
  if (!res.ok) return json({ error: `GitHub answered ${res.status}` }, 502);
  const commits = (await res.json()) as GhCommit[];

  // Skip shas we already ingested for this user so the detail budget goes to
  // genuinely new commits.
  const shas = commits.map((c) => c.sha);
  const { data: seenRows } = await admin
    .from("leetping_events")
    .select("commit_sha")
    .eq("user_id", uid)
    .in("commit_sha", shas);
  const seen = new Set((seenRows ?? []).map((r) => r.commit_sha));

  let detailBudget = 8;
  const solves: { sha: string; at: string | null; solve: ParsedSolve }[] = [];
  for (const c of commits) {
    if (seen.has(c.sha)) continue;
    let solve = parseFromMessage(c.commit?.message ?? "");
    if (!solve && detailBudget > 0) {
      detailBudget--;
      const d = await fetch(
        `https://api.github.com/repos/${conn.repo_full_name}/commits/${c.sha}`,
        { headers: ghHeaders }
      );
      if (d.ok) {
        const detail = (await d.json()) as { files?: { filename: string }[] };
        for (const f of detail.files ?? []) {
          solve = parseFromPath(f.filename);
          if (solve) break;
        }
      }
    }
    if (solve) solves.push({ sha: c.sha, at: c.commit?.author?.date ?? null, solve });
  }

  if (!conn.share_to_boards) {
    return json({ found: solves.length, inserted: 0, note: "Sharing to boards is turned off" });
  }
  if (solves.length === 0) return json({ found: 0, inserted: 0 });

  const { data: memberships } = await admin
    .from("board_members")
    .select("board_id")
    .eq("user_id", uid);
  const boards = (memberships ?? []).map((m) => m.board_id);
  if (boards.length === 0) return json({ found: solves.length, inserted: 0, note: "No boards" });

  const rows = boards.flatMap((boardId) =>
    solves.map((s) => ({
      board_id: boardId,
      user_id: uid,
      problem_title: s.solve.title,
      problem_slug: s.solve.slug,
      problem_url: s.solve.url,
      difficulty: s.solve.difficulty,
      language: s.solve.language,
      repo_full_name: conn.repo_full_name,
      commit_sha: s.sha,
      committed_at: s.at,
    }))
  );

  const { error: insertError } = await admin
    .from("leetping_events")
    .upsert(rows, { onConflict: "board_id,user_id,commit_sha", ignoreDuplicates: true });
  if (insertError) return json({ error: insertError.message }, 500);

  return json({ found: solves.length, boards: boards.length });
});
