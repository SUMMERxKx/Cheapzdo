import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shapes, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TYPE_ICONS, TYPE_COLORS, FALLBACK_TYPE, getTypeIcon, getTypeColorClass } from '@/lib/workItemTypes';

/**
 * WorkItemTypeLabel
 *
 * A type's icon in its colour, followed by its name. Used in the type selects.
 */
export function WorkItemTypeLabel({ name }: { name: string }) {
  const { workItemTypes } = useApp();
  const type = workItemTypes.find(t => t.name === name);
  const Icon = getTypeIcon(type?.icon);

  return (
    <span className="flex items-center gap-2">
      <Icon className={cn('w-3.5 h-3.5', getTypeColorClass(type?.color))} />
      {name}
    </span>
  );
}

interface SymbolPickerProps {
  icon: string;
  color: string;
  onChange: (updates: { icon?: string; color?: string }) => void;
}

/**
 * Grid of icons and a row of colour swatches.
 */
function SymbolPicker({ icon, color, onChange }: SymbolPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-8 gap-1">
        {Object.entries(TYPE_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            title={key}
            onClick={() => onChange({ icon: key })}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded border border-transparent hover:bg-secondary',
              icon === key && 'border-primary bg-secondary',
            )}
          >
            <Icon className={cn('w-4 h-4', getTypeColorClass(color))} />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(TYPE_COLORS).map(([key, { swatch }]) => (
          <button
            key={key}
            type="button"
            title={key}
            onClick={() => onChange({ color: key })}
            className={cn(
              'h-5 w-5 rounded-full ring-offset-2 ring-offset-card',
              swatch,
              color === key && 'ring-2 ring-foreground',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * WorkItemTypeManager
 *
 * Dialog for adding work item types and choosing each type's icon and colour.
 * A type can only be deleted once no task uses it, and 'Other' is always kept.
 */
export function WorkItemTypeManager() {
  const { workItems, workItemTypes, addWorkItemType, updateWorkItemType, deleteWorkItemType } = useApp();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('star');
  const [newColor, setNewColor] = useState('teal');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (workItemTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`"${name}" already exists.`);
      return;
    }
    if (await addWorkItemType({ name, icon: newIcon, color: newColor })) {
      setNewName('');
      toast.success(`Added "${name}".`);
    } else {
      toast.error('Failed to add type. Check console for details.');
    }
  };

  const handleDelete = async (name: string) => {
    if (!(await deleteWorkItemType(name))) {
      toast.error('Failed to delete type. Check console for details.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shapes className="w-4 h-4 mr-2" />
          Manage Types
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Work Item Types</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {workItemTypes.map(type => {
            const Icon = getTypeIcon(type.icon);
            const usage = workItems.filter(item => item.type === type.name).length;
            const canDelete = type.name !== FALLBACK_TYPE && usage === 0;

            return (
              <div key={type.name} className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-secondary/50">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      title="Change symbol"
                      className="h-8 w-8 flex items-center justify-center rounded border border-border hover:bg-secondary"
                    >
                      <Icon className={cn('w-4 h-4', getTypeColorClass(type.color))} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto bg-card border-border" align="start">
                    <SymbolPicker
                      icon={type.icon}
                      color={type.color}
                      onChange={(updates) => updateWorkItemType(type.name, updates)}
                    />
                  </PopoverContent>
                </Popover>
                <span className="flex-1 text-sm">{type.name}</span>
                <span className="text-xs text-muted-foreground">{usage} {usage === 1 ? 'task' : 'tasks'}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  disabled={!canDelete}
                  title={canDelete ? 'Delete type' : type.name === FALLBACK_TYPE ? 'Other is always kept' : 'Still used by tasks'}
                  onClick={() => handleDelete(type.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAdd} className="space-y-3 border-t border-border pt-4">
          <Label htmlFor="new-type-name">Add Type</Label>
          <div className="flex gap-2">
            <Input
              id="new-type-name"
              placeholder="Name, e.g. Reading"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={30}
            />
            <Button type="submit" size="sm" className="h-10 gap-1.5" disabled={!newName.trim()}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          <SymbolPicker
            icon={newIcon}
            color={newColor}
            onChange={(updates) => {
              if (updates.icon) setNewIcon(updates.icon);
              if (updates.color) setNewColor(updates.color);
            }}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
