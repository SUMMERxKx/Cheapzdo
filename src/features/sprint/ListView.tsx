import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
const col = createColumnHelper<Task>();

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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left">
        <thead className="border-b border-border bg-secondary/40">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted-foreground"
                  onClick={h.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3" />}
                    {h.column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3" />}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onOpen(row.original)}
              className={cn(
                "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/30",
                row.original.is_blocker && "bg-destructive/5"
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
