import { NavLink } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyBoards } from "@/features/boards/useMyBoards";

// App level navigation: the user's boards plus a way to create another. Board
// section navigation lives in BoardLayout.
export function AppSidebar() {
  const boards = useMyBoards();
  const list = boards.data ?? [];

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

      <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Boards
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-0">
        {list.map((b) => (
          <NavLink
            key={b.id}
            to={`/b/${b.id}/sprint`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 truncate rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )
            }
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="truncate">{b.name}</span>
          </NavLink>
        ))}
        {list.length === 0 && !boards.isLoading && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No boards yet.</p>
        )}
        <NavLink
          to="/onboarding"
          className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-primary transition-colors hover:bg-sidebar-accent"
        >
          <Plus className="h-4 w-4" />
          New board
        </NavLink>
      </nav>
    </aside>
  );
}
