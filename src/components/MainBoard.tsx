import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkItemList } from './WorkItemList';
import { Dashboard } from './Dashboard';
import { PeopleManager } from './PeopleManager';
import { Header } from './Header';
import { SprintNavigation } from './SprintNavigation';
import { LayoutDashboard, Archive, Zap, Users } from 'lucide-react';

type TabValue = 'dashboard' | 'sprint' | 'taskhub' | 'people';

export function MainBoard() {
  const { workItems, activeSprint } = useApp();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  // Task Hub items are items without a sprint (backlog items)
  const taskHubItems = workItems.filter(item => !item.sprintId);
  // Sprint items are items assigned to the active sprint
  const sprintItems = workItems.filter(item => item.sprintId === activeSprint);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card">
          <TabsList className="h-12 bg-transparent rounded-none border-0 px-4">
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
              Sprint
              <span className="ml-1 text-xs text-muted-foreground">({sprintItems.filter(i => !i.parentId).length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="taskhub"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Archive className="w-4 h-4" />
              Task Hub
              <span className="ml-1 text-xs text-muted-foreground">({taskHubItems.filter(i => !i.parentId).length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="data-[state=active]:bg-secondary data-[state=active]:text-foreground gap-2"
            >
              <Users className="w-4 h-4" />
              People
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 m-0">
          <Dashboard />
        </TabsContent>

        <TabsContent value="sprint" className="flex-1 m-0 flex flex-col">
          <SprintNavigation />
          <div className="flex-1 overflow-hidden">
            <WorkItemList 
              items={sprintItems} 
              title="SPRINT" 
              defaultSprintId={activeSprint || undefined}
              hideSprintColumn={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="taskhub" className="flex-1 m-0">
          <WorkItemList items={taskHubItems} title="TASK HUB" />
        </TabsContent>

        <TabsContent value="people" className="flex-1 m-0">
          <PeopleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
