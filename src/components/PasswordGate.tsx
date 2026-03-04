import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, ShieldOff } from 'lucide-react';

const CREEP_MESSAGES = [
  { emoji: '🚨', line1: 'GO AWAY, CREEP.', line2: "You don't belong here." },
  { emoji: '🕵️', line1: 'Nice try, detective.', line2: 'Still not letting you in.' },
  { emoji: '🛑', line1: "Sir, this is a Cheapzdo.", line2: 'Please step away from the board.' },
  { emoji: '🤡', line1: 'Clown detected.', line2: 'Access: absolutely not.' },
  { emoji: '🙃', line1: "Still here?", line2: 'Impressive. Wrong, but impressive.' },
];

export function PasswordGate() {
  const { authenticate } = useApp();
  const [password, setPassword] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [error, setError] = useState(false);
  const [showCreep, setShowCreep] = useState(false);
  const [creepIndex, setCreepIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authenticate(password);
    if (!success) {
      const newCount = failCount + 1;
      setPassword('');
      if (newCount >= 3) {
        setShowCreep(true);
        setCreepIndex(prev => (prev + 1) % CREEP_MESSAGES.length);
        setFailCount(0);
        setError(false);
      } else {
        setFailCount(newCount);
        setError(true);
      }
    }
  };

  const handleDismiss = () => {
    setShowCreep(false);
    setError(false);
  };

  const creep = CREEP_MESSAGES[creepIndex];

  if (showCreep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm p-8 text-center space-y-6">
          <div className="text-7xl animate-bounce select-none">{creep.emoji}</div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-destructive">{creep.line1}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{creep.line2}</p>
          </div>
          <Button variant="outline" onClick={handleDismiss} className="gap-2">
            <ShieldOff className="w-4 h-4" />
            Fine, I'll try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-secondary mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CHEAPZDO</h1>
          <p className="text-sm text-muted-foreground mt-1">TASK BOARD</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="text-center text-lg tracking-widest"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                Wrong password.{' '}
                {failCount === 2
                  ? 'One more and you\'re toast. 👀'
                  : 'Try again.'}
              </span>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg">
            Enter
          </Button>
        </form>
      </div>
    </div>
  );
}
