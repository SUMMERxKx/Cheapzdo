import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, nextMonday, parseISO } from "date-fns";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useMyBoards } from "./useMyBoards";
import { useCreateBoard } from "./useCreateBoard";
import { ArcTimelinePreview } from "./ArcTimelinePreview";
import { createBoardSchema } from "@/lib/supabase/schemas/board";

type Preset = "today" | "tomorrow" | "monday" | "custom";

function Stepper({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-secondary/40 font-mono text-sm tabular-nums">
          {value}
          {suffix ? <span className="ml-1 text-muted-foreground">{suffix}</span> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// The one place a board gets created, opened from the home screen and the
// sidebar. A single calm form: name it, shape the first arc, choose when the
// first sprint starts, then create. No forced wizard, no gate.
export default function CreateBoardDialog() {
  const navigate = useNavigate();
  const open = useUiStore((s) => s.createBoardOpen);
  const setOpen = useUiStore((s) => s.setCreateBoardOpen);
  const boards = useMyBoards();
  const isFirstBoard = (boards.data?.length ?? 0) === 0;
  const createBoard = useCreateBoard();

  const [name, setName] = useState("");
  const [arcSize, setArcSize] = useState(5);
  const [sprintLength, setSprintLength] = useState(14);
  const [preset, setPreset] = useState<Preset>("tomorrow");
  const [customDate, setCustomDate] = useState("");

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Reset every time the dialog opens. A brand new user is nudged to start
  // tomorrow so day one is not already half gone, later boards default to today.
  useEffect(() => {
    if (!open) return;
    setName("");
    setArcSize(5);
    setSprintLength(14);
    setPreset(isFirstBoard ? "tomorrow" : "today");
    setCustomDate(todayStr);
  }, [open, isFirstBoard, todayStr]);

  const startDate = useMemo(() => {
    const today = new Date();
    switch (preset) {
      case "today":
        return today;
      case "tomorrow":
        return addDays(today, 1);
      case "monday":
        return nextMonday(today);
      case "custom":
        return customDate ? parseISO(customDate) : today;
    }
  }, [preset, customDate]);

  const submit = async () => {
    const parsed = createBoardSchema.safeParse({
      name: name.trim(),
      arcSize,
      sprintLengthDays: sprintLength,
      startDate: format(startDate, "yyyy-MM-dd"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }
    try {
      const boardId = await createBoard.mutateAsync(parsed.data);
      setOpen(false);
      navigate(`/b/${boardId}/sprint`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the board");
    }
  };

  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "monday", label: "Next Monday" },
    { key: "custom", label: "Pick a date" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isFirstBoard ? "Create your first board" : "Create a board"}
          </DialogTitle>
          <DialogDescription>
            A board is your team's workspace, an arc of equal length sprints. You
            can change any of this later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="new-board-name">Board name</Label>
            <Input
              id="new-board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rocket Team"
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Sprints per arc" value={arcSize} min={1} max={24} onChange={setArcSize} />
            <Stepper label="Sprint length" value={sprintLength} min={1} max={60} suffix="d" onChange={setSprintLength} />
          </div>

          <div className="space-y-1.5">
            <Label>First sprint starts</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    preset === p.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <Input
                type="date"
                className="mt-1"
                min={todayStr}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                aria-label="Custom start date"
              />
            )}
          </div>

          <ArcTimelinePreview
            arcSize={arcSize}
            sprintLengthDays={sprintLength}
            startDate={startDate}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || createBoard.isPending}
            >
              {createBoard.isPending ? "Creating board…" : "Create board"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
