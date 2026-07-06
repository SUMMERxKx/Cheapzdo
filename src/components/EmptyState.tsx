import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useMotion } from "@/lib/design/motion";
import { cn } from "@/lib/utils";

// A designed empty state, not bare grey text. Every collection uses this so an
// empty screen still gives direction and a next action.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const { fadeUp } = useMotion();
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/60 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
