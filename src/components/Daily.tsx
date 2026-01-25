import { useState, useMemo } from 'react';
import { WorkItem } from '@/types';
import { useApp } from '@/context/AppContext';
import { AddWorkItemDialog } from './AddWorkItemDialog';
import { TaskCardModal } from './TaskCardModal';

export function Daily() {
  const { workItems, getPersonById } = useApp();
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Get all top-level items (no parent), sorted by order or createdAt
  const allTasks = useMemo(() => {
    return workItems
      .filter(item => !item.parentId)
      .filter(item => {
        if (search && !item.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const orderA = a.order ?? a.createdAt;
        const orderB = b.order ?? b.createdAt;
        return orderA - orderB;
      });
  }, [workItems, search]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-bold tracking-wide">DAILY</h2>
        <AddWorkItemDialog />
      </div>

      {/* Simple search */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 px-3 w-20">#</th>
              <th className="py-2 px-3">Task</th>
              <th className="py-2 px-3 w-36">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((item, index) => {
              const assignee = item.assigneeId ? getPersonById(item.assigneeId) : null;
              return (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="py-2 px-3 w-20">
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="text-sm">{item.title}</span>
                  </td>
                  <td className="py-2 px-3 w-36">
                    <span className="text-xs">
                      {assignee ? assignee.name : 'Unassigned'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {allTasks.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  {search ? 'No tasks found' : 'No tasks yet'}
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
