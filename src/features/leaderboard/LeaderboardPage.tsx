import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Crown, Info, Trophy, Users } from "lucide-react";
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
import { spring, useMotion } from "@/lib/design/motion";
import { useRoster, useTeams } from "@/features/boards/useBoardData";
import { useSprints } from "@/features/sprint/useBoardWork";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/supabase/leaderboardApi";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { teamScores, UNASSIGNED_TEAM, type TeamScore } from "./score";

const OVERALL = "overall";

function useLeaderboard(boardId: string, sprintId: string | null) {
  return useQuery({
    queryKey: queryKeys.leaderboard(boardId, sprintId),
    enabled: !!boardId,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetchLeaderboard(boardId, sprintId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

// One scoring pillar as a labeled mini bar.
function Pillar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-24 space-y-1">
      <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>{label}</span>
        <span>
          {Math.round(value)}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={spring.gentle}
        />
      </div>
    </div>
  );
}

function Podium({
  entries,
}: {
  entries: { key: string; label: string; total: number; sub: string; avatar?: React.ReactNode }[];
}) {
  const { reduced } = useMotion();
  if (entries.length === 0) return null;
  // Second place left, first center, third right.
  const order = [entries[1], entries[0], entries[2]].filter(Boolean) as typeof entries;
  const heights: Record<string, number> = { 0: 132, 1: 96, 2: 72 };

  return (
    <div className="flex items-end justify-center gap-3 pt-4">
      {order.map((e) => {
        const rank = entries.indexOf(e);
        return (
          <div key={e.key} className="flex w-32 flex-col items-center gap-2">
            {rank === 0 && <Crown className="h-5 w-5 text-warning" />}
            {e.avatar}
            <span className="max-w-full truncate text-sm font-medium">{e.label}</span>
            <motion.div
              initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={
                reduced
                  ? { opacity: 1 }
                  : { height: heights[rank], opacity: 1 }
              }
              transition={spring.snappy}
              style={reduced ? { height: heights[rank] } : undefined}
              className={cn(
                "flex w-full flex-col items-center justify-end rounded-t-xl border border-b-0 pb-2",
                rank === 0 && "border-warning/40 bg-warning/10",
                rank === 1 && "border-border bg-secondary/60",
                rank === 2 && "border-border bg-secondary/30"
              )}
            >
              <span className="font-display text-2xl font-bold tabular-nums">{e.total}</span>
              <span className="font-mono text-[10px] text-muted-foreground">/100 · {e.sub}</span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { boardId = "" } = useParams();
  const sprints = useSprints(boardId);
  const teams = useTeams(boardId);
  const roster = useRoster(boardId);
  const { fadeUp, stagger } = useMotion();

  const [scope, setScope] = useState<string>(OVERALL);
  const [drillTeam, setDrillTeam] = useState<string | null>(null);
  const [showHow, setShowHow] = useState(false);

  const sprintId = scope === OVERALL ? null : scope;
  const board = useLeaderboard(boardId, sprintId);
  const rows = useMemo(
    () => (board.data ?? []).filter((r) => r.assigned > 0),
    [board.data]
  );

  const teamsById = useMemo(() => {
    const m = new Map<string, { name: string; color: string | null }>();
    (teams.data ?? []).forEach((t) => m.set(t.id, { name: t.name, color: t.color }));
    m.set(UNASSIGNED_TEAM, { name: "Unassigned", color: null });
    return m;
  }, [teams.data]);

  const scores: TeamScore[] = useMemo(() => teamScores(rows), [rows]);
  const hasTeams = (teams.data ?? []).length > 0;
  const level: "teams" | "members" = hasTeams && !drillTeam ? "teams" : "members";

  const memberRows = useMemo(() => {
    if (!drillTeam) return rows;
    return rows.filter((r) => (r.team_id ?? UNASSIGNED_TEAM) === drillTeam);
  }, [rows, drillTeam]);

  const memberOf = (id: string) => (roster.data ?? []).find((m) => m.user_id === id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Trophy className="h-5 w-5 text-warning" />
        <h1 className="font-display text-xl font-bold tracking-tight">Leaderboard</h1>
        {drillTeam && (
          <button
            onClick={() => setDrillTeam(null)}
            className="text-xs text-primary hover:underline"
          >
            ← All teams
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OVERALL}>Overall</SelectItem>
              {(sprints.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.is_active ? " · active" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowHow((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
            aria-label="How scoring works"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showHow && (
        <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          Scores are rates out of 100, so having more tasks never means more
          points. <span className="text-foreground">Completion</span> is the share
          of your assigned tasks that are done, up to 50.{" "}
          <span className="text-foreground">Priority</span> is the average weight
          of what you finished, up to 30, harder work counts more.{" "}
          <span className="text-foreground">Momentum</span> is how much of your
          remaining work is actively moving, up to 20. Team scores are the average
          of member scores.
        </div>
      )}

      {rows.length === 0 && !board.isLoading ? (
        <EmptyState
          icon={Trophy}
          title="No scores yet"
          description="Assign tasks to people and finish some work. The board scores itself."
        />
      ) : level === "teams" ? (
        <>
          <Podium
            entries={scores.slice(0, 3).map((s) => {
              const t = teamsById.get(s.teamId);
              return {
                key: s.teamId,
                label: t?.name ?? "Team",
                total: s.total,
                sub: `${s.memberCount} scored`,
                avatar: (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                    style={{ backgroundColor: t?.color ? `${t.color}33` : undefined }}
                  >
                    <Users className="h-4 w-4" />
                  </span>
                ),
              };
            })}
          />
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {scores.map((s, i) => {
              const t = teamsById.get(s.teamId);
              return (
                <motion.button
                  key={s.teamId}
                  variants={fadeUp}
                  onClick={() => setDrillTeam(s.teamId)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
                >
                  <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: t?.color ?? "transparent" }}
                  />
                  <span className="flex-1 truncate text-sm font-medium">{t?.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.memberCount} member{s.memberCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums">{s.total}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </>
      ) : (
        <>
          <Podium
            entries={memberRows.slice(0, 3).map((r) => ({
              key: r.user_id,
              label: r.display_name,
              total: r.total,
              sub: `${r.done}/${r.assigned} done`,
              avatar: <MemberChip member={memberOf(r.user_id)} />,
            }))}
          />
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {memberRows.map((r, i) => (
              <motion.div
                key={r.user_id}
                variants={fadeUp}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="w-6 text-center font-mono text-sm tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <MemberChip member={memberOf(r.user_id)} size={5} />
                <span className="min-w-24 flex-1 truncate text-sm font-medium">
                  {r.display_name}
                </span>
                <div className="flex gap-3">
                  <Pillar label="Done" value={r.completion ?? 0} max={50} tone="bg-success" />
                  <Pillar label="Weight" value={r.priority ?? 0} max={30} tone="bg-warning" />
                  <Pillar label="Motion" value={r.momentum ?? 0} max={20} tone="bg-info" />
                </div>
                <span className="ml-auto font-display text-lg font-bold tabular-nums">
                  {r.total}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
