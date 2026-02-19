import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AIGeneratedTask } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Sparkles, Loader2, Check, RotateCcw, Pencil, X } from 'lucide-react';

interface AITaskCreatorProps {
  defaultSprintId?: string;
  isDailyBoard?: boolean;
}

type Phase = 'input' | 'loading' | 'preview';

export function AITaskCreator({ defaultSprintId, isDailyBoard = false }: AITaskCreatorProps) {
  const {
    generateAITask,
    addWorkItem,
    people,
    sprints,
    activeSprint,
    isAIEnabled,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [generated, setGenerated] = useState<AIGeneratedTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInputText('');
      setPhase('input');
      setGenerated(null);
      setError(null);
    }
  }, [open]);

  if (!isAIEnabled) return null;

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setPhase('loading');
    setError(null);

    try {
      const extraContext = isDailyBoard
        ? '\n(This is for the Daily board — add a "Daily" tag automatically.)'
        : '';
      const task = await generateAITask(inputText.trim() + extraContext);

      if (isDailyBoard) {
        if (!task.tags.includes('Daily')) task.tags.push('Daily');
        task.sprintId = undefined;
      }

      setGenerated(task);
      setPhase('preview');
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate task. Please try again.';
      setError(msg);
      toast.error(msg);
      setPhase('input');
    }
  };

  const handleAccept = () => {
    if (!generated) return;

    const sprintId = isDailyBoard
      ? undefined
      : (generated.sprintId || defaultSprintId || activeSprint || undefined);

    addWorkItem({
      title: generated.title,
      description: generated.description || '',
      type: generated.type,
      state: generated.state,
      priority: generated.priority,
      assigneeId: generated.assigneeId,
      tags: generated.tags,
      sprintId,
      parentId: generated.parentId,
      order: undefined,
    });

    toast.success('Task created successfully');
    setOpen(false);
  };

  const handleRegenerate = () => {
    setGenerated(null);
    handleGenerate();
  };

  const getPersonName = (id?: string) => {
    if (!id) return 'Unassigned';
    return people.find(p => p.id === id)?.name || 'Unknown';
  };

  const getSprintName = (id?: string) => {
    if (!id) return 'None';
    return sprints.find(s => s.id === id)?.name || 'Unknown';
  };

  const priorityColor: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Task Creator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input / Loading Phase */}
          {phase !== 'preview' && (
            <>
              <Textarea
                placeholder='Describe the task… e.g. "Sam needs to finish the math homework by Friday, high priority"'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[100px] resize-none bg-secondary/40 border-border/50 focus:border-primary/50 text-sm"
                disabled={phase === 'loading'}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button
                onClick={handleGenerate}
                disabled={!inputText.trim() || phase === 'loading'}
                className="w-full gap-2"
                size="sm"
              >
                {phase === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Task
                  </>
                )}
              </Button>
            </>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && generated && (
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 bg-secondary/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">{generated.title}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-primary/40 text-primary">
                    {generated.type}
                  </Badge>
                </div>

                {generated.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {generated.description}
                  </p>
                )}

                <Separator className="opacity-40" />

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">State:</span>{' '}
                    <span className="font-medium">{generated.state}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>{' '}
                    <Badge variant="outline" className={`text-[10px] ml-1 ${priorityColor[generated.priority] || ''}`}>
                      {generated.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assignee:</span>{' '}
                    <span className="font-medium">{getPersonName(generated.assigneeId)}</span>
                  </div>
                  {!isDailyBoard && (
                    <div>
                      <span className="text-muted-foreground">Sprint:</span>{' '}
                      <span className="font-medium">{getSprintName(generated.sprintId)}</span>
                    </div>
                  )}
                  {generated.tags.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Tags:</span>{' '}
                      {generated.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] mr-1">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept} className="flex-1 gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={handleRegenerate} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPhase('input')} className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="gap-1.5 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
