import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkItemList } from './WorkItemList';
import { Dashboard } from './Dashboard';
import { Header } from './Header';
import { SprintNavigation } from './SprintNavigation';
import { Announcements } from './Announcements';
import { LayoutDashboard, Zap, Megaphone, Calendar } from 'lucide-react';

type TabValue = 'dashboard' | 'sprint' | 'announcements' | 'daily';

/**
 * MainBoard Component
 * 
 * Main application board with tabbed interface containing:
 * - Announcements: Team announcements and updates
 * - Dashboard: Analytics and team overview
 * - Sprint Board: Sprint-based task management
 * - Daily Board: Daily task management (simplified view without State/Priority/Tags)
 * 
 * Task Separation:
 * - Sprint tasks: Have sprintId and do NOT have "Daily" tag
 * - Daily tasks: Have "Daily" tag (regardless of sprintId)
 */
export function MainBoard() {
  const { workItems, activeSprint } = useApp();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  // Filter Sprint tasks: items assigned to active sprint that don't have "Daily" tag
  // This ensures Daily board tasks don't appear in Sprint board
  const sprintTasks = activeSprint 
    ? workItems.filter(item => item.sprintId === activeSprint && !item.tags.includes('Daily'))
    : [];
  
  // Filter Daily tasks: items with "Daily" tag (regardless of sprintId)
  // Tasks added from Daily board automatically get "Daily" tag
  const dailyTasks = workItems.filter(item => item.tags.includes('Daily'));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card">
          <TabsList className="h-12 bg-transparent rounded-none border-0 px-4">
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="sprint"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Zap className="w-4 h-4" />
              Sprint Board
              <span className="ml-1 text-xs text-muted-foreground">({sprintTasks.filter(i => !i.parentId).length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Calendar className="w-4 h-4" />
              Daily
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="announcements" className="flex-1 mt-2 overflow-hidden">
          <Announcements />
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1 mt-2">
          <Dashboard />
        </TabsContent>

        {/* Sprint Board: Full-featured task management with all columns */}
        <TabsContent value="sprint" className="flex-1 m-0 !mt-0 p-0 flex flex-col overflow-hidden min-h-0">
          <SprintNavigation />
          <div className="flex-1 overflow-hidden min-h-0">
            <WorkItemList 
              items={sprintTasks} 
              title="SPRINT BOARD" 
              defaultSprintId={activeSprint || undefined}
              hideSprintColumn={true}
            />
          </div>
        </TabsContent>

        {/* Daily Board: Simplified task management without State/Priority/Tags columns */}
        {/* Uses same structure as Sprint board but with hideStatePriorityTags flag */}
        {/* Tasks added here automatically get "Daily" tag to separate from Sprint tasks */}
        <TabsContent value="daily" className="flex-1 m-0 !mt-0 p-0 flex flex-col overflow-hidden min-h-0">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
