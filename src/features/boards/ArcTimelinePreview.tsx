import { AnimatePresence, motion } from "framer-motion";
import { addDays, format } from "date-fns";
import { spring, useMotion } from "@/lib/design/motion";

// Live preview of the arc the user is configuring. Each sprint segment shows its
// computed date range and springs in or out as the arc size changes. Honors the
// chosen start date so the preview matches when the first sprint will begin.
export function ArcTimelinePreview({
  arcSize,
  sprintLengthDays,
  startDate,
}: {
  arcSize: number;
  sprintLengthDays: number;
  startDate?: Date;
}) {
  const { reduced } = useMotion();
  const start = startDate ?? new Date();
  const sprints = Array.from({ length: Math.max(0, arcSize) }, (_, i) => ({
    i,
    start: addDays(start, i * sprintLengthDays),
    end: addDays(start, (i + 1) * sprintLengthDays - 1),
  }));

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-semibold">Arc 1</span>
        <span className="font-mono text-xs text-muted-foreground">
          {arcSize} sprints · {sprintLengthDays}d each
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <AnimatePresence initial={false} mode="popLayout">
          {sprints.map((s) => (
            <motion.div
              key={s.i}
              layout={!reduced}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={spring.snappy}
              className="flex min-w-[96px] flex-1 flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-2.5"
            >
              <span className="text-xs font-semibold">Sprint {s.i + 1}</span>
              <span className="font-mono text-[10px] leading-tight text-muted-foreground">
                {format(s.start, "MMM d")} to {format(s.end, "MMM d")}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
