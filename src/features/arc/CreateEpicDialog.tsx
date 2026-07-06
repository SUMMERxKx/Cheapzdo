import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useStatuses, useTypes, useRoster } from "@/features/boards/useBoardData";
import { createEpic, type Priority } from "@/lib/supabase/epics";
import { keyBetween } from "@/lib/fractionalIndex";
import { PRIORITY_LABEL } from "@/components/itemAtoms";

const UNSET = "none";

export function CreateEpicDialog({
  boardId,
  arcId,
  lastPosition,
}: {
  boardId: string;
  arcId: string | null;
  lastPosition: string | null;
}) {
  const { user } = useAuth();
  const statuses = useStatuses(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState<string>(UNSET);
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(UNSET);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const firstStatus = (statuses.data ?? [])[0];
    const res = await createEpic({
      boardId,
      title,
      arcId,
      typeId: typeId === UNSET ? null : typeId,
      statusId: firstStatus?.id ?? null,
      priority,
      assigneeId: assigneeId === UNSET ? null : assigneeId,
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
    setOpen(false);
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epics"] });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New epic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New epic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="epic-title">Title</Label>
            <Input
              id="epic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this stream of work?"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) void submit();
              }}
            />
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
          <Button className="w-full" onClick={submit} disabled={saving || !title.trim()}>
            {saving ? "Creating…" : "Create epic"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
