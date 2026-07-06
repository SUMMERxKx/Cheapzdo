import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical, Lock, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { DailyCheckbox } from "./DailyCheckbox";
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
import { MemberChip } from "@/components/itemAtoms";
import { RadialGauge } from "@/lib/design/charts/RadialGauge";
import { spring, useMotion } from "@/lib/design/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster } from "@/features/boards/useBoardData";
import { keyBetween } from "@/lib/fractionalIndex";
import {
  createDailyItem,
  deleteDailyItem,
  listDailyItems,
  updateDailyItem,
  type DailyItem,
  type DailyScope,
} from "@/lib/supabase/daily";
import { queryKeys } from "@/lib/supabase/queryKeys";
import type { RosterMember } from "@/lib/supabase/members";

const UNSET = "none";

function useDaily(boardId: string, scope: DailyScope, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.daily(boardId, scope),
    enabled: !!boardId && !!userId,
    queryFn: async () => {
      const res = await listDailyItems(boardId, scope, userId as string);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

function Row({
  item,
  scope,
  roster,
  canWrite,
  onToggle,
  onRename,
  onDelete,
  onAssign,
  sortable,
}: {
  item: DailyItem;
  scope: DailyScope;
  roster: RosterMember[];
  canWrite: boolean;
  onToggle: (i: DailyItem) => void;
  onRename: (i: DailyItem, title: string) => void;
  onDelete: (i: DailyItem) => void;
  onAssign: (i: DailyItem, assigneeId: string | null) => void;
  sortable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !sortable || !canWrite,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const assignee = roster.find((m) => m.user_id === item.assignee_id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-secondary/30",
        isDragging && "opacity-50"
      )}
    >
      {sortable && canWrite ? (
        <button
          className="cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-4" />
      )}

      <span className={cn(!canWrite && "pointer-events-none opacity-70")}>
        <DailyCheckbox
          checked={item.is_done}
          onToggle={() => onToggle(item)}
          label={item.is_done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
        />
      </span>

      {editing && canWrite ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="h-8"
          onBlur={() => {
            setEditing(false);
            if (draft.trim() && draft !== item.title) onRename(item, draft.trim());
            else setDraft(item.title);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setDraft(item.title);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          onClick={() => canWrite && setEditing(true)}
          className={cn(
            "flex-1 truncate text-left text-sm transition-colors",
            item.is_done && "text-muted-foreground line-through",
            !canWrite && "cursor-default"
          )}
        >
          {item.title}
        </button>
      )}

      {scope === "team" &&
        (canWrite ? (
          <Select
            value={item.assignee_id ?? UNSET}
            onValueChange={(v) => onAssign(item, v === UNSET ? null : v)}
          >
            <SelectTrigger
              className="h-7 w-32 border-0 bg-secondary/60 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>Anyone</SelectItem>
              {roster.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MemberChip member={assignee} size={5} />
            {assignee ? assignee.display_name : "Anyone"}
          </span>
        ))}

      {canWrite && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={() => onDelete(item)}
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function DailyPage() {
  const { boardId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { canEdit } = usePermissions(boardId);
  const roster = useRoster(boardId);
  const qc = useQueryClient();
  const { fadeUp } = useMotion();

  const scope: DailyScope = params.get("lane") === "team" ? "team" : "personal";
  const setScope = (lane: DailyScope) =>
    setParams(
      (p) => {
        if (lane === "personal") p.delete("lane");
        else p.set("lane", lane);
        return p;
      },
      { replace: true }
    );

  const daily = useDaily(boardId, scope, user?.id);
  const [draft, setDraft] = useState("");
  const [draftAssignee, setDraftAssignee] = useState<string>(UNSET);

  // Personal items are always yours to write. Team items follow the board role.
  const canWrite = scope === "personal" ? true : canEdit;

  const items = useMemo(
    () => (daily.data ?? []).slice().sort((a, b) => (a.position < b.position ? -1 : 1)),
    [daily.data]
  );
  const open = items.filter((i) => !i.is_done);
  const done = items.filter((i) => i.is_done);
  const pct = items.length ? (done.length / items.length) * 100 : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const refresh = () => void qc.invalidateQueries({ queryKey: ["board", boardId, "daily"] });

  const add = async () => {
    if (!user || !draft.trim()) return;
    const last = open.length ? open[open.length - 1].position : null;
    const res = await createDailyItem({
      boardId,
      userId: user.id,
      title: draft,
      position: keyBetween(last, null),
      scope,
      assigneeId: draftAssignee === UNSET ? null : draftAssignee,
    });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setDraft("");
    refresh();
  };

  const toggle = async (item: DailyItem) => {
    const res = await updateDailyItem(item.id, { is_done: !item.is_done });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const rename = async (item: DailyItem, title: string) => {
    const res = await updateDailyItem(item.id, { title });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const assign = async (item: DailyItem, assigneeId: string | null) => {
    const res = await updateDailyItem(item.id, { assignee_id: assigneeId });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const remove = async (item: DailyItem) => {
    const res = await deleteDailyItem(item.id);
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = open.findIndex((i) => i.id === active.id);
    const to = open.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    const list = [...open];
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
    const res = await updateDailyItem(moved.id, { position });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-4">
        <RadialGauge value={pct} size={52} stroke={5} label={`${done.length} of ${items.length} done`} />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Daily</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMM d")} ·{" "}
            <span className="font-mono tabular-nums">
              {done.length}/{items.length}
            </span>{" "}
            done
          </p>
        </div>
      </motion.div>

      <div className="inline-flex rounded-md border border-border p-0.5">
        <button
          onClick={() => setScope("team")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors",
            scope === "team" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Team
        </button>
        <button
          onClick={() => setScope("personal")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors",
            scope === "personal" ? "bg-secondary text-foreground" : "text-muted-foreground"
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          Personal
        </button>
      </div>

      {canWrite && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={scope === "team" ? "Add a team item…" : "Add a thing for today…"}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
          />
          {scope === "team" && (
            <Select value={draftAssignee} onValueChange={setDraftAssignee}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Anyone</SelectItem>
                {(roster.data ?? []).map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={add} disabled={!draft.trim()} size="icon" aria-label="Add item">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {items.length === 0 && !daily.isLoading ? (
        <EmptyState
          icon={scope === "team" ? Users : Sparkles}
          title={scope === "team" ? "No team items yet" : "A clean slate"}
          description={
            scope === "team"
              ? canWrite
                ? "Shared with everyone on the board. Add an item and assign it to someone."
                : "Editors can add shared items with an owner for each."
              : "This list is only yours. Not even the board owner can see it."
          }
        />
      ) : (
        <div className="space-y-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={open.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {open.map((i) => (
                    <motion.div
                      key={i.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={spring.soft}
                    >
                      <Row
                        item={i}
                        scope={scope}
                        roster={roster.data ?? []}
                        canWrite={canWrite}
                        onToggle={toggle}
                        onRename={rename}
                        onDelete={remove}
                        onAssign={assign}
                        sortable
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          {done.length > 0 && (
            <div className="space-y-0.5">
              <p className="px-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Done · {done.length}
              </p>
              <AnimatePresence initial={false}>
                {done.map((i) => (
                  <motion.div
                    key={i.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={spring.gentle}
                  >
                    <Row
                      item={i}
                      scope={scope}
                      roster={roster.data ?? []}
                      canWrite={canWrite}
                      onToggle={toggle}
                      onRename={rename}
                      onDelete={remove}
                      onAssign={assign}
                      sortable={false}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {open.length === 0 && done.length > 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              All done. Nice work, go touch grass.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
