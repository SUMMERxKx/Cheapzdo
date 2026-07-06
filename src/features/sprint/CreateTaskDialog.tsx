import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import { useRoster, useStatuses, useTypes } from "@/features/boards/useBoardData";
import { useAllEpics } from "./useBoardWork";
import { createTask, type Priority } from "@/lib/supabase/tasks";
import { keyBetween } from "@/lib/fractionalIndex";
import { PRIORITY_LABEL } from "@/components/itemAtoms";
import { queryKeys } from "@/lib/supabase/queryKeys";

const UNSET = "none";

// Every task needs a parent epic, the submit stays disabled until one is picked.
export function CreateTaskDialog({
  boardId,
  sprintId,
  lastPosition,
}: {
  boardId: string;
  sprintId: string | null;
  lastPosition: string | null;
}) {
  const { user } = useAuth();
  const epics = useAllEpics(boardId);
  const statuses = useStatuses(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [epicId, setEpicId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>(UNSET);
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(UNSET);
  const [isBlocker, setIsBlocker] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = !!title.trim() && !!epicId;

  const submit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    const firstStatus = (statuses.data ?? [])[0];
    const res = await createTask({
      boardId,
      epicId,
      sprintId,
      title,
      typeId: typeId === UNSET ? null : typeId,
      statusId: firstStatus?.id ?? null,
      priority,
      assigneeId: assigneeId === UNSET ? null : assigneeId,
      isBlocker,
      description: null,
      position: keyBetween(lastPosition, null),
      createdBy: user.id,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setTitle("");
    setIsBlocker(false);
    setOpen(false);
    void qc.invalidateQueries({ queryKey: queryKeys.tasks(boardId, { sprintId }) });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  const noEpics = (epics.data ?? []).length === 0 && !epics.isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        {noEpics ? (
          <p className="text-sm text-muted-foreground">
            Tasks live under an epic. Create your first epic on the Arc Board, then
            come back here.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) void submit();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent epic (required)</Label>
              <Select value={epicId} onValueChange={setEpicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick an epic" />
                </SelectTrigger>
                <SelectContent>
                  {(epics.data ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={typeId} onValueChange={setTypeId}>
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
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
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
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isBlocker} onCheckedChange={(v) => setIsBlocker(v === true)} />
              <TriangleAlert className="h-4 w-4 text-destructive" />
              This task blocks other work
            </label>
            <Button className="w-full" onClick={submit} disabled={saving || !canSubmit}>
              {saving ? "Creating…" : "Create task"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
