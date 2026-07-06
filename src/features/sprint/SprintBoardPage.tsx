import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Kanban,
  ListChecks,
  Rows3,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster, useStatuses, useTypes } from "@/features/boards/useBoardData";
import { useAllEpics, useSprints, useTasks } from "./useBoardWork";
import { closeSprint } from "@/lib/supabase/sprints";
import type { Task } from "@/lib/supabase/tasks";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";

const BACKLOG = "backlog";
const ALL = "all";

export default function SprintBoardPage() {
  const { boardId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePermissions(boardId);
  const qc = useQueryClient();

  const sprints = useSprints(boardId);
  const sprintList = sprints.data ?? [];
  const activeSprint = sprintList.find((s) => s.is_active);

  // URL is the source of truth for the viewed sprint, the view mode, and filters.
  const sprintParam = params.get("sprint") ?? activeSprint?.id ?? (sprintList[0]?.id ?? BACKLOG);
  const sprintId = sprintParam === BACKLOG ? null : sprintParam;
  const view = params.get("view") === "kanban" ? "kanban" : "list";
  const search = params.get("q") ?? "";
  const assigneeFilter = params.get("assignee") ?? ALL;
  const blockersOnly = params.get("blockers") === "1";

  const setParam = (key: string, value: string | null) => {
    setParams(
      (p) => {
        if (value === null || value === "" || value === ALL) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true }
    );
  };

  const tasks = useTasks(boardId, sprintId);
  const statuses = useStatuses(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const epics = useAllEpics(boardId);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [closing, setClosing] = useState(false);

  const viewed = sprintList.find((s) => s.id === sprintId);
  const viewedIndex = viewed ? sprintList.findIndex((s) => s.id === viewed.id) : -1;
  const prev = viewedIndex > 0 ? sprintList[viewedIndex - 1] : null;
  const next = viewedIndex >= 0 && viewedIndex < sprintList.length - 1 ? sprintList[viewedIndex + 1] : null;

  const filtered = useMemo(() => {
    return (tasks.data ?? []).filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (assigneeFilter !== ALL) {
        if (assigneeFilter === "unassigned" && t.assignee_id) return false;
        if (assigneeFilter !== "unassigned" && t.assignee_id !== assigneeFilter) return false;
      }
      if (blockersOnly && !t.is_blocker) return false;
      return true;
    });
  }, [tasks.data, search, assigneeFilter, blockersOnly]);

  const lastPosition = useMemo(() => {
    const list = tasks.data ?? [];
    return list.length ? list[list.length - 1].position : null;
  }, [tasks.data]);

  const doCloseSprint = async () => {
    if (!viewed) return;
    const move = window.confirm(
      "Close this sprint?\n\nOK moves unfinished tasks to the next sprint. Cancel keeps everything where it is and only asks about closing."
    );
    if (!move && !window.confirm("Close the sprint without moving unfinished tasks?")) return;
    setClosing(true);
    const res = await closeSprint(viewed.id, move);
    setClosing(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(res.data ? "Sprint closed, the next one is active" : "Sprint closed. That was the last one, start a new arc from the Arc Board.");
    void qc.invalidateQueries({ queryKey: ["board", boardId] });
    if (res.data) setParam("sprint", res.data);
  };

  const ctx = {
    types: types.data ?? [],
    roster: roster.data ?? [],
    epics: epics.data ?? [],
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border p-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!prev}
            onClick={() => prev && setParam("sprint", prev.id)}
            aria-label="Previous sprint"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={sprintParam} onValueChange={(v) => setParam("sprint", v)}>
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sprintList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.is_active ? " · active" : ""}
                </SelectItem>
              ))}
              <SelectItem value={BACKLOG}>Backlog (no sprint)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!next}
            onClick={() => next && setParam("sprint", next.id)}
            aria-label="Next sprint"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {viewed?.start_date && viewed?.end_date && (
            <span className="font-mono text-xs text-muted-foreground">
              {format(new Date(viewed.start_date), "MMM d")} to {format(new Date(viewed.end_date), "MMM d")}
            </span>
          )}
          {viewed?.is_active && <Badge className="text-[10px]">Active</Badge>}

          <div className="ml-auto flex items-center gap-2">
            {canEdit && viewed?.is_active && (
              <Button size="sm" variant="outline" onClick={doCloseSprint} disabled={closing}>
                <Check className="mr-1.5 h-4 w-4" />
                {closing ? "Closing…" : "Close sprint"}
              </Button>
            )}
            {canEdit && (
              <CreateTaskDialog boardId={boardId} sprintId={sprintId} lastPosition={lastPosition} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              onClick={() => setParam("view", null)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setParam("view", "kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors",
                view === "kanban" ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setParam("q", e.target.value)}
              placeholder="Search tasks"
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>

          <Select value={assigneeFilter} onValueChange={(v) => setParam("assignee", v)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Everyone</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {(roster.data ?? []).map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={() => setParam("blockers", blockersOnly ? null : "1")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
              blockersOnly
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            Blockers
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {filtered.length === 0 && !tasks.isLoading ? (
          <EmptyState
            icon={ListChecks}
            title={(tasks.data ?? []).length === 0 ? "No tasks in this sprint" : "Nothing matches your filters"}
            description={
              (tasks.data ?? []).length === 0
                ? canEdit
                  ? "Add the first task. Every task belongs to an epic from the Arc Board."
                  : "Tasks appear here once an editor adds them."
                : "Loosen the search or filters to see more."
            }
            action={
              canEdit && (tasks.data ?? []).length === 0 ? (
                <CreateTaskDialog boardId={boardId} sprintId={sprintId} lastPosition={lastPosition} />
              ) : undefined
            }
          />
        ) : view === "kanban" ? (
          <KanbanView
            boardId={boardId}
            sprintId={sprintId}
            tasks={filtered}
            statuses={statuses.data ?? []}
            ctx={ctx}
            canEdit={canEdit}
            onOpen={setOpenTask}
          />
        ) : (
          <ListView
            boardId={boardId}
            tasks={filtered}
            statuses={statuses.data ?? []}
            types={types.data ?? []}
            roster={roster.data ?? []}
            epics={epics.data ?? []}
            canEdit={canEdit}
            onOpen={setOpenTask}
          />
        )}
      </div>

      <TaskDetailSheet boardId={boardId} task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}
