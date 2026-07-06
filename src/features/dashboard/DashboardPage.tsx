import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, BarChart3, CheckCircle2, TriangleAlert } from "lucide-react";
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
import { useRoster, useStatuses } from "@/features/boards/useBoardData";
import { useSprints } from "@/features/sprint/useBoardWork";
import { listAllTasks, type Task } from "@/lib/supabase/tasks";
import type { BoardStatus } from "@/lib/supabase/statuses";
import { computeBurndown } from "./burndown";

const WHOLE_BOARD = "board";

function useAllTasks(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId, "tasks", "all"],
    enabled: !!boardId,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await listAllTasks(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Activity; tone?: string }) {
  const { reduced } = useMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring.soft}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-secondary", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-display text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

// Donut of tasks by status, colored by each status's stored color.
function StatusDonut({ tasks, statuses }: { tasks: Task[]; statuses: BoardStatus[] }) {
  const { reduced } = useMotion();
  const size = 148;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = tasks.length || 1;

  let offset = 0;
  const segments = statuses
    .map((s) => {
      const count = tasks.filter((t) => t.status_id === s.id).length;
      const frac = count / total;
      const seg = { status: s, count, frac, offset };
      offset += frac;
      return seg;
    })
    .filter((s) => s.count > 0);

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
          {segments.map((seg) => (
            <motion.circle
              key={seg.status.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              stroke={seg.status.color ?? "hsl(var(--primary))"}
              strokeDasharray={`${seg.frac * c} ${c}`}
              initial={{ strokeDashoffset: reduced ? -seg.offset * c : 0, opacity: reduced ? 1 : 0 }}
              animate={{ strokeDashoffset: -seg.offset * c, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.5, ease: [0.2, 0, 0, 1] }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums">{tasks.length}</span>
          <span className="text-[10px] text-muted-foreground">tasks</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.status.id} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.status.color ?? undefined }} />
            <span className="text-muted-foreground">{seg.status.name}</span>
            <span className="font-mono tabular-nums">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Burndown({ tasks, sprintStart, sprintEnd, statuses }: { tasks: Task[]; sprintStart: string; sprintEnd: string; statuses: BoardStatus[] }) {
  const { reduced } = useMotion();
  const doneIds = new Set(statuses.filter((s) => s.category === "done").map((s) => s.id));
  const points = computeBurndown(
    tasks.map((t) => ({
      doneAt: t.status_id && doneIds.has(t.status_id) ? t.updated_at : null,
      createdAt: t.created_at,
    })),
    sprintStart,
    sprintEnd
  );

  const w = 560;
  const h = 180;
  const pad = 24;
  const maxY = Math.max(1, points[0]?.ideal ?? 1);
  const x = (day: number) => pad + (day / Math.max(1, points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - (v / maxY) * (h - pad * 2);

  const idealPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.day)},${y(p.ideal)}`).join(" ");
  const actualPts = points.filter((p) => p.actual !== null);
  const actualPath = actualPts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.day)},${y(p.actual as number)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={w - pad}
          y1={y(maxY * f)}
          y2={y(maxY * f)}
          className="stroke-border"
          strokeDasharray="3 5"
        />
      ))}
      <path d={idealPath} fill="none" strokeDasharray="5 5" className="stroke-muted-foreground/50" strokeWidth={1.5} />
      {actualPts.length > 1 && (
        <motion.path
          d={actualPath}
          fill="none"
          className="stroke-[hsl(var(--primary))]"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.2, 0, 0, 1] }}
        />
      )}
      <text x={pad} y={h - 6} className="fill-current font-mono text-[9px] text-muted-foreground">
        day 0
      </text>
      <text x={w - pad} y={h - 6} textAnchor="end" className="fill-current font-mono text-[9px] text-muted-foreground">
        day {points.length - 1}
      </text>
    </svg>
  );
}

function HBar({ label, value, max, color, chip }: { label: string; value: number; max: number; color?: string; chip?: React.ReactNode }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      {chip}
      <span className="w-24 truncate text-xs text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color ?? "hsl(var(--primary))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={spring.gentle}
        />
      </div>
      <span className="w-6 text-right font-mono text-xs tabular-nums">{value}</span>
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "hsl(var(--destructive))",
  high: "hsl(var(--warning))",
  medium: "hsl(var(--primary))",
  low: "hsl(var(--muted-foreground))",
};

export default function DashboardPage() {
  const { boardId = "" } = useParams();
  const sprints = useSprints(boardId);
  const statuses = useStatuses(boardId);
  const roster = useRoster(boardId);
  const allTasks = useAllTasks(boardId);

  const activeSprint = (sprints.data ?? []).find((s) => s.is_active);
  const [scope, setScope] = useState<string>(WHOLE_BOARD);
  const scopeSprint =
    scope === WHOLE_BOARD ? null : (sprints.data ?? []).find((s) => s.id === scope) ?? null;
  const burnSprint = scopeSprint ?? activeSprint ?? null;

  const tasks = useMemo(() => {
    const list = allTasks.data ?? [];
    return scopeSprint ? list.filter((t) => t.sprint_id === scopeSprint.id) : list;
  }, [allTasks.data, scopeSprint]);

  const doneIds = useMemo(
    () => new Set((statuses.data ?? []).filter((s) => s.category === "done").map((s) => s.id)),
    [statuses.data]
  );
  const inProgressIds = useMemo(
    () => new Set((statuses.data ?? []).filter((s) => s.category === "in_progress").map((s) => s.id)),
    [statuses.data]
  );

  const done = tasks.filter((t) => t.status_id && doneIds.has(t.status_id));
  const active = tasks.filter((t) => t.status_id && inProgressIds.has(t.status_id));
  const blockers = tasks.filter((t) => t.is_blocker && !(t.status_id && doneIds.has(t.status_id)));

  const burnTasks = useMemo(() => {
    if (!burnSprint) return [];
    return (allTasks.data ?? []).filter((t) => t.sprint_id === burnSprint.id);
  }, [allTasks.data, burnSprint]);

  const workload = useMemo(() => {
    const open = tasks.filter((t) => !(t.status_id && doneIds.has(t.status_id)));
    const byMember = new Map<string, number>();
    open.forEach((t) => {
      if (t.assignee_id) byMember.set(t.assignee_id, (byMember.get(t.assignee_id) ?? 0) + 1);
    });
    return [...byMember.entries()]
      .map(([id, count]) => ({ member: (roster.data ?? []).find((m) => m.user_id === id), count }))
      .filter((w) => w.member)
      .sort((a, b) => b.count - a.count);
  }, [tasks, doneIds, roster.data]);

  const priorities = (["critical", "high", "medium", "low"] as const).map((p) => ({
    p,
    count: tasks.filter((t) => t.priority === p).length,
  }));
  const maxPriority = Math.max(1, ...priorities.map((x) => x.count));

  if ((allTasks.data ?? []).length === 0 && !allTasks.isLoading) {
    return (
      <div className="p-5">
        <EmptyState
          icon={BarChart3}
          title="Nothing to chart yet"
          description="Create some tasks on the Sprint Board and the dashboard lights up."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl font-bold tracking-tight">Dashboard</h1>
        <div className="ml-auto">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WHOLE_BOARD}>Whole board</SelectItem>
              {(sprints.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.is_active ? " · active" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tasks in scope" value={tasks.length} icon={BarChart3} />
        <Metric label="In progress" value={active.length} icon={Activity} tone="text-info" />
        <Metric label="Done" value={done.length} icon={CheckCircle2} tone="text-success" />
        <Metric label="Open blockers" value={blockers.length} icon={TriangleAlert} tone="text-destructive" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="font-display text-sm font-semibold">Burndown</h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              {burnSprint ? `${burnSprint.name} · done day is an estimate` : "no sprint"}
            </span>
          </div>
          {burnSprint?.start_date && burnSprint?.end_date ? (
            <Burndown
              tasks={burnTasks}
              sprintStart={burnSprint.start_date}
              sprintEnd={burnSprint.end_date}
              statuses={statuses.data ?? []}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No dated sprint to chart.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h3 className="mb-3 font-display text-sm font-semibold">By status</h3>
          <StatusDonut tasks={tasks} statuses={statuses.data ?? []} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold">By priority</h3>
          <div className="space-y-2.5">
            {priorities.map(({ p, count }) => (
              <HBar key={p} label={p} value={count} max={maxPriority} color={PRIORITY_COLORS[p]} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold">Open work by member</h3>
          {workload.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing open is assigned right now.
            </p>
          ) : (
            <div className="space-y-2.5">
              {workload.map((wl) => (
                <HBar
                  key={wl.member!.user_id}
                  label={wl.member!.display_name}
                  value={wl.count}
                  max={workload[0].count}
                  chip={<MemberChip member={wl.member!} size={5} />}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-destructive">
            <TriangleAlert className="h-4 w-4" />
            Open blockers
          </h3>
          <div className="space-y-1.5">
            {blockers.map((b) => (
              <div key={b.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate">{b.title}</span>
                <MemberChip member={(roster.data ?? []).find((m) => m.user_id === b.assignee_id)} size={5} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
