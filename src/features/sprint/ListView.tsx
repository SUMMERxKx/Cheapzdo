import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ArrowDown, ArrowUp, GripVertical, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { keyBetween } from "@/lib/fractionalIndex";
import { moveTask } from "@/lib/supabase/tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MemberChip,
  PRIORITY_LABEL,
  PriorityBadge,
  StatusPill,
  TypeChip,
} from "@/components/itemAtoms";
import { updateTask, type Priority, type Task } from "@/lib/supabase/tasks";
import type { BoardStatus } from "@/lib/supabase/statuses";
import type { WorkItemType } from "@/lib/supabase/workItemTypes";
import type { RosterMember } from "@/lib/supabase/members";
import type { Epic } from "@/lib/supabase/epics";

// The default sprint view, a dense sortable grid with inline status and priority
// edits. Row click opens the detail sheet, the inline selects stop propagation.
// Headers drag left and right to rearrange columns (saved per user), and rows
// drag up and down to reorder tasks when no header sort is active.
const col = createColumnHelper<Task>();

const DEFAULT_COLUMN_ORDER = ["type", "title", "epic", "assignee", "status", "priority"];

function HeaderCell({
  header,
  children,
}: {
  header: { column: { id: string; getToggleSortingHandler: () => ((e: unknown) => void) | undefined } };
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `th:${header.column.id}`,
  });
  return (
    <th
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "select-none px-3 py-2 text-xs font-medium text-muted-foreground",
        isDragging && "opacity-50"
      )}
    >
      <span className="inline-flex items-center gap-1">
        <button
          className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
          aria-label="Drag to move column"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <button className="inline-flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
          {children}
        </button>
      </span>
    </th>
  );
}

function BodyRow({
  row,
  onOpen,
  draggable,
  children,
}: {
  row: { id: string; original: Task };
  onOpen: (t: Task) => void;
  draggable: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
    disabled: !draggable,
  });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onOpen(row.original)}
      className={cn(
        "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/30",
        row.original.is_blocker && "bg-destructive/5",
        isDragging && "opacity-50"
      )}
    >
      <td className="w-8 px-2 py-2">
        {draggable && (
          <button
            className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground"
            aria-label="Drag to reorder task"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
      {children}
    </tr>
  );
}

export function ListView({
  boardId,
  tasks,
  statuses,
  types,
  roster,
  epics,
  canEdit,
  onOpen,
}: {
  boardId: string;
  tasks: Task[];
  statuses: BoardStatus[];
  types: WorkItemType[];
  roster: RosterMember[];
  epics: Epic[];
  canEdit: boolean;
  onOpen: (t: Task) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const qc = useQueryClient();
  const storedOrder = useUiStore((s) => s.listColumnOrder);
  const setStoredOrder = useUiStore((s) => s.setListColumnOrder);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    storedOrder.length === DEFAULT_COLUMN_ORDER.length ? storedOrder : DEFAULT_COLUMN_ORDER
  );

  useEffect(() => {
    if (storedOrder.length === DEFAULT_COLUMN_ORDER.length) setColumnOrder(storedOrder);
  }, [storedOrder]);

  // Manual row ordering only makes sense in position order, so it turns off
  // while a header sort is active.
  const rowsDraggable = canEdit && sorting.length === 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["board", boardId, "tasks"] });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  const patch = async (id: string, updates: Parameters<typeof updateTask>[1]) => {
    const res = await updateTask(id, updates);
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const columns = useMemo(
    () => [
      col.accessor((t) => types.find((x) => x.id === t.type_id)?.name ?? "", {
        id: "type",
        header: "Type",
        cell: (info) => <TypeChip type={types.find((x) => x.id === info.row.original.type_id)} />,
      }),
      col.accessor("title", {
        header: "Title",
        cell: (info) => (
          <span className="flex items-center gap-1.5">
            {info.row.original.is_blocker && (
              <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            <span className="text-sm">{info.getValue()}</span>
          </span>
        ),
      }),
      col.accessor((t) => epics.find((e) => e.id === t.epic_id)?.title ?? "", {
        id: "epic",
        header: "Epic",
        cell: (info) => (
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),
      col.accessor((t) => roster.find((m) => m.user_id === t.assignee_id)?.display_name ?? "", {
        id: "assignee",
        header: "Assignee",
        cell: (info) => (
          <MemberChip member={roster.find((m) => m.user_id === info.row.original.assignee_id)} size={5} />
        ),
      }),
      col.accessor((t) => statuses.find((s) => s.id === t.status_id)?.position ?? 99, {
        id: "status",
        header: "Status",
        cell: (info) => {
          const t = info.row.original;
          const st = statuses.find((s) => s.id === t.status_id);
          return canEdit ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Select
                value={t.status_id ?? ""}
                onValueChange={(v) => void patch(t.id, { status_id: v })}
              >
                <SelectTrigger
                  className="h-7 w-28 border-0 text-xs font-medium"
                  style={{
                    backgroundColor: st?.color ? `${st.color}22` : undefined,
                    color: st?.color ?? undefined,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <StatusPill name={s.name} color={s.color} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          ) : (
            <StatusPill name={st?.name} color={st?.color} />
          );
        },
      }),
      col.accessor("priority", {
        header: "Priority",
        cell: (info) => {
          const t = info.row.original;
          const tone: Record<Priority, string> = {
            critical: "bg-destructive/15 text-destructive",
            high: "bg-warning/15 text-warning",
            medium: "bg-primary/15 text-primary",
            low: "bg-muted text-muted-foreground",
          };
          return canEdit ? (
            <span onClick={(e) => e.stopPropagation()}>
              <Select
                value={t.priority}
                onValueChange={(v) => void patch(t.id, { priority: v as Priority })}
              >
                <SelectTrigger className={`h-7 w-28 border-0 text-xs font-medium ${tone[t.priority]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <PriorityBadge priority={p} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          ) : (
            <PriorityBadge priority={t.priority} />
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statuses, types, roster, epics, canEdit]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting, columnOrder },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isHeaderDrag = (id: unknown) => String(id).startsWith("th:");

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    // Column drag: persist the new header order per user.
    if (isHeaderDrag(active.id)) {
      if (!isHeaderDrag(over.id)) return;
      const from = columnOrder.indexOf(String(active.id).slice(3));
      const to = columnOrder.indexOf(String(over.id).slice(3));
      if (from < 0 || to < 0) return;
      const next = arrayMove(columnOrder, from, to);
      setColumnOrder(next);
      setStoredOrder(next);
      return;
    }

    // Row drag: write a fresh fractional position between the drop neighbors.
    const visible = table.getRowModel().rows.map((r) => r.original);
    const from = visible.findIndex((t) => t.id === active.id);
    const to = visible.findIndex((t) => t.id === over.id);
    if (from < 0 || to < 0) return;
    const list = [...visible];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    const before = list[to - 1]?.position ?? null;
    const after = list[to + 1]?.position ?? null;
    let position: string;
    try {
      position = keyBetween(before, after);
    } catch {
      position = keyBetween(list[list.length - 2]?.position ?? null, null);
    }
    const res = await moveTask({ taskId: moved.id, statusId: null, position });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={rowsDraggable ? undefined : [restrictToVerticalAxis]}
      >
        <table className="w-full text-left">
          <thead className="border-b border-border bg-secondary/40">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                <th className="w-8 px-2 py-2" aria-label="Row drag handles" />
                <SortableContext
                  items={hg.headers.map((h) => `th:${h.column.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  {hg.headers.map((h) => (
                    <HeaderCell key={h.id} header={h}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3" />}
                      {h.column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3" />}
                    </HeaderCell>
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            <SortableContext
              items={rows.map((r) => r.original.id)}
              strategy={verticalListSortingStrategy}
            >
              {rows.map((row) => (
                <BodyRow key={row.id} row={row} onOpen={onOpen} draggable={rowsDraggable}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </BodyRow>
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
