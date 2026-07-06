import { useReducedMotion, type Transition, type Variants } from "framer-motion";

// One shared motion vocabulary so every screen animates the same way.
// Durations are in seconds to match framer.
export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.24,
  slow: 0.36,
  deliberate: 0.5,
} as const;

// Enter and exit curves. No bounce or elastic on purpose, that reads as fake.
export const easing = {
  enter: [0.2, 0, 0, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 34 },
  soft: { type: "spring", stiffness: 260, damping: 26 },
  gentle: { type: "spring", stiffness: 170, damping: 22 },
} satisfies Record<string, Transition>;

// Call this inside a component to get variants that already respect the user's
// reduce motion setting. When reduced, we fade only and keep it short.
export function useMotion() {
  const reduced = useReducedMotion();

  const fadeUp: Variants = reduced
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.12 } },
      }
    : {
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: duration.base, ease: easing.enter },
        },
      };

  const stagger: Variants = {
    hidden: {},
    show: {
      transition: reduced ? {} : { staggerChildren: 0.03, delayChildren: 0.04 },
    },
  };

  return { reduced, fadeUp, stagger, spring, duration, easing };
}
