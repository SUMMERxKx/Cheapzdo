import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster, useStatuses, useTypes } from "@/features/boards/useBoardData";
import { useArcs } from "@/features/sprint/useBoardWork";
import { deleteEpic, updateEpic, type Epic, type Priority } from "@/lib/supabase/epics";
import { PRIORITY_LABEL } from "@/components/itemAtoms";

const UNSET = "none";
const BACKLOG = "backlog";

export function EpicDetailSheet({
  boardId,
  epic,
  onClose,
}: {
  boardId: string;
  epic: Epic | null;
  onClose: () => void;
}) {
  const { canEdit } = usePermissions(boardId);
  const statuses = useStatuses(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const arcs = useArcs(boardId);
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (epic) {
      setTitle(epic.title);
      setDescription(epic.description ?? "");
    }
  }, [epic]);

  if (!epic) return null;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epics"] });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  const patch = async (updates: Parameters<typeof updateEpic>[1]) => {
    const res = await updateEpic(epic.id, updates);
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const remove = async () => {
    const res = await deleteEpic(epic.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Epic deleted");
    refresh();
    onClose();
  };

  return (
    <Sheet open={!!epic} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Epic</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ed-title">Title</Label>
            <Input
              id="ed-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              onBlur={() => {
                if (title.trim() && title !== epic.title) void patch({ title: title.trim() });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Arc</Label>
              <Select
                value={epic.arc_id ?? BACKLOG}
                onValueChange={(v) => void patch({ arc_id: v === BACKLOG ? null : v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={BACKLOG}>Backlog</SelectItem>
                  {(arcs.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={epic.status_id ?? UNSET}
                onValueChange={(v) => void patch({ status_id: v === UNSET ? null : v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>None</SelectItem>
                  {(statuses.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={epic.type_id ?? UNSET}
                onValueChange={(v) => void patch({ type_id: v === UNSET ? null : v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>None</SelectItem>
                  {(types.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={epic.priority}
                onValueChange={(v) => void patch({ priority: v as Priority })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Assignee</Label>
              <Select
                value={epic.assignee_id ?? UNSET}
                onValueChange={(v) => void patch({ assignee_id: v === UNSET ? null : v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET}>Nobody</SelectItem>
                  {(roster.data ?? []).map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ed-desc">Description</Label>
            <Textarea
              id="ed-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              onBlur={() => {
                if (description !== (epic.description ?? "")) {
                  void patch({ description: description || null });
                }
              }}
            />
          </div>

          {canEdit && (
            <Button variant="outline" className="text-destructive" onClick={remove}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete epic
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
