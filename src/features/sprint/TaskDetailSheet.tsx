import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster, useStatuses, useTypes } from "@/features/boards/useBoardData";
import { useAllEpics, useComments, useSprints } from "./useBoardWork";
import { deleteTask, updateTask, type Priority, type Task } from "@/lib/supabase/tasks";
import { addComment, deleteComment } from "@/lib/supabase/comments";
import { MemberChip, PRIORITY_LABEL } from "@/components/itemAtoms";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { queryKeys } from "@/lib/supabase/queryKeys";

const UNSET = "none";
const BACKLOG = "backlog";

export function TaskDetailSheet({
  boardId,
  task,
  onClose,
}: {
  boardId: string;
  task: Task | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { canEdit } = usePermissions(boardId);
  const statuses = useStatuses(boardId);
  const types = useTypes(boardId);
  const roster = useRoster(boardId);
  const epics = useAllEpics(boardId);
  const sprints = useSprints(boardId);
  const comments = useComments(boardId, { taskId: task?.id });
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task]);

  if (!task) return null;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["board", boardId, "tasks"] });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
  };

  const patch = async (updates: Parameters<typeof updateTask>[1]) => {
    const res = await updateTask(task.id, updates);
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const doDelete = async () => {
    const res = await deleteTask(task.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
    onClose();
  };

  const send = async () => {
    if (!user || !draft.trim()) return;
    const res = await addComment({ boardId, taskId: task.id, authorId: user.id, body: draft });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setDraft("");
    void qc.invalidateQueries({ queryKey: queryKeys.comments(boardId, { taskId: task.id }) });
  };

  const removeComment = async (id: string) => {
    const res = await deleteComment(id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: queryKeys.comments(boardId, { taskId: task.id }) });
  };

  const memberOf = (id: string | null) => (roster.data ?? []).find((m) => m.user_id === id);

  return (
    <>
    <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            Task
            {task.is_blocker && (
              <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
                <TriangleAlert className="h-3 w-3" />
                Blocker
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="td-title">Title</Label>
            <Input
              id="td-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              onBlur={() => {
                if (title.trim() && title !== task.title) void patch({ title: title.trim() });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Parent epic</Label>
              <Select
                value={task.epic_id}
                onValueChange={(v) => void patch({ epic_id: v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(epics.data ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sprint</Label>
              <Select
                value={task.sprint_id ?? BACKLOG}
                onValueChange={(v) => void patch({ sprint_id: v === BACKLOG ? null : v })}
                disabled={!canEdit}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={BACKLOG}>Backlog</SelectItem>
                  {(sprints.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={task.status_id ?? UNSET}
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
              <Label>Priority</Label>
              <Select
                value={task.priority}
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
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={task.type_id ?? UNSET}
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
              <Label>Assignee</Label>
              <Select
                value={task.assignee_id ?? UNSET}
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

          {canEdit && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={task.is_blocker}
                onCheckedChange={(v) => void patch({ is_blocker: v === true })}
              />
              Mark as a blocker
            </label>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="td-desc">Description</Label>
            <Textarea
              id="td-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              onBlur={() => {
                if (description !== (task.description ?? "")) {
                  void patch({ description: description || null });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <div className="space-y-2.5">
              {(comments.data ?? []).map((c) => {
                const author = memberOf(c.author_id);
                const mine = c.author_id === user?.id;
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <MemberChip member={author} size={5} />
                    <div className="min-w-0 flex-1 rounded-lg bg-secondary/50 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium">
                          {author?.display_name ?? "Former member"}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                    </div>
                    {(mine || canEdit) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeComment(c.id)}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {comments.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          {canEdit && (
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send comment">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete task
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Delete task"
      description="This permanently deletes the task and its comments. There is no undo."
      confirmText="Delete task"
      variant="destructive"
      onConfirm={doDelete}
    />
    </>
  );
}
