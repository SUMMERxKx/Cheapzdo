import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkItemList } from './WorkItemList';
import { Dashboard } from './Dashboard';
import { Header } from './Header';
import { SprintNavigation } from './SprintNavigation';
import { Announcements } from './Announcements';
import { LayoutDashboard, Zap, Megaphone } from 'lucide-react';

type TabValue = 'dashboard' | 'sprint' | 'announcements';

export function MainBoard() {
  const { workItems, activeSprint } = useApp();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  // Show all tasks in Sprint Board (todo board)
  const allTasks = workItems;

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
              <span className="ml-1 text-xs text-muted-foreground">({allTasks.filter(i => !i.parentId).length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="announcements" className="flex-1 m-0 overflow-hidden">
          <Announcements />
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1 m-0">
          <Dashboard />
        </TabsContent>

        <TabsContent value="sprint" className="flex-1 m-0 flex flex-col">
          <SprintNavigation />
          <div className="flex-1 overflow-hidden">
            <WorkItemList 
              items={allTasks} 
              title="SPRINT BOARD" 
              defaultSprintId={activeSprint || undefined}
              hideSprintColumn={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
