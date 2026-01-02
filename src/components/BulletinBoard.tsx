import { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { useApp } from '@/context/AppContext';
import { BoardNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { cn } from '@/lib/utils';

interface BulletinBoardProps {
  boardId: string;
}

const noteColors = [
  '#fef3c7', // Yellow
  '#dbeafe', // Blue
  '#fce7f3', // Pink
  '#d1fae5', // Green
  '#e9d5ff', // Purple
  '#fed7aa', // Orange
];

export function BulletinBoard({ boardId }: BulletinBoardProps) {
  const { boardNotes, addBoardNote, updateBoardNote, deleteBoardNote } = useApp();
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BoardNote | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState(noteColors[0]);
  const boardRef = useRef<HTMLDivElement>(null);

  const notes = boardNotes.filter(note => note.boardId === boardId);

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) {
      return;
    }
    addBoardNote(boardId, newNoteTitle.trim(), newNoteContent.trim() || undefined, newNoteColor);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteColor(noteColors[0]);
    setIsAddNoteOpen(false);
  };

  const handleEditNote = (note: BoardNote) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || '');
    setNewNoteColor(note.color || noteColors[0]);
    setIsAddNoteOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingNote || !newNoteTitle.trim()) {
      return;
    }
    updateBoardNote(editingNote.id, {
      title: newNoteTitle.trim(),
      content: newNoteContent.trim() || undefined,
      color: newNoteColor,
    });
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteColor(noteColors[0]);
    setIsAddNoteOpen(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      deleteBoardNote(noteToDelete);
      setNoteToDelete(null);
    }
  };

  const handleStop = (noteId: string, data: { x: number; y: number }) => {
    updateBoardNote(noteId, { x: data.x, y: data.y });
  };

  const openAddDialog = () => {
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteColor(noteColors[0]);
    setIsAddNoteOpen(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
      {/* Board background with grid pattern */}
      <div
        ref={boardRef}
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Draggable Notes */}
        {notes.map(note => (
          <Draggable
            key={note.id}
            defaultPosition={{ x: note.x, y: note.y }}
            onStop={(e, data) => handleStop(note.id, data)}
            bounds="parent"
          >
            <div className="cursor-move group inline-block">
              <div
                className="w-48 p-3 shadow-lg rounded-sm transform transition-all hover:shadow-xl hover:scale-105"
                style={{
                  backgroundColor: note.color || noteColors[0],
                  transform: 'rotate(-1deg)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm flex-1 break-words">{note.title}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}
              </div>
            </div>
          </Draggable>
        ))}
      </div>

      {/* Add Note Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          onClick={openAddDialog}
          size="lg"
          className="rounded-full shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Add/Edit Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note title"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Note content (optional)"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded border-2 transition-all',
                      newNoteColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewNoteColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingNote ? handleSaveEdit : handleAddNote}>
                {editingNote ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Note"
        description="Are you sure you want to delete this note?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteNote}
        variant="destructive"
      />
    </div>
  );
}

