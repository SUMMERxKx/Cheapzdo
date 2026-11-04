import { useApp } from '@/context/AppContext';
import { WorkItemList } from './WorkItemList';
import { SprintNavigation } from './SprintNavigation';

/**
 * DailyContent Component
 * 
 * Daily task management content, rendered inside the MainBoard tab system.
 * 
 * Features:
 * - Simplified view without State, Priority, and Tags columns
 * - Shows only tasks with "Daily" tag
 * - Tasks added here automatically get "Daily" tag to separate from Sprint tasks
 * - Uses Sprint Navigation for sprint context
 */
export function DailyContent() {
  const { workItems, activeSprint } = useApp();

  // Filter Daily tasks: items with "Daily" tag (regardless of sprintId)
  // Tasks added from Daily board automatically get "Daily" tag
  const dailyTasks = workItems.filter(item => item.tags.includes('Daily'));

  return (
    <>
      <SprintNavigation />
      <div className="flex-1 overflow-hidden min-h-0">
        <WorkItemList 
          items={dailyTasks} 
          title="DAILY" 
          hideSprintColumn={true}
          isDailyBoard={true}
          hideStatePriorityTags={true}
        />
      </div>
    </>
  );
}
