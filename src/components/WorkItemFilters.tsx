import { WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, X } from 'lucide-react';

interface FiltersState {
  search: string;
  type: WorkItemType | 'all';
  state: WorkItemState | 'all';
  assignee: string;
  priority: Priority | 'all';
  blockerOnly: boolean;
}

interface WorkItemFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export function WorkItemFilters({ filters, onFiltersChange }: WorkItemFiltersProps) {
  const { people } = useApp();

  const updateFilter = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      type: 'all',
      state: 'all',
      assignee: 'all',
      priority: 'all',
      blockerOnly: false,
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.state !== 'all' ||
    filters.assignee !== 'all' ||
    filters.priority !== 'all' ||
    filters.blockerOnly;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border bg-card">
      <Input
        placeholder="Search..."
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="w-48 h-8 text-sm"
      />

      <Select value={filters.type} onValueChange={(value) => updateFilter('type', value as WorkItemType | 'all')}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Epic">Epic</SelectItem>
          <SelectItem value="User Story">User Story</SelectItem>
          <SelectItem value="Task">Task</SelectItem>
          <SelectItem value="Bug">Bug</SelectItem>
          <SelectItem value="Operation">Operation</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.state} onValueChange={(value) => updateFilter('state', value as WorkItemState | 'all')}>
        <SelectTrigger className="w-28 h-8 text-sm">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.assignee} onValueChange={(value) => updateFilter('assignee', value)}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {people.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value as Priority | 'all')}>
        <SelectTrigger className="w-28 h-8 text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant={filters.blockerOnly ? 'destructive' : 'outline'}
        size="sm"
        className="h-8 gap-2"
        onClick={() => updateFilter('blockerOnly', !filters.blockerOnly)}
      >
        <AlertTriangle className="w-4 h-4" />
        Blockers
      </Button>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={resetFilters}>
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
