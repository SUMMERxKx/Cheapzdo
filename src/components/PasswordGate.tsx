import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle } from 'lucide-react';

export function PasswordGate() {
  const { authenticate } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticate(password);
    if (!success) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-secondary mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TOPI GANG</h1>
          <p className="text-sm text-muted-foreground mt-1">TASK BOARD</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter password to lock in..."
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Wrong password. Try again.</span>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            LOCK IN
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Focus. Execute. Ship.
        </p>
      </div>
    </div>
  );
}
