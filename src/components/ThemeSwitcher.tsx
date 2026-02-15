import { useTheme, themes } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ThemeSwitcher
 *
 * Dropdown button that lets the user pick a weather / season theme.
 * Each option shows an emoji, name, and a short description.
 * The active theme gets a highlighted background.
 */
export function ThemeSwitcher() {
  const { theme, setTheme, currentTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-2 h-8"
        >
          <span className="text-base leading-none">{currentTheme.emoji}</span>
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground tracking-wide">THEME</p>
        </div>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              theme === t.id && 'bg-secondary text-foreground',
            )}
          >
            <span className="text-lg leading-none w-6 text-center">{t.emoji}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-[10px] text-muted-foreground">{t.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
