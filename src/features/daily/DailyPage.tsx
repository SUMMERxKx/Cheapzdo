import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
import { GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import { DailyCheckbox } from "./DailyCheckbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { RadialGauge } from "@/lib/design/charts/RadialGauge";
import { spring, useMotion } from "@/lib/design/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/useAuth";
import { keyBetween } from "@/lib/fractionalIndex";
import {
  createDailyItem,
  deleteDailyItem,
  listDailyItems,
  updateDailyItem,
  type DailyItem,
} from "@/lib/supabase/daily";
import { queryKeys } from "@/lib/supabase/queryKeys";

function useDaily(boardId: string, userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.daily(boardId),
    enabled: !!boardId && !!userId,
    queryFn: async () => {
      const res = await listDailyItems(boardId, userId as string);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

function Row({
  item,
  onToggle,
  onRename,
  onDelete,
  sortable,
}: {
  item: DailyItem;
  onToggle: (i: DailyItem) => void;
  onRename: (i: DailyItem, title: string) => void;
  onDelete: (i: DailyItem) => void;
  sortable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !sortable,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-secondary/30",
        isDragging && "opacity-50"
      )}
    >
      {sortable ? (
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

      <DailyCheckbox
        checked={item.is_done}
        onToggle={() => onToggle(item)}
        label={item.is_done ? `Mark ${item.title} not done` : `Mark ${item.title} done`}
      />

      {editing ? (
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
          onClick={() => setEditing(true)}
          className={cn(
            "flex-1 truncate text-left text-sm transition-colors",
            item.is_done && "text-muted-foreground line-through"
          )}
        >
          {item.title}
        </button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        onClick={() => onDelete(item)}
        aria-label={`Delete ${item.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function DailyPage() {
  const { boardId = "" } = useParams();
  const { user } = useAuth();
  const daily = useDaily(boardId, user?.id);
  const qc = useQueryClient();
  const { fadeUp } = useMotion();
  const [draft, setDraft] = useState("");

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

  const refresh = () => void qc.invalidateQueries({ queryKey: queryKeys.daily(boardId) });

  const add = async () => {
    if (!user || !draft.trim()) return;
    const last = open.length ? open[open.length - 1].position : null;
    const res = await createDailyItem({
      boardId,
      userId: user.id,
      title: draft,
      position: keyBetween(last, null),
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
        <div>
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

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a thing for today…"
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <Button onClick={add} disabled={!draft.trim()} size="icon" aria-label="Add item">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 && !daily.isLoading ? (
        <EmptyState
          icon={Sparkles}
          title="A clean slate"
          description="This list is only yours. Not even the board owner can see it. Add your first thing for today."
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
                      <Row item={i} onToggle={toggle} onRename={rename} onDelete={remove} sortable />
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
                    <Row item={i} onToggle={toggle} onRename={rename} onDelete={remove} sortable={false} />
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
