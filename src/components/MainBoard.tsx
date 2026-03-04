import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkItemList } from './WorkItemList';
import { Dashboard } from './Dashboard';
import { Header } from './Header';
import { SprintNavigation } from './SprintNavigation';
import { Announcements } from './Announcements';
import { DailyContent } from './Daily';
import { Leaderboard } from './Leaderboard';
import { LayoutDashboard, Zap, Megaphone, CalendarDays, Trophy, Layers } from 'lucide-react';

type TabValue = 'dashboard' | 'sprint' | 'arc' | 'announcements' | 'daily' | 'leaderboard';

/**
 * MainBoard Component
 * 
 * Main application board with tabbed interface containing:
 * - Announcements: Team announcements and updates
 * - Dashboard: Analytics and team overview (+ AI Insights)
 * - Sprint Board: Sprint-based task management (+ AI Task Creator)
 * - Daily: Daily task management (+ AI Task Creator)
 * - Leaderboard: Team performance rankings
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

  // Arc Board: all items that belong to any sprint (cross-sprint PI view), no Daily tasks
  const arcTasks = workItems.filter(item => item.sprintId && !item.tags.includes('Daily'));

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
              value="arc"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Layers className="w-4 h-4" />
              Arc Board
              <span className="ml-1 text-xs text-muted-foreground">({arcTasks.filter(i => !i.parentId).length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
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

        {/* Arc Board: Cross-sprint PI planning view — all sprint items in one place */}
        <TabsContent value="arc" className="flex-1 m-0 !mt-0 p-0 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <WorkItemList
              items={arcTasks}
              title="ARC BOARD"
              hideSprintColumn={false}
            />
          </div>
        </TabsContent>

        {/* Daily Board: Simplified daily task management */}
        <TabsContent value="daily" className="flex-1 m-0 !mt-0 p-0 flex flex-col overflow-hidden min-h-0">
          <DailyContent />
        </TabsContent>

        {/* Leaderboard: Team performance rankings */}
        <TabsContent value="leaderboard" className="flex-1 mt-0 overflow-auto">
          <Leaderboard />
        </TabsContent>

      </Tabs>
    </div>
  );
}
