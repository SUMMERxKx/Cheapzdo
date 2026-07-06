import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { SwatchPicker, SWATCHES } from "@/features/boards/SwatchPicker";
import { usePermissions } from "./usePermissions";
import { useRoster, useTeams } from "@/features/boards/useBoardData";
import { createTeam, deleteTeam, renameTeam } from "@/lib/supabase/teams";
import { queryKeys } from "@/lib/supabase/queryKeys";

export function TeamsPanel({ boardId }: { boardId: string }) {
  const { isOwner } = usePermissions(boardId);
  const teams = useTeams(boardId);
  const roster = useRoster(boardId);
  const qc = useQueryClient();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.teams(boardId) });
    void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) });
  };

  const add = async () => {
    const res = await createTeam(boardId, newName, newColor);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setNewName("");
    refresh();
  };

  const saveRename = async (id: string) => {
    const res = await renameTeam(id, editName);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setEditingId(null);
    refresh();
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete team ${name}? Its members stay on the board without a team.`)) return;
    const res = await deleteTeam(id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  const membersOf = (teamId: string) =>
    (roster.data ?? []).filter((m) => m.team_id === teamId);

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <div className="min-w-40 flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="team-name">New team</label>
            <Input
              id="team-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Frontend"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) void add();
              }}
            />
          </div>
          <SwatchPicker value={newColor} onChange={setNewColor} />
          <Button onClick={add} disabled={!newName.trim()}>
            Create team
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(teams.data ?? []).map((t) => {
          const members = membersOf(t.id);
          return (
            <div key={t.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color ?? undefined }}
                />
                {editingId === t.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveRename(t.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => void saveRename(t.id)}
                  />
                ) : (
                  <span className="flex-1 truncate font-display text-sm font-semibold">
                    {t.name}
                  </span>
                )}
                {isOwner && editingId !== t.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingId(t.id);
                        setEditName(t.name);
                      }}
                      aria-label={`Rename ${t.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(t.id, t.name)}
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                {members.slice(0, 6).map((m) =>
                  m.avatar_url ? (
                    <img
                      key={m.user_id}
                      src={m.avatar_url}
                      alt={m.display_name}
                      title={m.display_name}
                      className="h-6 w-6 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <span
                      key={m.user_id}
                      title={m.display_name}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold"
                    >
                      {m.display_name.charAt(0).toUpperCase()}
                    </span>
                  )
                )}
                <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {teams.data?.length === 0 && (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description={
            isOwner
              ? "Create a team to group members and unlock team vs team on the leaderboard."
              : "The board owner has not created teams yet."
          }
        />
      )}
    </div>
  );
}
