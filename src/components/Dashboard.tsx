import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Zap, AlertTriangle, Layers, Plus, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { workItems, people, getPersonById, addPerson, deletePerson } = useApp();
  const [newPersonName, setNewPersonName] = useState('');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isDeletePersonConfirmOpen, setIsDeletePersonConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);

  const activeItems = workItems.filter(item => item.state === 'Active');
  const blockers = workItems.filter(item => item.tags.includes('Blocker') && item.state !== 'Done');
  const doneItems = workItems.filter(item => item.state === 'Done');

  // Data for charts
  const activeByAssignee = activeItems.reduce((acc, item) => {
    const assignee = item.assigneeId ? getPersonById(item.assigneeId)?.name || 'Unknown' : 'Unassigned';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeByType = activeItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stateDistribution = [
    { name: 'New', value: workItems.filter(i => i.state === 'New').length, color: '#94a3b8' },
    { name: 'Active', value: activeItems.length, color: '#f59e0b' },
    { name: 'Done', value: doneItems.length, color: '#10b981' },
  ];

  const priorityDistribution = [
    { name: 'Critical', value: workItems.filter(i => i.priority === 'Critical').length, color: '#ef4444' },
    { name: 'High', value: workItems.filter(i => i.priority === 'High').length, color: '#f59e0b' },
    { name: 'Medium', value: workItems.filter(i => i.priority === 'Medium').length, color: '#3b82f6' },
    { name: 'Low', value: workItems.filter(i => i.priority === 'Low').length, color: '#6b7280' },
  ];

  // Convert to chart data format
  const assigneeChartData = Object.entries(activeByAssignee)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const typeChartData = Object.entries(activeByType)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson({ name: newPersonName.trim() });
      setNewPersonName('');
      setIsAddPersonOpen(false);
    }
  };

  const handleDeletePerson = (id: string) => {
    setPersonToDelete(id);
    setIsDeletePersonConfirmOpen(true);
  };

  const confirmDeletePerson = () => {
    if (personToDelete) {
      deletePerson(personToDelete);
      setPersonToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold tracking-wide">are we slacking?</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{people.length}</p>
              <p className="text-xs text-muted-foreground">TEAM SIZE</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeItems.length}</p>
              <p className="text-xs text-muted-foreground">ACTIVE</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{blockers.length}</p>
              <p className="text-xs text-muted-foreground">BLOCKERS</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
              <Layers className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{doneItems.length}</p>
              <p className="text-xs text-muted-foreground">DONE</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* State Distribution Pie Chart */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">STATE DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={stateDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {stateDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Priority Distribution Pie Chart */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">PRIORITY DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={priorityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Active by Assignee Bar Chart */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">ACTIVE BY ASSIGNEE</h3>
          {assigneeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={assigneeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No active items</p>
          )}
        </Card>

        {/* Active by Type Bar Chart */}
        <Card className="p-4 bg-card border-border">
          <h3 className="text-sm font-bold mb-4 text-muted-foreground">ACTIVE BY TYPE</h3>
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No active items</p>
          )}
        </Card>
      </div>

      {/* Active Users Board */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-muted-foreground">ACTIVE USERS</h3>
          <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Person</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Person name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddPerson();
                    }
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddPersonOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPerson}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm">{person.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeletePerson(person.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-4">
              No people added yet
            </p>
          )}
        </div>
      </Card>

      {/* Blockers Section */}
      {blockers.length > 0 && (
        <Card className="p-4 bg-card border-destructive/50 glow-red">
          <h3 className="text-sm font-bold mb-4 text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ACTIVE BLOCKERS
          </h3>
          <div className="space-y-2">
            {blockers.map(blocker => (
              <div key={blocker.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm">{blocker.title}</span>
                <span className="text-xs text-muted-foreground">
                  {blocker.assigneeId ? getPersonById(blocker.assigneeId)?.name : 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Delete Person Confirmation Dialog */}
      <ConfirmDialog
        open={isDeletePersonConfirmOpen}
        onOpenChange={setIsDeletePersonConfirmOpen}
        title="Remove Person"
        description="Are you sure you want to remove this person from the board?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmDeletePerson}
        variant="destructive"
      />
    </div>
  );
}
