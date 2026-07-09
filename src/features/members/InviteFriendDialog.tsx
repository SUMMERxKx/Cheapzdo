import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/EmptyState";
import { useFriends } from "@/features/friends/useFriends";
import { inviteFriend, type FriendRole } from "@/lib/supabase/friends";
import { queryKeys } from "@/lib/supabase/queryKeys";

// Owner only. Drops an accepted friend straight into the board, no email or
// copied link. Friends already on the board are filtered out.
export function InviteFriendDialog({
  boardId,
  memberIds,
}: {
  boardId: string;
  memberIds: string[];
}) {
  const qc = useQueryClient();
  const friends = useFriends();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<FriendRole>("editor");
  const [busy, setBusy] = useState<string | null>(null);

  const eligible = (friends.data ?? []).filter((f) => !memberIds.includes(f.user_id));

  const add = async (userId: string, name: string) => {
    setBusy(userId);
    const res = await inviteFriend(boardId, userId, role);
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`${name} added to the board`);
    void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserRoundPlus className="mr-2 h-4 w-4" />
          Add a friend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a friend to this board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Add as</span>
            <Select value={role} onValueChange={(v) => setRole(v as FriendRole)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {friends.isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading friends…</p>
          ) : eligible.length === 0 ? (
            <EmptyState
              title="No friends to add"
              description="Everyone you are friends with is already on this board, or you have not added friends yet."
            />
          ) : (
            <div className="space-y-2">
              {eligible.map((f) => (
                <div
                  key={f.user_id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.display_name}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      @{f.handle}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={busy === f.user_id}
                    onClick={() => add(f.user_id, f.display_name)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
