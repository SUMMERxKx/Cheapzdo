import { useState, useEffect } from 'react';
import { WorkItem, WorkItemType, WorkItemState, Priority } from '@/types';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardModalProps {
  workItem: WorkItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCardModal({ workItem, open, onOpenChange }: TaskCardModalProps) {
  const { updateWorkItem, addComment, people, sprints, getPersonById } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkItemType>('Task');
  const [state, setState] = useState<WorkItemState>('New');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newComment, setNewComment] = useState('');

  // Update form when workItem changes
  useEffect(() => {
    if (workItem) {
      setTitle(workItem.title);
      setDescription(workItem.description || '');
      setType(workItem.type);
      setState(workItem.state);
      setPriority(workItem.priority);
      setAssigneeId(workItem.assigneeId || '');
      setSprintId(workItem.sprintId || '');
      setTags([...workItem.tags]);
      setTagInput('');
      setNewComment('');
    }
  }, [workItem]);

  // Handle saving changes
  const handleSave = () => {
    if (!workItem) {
      return;
    }

    updateWorkItem(workItem.id, {
      title,
      description,
      type,
      state,
      priority,
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
      tags,
    });
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (!workItem) {
      return;
    }
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setTagInput('');
      updateWorkItem(workItem.id, { tags: newTags });
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!workItem) {
      return;
    }
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    updateWorkItem(workItem.id, { tags: newTags });
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (!workItem || !newComment.trim()) {
      return;
    }

    addComment(workItem.id, newComment.trim());
    setNewComment('');
  };

  if (!workItem) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="modal-title">Title</Label>
              <Input
                id="modal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
              />
            </div>

            {/* Basic Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(value: WorkItemType) => {
                  setType(value);
                  updateWorkItem(workItem.id, { type: value });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Epic">Epic</SelectItem>
                    <SelectItem value="User Story">User Story</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Bug">Bug</SelectItem>
                    <SelectItem value="Operation">Operation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={(value: WorkItemState) => {
                  setState(value);
                  updateWorkItem(workItem.id, { state: value });
                }}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(value: Priority) => {
                  setPriority(value);
                  updateWorkItem(workItem.id, { priority: value });
                }}>
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

              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={(value) => {
                  setAssigneeId(value);
                  updateWorkItem(workItem.id, { assigneeId: value || undefined });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {people.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select value={sprintId} onValueChange={(value) => {
                setSprintId(value);
                updateWorkItem(workItem.id, { sprintId: value || undefined });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Backlog" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Backlog</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add tag..."
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tag === 'Blocker' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Description Section */}
            <div className="space-y-2">
              <Label htmlFor="modal-description">Description</Label>
              <Textarea
                id="modal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSave}
                placeholder="Add a description..."
                className="min-h-[120px]"
              />
            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-4">
              <Label>Comments</Label>
              
              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <Button onClick={handleAddComment} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {workItem.comments && workItem.comments.length > 0 ? (
                  workItem.comments
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map(comment => {
                      const author = comment.authorId ? getPersonById(comment.authorId) : null;
                      return (
                        <div key={comment.id} className="p-3 bg-secondary rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {author && (
                                <span className="text-sm font-medium">{author.name}</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

