import { useState, useMemo } from 'react';
import { TaskGroupRow } from './TaskGroupRow'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { WorkItem, WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { WorkItemRow } from './WorkItemRow';
import { WorkItemFilters } from './WorkItemFilters';
import { AddWorkItemDialog } from './AddWorkItemDialog';
import { TaskCardModal } from './TaskCardModal';
import { AITaskCreator } from './ai/AITaskCreator';

interface FiltersState {
  search: string;
  type: WorkItemType | 'all';
  state: WorkItemState | 'all';
  assignee: string;
  priority: Priority | 'all';
  blockerOnly: boolean;
}

interface WorkItemListProps {
  items: WorkItem[];
  title: string;
  defaultSprintId?: string;
  hideSprintColumn?: boolean; // Hide sprint column in table (used when sprint is shown in navigation)
  hideSprintInDialog?: boolean; // Hide sprint selector in add dialog
  hideStatePriorityTags?: boolean; // Hide State, Priority, and Tags columns (used for Daily board)
  isDailyBoard?: boolean; // If true, tasks added will get "Daily" tag automatically
}

/**
 * WorkItemList Component
 * 
 * Displays a list of work items in a table format with:
 * - Filtering capabilities (search, type, state, assignee, priority, blockers)
 * - Drag and drop reordering
 * - Click to view/edit task details
 * - Add new task dialog
 * 
 * Features:
 * - Shows only top-level items (children are nested in WorkItemRow)
 * - Supports hiding columns for simplified views (Daily board)
 * - Automatic task tagging for Daily board separation
 */
export function WorkItemList({ items, title, defaultSprintId, hideSprintColumn = false, hideSprintInDialog = false, hideStatePriorityTags = false, isDailyBoard = false }: WorkItemListProps) {
  const { reorderWorkItems, workItems, taskGroups, createTaskGroup, updateWorkItem } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const selected = selectedIds.filter(id => items.some(item => item.id === id))
  const boardGroups = taskGroups.filter(g => items.some(item => item.groupId === g.id))
  const toggleSelected = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id])

  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    type: 'all',
    state: 'all',
    assignee: 'all',
    priority: 'all',
    blockerOnly: false,
  });
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  /**
   * Filter to only top-level items (items without a parent).
   * Child items are displayed nested under their parents in the row component.
   * Sort by order field, then by createdAt as fallback.
   */
  const topLevelItems = useMemo(() => {
    return items
      .filter(item => !item.parentId)
      .sort((a, b) => {
        const orderA = a.order ?? a.createdAt;
        const orderB = b.order ?? b.createdAt;
        return orderA - orderB;
      });
  }, [items]);

  /**
   * Apply all active filters to the top-level items.
   * Filters include: search text, type, state, assignee, priority, and blocker status.
   */
  const filteredItems = useMemo(() => {
    return topLevelItems.filter(item => {
      // Search filter: check if title contains search text (case-insensitive)
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter: filter by work item type
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      
      // State filter: filter by work item state (New, Active, Done)
      if (filters.state !== 'all' && item.state !== filters.state) {
        return false;
      }
      
      // Assignee filter: filter by assignee or unassigned items
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && item.assigneeId) {
          return false;
        }
        if (filters.assignee !== 'unassigned' && item.assigneeId !== filters.assignee) {
          return false;
        }
      }
      
      // Priority filter: filter by priority level
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      
      // Blocker filter: show only items tagged as blockers
      if (filters.blockerOnly && !item.tags.includes('Blocker')) {
        return false;
      }
      
      return true;
    });
  }, [topLevelItems, filters]);

  const handleRowClick = (item: WorkItem) => {
    setSelectedWorkItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setIsModalOpen(false);
      setSelectedWorkItem(null);
    }
  };

  /**
   * Drag and Drop Handlers
   * Allows reordering of tasks by dragging and dropping
   */
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItemId && draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    setDragOverItemId(null);
    
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    // Calculate new order based on drag position
    const currentOrder = filteredItems.map(item => item.id);
    const draggedIndex = currentOrder.indexOf(draggedItemId);
    const targetIndex = currentOrder.indexOf(targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    // Reorder: remove dragged item and insert at target position
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItemId);

    reorderWorkItems(newOrder);
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // Calculate column count for empty state message
  // Daily board: 5 columns (#, Title, Type, Assigned, Actions)
  // Sprint board: 8 columns (+ State, Priority, Tags)
  const columnCount = hideStatePriorityTags ? 5 : 8;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold tracking-wide">{title}</h2>
        <div className="flex items-center gap-2">
          <AITaskCreator defaultSprintId={defaultSprintId} isDailyBoard={isDailyBoard} />
          <AddWorkItemDialog defaultSprintId={defaultSprintId} hideSprint={hideSprintInDialog} isDailyBoard={isDailyBoard} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 flex-wrap border-b border-border">
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
        <Input aria-label="Group name" placeholder="Group name" className="w-44 h-8" value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={100} />
        <Button size="sm" variant="outline" disabled={selected.length < 2 || !groupName.trim()} onClick={() => {
          createTaskGroup(groupName, selected)
          setSelectedIds([])
          setGroupName('')
        }}>Group selected</Button>
        {selected.length > 0 && <>
          <select aria-label="Move selected tasks to group" className="bg-card border border-border rounded p-1 text-sm" value="" onChange={e => {
            if (!e.target.value) return
            selected.forEach(id => updateWorkItem(id, { groupId: e.target.value === '__none__' ? undefined : e.target.value }))
            setSelectedIds([])
          }}>
            <option value="">Move to group...</option>
            <option value="__none__">Remove from group</option>
            {boardGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear selection</Button>
        </>}
      </div>
      <WorkItemFilters filters={filters} onFiltersChange={setFilters} hideStatePriorityTags={hideStatePriorityTags} />

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 px-3 w-20">#</th>
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3 w-28">Type</th>
              <th className="py-2 px-3 w-36">Assigned</th>
              {!hideStatePriorityTags && (
                <>
                  <th className="py-2 px-3 w-24">State</th>
                  <th className="py-2 px-3 w-24">Priority</th>
                  <th className="py-2 px-3">Tags</th>
                </>
              )}
              <th className="py-2 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const renderTask = (item: WorkItem) => <WorkItemRow key={item.id} item={item}
                index={topLevelItems.findIndex(value => value.id === item.id) + 1}
                selected={selected.includes(item.id)} onToggleSelected={() => toggleSelected(item.id)}
                onRowClick={handleRowClick} hideSprintColumn={hideSprintColumn} hideStatePriorityTags={hideStatePriorityTags}
                isDragging={draggedItemId === item.id} isDragOver={dragOverItemId === item.id}
                onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={handleDragEnd} />
              const seen = new Set<string>()
              return filteredItems.map(item => {
                const group = taskGroups.find(g => g.id === item.groupId)
                if (!group) return renderTask(item)
                if (seen.has(group.id)) return null
                seen.add(group.id)
                const all = topLevelItems.filter(task => task.groupId === group.id)
                const visible = filteredItems.filter(task => task.groupId === group.id)
                return <TaskGroupRow key={group.id} group={group} items={all} visibleCount={visible.length} columnCount={columnCount}>
                  {visible.map(renderTask)}
                </TaskGroupRow>
              })
            })()}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="py-8 text-center text-muted-foreground">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TaskCardModal 
        workItem={workItems.find(item => item.id === selectedWorkItem?.id) || null}
        open={isModalOpen} 
        onOpenChange={handleModalClose} 
      />
    </div>
  );
}
