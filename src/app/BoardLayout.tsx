import { useEffect } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  Github,
  Layers,
  Megaphone,
  Settings,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/boardStore";
import { useBoardRealtime } from "@/features/realtime/useBoardRealtime";

const sections = [
  { to: "arc", label: "Arc Board", icon: Layers },
  { to: "sprint", label: "Sprint Board", icon: Zap },
  { to: "daily", label: "Daily", icon: CalendarCheck },
  { to: "leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "announcements", label: "Announcements", icon: Megaphone },
  { to: "leetping", label: "LeetPing", icon: Github },
  { to: "settings", label: "Settings", icon: Settings },
];

// Frame for a single board. It records the active board and renders the section
// nav. Real board resolution and role gating arrive in phases 3 and 4.
export function BoardLayout() {
  const { boardId } = useParams();
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard);
  useBoardRealtime(boardId);

  useEffect(() => {
    setActiveBoard(boardId ?? null);
  }, [boardId, setActiveBoard]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {sections.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                isActive && "bg-secondary text-foreground"
              )
            }
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
