import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/ThemePicker";
import { useUiStore } from "@/stores/uiStore";

export function AppTopbar() {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          Search
          <kbd className="rounded border border-border bg-background px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <ThemePicker />
      </div>
    </header>
  );
}
