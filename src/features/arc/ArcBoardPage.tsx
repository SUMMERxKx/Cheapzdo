import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Archive, Layers, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { MemberChip, PriorityDot, TypeChip } from "@/components/itemAtoms";
import { RadialGauge } from "@/lib/design/charts/RadialGauge";
import { useMotion } from "@/lib/design/motion";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster, useTypes } from "@/features/boards/useBoardData";
import { useArcs, useEpicRollups, useEpics } from "@/features/sprint/useBoardWork";
import { startNewArc } from "@/lib/supabase/arcs";
import type { Epic } from "@/lib/supabase/epics";
import { CreateEpicDialog } from "./CreateEpicDialog";
import { EpicDetailSheet } from "./EpicDetailSheet";

const BACKLOG = "backlog";

export default function ArcBoardPage() {
  const { boardId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePermissions(boardId);
  const { fadeUp, stagger } = useMotion();
  const qc = useQueryClient();

  const arcs = useArcs(boardId);
  const activeArc = (arcs.data ?? []).find((a) => a.is_active);
  const selected = params.get("arc") ?? activeArc?.id ?? BACKLOG;
  const arcId = selected === BACKLOG ? null : selected;

  const epics = useEpics(boardId, arcId);
  const rollups = useEpicRollups(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const [openEpic, setOpenEpic] = useState<Epic | null>(null);
  const [starting, setStarting] = useState(false);

  const rollupOf = useMemo(() => {
    const map = new Map<string, { pct: number; done: number; total: number }>();
    (rollups.data ?? []).forEach((r) =>
      map.set(r.epic_id, { pct: r.pct_done, done: r.done_count, total: r.task_count })
    );
    return map;
  }, [rollups.data]);

  const list = epics.data ?? [];
  const lastPosition = list.length ? list[list.length - 1].position : null;

  const newArc = async () => {
    if (!window.confirm("Start the next arc? The current arc is kept as history and a fresh set of sprints is created.")) return;
    setStarting(true);
    const res = await startNewArc({ boardId });
    setStarting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("New arc started");
    void qc.invalidateQueries({ queryKey: ["board", boardId] });
    setParams((p) => {
      p.set("arc", res.data);
      return p;
    });
  };

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight">Arc Board</h2>
        <Select
          value={selected}
          onValueChange={(v) =>
            setParams((p) => {
              p.set("arc", v);
              return p;
            })
          }
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(arcs.data ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
                {a.is_active ? " · active" : ""}
              </SelectItem>
            ))}
            <SelectItem value={BACKLOG}>Backlog (no arc)</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={newArc} disabled={starting}>
              <Rocket className="mr-1.5 h-4 w-4" />
              {starting ? "Starting…" : "Start new arc"}
            </Button>
          )}
          {canEdit && (
            <CreateEpicDialog boardId={boardId} arcId={arcId} lastPosition={lastPosition} />
          )}
        </div>
      </div>

      {list.length === 0 && !epics.isLoading ? (
        <EmptyState
          icon={arcId === null ? Archive : Layers}
          title={arcId === null ? "The backlog is empty" : "No epics in this arc yet"}
          description={
            canEdit
              ? "Epics are the big streams of work. Sprint tasks always belong to one."
              : "Epics show up here once an editor creates them."
          }
          action={
            canEdit ? (
              <CreateEpicDialog boardId={boardId} arcId={arcId} lastPosition={lastPosition} />
            ) : undefined
          }
        />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {list.map((e) => {
            const roll = rollupOf.get(e.id) ?? { pct: 0, done: 0, total: 0 };
            const type = (types.data ?? []).find((t) => t.id === e.type_id);
            const assignee = (roster.data ?? []).find((m) => m.user_id === e.assignee_id);
            return (
              <motion.button
                key={e.id}
                variants={fadeUp}
                onClick={() => setOpenEpic(e)}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                <RadialGauge value={roll.pct} label={`${roll.done} of ${roll.total} tasks done`} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-sm font-medium group-hover:text-primary">
                    {e.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityDot priority={e.priority} />
                    <TypeChip type={type} />
                    <Badge variant="secondary" className="font-mono text-[10px] tabular-nums">
                      {roll.done}/{roll.total}
                    </Badge>
                    <span className="ml-auto">
                      <MemberChip member={assignee} size={5} />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <EpicDetailSheet boardId={boardId} epic={openEpic} onClose={() => setOpenEpic(null)} />
    </div>
  );
}
