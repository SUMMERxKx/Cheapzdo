import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  Github,
  LayoutGrid,
  Layers,
  LogOut,
  Megaphone,
  Palette,
  Settings,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUiStore, type Theme } from "@/stores/uiStore";
import { useBoardStore } from "@/stores/boardStore";
import { useMyBoards } from "@/features/boards/useMyBoards";
import { signOut } from "@/lib/supabase/auth";

const THEMES: { id: Theme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "cherry", label: "Cherry Blossom" },
  { id: "retro", label: "Retro" },
  { id: "neon", label: "Neon" },
  { id: "winter", label: "Winter Snow" },
];

const SECTIONS = [
  { to: "arc", label: "Arc Board", icon: Layers },
  { to: "sprint", label: "Sprint Board", icon: Zap },
  { to: "daily", label: "Daily", icon: CalendarCheck },
  { to: "leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "announcements", label: "Announcements", icon: Megaphone },
  { to: "leetping", label: "LeetPing", icon: Github },
  { to: "settings", label: "Board settings", icon: Settings },
];

// Cmd K everywhere. Jump to a section or board, switch theme, sign out.
export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const setTheme = useUiStore((s) => s.setTheme);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const boards = useMyBoards();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to, switch theme, or sign out…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>

        {activeBoardId && (
          <CommandGroup heading="This board">
            {SECTIONS.map((s) => (
              <CommandItem
                key={s.to}
                onSelect={() => run(() => navigate(`/b/${activeBoardId}/${s.to}`))}
              >
                <s.icon className="mr-2 h-4 w-4" />
                {s.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(boards.data ?? []).length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Boards">
              {(boards.data ?? []).map((b) => (
                <CommandItem key={b.id} onSelect={() => run(() => navigate(`/b/${b.id}/sprint`))}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  {b.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Theme">
          {THEMES.map((t) => (
            <CommandItem key={t.id} onSelect={() => run(() => setTheme(t.id))}>
              <Palette className="mr-2 h-4 w-4" />
              {t.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => run(() => navigate("/profile"))}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                void signOut().then(() => navigate("/login", { replace: true }));
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
