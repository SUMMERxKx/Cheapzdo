import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GripVertical, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { MemberChip, PriorityDot, TypeChip } from "@/components/itemAtoms";
import { keyBetween } from "@/lib/fractionalIndex";
import { moveTask, type Task } from "@/lib/supabase/tasks";
import { reorderStatuses, type BoardStatus } from "@/lib/supabase/statuses";
import type { WorkItemType } from "@/lib/supabase/workItemTypes";
import type { RosterMember } from "@/lib/supabase/members";
import type { Epic } from "@/lib/supabase/epics";

// Kanban columns are the board's statuses. Cards can be dragged within and
// across columns. During a drag we sort a local copy of the grouping so columns
// part in real time, then the drop commits one move_task call with a fresh
// fractional position. On error we refetch and the board snaps back.

interface Ctx {
  types: WorkItemType[];
  roster: RosterMember[];
  epics: Epic[];
}

function Card({
  task,
  ctx,
  onOpen,
  overlay,
}: {
  task: Task;
  ctx: Ctx;
  onOpen?: (t: Task) => void;
  overlay?: boolean;
}) {
  const type = ctx.types.find((t) => t.id === task.type_id);
  const assignee = ctx.roster.find((m) => m.user_id === task.assignee_id);
  const epic = ctx.epics.find((e) => e.id === task.epic_id);
  return (
    <div
      onClick={() => onOpen?.(task)}
      className={cn(
        "cursor-pointer space-y-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40",
        task.is_blocker && "border-destructive/40",
        overlay && "rotate-2 shadow-2xl ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-start gap-2">
        {task.is_blocker && (
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
        )}
        <p className="flex-1 text-sm leading-snug">{task.title}</p>
      </div>
      {epic && (
        <p className="truncate font-mono text-[10px] text-muted-foreground">{epic.title}</p>
      )}
      <div className="flex items-center gap-2">
        <PriorityDot priority={task.priority} />
        <TypeChip type={type} />
        <span className="ml-auto">
          <MemberChip member={assignee} size={5} />
        </span>
      </div>
    </div>
  );
}

function SortableCard({
  task,
  ctx,
  onOpen,
  disabled,
}: {
  task: Task;
  ctx: Ctx;
  onOpen: (t: Task) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <Card task={task} ctx={ctx} onOpen={onOpen} />
    </div>
  );
}

function Column({
  status,
  tasks,
  ctx,
  onOpen,
  disabled,
}: {
  status: BoardStatus;
  tasks: Task[];
  ctx: Ctx;
  onOpen: (t: Task) => void;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  // The column itself is draggable by its header grip so the board layout can
  // be rearranged in place. Cards keep their own drag behavior inside.
  const colSort = useSortable({
    id: `col:${status.id}`,
    data: { type: "column" },
    disabled,
  });

  return (
    <div
      ref={colSort.setNodeRef}
      style={{ transform: CSS.Transform.toString(colSort.transform), transition: colSort.transition }}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col rounded-xl bg-secondary/40",
        colSort.isDragging && "opacity-60 ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {!disabled && (
          <button
            className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
            aria-label={`Drag to move the ${status.name} column`}
            {...colSort.attributes}
            {...colSort.listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color ?? undefined }} />
        <span className="text-sm font-medium">{status.name}</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-b-xl p-2 pt-0 transition-colors",
            isOver && "bg-primary/5"
          )}
        >
          {tasks.map((t) => (
            <SortableCard key={t.id} task={t} ctx={ctx} onOpen={onOpen} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanView({
  boardId,
  sprintId,
  tasks,
  statuses,
  ctx,
  canEdit,
  onOpen,
}: {
  boardId: string;
  sprintId: string | null;
  tasks: Task[];
  statuses: BoardStatus[];
  ctx: Ctx;
  canEdit: boolean;
  onOpen: (t: Task) => void;
}) {
  const qc = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Local grouping that mirrors the query data and is mutated live during drag.
  const [groups, setGroups] = useState<Record<string, Task[]>>({});
  const [active, setActive] = useState<Task | null>(null);
  // Column drags stay on the horizontal axis, cards move freely between columns.
  const [draggingColumn, setDraggingColumn] = useState(false);
  // Column order mirrors statuses and is reordered live during a column drag.
  const [colOrder, setColOrder] = useState<string[]>([]);
  const orderedStatuses = useMemo(() => {
    const byId = new Map(statuses.map((s) => [s.id, s]));
    const ordered = colOrder.map((id) => byId.get(id)).filter(Boolean) as BoardStatus[];
    return ordered.length === statuses.length ? ordered : statuses;
  }, [colOrder, statuses]);

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = {};
    statuses.forEach((s) => (g[s.id] = []));
    tasks.forEach((t) => {
      const key = t.status_id && g[t.status_id] ? t.status_id : statuses[0]?.id;
      if (key) g[key].push(t);
    });
    Object.values(g).forEach((list) => list.sort((a, b) => (a.position < b.position ? -1 : 1)));
    return g;
  }, [tasks, statuses]);

  useEffect(() => {
    setGroups(grouped);
  }, [grouped]);

  useEffect(() => {
    setColOrder(statuses.map((s) => s.id));
  }, [statuses]);

  const columnOf = (id: string): string | undefined => {
    if (groups[id]) return id;
    return Object.keys(groups).find((col) => groups[col].some((t) => t.id === id));
  };

  const isColumnDrag = (id: unknown) => String(id).startsWith("col:");

  const onDragStart = (e: DragStartEvent) => {
    if (isColumnDrag(e.active.id)) {
      setDraggingColumn(true);
      return;
    }
    const col = columnOf(String(e.active.id));
    const t = col ? groups[col].find((x) => x.id === e.active.id) : undefined;
    setActive(t ?? null);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active: a, over } = e;
    if (!over) return;
    // Column drags reorder the column strip live.
    if (isColumnDrag(a.id)) {
      if (!isColumnDrag(over.id) || a.id === over.id) return;
      setColOrder((prev) => {
        const from = prev.indexOf(String(a.id).slice(4));
        const to = prev.indexOf(String(over.id).slice(4));
        if (from < 0 || to < 0) return prev;
        return arrayMove(prev, from, to);
      });
      return;
    }
    const from = columnOf(String(a.id));
    const to = columnOf(String(over.id));
    if (!from || !to || from === to) return;
    setGroups((prev) => {
      const task = prev[from].find((t) => t.id === a.id);
      if (!task) return prev;
      const overIndex = prev[to].findIndex((t) => t.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
      const next = { ...prev };
      next[from] = prev[from].filter((t) => t.id !== a.id);
      next[to] = [...prev[to].slice(0, insertAt), task, ...prev[to].slice(insertAt)];
      return next;
    });
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active: a, over } = e;
    setActive(null);
    setDraggingColumn(false);
    // Commit a column reorder in one atomic call.
    if (isColumnDrag(a.id)) {
      const res = await reorderStatuses(boardId, colOrder);
      if (!res.ok) {
        toast.error(res.error.message);
        setColOrder(statuses.map((s) => s.id));
      }
      void qc.invalidateQueries({ queryKey: ["board", boardId, "statuses"] });
      return;
    }
    if (!over) {
      setGroups(grouped);
      return;
    }
    const col = columnOf(String(over.id)) ?? columnOf(String(a.id));
    if (!col) return;

    // Reorder within the resolved column, then compute the fractional key from
    // the dropped card's neighbors.
    const list = [...groups[col]];
    const fromIndex = list.findIndex((t) => t.id === a.id);
    if (fromIndex < 0) return;
    let toIndex = list.findIndex((t) => t.id === over.id);
    if (toIndex < 0) toIndex = list.length - 1;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    const before = list[toIndex - 1]?.position ?? null;
    const after = list[toIndex + 1]?.position ?? null;
    let position: string;
    try {
      position = keyBetween(before, after);
    } catch {
      position = keyBetween(list[list.length - 2]?.position ?? null, null);
    }

    setGroups((prev) => ({ ...prev, [col]: list.map((t) => (t.id === moved.id ? { ...t, position, status_id: col } : t)) }));

    const res = await moveTask({ taskId: moved.id, statusId: col, position });
    if (!res.ok) {
      toast.error(res.error.message);
    }
    void qc.invalidateQueries({ queryKey: ["board", boardId, "tasks", { sprintId }] });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      autoScroll={{ threshold: { x: 0.15, y: 0.15 } }}
      modifiers={draggingColumn ? [restrictToHorizontalAxis] : undefined}
      onDragStart={canEdit ? onDragStart : undefined}
      onDragOver={canEdit ? onDragOver : undefined}
      onDragEnd={canEdit ? onDragEnd : undefined}
      onDragCancel={() => {
        setActive(null);
        setDraggingColumn(false);
      }}
    >
      <SortableContext
        items={orderedStatuses.map((s) => `col:${s.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex snap-x gap-3 overflow-x-auto pb-3">
          {orderedStatuses.map((s) => (
            <Column
              key={s.id}
              status={s}
              tasks={groups[s.id] ?? []}
              ctx={ctx}
              onOpen={onOpen}
              disabled={!canEdit}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>{active ? <Card task={active} ctx={ctx} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
