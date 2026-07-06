import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBoard } from "@/lib/supabase/boards";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { useBoard } from "./useBoardData";
import { usePermissions } from "@/features/members/usePermissions";

export function GeneralSettings({ boardId }: { boardId: string }) {
  const board = useBoard(boardId);
  const { isOwner } = usePermissions(boardId);
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [arcSize, setArcSize] = useState(5);
  const [sprintLen, setSprintLen] = useState(14);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (board.data) {
      setName(board.data.name);
      setArcSize(board.data.arc_size);
      setSprintLen(board.data.sprint_length_days);
    }
  }, [board.data]);

  const save = async () => {
    setSaving(true);
    const res = await updateBoard(boardId, {
      name: name.trim(),
      arc_size: arcSize,
      sprint_length_days: sprintLen,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Board settings saved");
    void qc.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    void qc.invalidateQueries({ queryKey: queryKeys.boards() });
  };

  return (
    <div className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="board-name">Board name</Label>
        <Input
          id="board-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="arc-size">Sprints per arc</Label>
          <Input
            id="arc-size"
            type="number"
            min={1}
            max={24}
            value={arcSize}
            onChange={(e) => setArcSize(Number(e.target.value))}
            disabled={!isOwner}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sprint-len">Sprint length (days)</Label>
          <Input
            id="sprint-len"
            type="number"
            min={1}
            max={60}
            value={sprintLen}
            onChange={(e) => setSprintLen(Number(e.target.value))}
            disabled={!isOwner}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Arc shape applies to future arcs. The current arc keeps its sprints.
      </p>
      {isOwner && (
        <Button onClick={save} disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      )}
    </div>
  );
}
