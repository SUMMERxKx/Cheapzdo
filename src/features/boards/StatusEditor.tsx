import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwatchPicker, SWATCHES } from "./SwatchPicker";
import { useStatuses } from "./useBoardData";
import { usePermissions } from "@/features/members/usePermissions";
import {
  createStatus,
  deleteStatus,
  swapStatusPositions,
  updateStatus,
  type StatusCategory,
} from "@/lib/supabase/statuses";
import { queryKeys } from "@/lib/supabase/queryKeys";

const CATEGORY_LABEL: Record<StatusCategory, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

// Statuses are the kanban columns. Names and colors are free, the category is
// fixed per status because analytics key off it.
export function StatusEditor({ boardId }: { boardId: string }) {
  const { canEdit } = usePermissions(boardId);
  const statuses = useStatuses(boardId);
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<StatusCategory>("todo");
  const [color, setColor] = useState(SWATCHES[0]);

  const refresh = () => void qc.invalidateQueries({ queryKey: queryKeys.statuses(boardId) });

  const add = async () => {
    const res = await createStatus({ boardId, name, category, color });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setName("");
    refresh();
  };

  const rename = async (id: string, next: string) => {
    if (!next.trim()) return;
    const res = await updateStatus(id, { name: next.trim() });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const recolor = async (id: string, hex: string) => {
    const res = await updateStatus(id, { color: hex });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const remove = async (id: string) => {
    const res = await deleteStatus(id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const list = statuses.data ?? [];
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    const res = await swapStatusPositions(
      { id: a.id, position: a.position },
      { id: b.id, position: b.position }
    );
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const list = statuses.data ?? [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Statuses are your workflow columns. The category tells the leaderboard and
        charts what counts as done, so it stays fixed once created.
      </p>

      <div className="divide-y divide-border rounded-xl border border-border">
        {list.map((s, i) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color ?? undefined }} />
            {canEdit ? (
              <Input
                defaultValue={s.name}
                className="h-8 w-40"
                onBlur={(e) => {
                  if (e.target.value !== s.name) void rename(s.id, e.target.value);
                }}
              />
            ) : (
              <span className="w-40 text-sm">{s.name}</span>
            )}
            <Badge variant="secondary" className="text-[11px]">
              {CATEGORY_LABEL[s.category]}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
              {canEdit && (
                <>
                  <SwatchPicker value={s.color ?? ""} onChange={(hex) => void recolor(s.id, hex)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(s.id)}
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <div className="min-w-36 flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="status-name">New status</label>
            <Input
              id="status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. In review"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as StatusCategory)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SwatchPicker value={color} onChange={setColor} />
          <Button onClick={add} disabled={!name.trim()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
