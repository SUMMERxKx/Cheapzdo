import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMotion } from "@/lib/design/motion";
import { ArcTimelinePreview } from "./ArcTimelinePreview";
import { useCreateBoard } from "./useCreateBoard";
import { createBoardSchema } from "@/lib/supabase/schemas/board";

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

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { fadeUp } = useMotion();
  const createBoard = useCreateBoard();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [arcSize, setArcSize] = useState(5);
  const [sprintLength, setSprintLength] = useState(14);

  const submit = async () => {
    const parsed = createBoardSchema.safeParse({
      name: name.trim(),
      arcSize,
      sprintLengthDays: sprintLength,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }
    try {
      const boardId = await createBoard.mutateAsync(parsed.data);
      navigate(`/b/${boardId}/sprint`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the board");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground">
            A
          </div>
          <span className="font-display text-lg font-semibold">Arcflow</span>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {[1, 2].map((s) => (
            <span
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Name your board
                </h1>
                <p className="text-sm text-muted-foreground">
                  This is your team's workspace. You can rename it later.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="board-name">Board name</Label>
                <Input
                  id="board-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rocket Team"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) setStep(2);
                  }}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  Shape your first arc
                </h1>
                <p className="text-sm text-muted-foreground">
                  An arc is a cycle of equal length sprints. Pick how many and how
                  long.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stepper label="Sprints per arc" value={arcSize} min={1} max={24} onChange={setArcSize} />
                <Stepper label="Sprint length" value={sprintLength} min={1} max={60} suffix="d" onChange={setSprintLength} />
              </div>
              <ArcTimelinePreview arcSize={arcSize} sprintLengthDays={sprintLength} />
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={submit}
                  disabled={createBoard.isPending}
                >
                  {createBoard.isPending ? "Creating board…" : "Create board"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
