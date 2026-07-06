import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore, type Theme } from "@/stores/uiStore";

// The available themes. The swatch is the theme primary color, shown so the user
// can pick by look. Keep this list in sync with the token blocks in index.css.
const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "dark", label: "Dark", swatch: "#5B7CFA" },
  { id: "light", label: "Light", swatch: "#5B7CFA" },
  { id: "cherry", label: "Cherry Blossom", swatch: "#E85C93" },
  { id: "retro", label: "Retro", swatch: "#DE4B34" },
  { id: "neon", label: "Neon", swatch: "#FF33A8" },
  { id: "winter", label: "Winter Snow", swatch: "#2A93D8" },
];

export function ThemePicker() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme" title="Theme">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="gap-2.5"
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: t.swatch }}
            />
            <span className="flex-1">{t.label}</span>
            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
