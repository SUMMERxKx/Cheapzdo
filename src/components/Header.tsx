import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, Target, Pencil, Check } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

const SUBTITLE_KEY = 'cheapzdo-header-subtitle';
const DEFAULT_SUBTITLE = '🐴 Year of the Horse 🧧';

export function Header() {
  const { logout } = useApp();
  const [subtitle, setSubtitle] = useState(() => {
    return localStorage.getItem(SUBTITLE_KEY) || DEFAULT_SUBTITLE;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(subtitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveSubtitle = () => {
    const trimmed = draft.trim();
    const value = trimmed || DEFAULT_SUBTITLE;
    setSubtitle(value);
    setDraft(value);
    localStorage.setItem(SUBTITLE_KEY, value);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraft(subtitle);
    setIsEditing(false);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Target className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide">CHEAPZDO</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest">TASK BOARD</p>
        </div>

        <div className="h-8 w-px bg-border mx-1" />

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveSubtitle();
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={saveSubtitle}
              className="bg-secondary/80 text-foreground text-xs font-medium px-2 py-1 rounded border border-border/60 outline-none focus:ring-1 focus:ring-primary/50 w-56"
              maxLength={50}
              placeholder="Enter subtitle..."
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 text-primary hover:text-primary"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSubtitle();
              }}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(subtitle); setIsEditing(true); }}
            className="group flex items-center gap-1.5 text-xs font-medium text-primary/90 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
            title="Click to edit subtitle"
          >
            <span className="tracking-wide">{subtitle}</span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
