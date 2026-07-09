import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Pin, PinOff, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { MemberChip } from "@/components/itemAtoms";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/design/motion";
import { useAuth } from "@/features/auth/useAuth";
import { usePermissions } from "@/features/members/usePermissions";
import { useRoster } from "@/features/boards/useBoardData";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "@/lib/supabase/announcements";
import { queryKeys } from "@/lib/supabase/queryKeys";

function useAnnouncements(boardId: string) {
  return useQuery({
    queryKey: queryKeys.announcements(boardId),
    enabled: !!boardId,
    queryFn: async () => {
      const res = await listAnnouncements(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export default function AnnouncementsPage() {
  const { boardId = "" } = useParams();
  const { user } = useAuth();
  const { canEdit } = usePermissions(boardId);
  const roster = useRoster(boardId);
  const feed = useAnnouncements(boardId);
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const refresh = () => void qc.invalidateQueries({ queryKey: queryKeys.announcements(boardId) });

  const post = async () => {
    if (!user || !title.trim()) return;
    setPosting(true);
    const res = await createAnnouncement({
      boardId,
      authorId: user.id,
      title,
      body: body.trim() || null,
    });
    setPosting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setTitle("");
    setBody("");
    refresh();
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const res = await updateAnnouncement(id, {
      is_pinned: !pinned,
      pinned_at: !pinned ? new Date().toISOString() : null,
    });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const remove = (id: string) => setToDelete(id);
  const doDelete = async () => {
    if (!toDelete) return;
    const res = await deleteAnnouncement(toDelete);
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const authorOf = (id: string | null) => (roster.data ?? []).find((m) => m.user_id === id);
  const list = feed.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5">
      <div className="flex items-center gap-3">
        <Megaphone className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl font-bold tracking-tight">Announcements</h1>
      </div>

      {canEdit && (
        <div className="space-y-2.5 rounded-xl border border-border bg-card p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announce something to the board…"
          />
          {title.trim() && (
            <>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add detail (optional)"
                rows={3}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={post} disabled={posting}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {posting ? "Posting…" : "Post"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {list.length === 0 && !feed.isLoading ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing announced yet"
          description={
            canEdit
              ? "Post the first update. The whole board sees announcements."
              : "Updates from the team will show up here."
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((a) => {
              const author = authorOf(a.author_id);
              return (
                <motion.article
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={spring.soft}
                  className={cn(
                    "rounded-xl border p-4",
                    a.is_pinned
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <MemberChip member={author} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-display text-base font-semibold leading-snug">
                          {a.title}
                        </h3>
                        {a.is_pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {author?.display_name ?? "Former member"} ·{" "}
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                      {a.body && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                          {a.body}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => togglePin(a.id, a.is_pinned)}
                          aria-label={a.is_pinned ? "Unpin" : "Pin"}
                        >
                          {a.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(a.id)}
                          aria-label="Delete announcement"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete announcement"
        description="This permanently deletes the announcement."
        confirmText="Delete"
        variant="destructive"
        onConfirm={doDelete}
      />
    </div>
  );
}
