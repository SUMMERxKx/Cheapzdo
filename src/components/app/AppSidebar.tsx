import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// App level navigation. Board section navigation lives in BoardLayout.
const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/onboarding", label: "New board", icon: Sparkles, end: false },
  { to: "/b/demo/sprint", label: "Demo board", icon: LayoutGrid, end: false },
];

export function AppSidebar() {
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
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )
            }
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
        shell v0
      </div>
    </aside>
  );
}
