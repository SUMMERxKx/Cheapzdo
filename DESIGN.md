# DESIGN.md — Arcflow design contract

The frozen design decisions. Full detail in implementation.md section 11. Design
work follows this so quality does not depend on any external skill being installed.

## Type
- Display and headings: Space Grotesk (500, 600, 700).
- Body and UI: Geist (the Geist Variable family).
- Numerics, ids, keyboard hints: JetBrains Mono with tabular figures, through the
  .font-mono utility only. The body is not monospaced.
- Never Inter, Arial, or a system default as the primary face. Never a serif fallback.

## Color
Blue tinted near black canvas, cobalt iris accent. Tokens are HSL triples behind
the shadcn variable names so Radix primitives keep working. Dark is the default,
light is a real theme. Accent stays constant across themes.
- ink #0B0E14, surface #12161F, surface-2 #1A1F2B, stroke #232A38, paper #E6EAF2,
  iris #5B7CFA.
- positive #3FB98C, warn #E8A13A, danger #E5484D, info #4CC2E0, plus a six stop
  chart ramp (chart-1 to chart-6).
- No hardcoded hex in components, colors come from tokens. Never grey text on a
  colored background. Never pure black.
- The eight seasonal themes and weather particles from the old app are dropped
  from the core, at most an opt in easter egg later.

## Scale, radius, spacing, elevation
- Type scale: 11, 13 (UI base), 14, 16, 20, 26, 34, 46. Line height 1.45 for UI,
  1.15 for headings. Display tracking -0.02em.
- Spacing on a 4px base. Radius: sm 6, md 10 (workhorse, --radius is 0.625rem),
  lg 14, full. Raised off the old hard 0.25rem.
- Elevation in dark uses light and border, not just shadow. Glow only on the drag
  overlay and focus.

## Motion (src/lib/design/motion.ts)
- Durations: instant 80, fast 150, base 240, slow 360, deliberate 500 ms.
- Easings: enter [0.2,0,0,1], exit [0.4,0,1,1]. No bounce or elastic.
- Springs: snappy, soft, gentle. Stagger 0.03 with a small delay, capped.
- useMotion returns variants that already respect prefers-reduced-motion, reduced
  means opacity only and short.

## Principles
- Spend boldness in one place per screen, keep the rest quiet.
- No card in card. Asymmetric layout, real hierarchy, whitespace as structure.
- Structure encodes meaning, not decoration.
- Charts are bespoke for the hero visuals (visx and Framer), recharts only for
  routine ones, and always themed and reduced motion aware.
- Accessibility always: keyboard, visible focus, AA contrast, reduced motion.

## Screen signatures
See implementation.md section 11.7 for the per screen brief. The two heroes are the
Sprint Board Kanban and the Leaderboard podium.
