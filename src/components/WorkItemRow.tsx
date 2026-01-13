import { useState } from 'react';
import { WorkItem, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, ChevronDown, MoreVertical, Plus, AlertTriangle, BookOpen, Dumbbell, Gamepad2, Footprints, Film, Circle, Copy, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddChildItemDialog } from './AddChildItemDialog';
import { ConfirmDialog } from './ConfirmDialog';

interface WorkItemRowProps {
  item: WorkItem;
  depth?: number;
  index?: number;
  onRowClick: (item: WorkItem) => void;
  hideSprintColumn?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, itemId: string) => void;
  onDragOver?: (e: React.DragEvent, itemId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, itemId: string) => void;
  onDragEnd?: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  'Study': BookOpen,
  'Gym': Dumbbell,
  'Sports': Gamepad2,
  'Running': Footprints,
  'Entertainment': Film,
  'Other': Circle,
};

const typeColors: Record<string, string> = {
  'Study': 'text-blue-500',
  'Gym': 'text-purple-500',
  'Sports': 'text-green-500',
  'Running': 'text-orange-500',
  'Entertainment': 'text-pink-500',
  'Other': 'text-gray-500',
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

export function WorkItemRow({ 
  item, 
  depth = 0,
  index,
  onRowClick, 
  hideSprintColumn = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: WorkItemRowProps) {
  const { deleteWorkItem, copyWorkItem, getChildItems, getPersonById, sprints, updateWorkItem } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isAddBlockerOpen, setIsAddBlockerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const children = getChildItems(item.id);
  const hasChildren = children.length > 0;
  // All task types can have children, but only main tasks (not children) can have children
  const canHaveChildren = !item.parentId;
  const isBlocker = item.tags.includes('Blocker');
  const Icon = typeIcons[item.type] || Circle;
  const assignee = item.assigneeId ? getPersonById(item.assigneeId) : null;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on buttons or dropdowns
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]')) {
      return;
    }
    onRowClick(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteWorkItem(item.id);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyWorkItem(item.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleMoveToSprint = (sprintId: string) => {
    updateWorkItem(item.id, { sprintId: sprintId || undefined });
  };

  // Only make top-level items draggable (no parent)
  const isDraggable = !item.parentId && depth === 0 && !!onDragStart;

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (onDragStart) {
      onDragStart(e, item.id);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (onDragOver) {
      onDragOver(e, item.id);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (onDrop) {
      onDrop(e, item.id);
    }
  };

  return (
    <>
      <tr 
        className={cn(
          'border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer',
          isBlocker && 'bg-destructive/5 hover:bg-destructive/10',
          isDragging && 'opacity-50',
          isDragOver && 'bg-primary/20 border-t-2 border-t-primary'
        )}
        onClick={handleRowClick}
        draggable={isDraggable}
        onDragStart={isDraggable ? handleDragStart : undefined}
        onDragOver={isDraggable ? handleDragOver : undefined}
        onDragLeave={isDraggable ? onDragLeave : undefined}
        onDrop={isDraggable ? handleDrop : undefined}
        onDragEnd={isDraggable ? onDragEnd : undefined}
      >
        {/* Number, plus button and expand arrow */}
        <td className="py-2 px-3 w-20">
          <div className="flex items-center gap-1">
            {index !== undefined && (
              <span className="text-xs text-muted-foreground w-6 text-right">{index}</span>
            )}
            {canHaveChildren && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                    title="Add child task or blocker"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsAddChildOpen(true);
                  }}>
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsAddBlockerOpen(true);
                  }}>
                    Add Blocker
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {hasChildren ? (
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
          </div>
        </td>

        {/* Title with icon */}
        <td className="py-2 px-3" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4 flex-shrink-0', typeColors[item.type])} />
            {isBlocker && <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />}
            <span className={cn('text-sm', isBlocker && 'text-destructive font-medium')}>
              {item.title}
            </span>
          </div>
        </td>

        {/* Type */}
        <td className="py-2 px-3 w-28">
          <span className={cn('text-xs', typeColors[item.type])}>{item.type}</span>
        </td>

        {/* Assigned */}
        <td className="py-2 px-3 w-36">
          <span className="text-xs">
            {assignee ? assignee.name : 'Unassigned'}
          </span>
        </td>

        {/* State */}
        <td className="py-2 px-3 w-24">
          <Badge className={cn('text-xs', stateColors[item.state])}>
            {item.state}
          </Badge>
        </td>

        {/* Priority */}
        <td className="py-2 px-3 w-24">
          <span className={cn('text-xs font-medium', priorityColors[item.priority])}>
            {item.priority}
          </span>
        </td>

        {/* Tags */}
        <td className="py-2 px-3">
          <div className="flex flex-wrap gap-1 justify-end">
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

        {/* Three dots menu */}
        <td className="py-2 px-3 w-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Item
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Move to Sprint
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveToSprint('')}>
                    No Sprint
                  </DropdownMenuItem>
                  {sprints.map((sprint) => (
                    <DropdownMenuItem key={sprint.id} onClick={() => handleMoveToSprint(sprint.id)}>
                      {sprint.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Child items */}
      {expanded && children.map(child => (
        <WorkItemRow 
          key={child.id} 
          item={child} 
          depth={depth + 1}
          onRowClick={onRowClick}
          hideSprintColumn={hideSprintColumn}
          isDragging={false}
          isDragOver={false}
        />
      ))}

      {/* Add Child Task Dialog */}
      <AddChildItemDialog
        open={isAddChildOpen}
        onOpenChange={setIsAddChildOpen}
        parentItem={item}
        isBlocker={false}
      />

      {/* Add Blocker Dialog */}
      <AddChildItemDialog
        open={isAddBlockerOpen}
        onOpenChange={setIsAddBlockerOpen}
        parentItem={item}
        isBlocker={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
}
