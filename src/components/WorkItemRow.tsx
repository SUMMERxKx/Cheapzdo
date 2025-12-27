import { useState } from 'react';
import { WorkItem, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronDown, Trash2, AlertTriangle, Circle, Bug, Layers, BookOpen, Wrench, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkItemRowProps {
  item: WorkItem;
  depth?: number;
}

const typeIcons: Record<string, React.ElementType> = {
  'Epic': Layers,
  'User Story': BookOpen,
  'Task': Circle,
  'Bug': Bug,
  'Operation': Wrench,
};

const typeColors: Record<string, string> = {
  'Epic': 'type-epic',
  'User Story': 'type-story',
  'Task': 'type-task',
  'Bug': 'type-bug',
  'Operation': 'type-operation',
};

const stateColors: Record<WorkItemState, string> = {
  'New': 'bg-secondary text-secondary-foreground',
  'Active': 'bg-warning text-warning-foreground',
  'Done': 'bg-success text-success-foreground',
};

const priorityColors: Record<Priority, string> = {
  'Critical': 'text-destructive',
  'High': 'text-warning',
  'Medium': 'text-info',
  'Low': 'text-muted-foreground',
};

export function WorkItemRow({ item, depth = 0 }: WorkItemRowProps) {
  const { updateWorkItem, deleteWorkItem, getChildItems, getPersonById, people, sprints, activeSprint } = useApp();
  const [expanded, setExpanded] = useState(true);

  const children = getChildItems(item.id);
  const hasChildren = children.length > 0;
  const canHaveChildren = item.type === 'User Story' || item.type === 'Operation';
  const isBlocker = item.tags.includes('Blocker');
  const Icon = typeIcons[item.type] || Circle;
  const assignee = item.assigneeId ? getPersonById(item.assigneeId) : null;

  return (
    <>
      <tr className={cn(
        'border-b border-border hover:bg-secondary/30 transition-colors',
        isBlocker && 'bg-destructive/5 hover:bg-destructive/10'
      )}>
        <td className="py-2 px-3 w-10">
          {hasChildren || canHaveChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <span className="w-6" />
          )}
        </td>

        <td className="py-2 px-3" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4 flex-shrink-0', typeColors[item.type])} />
            {isBlocker && <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />}
            <span className={cn('text-sm', isBlocker && 'text-destructive font-medium')}>
              {item.title}
            </span>
          </div>
        </td>

        <td className="py-2 px-3 w-28">
          <span className={cn('text-xs', typeColors[item.type])}>{item.type}</span>
        </td>

        <td className="py-2 px-3 w-24">
          <Select
            value={item.state}
            onValueChange={(value: WorkItemState) => updateWorkItem(item.id, { state: value })}
          >
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0">
              <Badge className={cn('text-xs', stateColors[item.state])}>
                {item.state}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </td>

        <td className="py-2 px-3 w-36">
          <Select
            value={item.assigneeId || 'unassigned'}
            onValueChange={(value) => updateWorkItem(item.id, { assigneeId: value === 'unassigned' ? undefined : value })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {people.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        <td className="py-2 px-3 w-24">
          <Select
            value={item.priority}
            onValueChange={(value: Priority) => updateWorkItem(item.id, { priority: value })}
          >
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0">
              <span className={cn('text-xs font-medium', priorityColors[item.priority])}>
                {item.priority}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </td>

        <td className="py-2 px-3 w-32">
          <Select
            value={item.sprintId || 'backlog'}
            onValueChange={(value) => updateWorkItem(item.id, { sprintId: value === 'backlog' ? undefined : value })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Backlog" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        <td className="py-2 px-3">
          <div className="flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <Badge
                key={tag}
                variant={tag === 'Blocker' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </td>

        <td className="py-2 px-3 w-10">
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => deleteWorkItem(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </td>
      </tr>

      {expanded && children.map(child => (
        <WorkItemRow key={child.id} item={child} depth={depth + 1} />
      ))}
    </>
  );
}
