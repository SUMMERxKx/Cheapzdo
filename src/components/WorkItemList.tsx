import { useState, useMemo } from 'react';
import { WorkItem, WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { WorkItemRow } from './WorkItemRow';
import { WorkItemFilters } from './WorkItemFilters';
import { AddWorkItemDialog } from './AddWorkItemDialog';

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
}

export function WorkItemList({ items, title, defaultSprintId }: WorkItemListProps) {
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    type: 'all',
    state: 'all',
    assignee: 'all',
    priority: 'all',
    blockerOnly: false,
  });

  // Filter to only top-level items (no parent)
  const topLevelItems = useMemo(() => {
    return items.filter(item => !item.parentId);
  }, [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return topLevelItems.filter(item => {
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      if (filters.state !== 'all' && item.state !== filters.state) {
        return false;
      }
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && item.assigneeId) {
          return false;
        }
        if (filters.assignee !== 'unassigned' && item.assigneeId !== filters.assignee) {
          return false;
        }
      }
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }
      if (filters.blockerOnly && !item.tags.includes('Blocker')) {
        return false;
      }
      return true;
    });
  }, [topLevelItems, filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold tracking-wide">{title}</h2>
        <AddWorkItemDialog defaultSprintId={defaultSprintId} />
      </div>

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
              <th className="py-2 px-3 w-32">Sprint</th>
              <th className="py-2 px-3">Tags</th>
              <th className="py-2 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <WorkItemRow key={item.id} item={item} />
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
