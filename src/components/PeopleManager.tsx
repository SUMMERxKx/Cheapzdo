import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export function PeopleManager() {
  const { people, addPerson, updatePerson, deletePerson } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPerson({ name: newName.trim(), handle: newHandle.trim() || undefined });
    setNewName('');
    setNewHandle('');
    setAddOpen(false);
  };

  const startEdit = (id: string, name: string, handle?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditHandle(handle || '');
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updatePerson(editingId, { name: editName.trim(), handle: editHandle.trim() || undefined });
    }
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-wide">TEAM MEMBERS</h2>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Handle (optional)"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {people.map(person => (
          <Card key={person.id} className="p-4 bg-card border-border">
            {editingId === person.id ? (
              <div className="flex items-center gap-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Input
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="Handle"
                  className="w-32"
                />
                <Button size="sm" variant="ghost" onClick={saveEdit}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{person.name}</p>
                  {person.handle && (
                    <p className="text-sm text-muted-foreground">@{person.handle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => startEdit(person.id, person.name, person.handle)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deletePerson(person.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {people.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No team members yet. Add someone to get started.
          </p>
        )}
      </div>
    </div>
  );
}
