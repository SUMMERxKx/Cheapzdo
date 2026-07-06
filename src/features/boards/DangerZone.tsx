import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteBoard } from "@/lib/supabase/boards";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { useBoard } from "./useBoardData";

// Deleting a board removes everything on it. The owner must type the board name
// to arm the button.
export function DangerZone({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const boardName = board.data?.name ?? "";
  const armed = confirm.trim() === boardName && boardName.length > 0;

  const doDelete = async () => {
    setDeleting(true);
    const res = await deleteBoard(boardId);
    setDeleting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Board deleted");
    void qc.invalidateQueries({ queryKey: queryKeys.boards() });
    navigate("/", { replace: true });
  };

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 text-destructive">
        <TriangleAlert className="h-4 w-4" />
        <h3 className="font-display text-sm font-semibold">Delete this board</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        This permanently removes the board with all its arcs, sprints, epics,
        tasks, and members. There is no undo.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-name">
          Type <span className="font-mono">{boardName}</span> to confirm
        </Label>
        <Input
          id="confirm-name"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={boardName}
        />
      </div>
      <Button variant="destructive" disabled={!armed || deleting} onClick={doDelete}>
        {deleting ? "Deleting…" : "Delete board forever"}
      </Button>
    </div>
  );
}
