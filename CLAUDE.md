# CLAUDE.md — Arcflow (repo: Cheapzdo)

> Durable operating manual. Present tense = how things ARE now. History,
> decisions, and "why" live in memory.md. Loaded every session, keep it short and
> current.

## Prime directive
- implementation.md is authoritative. Build one phase at a time on "go phase N".
  Do only that phase. Backend first (migrations, then types, then data layer, then UI).
- If the plan is wrong, fix implementation.md first, log an ADR in memory.md, then continue.
- Verification golden rule: no browser screenshots. Each phase ends with
  build, typecheck, lint, test, and the Supabase advisors green, then hand the
  user the phase "You verify" list and stop.
- Every phase updates CLAUDE.md and memory.md, and commits and pushes.

## What this is
Arcflow is a Jira and Azure DevOps style team board. Board holds an Arc (a cycle
of N sprints), each Arc holds Sprints. Epics live on the Arc Board, Tasks live on
the Sprint Board and each Task has exactly one parent Epic. Plus a private Daily
checklist, a team vs team Leaderboard, Announcements, and a LeetPing feed.
Multi tenant, RLS hardened, realtime, built for thousands of users.
- Product name: Arcflow. React 18.3.

## Stack (load bearing, full list in package.json)
React 18.3, TypeScript strict, Vite with SWC, Tailwind v3 with CSS variable
tokens, Radix restyled, Framer Motion, dnd-kit, TanStack Query and Table,
Zustand, visx with restyled recharts, Supabase JS v2, react-hook-form and zod,
date-fns, sonner, lucide-react, fractional-indexing.
- Package manager is npm. Do not use bun.

## Commands
- Dev:        npm run dev
- Build:      npm run build
- Typecheck:  npm run typecheck
- Lint:       npm run lint
- Test:       npm run test
- All gates:  npm run gate
Supabase advisors after every migration, both must be zero findings:
- mcp__supabase__get_advisors type=security
- mcp__supabase__get_advisors type=performance

## Supabase and MCP rules
- Project ref: qjcpzozqzhsuveuytwlo. Schema changes via apply_migration only,
  never execute_sql for anything permanent. Regenerate types to
  src/lib/supabase/database.types.ts after any change and commit them.
- The publishable key (sb_publishable_...) is the only Supabase key in the client
  and .env. The secret key and access token live only in Edge Function or shell
  env, never committed. Rotate all shared keys before launch, see implementation.md section 21.

## Directory map (src/)
- app/            providers, router, layouts (AuthedLayout, BoardLayout), error boundary
- components/     shared pieces (EmptyState, ComingSoon, ThemeToggle) and app/ shell
- components/ui/  restyled Radix primitives
- lib/design/     motion.ts and the design tokens (index.css)
- lib/supabase/   queryKeys, useOptimisticMutation, and in phase 2 the client,
                  database.types.ts, entity modules, and zod schemas
- lib/            permissions.ts, fractionalIndex.ts, utils.ts
- stores/         uiStore, boardStore, viewStore
- pages/          NotFound
Feature folders (features/auth, features/sprint, and so on) are added from phase 3
onward. All DB access goes through a lib/supabase entity module, the UI never
calls supabase.from directly.

## Conventions (detail in implementation.md section 12)
- Server state goes in TanStack Query with optimistic updates and rollback.
  Ephemeral UI state goes in Zustand. Never put server data in Zustand.
- Validate every network boundary with zod, schemas shared between forms and the data layer.
- Data access functions return a typed result, no swallowed catches.
- Errors surface through sonner and the app error boundary.
- RLS is the real security boundary, the client only hides for UX.
- Respect prefers-reduced-motion, keyboard focus, and AA contrast.
- Colors come from tokens, no hardcoded hex in components.

## Commits and comments
- Commit at each sub step, push the phase branch to origin after each commit.
  Run the secret scan grep before the first push of a branch.
- Author is the repo owner only. Do not add any Co-Authored-By trailer, no Claude,
  no Cursor, no bots.
- Write commit messages and code comments in plain English. No em dashes, no
  semicolons inside the prose, no marketing tone, no restating the code. Say the
  why, keep it short.
- Conventional scoped messages, for example feat(sprint): ..., fix(rls): ...,
  chore(db): apply NNNN_..., docs(memory): ....

## Do
- Read implementation.md (target phase), CLAUDE.md, and memory.md before starting.
- Run the full gate before declaring a phase done.
- Update CLAUDE.md and memory.md every phase, and commit and push.
- Delete dead old app code as phases retire it.

## Don't
- Do not commit secrets or a second lockfile. Do not select star on whole tables.
- Do not add a permissive USING (true) RLS policy anywhere.
- Do not add Co-Authored-By trailers, or em dashes or semicolons in comment prose.
- Do not use Inter or system default fonts, or default shadcn styling.
- Do not put font-mono on the body element. Do not mark a phase done without doc updates and green gates.

## Gotchas
- Two lockfiles existed at clone (bun.lockb and package-lock.json). We use npm, bun.lockb was deleted.
- The old app (AppContext, PasswordGate, MainBoard, the old feature components,
  WeatherParticles) was removed in phase 1. Do not build on it.
- supabase-schema.sql is the old open RLS schema. Migrations are the source of truth, delete it in phase 2.
- Push uses a repo local credential file at .git/.git-credentials, keychain is
  disabled for this repo. The GitHub PAT there is on the rotation list.

## Pointers
- Full plan and phases: implementation.md
- Decisions, history, resume state: memory.md
- System explainer: docs/ARCHITECTURE.md
