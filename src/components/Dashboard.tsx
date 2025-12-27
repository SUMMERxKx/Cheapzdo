import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Users, Zap, AlertTriangle, Layers } from 'lucide-react';

export function Dashboard() {
  const { workItems, people, getPersonById } = useApp();

  const activeItems = workItems.filter(item => item.state === 'Active');
  const blockers = workItems.filter(item => item.tags.includes('Blocker') && item.state !== 'Done');

  const activeByAssignee = activeItems.reduce((acc, item) => {
    const assignee = item.assigneeId ? getPersonById(item.assigneeId)?.name || 'Unknown' : 'Unassigned';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeByType = activeItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold tracking-wide">LOCK-IN STATUS</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{people.length}</p>
              <p className="text-xs text-muted-foreground">TEAM SIZE</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeItems.length}</p>
              <p className="text-xs text-muted-foreground">ACTIVE</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{blockers.length}</p>
              <p className="text-xs text-muted-foreground">BLOCKERS</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Layers className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workItems.filter(i => i.state === 'Done').length}</p>
              <p className="text-xs text-muted-foreground">DONE</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">ACTIVE BY ASSIGNEE</h3>
          <div className="space-y-2">
            {Object.entries(activeByAssignee)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm">{name}</span>
                  <span className="text-sm font-mono text-primary">{count}</span>
                </div>
              ))}
            {Object.keys(activeByAssignee).length === 0 && (
              <p className="text-sm text-muted-foreground">No active items</p>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">ACTIVE BY TYPE</h3>
          <div className="space-y-2">
            {Object.entries(activeByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm">{type}</span>
                  <span className="text-sm font-mono text-primary">{count}</span>
                </div>
              ))}
            {Object.keys(activeByType).length === 0 && (
              <p className="text-sm text-muted-foreground">No active items</p>
            )}
          </div>
        </Card>
      </div>

      {blockers.length > 0 && (
        <Card className="p-4 bg-card border-destructive/50 glow-red">
          <h3 className="text-sm font-bold mb-4 text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ACTIVE BLOCKERS
          </h3>
          <div className="space-y-2">
            {blockers.map(blocker => (
              <div key={blocker.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{blocker.title}</span>
                <span className="text-xs text-muted-foreground">
                  {blocker.assigneeId ? getPersonById(blocker.assigneeId)?.name : 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
