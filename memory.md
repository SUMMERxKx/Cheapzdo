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
- Current phase: Phase 3 Auth and onboarding — done (pending user dashboard config
  and a real signup verify)
- Last updated: 2026-07-06
- Active branch: phase-3-auth (stacked on phase-2-database, pushed to origin)
- Built so far: Phase 1 (shell, design, six themes, four spines), Phase 2 (schema,
  RLS, RPCs, typed client), Phase 3 (email verification auth, session store and
  listener, guards, auth screens, onboarding wizard with live arc preview,
  profile page with avatar upload, lazy loaded routes, TypeScript strict on).
- In progress or half done: the user still needs to set the Supabase dashboard
  auth URLs (Site URL http://localhost:8080 plus redirect allow list) and run a
  real signup to verify email delivery.
- Next action: on "go phase 4", build boards, teams, members, invitations, and
  RBAC. Branch off phase-3-auth.
- Known broken right now: nothing. Full gate is green.
- Env and config: migrations 0001 to 0015 applied. .env has VITE_SUPABASE_URL and
  VITE_SUPABASE_PUBLISHABLE_KEY. Dev server runs on port 8080.
- Branch stacking: phases 1, 2, 3 are stacked branches, none merged to main yet.

---

## DECISION LOG (newest first)

### ADR-0012 — TypeScript strict mode on  [2026-07-06] — Status: Accepted
- Context: the Lovable template shipped with strict false and strictNullChecks
  false, which silently broke discriminated union narrowing on our Result type.
- Decision: set strict true in tsconfig.app.json. The whole codebase compiles
  clean under strict after the phase 1 and 2 rewrites.
- Rationale: the plan requires strict TypeScript, and Result-based error handling
  depends on proper narrowing.
- Consequences: any future code must be strict clean. noUnusedLocals stays off
  (lint covers that concern).
- Phase: 3

### ADR-0011 — Accept the SECURITY DEFINER advisor warnings as intentional  [2026-07-06] — Status: Accepted
- Context: after remediation the security advisor still reports 11 warnings, all
  authenticated_security_definer_function_executable, for the 5 RLS helper
  functions and the 6 API RPCs.
- Decision: accept these as intentional. Zero ERROR findings, zero anon exposure.
- Rationale: RLS policy evaluation requires the authenticated role to have EXECUTE
  on the helper functions, so they cannot be revoked without breaking RLS. The 6
  RPCs (create_board, accept_invite, move_task, reparent_epic_tasks, board_roster,
  leaderboard) are the intended signed in API. This is the standard Supabase
  pattern and the residual risk is negligible (a signed in user can at most learn
  their own membership booleans).
- Alternatives: move the 5 helpers to a private schema not exposed by PostgREST to
  drop those 5 warnings. Deferred as optional Phase 10 hardening, since the 6 RPC
  warnings are unavoidable regardless and a full policy rewrite carries more risk
  than the warnings do.
- Consequences: the "advisors security = 0" DoD is read as "0 ERROR, 0 anon, and
  only the documented intentional SECURITY DEFINER warnings." Performance advisor
  shows only unused_index INFO, an artifact of a zero row database.
- Phase: 2

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

### Phase 3 — Authentication and onboarding   [2026-07-06]
- Delivered:
  - Auth data module (signUp with verification redirect, signIn, signOut, resend,
    password reset request and update, acceptInvite RPC wrapper) and zod schemas
    shared by all auth forms.
  - Session layer: authStore plus an AuthListener in providers fed by getSession
    and onAuthStateChange. useAuth hook.
  - Guards: RequireGuest, RequireAuth, HomeRedirect (no boards goes to onboarding,
    otherwise first board), and AuthedLayout now guards with a loader so protected
    content never flashes.
  - Screens: Login, Signup, VerifyEmail (with resend), ResetRequest,
    UpdatePassword, AcceptInvite, all on the split AuthCard shell with the
    animated sprint bars motif. Profile page with display name, handle, and
    avatar upload to the avatars bucket. UserMenu with sign out in the topbar.
  - Onboarding wizard: two steps (name, then arc shape) with steppers and the
    live ArcTimelinePreview that rebuilds as arc size and sprint length change,
    submitting through the create_board RPC and landing on the new board.
  - Sidebar now lists the user's real boards from useMyBoards.
  - All page routes lazy loaded, and supabase-js and forms split into their own
    vendor chunks. App index chunk 173 kB, largest chunk 206 kB.
  - TypeScript strict mode enabled (ADR-0012).
- Gates: build ok, typecheck ok (strict), lint ok, test ok. No schema changes, so
  advisors unchanged from phase 2.
- Deviations from plan: the optional "create your first team" wizard step is
  deferred to phase 4 where teams exist end to end. Documented here on purpose.
- Follow ups: user must set Supabase auth URL config in the dashboard (Site URL
  and redirect allow list for localhost 8080) and confirm a real signup email.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 2 — Database schema, RLS, security foundation   [2026-07-06]
- Delivered:
  - Migrations 0001 to 0015 applied to project qjcpzozqzhsuveuytwlo. 16 tables,
    all RLS enabled, no permissive USING (true) anywhere.
  - Composite (id, board_id) foreign keys for airtight cross tenant integrity,
    SECURITY DEFINER helper functions with locked search_path, WITH CHECK on every
    mutating policy, invitation token stored as a hash, text fractional index
    positions, epic delete is RESTRICT.
  - RPCs: create_board, accept_invite, move_task, reparent_epic_tasks,
    board_roster, leaderboard. View: epic_rollups (security_invoker).
  - 0015 remediation: search_path on set_updated_at, revoked anon and public from
    functions, dropped the broad avatars listing policy, wrapped auth.uid() in a
    scalar subselect in the direct policies, de-duped permissive policies, added
    covering indexes for every foreign key.
  - Types generated to src/lib/supabase/database.types.ts. Data layer: client,
    Result helper, board zod schema, and boards module as the pattern. Deleted the
    old supabase-schema.sql.
  - RLS test matrix: all 7 assertions pass (viewer sees, viewer cannot write,
    non member sees nothing, owner writes, cross board blocked, daily private,
    assignee must be a member). Test data created and cleaned up.
- Gates: build ok, typecheck ok, lint ok, test ok. Advisors: 0 ERROR. Security has
  11 intentional SECURITY DEFINER warnings (see ADR-0011). Performance has only
  unused_index INFO (empty database artifact).
- Deviations from plan: added migration 0015 for advisor remediation beyond the
  planned 0001 to 0014. The per entity data modules beyond boards are added in
  their feature phases, following the boards pattern.
- Docs updated: memory.md, implementation.md unchanged (schema matched the plan).

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
