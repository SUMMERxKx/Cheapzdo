# memory.md — Arcflow project memory

> Running log across sessions. Append mostly. Records what happened and why.
> - Differs from CLAUDE.md (durable present tense instructions).
> - Differs from Claude Code built in memory (that auto loads CLAUDE.md, this file
>   is loaded on purpose during the phase start protocol).
> - Differs from implementation.md (the intended plan, this is actual history).
> When a decision becomes a permanent rule, promote a one liner to CLAUDE.md.
> Only the State of the world block is overwritten, everything else is append only.

---

## STATE OF THE WORLD — resume here  (overwrite this block each update)
- Current phase: Phase 1 Foundation — done
- Last updated: 2026-07-05
- Active branch: phase-1-foundation (pushed to origin)
- Built so far: Phase 1, the app shell, design system, meta docs, and the four spines.
- In progress or half done: none, ready to start Phase 2 (database schema and RLS).
- Next action: on "go phase 2", apply migrations 0001 to 0014 from implementation.md section 7.
- Known broken right now: nothing. Full gate is green.
- Env and config: no migrations applied yet, the Supabase public schema is still
  empty. Types not generated yet (phase 2). Push works via a repo local
  credential file, keychain disabled for this repo.

---

## DECISION LOG (newest first)

### ADR-0010 — Six selectable themes, not just dark and light  [2026-07-06] — Status: Accepted
- Context: the old app had many seasonal themes, the owner wants variety back.
- Decision: ship six first class themes: dark (default), light, cherry (Cherry
  Blossom), retro, neon (cyberpunk), winter (Winter Snow). Each is a full token
  block in index.css with a matching color-scheme, chosen from a topbar picker and
  persisted in uiStore.
- Rationale: the CSS variable architecture makes extra themes cheap, and it gives
  the product personality without weather particles.
- Alternatives: dark and light only (the earlier plan default), rejected by the owner.
- Consequences: adding a theme later is one data-theme block, one color-scheme
  entry, and one row in the picker THEMES list.
- Phase: 1

### ADR-0009 — Product name is Arcflow  [2026-07-05] — Status: Accepted
- Context: the plan left the product name open, repo stays Cheapzdo.
- Decision: user chose Arcflow as the product and display name.
- Rationale: Arc is the core concept, the name follows the domain.
- Alternatives: keep Cheapzdo, rejected by the user for the product name.
- Phase: 1

### ADR-0008 — No Co-Authored-By trailers, plain comment style  [2026-07-05] — Status: Accepted
- Context: repo owner wants human sounding history, and there is a Cursor and
  Claude co author habit to avoid.
- Decision: commits are authored by the owner only, no Co-Authored-By trailer.
  Comments and messages use plain English, no em dashes, no semicolons in prose.
- Rationale: owner preference for their own repo, overrides the default trailer.
- Alternatives: keep the default Claude trailer, rejected by the owner.
- Phase: 1

### ADR-0007 — Push via repo local credential file, not keychain  [2026-07-05] — Status: Accepted
- Context: the sandbox could not read the macOS keychain, and the owner did not
  want the keychain used.
- Decision: store a fine grained GitHub PAT in .git/.git-credentials, disable the
  keychain helper for this repo.
- Rationale: works from the sandbox, persists across sessions, keeps the token out
  of tracked files.
- Consequences: the PAT is on the phase 10 rotation list.
- Phase: 1

### ADR-0006 — Position ordering uses text fractional index  [2026-07-05] — Status: Accepted
- Decision: position columns are text using the fractional-indexing library.
- Rationale: double precision numbers collide after about fifty inserts in the same slot.
- Alternatives: numeric, integer reindex, both rejected.
- Phase: 1 decided, applied in phase 2 schema

### ADR-0005 — Epic delete is RESTRICT not CASCADE  [2026-07-05] — Status: Accepted
- Decision: tasks.epic_id uses ON DELETE RESTRICT plus a reparent flow.
- Rationale: CASCADE would silently destroy sprint work and leaderboard history.
- Phase: 1 decided, applied in phase 2

### ADR-0004 — Email verification auth  [2026-07-05] — Status: Accepted
- Decision: Supabase email and password with email confirmation is the primary auth.
- Rationale: the founder asked for the verification email flow, identity stays inside Supabase for RLS.
- Alternatives: magic link, Clerk or Auth0, both deferred or rejected.
- Phase: 1 decided, built in phase 3

### ADR-0003 — TanStack Query for server state, Zustand for UI state  [2026-07-05] — Status: Accepted
- Decision: server state in TanStack Query, ephemeral UI state in Zustand, never crossed.
- Rationale: replaces the old single global context that fire and forgot writes.
- Phase: 1

### ADR-0002 — Vite SPA, stay on React 18.3  [2026-07-05] — Status: Accepted
- Decision: keep a Vite single page app, React 18.3, do not move to Next.js.
- Rationale: private realtime tool with nothing to SEO, RLS is the security boundary,
  a server tier would only add a secret key temptation. React 18.3 has full ecosystem support.
- Alternatives: Next.js, React 19, both rejected for now.
- Phase: 1

### ADR-0001 — Package manager is npm  [2026-07-05] — Status: Accepted
- Context: clone shipped both bun.lockb and package-lock.json.
- Decision: standardize on npm, delete bun.lockb.
- Rationale: plan commands are npm, avoid dual lockfile drift.
- Alternatives: bun, rejected.
- Phase: 1

---

## PHASE COMPLETION LOG (newest first)

### Phase 1 — Foundation, process scaffolding, design system, app shell   [2026-07-05]
- Delivered:
  - Process docs: CLAUDE.md, memory.md, docs/ARCHITECTURE.md, docs/decisions/,
    PRODUCT.md, DESIGN.md.
  - Toolchain: added typecheck, test, test:watch, gate scripts. Vitest, jsdom,
    testing library, jsx-a11y installed. Deleted bun.lockb and the stale CODEBASE_CONTEXT.md.
  - Deps: framer-motion, dnd-kit, zustand, tanstack table and virtual, visx,
    fractional-indexing, Space Grotesk and Geist fonts.
  - Design system: new tokens in src/index.css for dark (default) and light,
    Geist body, Space Grotesk display, JetBrains Mono for numerics only, removed
    font-mono from the body. Tailwind config updated for fonts and chart colors.
  - Four spines: lib/design/motion.ts, lib/supabase/queryKeys.ts,
    lib/supabase/useOptimisticMutation.ts, lib/permissions.ts. Plus
    lib/fractionalIndex.ts with a passing unit test.
  - App shell: app/providers, app/router (all routes stubbed with ComingSoon),
    AuthedLayout, BoardLayout, AppErrorBoundary, AppSidebar, AppTopbar,
    ThemeToggle, EmptyState, ComingSoon. Stores: uiStore, boardStore, viewStore.
    Vite manualChunks for the heavy libs.
  - Removed the entire old app: AppContext, ThemeContext, PasswordGate, MainBoard,
    Dashboard, Leaderboard, WorkItem list and row and filters, Daily,
    Announcements, SprintNavigation, TaskCardModal, the add dialogs, PeopleManager,
    Header, ThemeSwitcher, WeatherParticles, NavLink, ai components, old Index page,
    old supabase client, old types, App.css, and ten unused ui primitives.
- Gates: build ok, typecheck ok, lint ok (0 errors, a few react-refresh warnings
  in kept shadcn files), test ok (4 of 4). Advisors not applicable, no schema yet.
- Deviations from plan: design skills (frontend-design, impeccable, taste-skill)
  were not installed into the harness. The design contract in implementation.md
  section 11 was followed directly, which the plan allows as the fallback.
- Follow ups: features/ folders start in phase 3. Command palette and keyboard
  shortcuts are scaffolded in the topbar but not wired yet.
- Docs updated: CLAUDE.md, memory.md, ARCHITECTURE.md, PRODUCT.md, DESIGN.md.

---

## OPEN QUESTIONS
- [ ] Priority stays a fixed enum (scoring depends on it) vs custom later. Default fixed.
- [ ] Daily rollover: rolling list (default) vs per day with carry over.
- [ ] LeetPing board scoping and privacy default (default off).
- [ ] AI insights kept as opt in (default) vs dropped.

## KNOWN ISSUES / TECH DEBT
- [SEV high] Rotate the Supabase secret key, the Supabase access token, and the
  GitHub PAT before launch, see implementation.md section 21. Phase 10.
- [SEV low] A few react-refresh only-export-components warnings remain in kept
  shadcn files (form, toggle, and similar). Warnings only, not errors.

## GOTCHAS DISCOVERED
- The shell tool had a transient PATH drop during one command, coreutils went
  missing for that call. Re running with simpler commands worked. If a command
  fails with command not found for wc or tail, just retry.
- @fontsource-variable/geist exposes the family name "Geist Variable", used in the
  font stack in index.css and tailwind.config.ts.
