import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { BulletinBoard } from './BulletinBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Trash2, Users } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

export function GroupTasks() {
  const { boards, activeBoard, addBoard, deleteBoard, setActiveBoard } = useApp();
  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);
  const [isDeleteBoardOpen, setIsDeleteBoardOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');

  // Create default board if none exist
  useEffect(() => {
    if (boards.length === 0 && !activeBoard) {
      addBoard('Group Tasks');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boards.length, activeBoard]);

  const currentBoard = boards.find(b => b.id === activeBoard);

  const handleAddBoard = () => {
    if (!newBoardName.trim()) {
      return;
    }
    addBoard(newBoardName.trim());
    setNewBoardName('');
    setIsAddBoardOpen(false);
  };

  const handleDeleteBoard = () => {
    if (boardToDelete) {
      deleteBoard(boardToDelete);
      setBoardToDelete(null);
    }
  };

  const openDeleteDialog = (boardId: string) => {
    setBoardToDelete(boardId);
    setIsDeleteBoardOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-wide">Group Tasks</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Board Selector */}
          {boards.length > 0 && (
            <div className="flex items-center gap-2">
              {boards.map((board) => (
                <div key={board.id} className="flex items-center gap-1">
                  <Button
                    variant={activeBoard === board.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveBoard(board.id)}
                  >
                    {board.name}
                  </Button>
                  {boards.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => openDeleteDialog(board.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Board Button */}
          <Dialog open={isAddBoardOpen} onOpenChange={setIsAddBoardOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Board Name</label>
                  <Input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Enter board name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddBoard();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddBoardOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddBoard}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulletin Board */}
      <div className="flex-1 overflow-hidden relative">
        {activeBoard && currentBoard ? (
          <BulletinBoard boardId={activeBoard} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">No board selected</p>
              <Button onClick={() => setIsAddBoardOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Board Confirmation */}
      <ConfirmDialog
        open={isDeleteBoardOpen}
        onOpenChange={setIsDeleteBoardOpen}
        title="Delete Board"
        description="Are you sure you want to delete this board? All notes on this board will be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteBoard}
        variant="destructive"
      />
    </div>
  );
}
