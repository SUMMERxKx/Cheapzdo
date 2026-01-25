import { useState } from 'react';
import { WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddWorkItemDialogProps {
  defaultSprintId?: string;
  parentId?: string;
  parentType?: WorkItemType;
  hideSprint?: boolean; // Hide sprint selector in dialog
  isDailyBoard?: boolean; // If true, automatically adds "Daily" tag and excludes sprintId
}

/**
 * AddWorkItemDialog Component
 * 
 * Dialog for adding new work items/tasks.
 * 
 * Behavior:
 * - When isDailyBoard=true: Automatically adds "Daily" tag and sets sprintId to undefined
 * - When hideSprint=true: Hides the sprint selector field
 * - When parentId is provided: Only allows "Other" type (for child tasks)
 */
export function AddWorkItemDialog({ defaultSprintId, parentId, parentType, hideSprint = false, isDailyBoard = false }: AddWorkItemDialogProps) {
  const { addWorkItem, people, sprints } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WorkItemType>(parentId ? 'Other' : 'Other');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>(defaultSprintId || '');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for the task');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse tags from comma-separated string
      const taskTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      
      // Daily board tasks: automatically add "Daily" tag to ensure separation from Sprint tasks
      if (isDailyBoard && !taskTags.includes('Daily')) {
        taskTags.push('Daily');
      }
      
      // Determine sprintId:
      // - Daily board: always undefined (no sprint assignment)
      // - hideSprint: undefined (sprint selector hidden)
      // - Otherwise: use selected sprintId or defaultSprintId
      const finalSprintId = isDailyBoard 
        ? undefined 
        : (hideSprint ? undefined : (sprintId || undefined));
      
      await addWorkItem({
        title: title.trim(),
        type,
        state: 'New',
        priority,
        assigneeId: assigneeId || undefined,
        sprintId: finalSprintId,
        parentId,
        tags: taskTags,
      });

      toast.success('Task added successfully');
      
      // Reset form
    setTitle('');
    setTags('');
      setAssigneeId('');
      setSprintId(defaultSprintId || '');
      setType(parentId ? 'Other' : 'Other');
      setPriority('Medium');
    setOpen(false);
    } catch (error) {
      console.error('Error adding work item:', error);
      toast.error('Failed to add task. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTypes: WorkItemType[] = parentId
    ? ['Other']
    : ['Study', 'Gym', 'Sports', 'Running', 'Entertainment', 'Other'];

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setTitle('');
      setTags('');
      setAssigneeId('');
      setSprintId(defaultSprintId || '');
      setType(parentId ? 'Other' : 'Other');
      setPriority('Medium');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {parentId ? `Add Task to ${parentType}` : 'Add Work Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter work item title..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as WorkItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select 
                value={assigneeId || "__none__"} 
                onValueChange={(value) => setAssigneeId(value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {people.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!parentId && !hideSprint && !isDailyBoard && (
              <div className="space-y-2">
                <Label>Sprint</Label>
                <Select 
                  value={sprintId || "__none__"} 
                  onValueChange={(value) => setSprintId(value === "__none__" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No Sprint" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="__none__">No Sprint</SelectItem>
                    {sprints.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., Blocker, backend, urgent"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
