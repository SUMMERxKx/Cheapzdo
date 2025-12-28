import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function SprintNavigation() {
  const { 
    activeSprint, 
    sprints, 
    getNextSprint, 
    getPreviousSprint, 
    navigateToNextSprint, 
    navigateToPreviousSprint,
    addSprint,
    setActiveSprint 
  } = useApp();
  
  const currentSprint = sprints.find(s => s.id === activeSprint);
  const nextSprint = getNextSprint();
  const previousSprint = getPreviousSprint();
  const [isAddSprintOpen, setIsAddSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');

  // Format sprint date range
  const formatSprintDates = (startDate: number, endDate: number) => {
    const start = format(new Date(startDate), 'MMM d');
    const end = format(new Date(endDate), 'MMM d, yyyy');
    return `${start} - ${end}`;
  };

  const handleAddSprint = () => {
    if (!newSprintName.trim()) {
      return;
    }

    // If no sprints exist, start from today
    // Otherwise, start the new sprint right after the last sprint
    let startDate: number | undefined;
    if (sprints.length > 0) {
      const sortedSprints = [...sprints].sort((a, b) => b.endDate - a.endDate);
      const lastSprint = sortedSprints[0];
      // Start new sprint the day after the last sprint ends
      startDate = lastSprint.endDate + (24 * 60 * 60 * 1000);
    }

    addSprint(newSprintName.trim(), startDate);
    setNewSprintName('');
    setIsAddSprintOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={navigateToPreviousSprint}
          disabled={!previousSprint}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex flex-col items-center min-w-[200px]">
          {currentSprint ? (
            <>
              <span className="text-sm font-semibold">{currentSprint.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatSprintDates(currentSprint.startDate, currentSprint.endDate)}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No sprint selected</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={navigateToNextSprint}
          disabled={!nextSprint}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={isAddSprintOpen} onOpenChange={setIsAddSprintOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Sprint
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="e.g., Sprint 2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSprint();
                  }
                }}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sprints are automatically set to 2 weeks. The new sprint will start after the last sprint ends.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddSprintOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSprint}>
                Create Sprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

