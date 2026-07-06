import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// The daily check. The mark draws itself in and the box springs, which is the
// small moment of joy this screen is built around. Reduced motion renders the
// final state instantly.
export function DailyCheckbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      whileTap={reduced ? undefined : { scale: 0.85 }}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        checked
          ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]"
          : "border-border bg-transparent hover:border-muted-foreground"
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0, 0, 1] }}
        />
      </svg>
    </motion.button>
  );
}
