import { motion } from "framer-motion";
import { useMotion } from "@/lib/design/motion";

// Split shell for the auth screens. Left is a quiet instrument panel showing the
// product as a live arc and sprint motif, right holds the form. Collapses to a
// single column on small screens.
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { fadeUp, reduced } = useMotion();
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[2fr_3fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground">
            A
          </div>
          <span className="font-display text-lg font-semibold">Arcflow</span>
        </div>

        <div className="space-y-5">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-tight">
            Plan in arcs. Ship in sprints.
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            A sharper board for teams that move. Epics up top, tasks in the sprint,
            your streak on the leaderboard.
          </p>
          <div className="flex items-end gap-1.5 pt-2" aria-hidden>
            {[42, 68, 30, 88, 54, 72, 40, 62].map((h, i) => (
              <motion.span
                key={i}
                className="w-5 rounded-t-sm bg-primary/70"
                initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={reduced ? { opacity: 1 } : { height: h, opacity: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.2, 0, 0, 1] }}
                style={{ height: reduced ? h : undefined }}
              />
            ))}
          </div>
        </div>

        <p className="font-mono text-[11px] text-muted-foreground">
          arc 1 of many
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm space-y-6"
        >
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
