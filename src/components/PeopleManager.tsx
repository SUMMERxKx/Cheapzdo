import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export function PeopleManager() {
  const { people, addPerson, updatePerson, deletePerson } = useApp();
  const [personToDelete, setPersonToDelete] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const validEmail = (value: string) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  const [newHandle, setNewHandle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!validEmail(newEmail)) { toast.error('Enter a valid email address'); return }
    addPerson({ name: newName.trim(), handle: newHandle.trim() || undefined, email: newEmail.trim() || undefined });
    setNewName('');
    setNewHandle('');
    setNewEmail('')
    setAddOpen(false);
  };

  const startEdit = (id: string, name: string, handle?: string, email?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditHandle(handle || '');
    setEditEmail(email || '')
  };

  const saveEdit = () => {
    if (!validEmail(editEmail)) { toast.error('Enter a valid email address'); return }
    if (editingId && editName.trim()) {
      updatePerson(editingId, { name: editName.trim(), handle: editHandle.trim() || undefined, email: editEmail.trim() || undefined });
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
              <Input aria-label="Email" type="email" placeholder="Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} maxLength={254} />
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

      <ConfirmDialog open={!!personToDelete} onOpenChange={open => { if (!open) setPersonToDelete(null) }} title="Remove Person" description="Remove this person from the board? Their tasks will become unassigned." confirmText="Remove" variant="destructive" onConfirm={() => {
        if (personToDelete) deletePerson(personToDelete)
        setPersonToDelete(null)
      }} />
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
                <Input aria-label="Email" type="email" placeholder="Email (optional)" value={editEmail} onChange={e => setEditEmail(e.target.value)} maxLength={254} />
                <Button size="sm" variant="ghost" aria-label="Save person" onClick={saveEdit}>
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
                  {person.email && <p className="text-sm text-muted-foreground">{person.email}</p>}
                  {person.handle && (
                    <p className="text-sm text-muted-foreground">@{person.handle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${person.name}`}
                    onClick={() => startEdit(person.id, person.name, person.handle, person.email)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${person.name}`}
                    onClick={() => setPersonToDelete(person.id)}
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
