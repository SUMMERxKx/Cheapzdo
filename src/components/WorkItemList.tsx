import { useState, useMemo } from 'react';
import { WorkItem, WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { WorkItemRow } from './WorkItemRow';
import { WorkItemFilters } from './WorkItemFilters';
import { AddWorkItemDialog } from './AddWorkItemDialog';
import { TaskCardModal } from './TaskCardModal';

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
  hideSprintColumn?: boolean;
}

export function WorkItemList({ items, title, defaultSprintId, hideSprintColumn = false }: WorkItemListProps) {
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

  /**
   * Filter to only top-level items (items without a parent).
   * Child items are displayed nested under their parents in the row component.
   */
  const topLevelItems = useMemo(() => {
    return items.filter(item => !item.parentId);
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedWorkItem(null);
  };

  // Calculate column count for empty state
  const columnCount = hideSprintColumn ? 8 : 9;

  return (
    <div className="flex flex-col h-full">
      {!hideSprintColumn && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold tracking-wide">{title}</h2>
          <AddWorkItemDialog defaultSprintId={defaultSprintId} />
        </div>
      )}

      {hideSprintColumn && (
        <div className="flex items-center p-4 border-b border-border">
          <h2 className="text-lg font-bold tracking-wide">{title}</h2>
        </div>
      )}

      <WorkItemFilters filters={filters} onFiltersChange={setFilters} />

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 px-3 w-10"></th>
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3 w-28">Type</th>
              <th className="py-2 px-3 w-24">State</th>
              <th className="py-2 px-3 w-36">Assignee</th>
              <th className="py-2 px-3 w-24">Priority</th>
              {!hideSprintColumn && <th className="py-2 px-3 w-32">Sprint</th>}
              <th className="py-2 px-3">Tags</th>
              <th className="py-2 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <WorkItemRow 
                key={item.id} 
                item={item} 
                onRowClick={handleRowClick}
                hideSprintColumn={hideSprintColumn}
              />
            ))}
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
        workItem={selectedWorkItem} 
        open={isModalOpen} 
        onOpenChange={handleModalClose} 
      />
    </div>
  );
}
