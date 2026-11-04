import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from './ConfirmDialog';

export function SprintNavigation() {
  const { 
    activeSprint, 
    sprints, 
    getNextSprint, 
    getPreviousSprint, 
    navigateToNextSprint, 
    navigateToPreviousSprint,
    addSprint,
    updateSprint,
    deleteSprint,
    setActiveSprint 
  } = useApp();
  
  const currentSprint = sprints.find(s => s.id === activeSprint);
  const nextSprint = getNextSprint();
  const previousSprint = getPreviousSprint();
  const [isAddSprintOpen, setIsAddSprintOpen] = useState(false);
  const [isEditSprintOpen, setIsEditSprintOpen] = useState(false);
  const [isDeleteSprintOpen, setIsDeleteSprintOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [editingSprint, setEditingSprint] = useState<{ id: string; name: string } | null>(null);

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

  const handleEditSprint = () => {
    if (!editingSprint || !newSprintName.trim()) {
      return;
    }
    updateSprint(editingSprint.id, { name: newSprintName.trim() });
    setEditingSprint(null);
    setNewSprintName('');
    setIsEditSprintOpen(false);
  };

  const handleDeleteSprint = () => {
    if (currentSprint) {
      deleteSprint(currentSprint.id);
      setIsDeleteSprintOpen(false);
    }
  };

  const openEditDialog = () => {
    if (currentSprint) {
      setEditingSprint({ id: currentSprint.id, name: currentSprint.name });
      setNewSprintName(currentSprint.name);
      setIsEditSprintOpen(true);
    }
  };

  return (
    <>
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

          <div className="flex items-center gap-2 min-w-[200px]">
            {currentSprint ? (
              <>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-sm font-semibold">{currentSprint.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatSprintDates(currentSprint.startDate, currentSprint.endDate)}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openEditDialog}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Sprint
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteSprintOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Sprint
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Edit Sprint Dialog */}
      <Dialog open={isEditSprintOpen} onOpenChange={setIsEditSprintOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Sprint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sprint-name">Sprint Name</Label>
              <Input
                id="edit-sprint-name"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                placeholder="Sprint name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditSprint();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditSprintOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSprint}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Sprint Confirmation */}
      <ConfirmDialog
        open={isDeleteSprintOpen}
        onOpenChange={setIsDeleteSprintOpen}
        title="Delete Sprint"
        description={`Are you sure you want to delete "${currentSprint?.name}"? All tasks in this sprint will be moved to no sprint.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteSprint}
        variant="destructive"
      />
    </>
  );
}
