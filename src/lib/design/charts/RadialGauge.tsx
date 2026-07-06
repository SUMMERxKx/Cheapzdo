import { motion, useReducedMotion } from "framer-motion";

// Small progress ring used on epic cards. Draws to the value on mount and
// renders the final state under reduced motion.
export function RadialGauge({
  value,
  size = 40,
  stroke = 4,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={label ?? `${clamped}% done`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-[hsl(var(--success))]"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduced ? offset : c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.2, 0, 0, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold tabular-nums">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
