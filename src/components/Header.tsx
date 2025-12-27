import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { LogOut, Target } from 'lucide-react';

export function Header() {
  const { logout } = useApp();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <Target className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide">TOPI GANG</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest">TASK BOARD</p>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </header>
  );
}
