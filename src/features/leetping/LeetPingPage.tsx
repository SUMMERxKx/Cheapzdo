import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Github, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { MemberChip } from "@/components/itemAtoms";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/design/motion";
import { useAuth } from "@/features/auth/useAuth";
import { useRoster } from "@/features/boards/useBoardData";
import {
  deleteConnection,
  getMyConnection,
  listLeetPingEvents,
  saveConnection,
  syncNow,
} from "@/lib/supabase/leetping";
import { queryKeys } from "@/lib/supabase/queryKeys";

const ALL = "all";

const DIFFICULTY_TONE: Record<string, string> = {
  Easy: "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  Hard: "bg-destructive/15 text-destructive",
};

function useConnection(userId: string | undefined) {
  return useQuery({
    queryKey: ["me", "githubConnection"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await getMyConnection(userId as string);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

function useFeed(boardId: string) {
  return useQuery({
    queryKey: queryKeys.leetping(boardId),
    enabled: !!boardId,
    queryFn: async () => {
      const res = await listLeetPingEvents(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export default function LeetPingPage() {
  const { boardId = "" } = useParams();
  const { user } = useAuth();
  const roster = useRoster(boardId);
  const connection = useConnection(user?.id);
  const feed = useFeed(boardId);
  const qc = useQueryClient();

  const [username, setUsername] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [repo, setRepo] = useState("");
  const [share, setShare] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [memberFilter, setMemberFilter] = useState(ALL);

  const conn = connection.data;

  const save = async () => {
    if (!user) return;
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.trim())) {
      toast.error("The repo should look like username/leetcode");
      return;
    }
    setSaving(true);
    const res = await saveConnection({
      userId: user.id,
      githubUsername: username,
      repoFullName: repo,
      shareToBoards: share,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("GitHub repo connected. Run a sync to pull your solves.");
    void qc.invalidateQueries({ queryKey: ["me", "githubConnection"] });
  };

  const toggleShare = async (next: boolean) => {
    if (!user || !conn) return;
    const res = await saveConnection({
      userId: user.id,
      githubUsername: conn.github_username ?? "",
      repoFullName: conn.repo_full_name ?? "",
      shareToBoards: next,
    });
    if (!res.ok) toast.error(res.error.message);
    void qc.invalidateQueries({ queryKey: ["me", "githubConnection"] });
  };

  const disconnect = () => {
    if (!user) return;
    setConfirmDisconnect(true);
  };
  const doDisconnect = async () => {
    if (!user) return;
    const res = await deleteConnection(user.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["me", "githubConnection"] });
  };

  const runSync = async () => {
    setSyncing(true);
    const res = await syncNow();
    setSyncing(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    const note = res.data.note ? ` (${res.data.note})` : "";
    toast.success(`Found ${res.data.found} solve${res.data.found === 1 ? "" : "s"}${note}`);
    void qc.invalidateQueries({ queryKey: queryKeys.leetping(boardId) });
  };

  const events = useMemo(() => {
    const list = feed.data ?? [];
    if (memberFilter === ALL) return list;
    return list.filter((e) => e.user_id === memberFilter);
  }, [feed.data, memberFilter]);

  const memberOf = (id: string) => (roster.data ?? []).find((m) => m.user_id === id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Github className="h-5 w-5" />
        <h1 className="font-display text-xl font-bold tracking-tight">LeetPing</h1>
        <div className="ml-auto flex items-center gap-2">
          {(feed.data ?? []).length > 0 && (
            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Everyone</SelectItem>
                {(roster.data ?? []).map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {conn && (
            <Button size="sm" variant="outline" onClick={runSync} disabled={syncing}>
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          )}
        </div>
      </div>

      {connection.isLoading ? null : conn ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Github className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm">{conn.repo_full_name}</p>
            <p className="text-xs text-muted-foreground">
              Solves are read from this repo's commits.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={conn.share_to_boards}
              onCheckedChange={(v) => void toggleShare(v === true)}
            />
            Share to my boards
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={disconnect}
            aria-label="Disconnect GitHub"
          >
            <Unplug className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-base font-semibold">Connect your LeetCode repo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tools like LeetHub push every accepted solution to a public GitHub
              repo. Point Arcflow at it and your solves show up here for the team.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gh-user">GitHub username</Label>
              <Input
                id="gh-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="octocat"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gh-repo">Repo (owner/name)</Label>
              <Input
                id="gh-repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="octocat/leetcode"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={share} onCheckedChange={(v) => setShare(v === true)} />
            Share my solves with my boards
          </label>
          <Button onClick={save} disabled={saving || !repo.trim() || !username.trim()}>
            {saving ? "Connecting…" : "Connect repo"}
          </Button>
        </div>
      )}

      {events.length === 0 && !feed.isLoading ? (
        <EmptyState
          icon={Github}
          title="No solves yet"
          description={
            conn
              ? "Run a sync after your next accepted solution and it lands here."
              : "Once someone connects their LeetCode repo, their solves show up for the whole board."
          }
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((e) => {
              const member = memberOf(e.user_id);
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={spring.soft}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <MemberChip member={member} size={6} />
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{member?.display_name ?? "Someone"}</span>{" "}
                    solved{" "}
                    <span className="font-medium text-primary">
                      {e.problem_title ?? e.problem_slug}
                    </span>
                  </p>
                  {e.difficulty && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium",
                        DIFFICULTY_TONE[e.difficulty] ?? "bg-secondary text-muted-foreground"
                      )}
                    >
                      {e.difficulty}
                    </span>
                  )}
                  {e.language && (
                    <span className="font-mono text-[11px] text-muted-foreground">{e.language}</span>
                  )}
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {e.committed_at
                      ? formatDistanceToNow(new Date(e.committed_at), { addSuffix: true })
                      : ""}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect GitHub"
        description="Past events stay on your boards. You can reconnect anytime."
        confirmText="Disconnect"
        variant="destructive"
        onConfirm={doDisconnect}
      />
    </div>
  );
}
