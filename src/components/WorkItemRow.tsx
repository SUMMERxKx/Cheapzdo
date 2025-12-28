import { useState } from 'react';
import { WorkItem, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Trash2, AlertTriangle, Circle, Bug, Layers, BookOpen, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkItemRowProps {
  item: WorkItem;
  depth?: number;
  onRowClick: (item: WorkItem) => void;
  hideSprintColumn?: boolean;
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

export function WorkItemRow({ item, depth = 0, onRowClick, hideSprintColumn = false }: WorkItemRowProps) {
  const { deleteWorkItem, getChildItems, getPersonById, sprints } = useApp();
  const [expanded, setExpanded] = useState(true);

  const children = getChildItems(item.id);
  const hasChildren = children.length > 0;
  const canHaveChildren = item.type === 'User Story' || item.type === 'Operation';
  const isBlocker = item.tags.includes('Blocker');
  const Icon = typeIcons[item.type] || Circle;
  const assignee = item.assigneeId ? getPersonById(item.assigneeId) : null;
  const sprint = item.sprintId ? sprints.find(s => s.id === item.sprintId) : null;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on expand/collapse or delete button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onRowClick(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWorkItem(item.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <>
      <tr 
        className={cn(
          'border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer',
          isBlocker && 'bg-destructive/5 hover:bg-destructive/10'
        )}
        onClick={handleRowClick}
      >
        <td className="py-2 px-3 w-10">
          {hasChildren || canHaveChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={handleExpandClick}
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
          <Badge className={cn('text-xs', stateColors[item.state])}>
            {item.state}
          </Badge>
        </td>

        <td className="py-2 px-3 w-36">
          <span className="text-xs">
            {assignee ? assignee.name : 'Unassigned'}
          </span>
        </td>

        <td className="py-2 px-3 w-24">
          <span className={cn('text-xs font-medium', priorityColors[item.priority])}>
            {item.priority}
          </span>
        </td>

        {!hideSprintColumn && (
          <td className="py-2 px-3 w-32">
            <span className="text-xs">
              {sprint ? sprint.name : 'Backlog'}
            </span>
          </td>
        )}

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
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </td>
      </tr>

      {expanded && children.map(child => (
        <WorkItemRow 
          key={child.id} 
          item={child} 
          depth={depth + 1} 
          onRowClick={onRowClick}
          hideSprintColumn={hideSprintColumn}
        />
      ))}
    </>
  );
}
