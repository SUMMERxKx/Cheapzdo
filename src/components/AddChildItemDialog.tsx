import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { WorkItem, WorkItemType, Priority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddChildItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentItem: WorkItem;
  isBlocker?: boolean;
}

export function AddChildItemDialog({ open, onOpenChange, parentItem, isBlocker = false }: AddChildItemDialogProps) {
  const { addWorkItem, people, sprints } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkItemType>('Other');
  const [state, setState] = useState<'New' | 'Active' | 'Done'>('New');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setTitle('');
      setDescription('');
      setType('Other');
      setState('New');
      setPriority('Medium');
      setAssigneeId('');
      setSprintId(parentItem.sprintId || '');
    }
  }, [open, parentItem.sprintId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = isBlocker ? ['Blocker'] : [];
      
      await addWorkItem({
        title: title.trim(),
        type,
        state,
        priority,
        assigneeId: assigneeId || undefined,
        sprintId: sprintId || undefined,
        parentId: parentItem.id,
        tags,
        description: description.trim() || undefined,
      });

      toast.success(isBlocker ? 'Blocker added successfully' : 'Child task added successfully');
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('Other');
      setState('New');
      setPriority('Medium');
      setAssigneeId('');
      setSprintId(parentItem.sprintId || '');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding child item:', error);
      toast.error('Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isBlocker ? 'Add Blocker' : 'Add Child Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: WorkItemType) => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Study">Study</SelectItem>
                  <SelectItem value="Gym">Gym</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Select value={state} onValueChange={(value: 'New' | 'Active' | 'Done') => setState(value)}>
                <SelectTrigger id="state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select value={assigneeId || '__none__'} onValueChange={(value) => setAssigneeId(value === '__none__' ? '' : value)}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sprint">Sprint</Label>
              <Select value={sprintId || '__none__'} onValueChange={(value) => setSprintId(value === '__none__' ? '' : value)}>
                <SelectTrigger id="sprint">
                  <SelectValue placeholder="No Sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Sprint</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isBlocker && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                This will be added as a blocker with the "Blocker" tag.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : isBlocker ? 'Add Blocker' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

