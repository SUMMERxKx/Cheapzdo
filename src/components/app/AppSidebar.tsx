import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LayoutGrid, MoreHorizontal, Pencil, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyBoards } from "@/features/boards/useMyBoards";
import { useAuth } from "@/features/auth/useAuth";
import { useUiStore } from "@/stores/uiStore";
import { updateBoard } from "@/lib/supabase/boards";
import { queryKeys } from "@/lib/supabase/queryKeys";

// App level navigation: the user's boards plus a way to create another. Board
// section navigation lives in BoardLayout.
export function AppSidebar() {
  const boards = useMyBoards();
  const list = boards.data ?? [];
  const { user } = useAuth();
  const qc = useQueryClient();
  const setCreateBoardOpen = useUiStore((s) => s.setCreateBoardOpen);

  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [saving, setSaving] = useState(false);

  const openRename = (id: string, name: string) => {
    setRenaming({ id, name });
    setRenameValue(name);
  };

  const saveRename = async () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name || name === renaming.name) {
      setRenaming(null);
      return;
    }
    setSaving(true);
    const res = await updateBoard(renaming.id, { name });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Board renamed");
    void qc.invalidateQueries({ queryKey: queryKeys.boards() });
    void qc.invalidateQueries({ queryKey: queryKeys.board(renaming.id) });
    setRenaming(null);
  };

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
          A
        </div>
        <span className="font-display text-base font-semibold tracking-tight">
          Arcflow
        </span>
      </div>

      <nav className="px-2 pt-1">
        <NavLink
          to="/friends"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-sidebar-foreground"
            )
          }
        >
          <Users className="h-4 w-4 shrink-0" />
          <span>Friends</span>
        </NavLink>
      </nav>

      <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Boards
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-0">
        {list.map((b) => (
          <div key={b.id} className="group flex items-center gap-0.5">
            <NavLink
              to={`/b/${b.id}/sprint`}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-foreground"
                )
              }
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span className="truncate">{b.name}</span>
            </NavLink>
            {b.owner_id === user?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Board options for ${b.name}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRename(b.id, b.name)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        {list.length === 0 && !boards.isLoading && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No boards yet.</p>
        )}
        <button
          type="button"
          onClick={() => setCreateBoardOpen(true)}
          className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-sidebar-accent"
        >
          <Plus className="h-4 w-4" />
          New board
        </button>
      </nav>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-board">Board name</Label>
            <Input
              id="rename-board"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) void saveRename();
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={saveRename} disabled={saving || !renameValue.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
