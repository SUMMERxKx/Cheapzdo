# Cheapzdo → "Arcflow" — Master Implementation Plan (v2)

> **Authoritative build spec.** Written so a Claude Opus 4.8 agent can execute
> one phase at a time ("go phase 1" … "go phase 10"). Each phase is
> self-contained: what to load, what to build (backend → typed data layer →
> UI), which libraries, and what YOU verify by eye before moving on. By the end
> of Phase 10 the product is feature-complete, secured, realtime, and deployable.
>
> This v2 replaces the thin v1. It integrates a five-track deep audit
> (database/RLS, frontend/design, spec-completeness, engineering-process, and
> tech-rationale). Where v1 said "add RLS policies," v2 gives the exact SQL;
> where v1 said "redesign the UI," v2 gives fonts, hex, motion tokens, and a
> screen-by-screen brief.
>
> **Working Supabase project:** `qjcpzozqzhsuveuytwlo`
> (`https://qjcpzozqzhsuveuytwlo.supabase.co`) — new, empty. Every migration
> runs against it via the Supabase MCP.
>
> **Golden verification rule:** we do **not** verify UI with Claude Preview /
> browser screenshots. Each phase ends with `build` + `typecheck` + `lint` +
> `test` + Supabase **advisors** green, then hands the user a short "You verify"
> checklist. The user pastes a screenshot only if something looks wrong. Saved
> effort goes into backend robustness, RLS correctness, and data integrity.

---

## Table of contents

- §0 How to use this document (phase protocols)
- §1 Vision
- §2 Glossary / domain model (read first — "Arc" is overloaded)
- §3 Meta-documentation & engineering-process system (CLAUDE.md, memory.md, ADRs, ARCHITECTURE.md, testing, git)
- §4 Current-state audit (what exists, its fate, and the design DNA to un-learn)
- §5 Requirements traceability + resolved product decisions
- §6 Target architecture & technology decision record (with pros/cons/alternatives)
- §7 Data model — full DDL (migrations 0001–0014)
- §8 Security / RLS model + test matrix
- §9 Realtime & scale
- §10 Edge Functions
- §11 Design system & the three design skills
- §12 Engineering conventions
- §13 The Phases (1–10)
- §14 Key user flows
- §15 Edge cases & failure modes
- §16 Master Definition of Done (hardened)
- §17 Risk register
- §18 Scale & cost
- §19 Architecture in one page (new-engineer explainer)
- §20 Open decisions
- §21 🔴 Security note — rotate the shared keys

---

## §0 How to use this document

1. The user says **"go phase N"**.
2. The agent runs the **Phase Start Protocol** (§3.5): read this file (phase N) →
   `CLAUDE.md` → `memory.md` ("State of the world" first); restate the goal and
   Definition of Done; check prerequisites; create the phase branch.
3. The agent implements **backend first** (migrations via MCP → regenerate types
   → typed data-access layer → UI).
4. The agent runs the **Phase End Protocol** (§3.5): all gates green (§16),
   update `CLAUDE.md` + `memory.md` + `ARCHITECTURE.md`, write the phase
   completion log + any ADRs, commit on the phase branch.
5. The agent hands the user the phase's **"You verify"** checklist and STOPS.

Do not skip ahead or batch phases unless told to. If a phase reveals the plan is
wrong, update THIS file first, log an ADR in `memory.md`, then continue.

---

## §1 Vision

A **Jira / Azure-DevOps-class collaboration board**, but sharper, faster, and
more opinionated — for small teams who plan in **Arcs** (multi-sprint cycles) and
want their work, their private dailies, and their competitive streak in one
place. It must feel like a product from a billion-dollar company: distinctive
typography, deliberate motion, bespoke data-viz — never generic AI card-slop. It
must be multi-tenant, RLS-hardened, realtime, and ready for **thousands of
users**. Real-world analogues from the founders: Jira, Azure DevOps Boards —
"a custom one for ourselves, better and refined."

Internal product name: **Arcflow** (Arc + flow). The repo/package may keep
"Cheapzdo" (founders: "some words stay the same"). Final name is a Phase-1
decision (§20).

---

## §2 Glossary / domain model (READ FIRST — "Arc" is overloaded)

The founders use "Arc" two ways. This plan disambiguates them permanently.

| Term | Meaning | DB entity |
|---|---|---|
| **Arc** | A **delivery cycle** = a fixed group of *N* sprints (N = "arc size", chosen at board creation). Like a SAFe Program Increment. | `arcs` |
| **Sprint** | A fixed-length iteration inside an Arc. Every sprint in an Arc shares the same length (user picks it at board creation). | `sprints` |
| **Arc Board** | The tab where you manage **Epics** — the high-level parent items for the cycle. | UI over `epics` |
| **Epic** | A parent work item on the Arc Board. **Every Sprint Task has exactly one parent Epic.** One Epic → many Tasks (siblings). | `epics` |
| **Sprint Board** | The tab of **Tasks** for the active sprint. Two view modes: **List** (default) and **Kanban**. | UI over `tasks` |
| **Task** | A work item in a sprint, child of exactly one Epic. Can be flagged a **Blocker**. | `tasks` |
| **Daily** | A private, self-authored, checkable to-do list (a rolling personal list, not pulled from sprints). Private even from owners. | `daily_items` |
| **Board** | The top-level workspace/project. Owns arcs, sprints, epics, tasks, teams, members, statuses, types, announcements. | `boards` |
| **Team** | A named grouping of board members (for leaderboard team-vs-team and org). A board can have multiple teams; a member belongs to at most one team per board. | `teams` |
| **Member / Role** | A user's membership in a board with a role: **owner / editor / viewer**. | `board_members` |
| **Status** | A customizable workflow state = a Kanban column. Each has a fixed **category** (`todo`/`in_progress`/`done`) that analytics key off — names/colors are custom, category is not. | `board_statuses` |
| **Type** | A customizable work-item type (Feature/Bug/… + custom), with a lucide icon + color. | `work_item_types` |
| **LeetPing** | Feed that surfaces "X solved <LeetCode problem>" by reading commits from a member's LeetCode→GitHub sync repo. | `leetping_events`, `github_connections` |

**Hierarchy:** `Board → Arc → Sprint`; `Board → Epic → Task` (task.epic_id
**required**); `Board → Member(role) → Team`; per-user private `Daily`.

---

## §3 Meta-documentation & engineering-process system

Continuity across many disconnected sessions is the #1 risk of an agent-driven,
phase-by-phase build. This section defines the documents and protocols that make
the build resumable, auditable, and consistent. **All of this is mandatory and
part of every phase's Definition of Done (§16).**

### 3.1 The four documents (keep them distinct)

| File | Nature | Answers | Cadence |
|---|---|---|---|
| `CLAUDE.md` | **Durable instructions** (present tense — "how things ARE") | "How do I work in this repo right now?" | Edited in place every phase; always current; auto-loaded each session. |
| `memory.md` | **Running log** (append-mostly — "what HAPPENED & why") | "What did we decide/hit/finish, and how do I resume?" | Appended every decision + phase end. Only its top "State of the world" block is overwritten. Read explicitly at phase start. |
| `docs/decisions/ADR-*.md` | **Heavyweight decision records** (optional tier) | "Why is this the way it is, in full?" | New file per significant decision; a stub line goes in `memory.md`. |
| `docs/ARCHITECTURE.md` | **System explainer** for a new engineer | "How does the whole thing fit together?" | Updated whenever data flow / auth / RLS / realtime / deployment changes. |

Rule of thumb: **`CLAUDE.md` describes the world; `memory.md` records how the
world changed.** If you're tempted to write a date or the word "decided," it goes
in `memory.md`. When a `memory.md` fact becomes a permanent rule, promote a
one-liner into `CLAUDE.md` and leave the full entry in `memory.md`.

`memory.md` vs the Claude Code built-in memory: Claude Code auto-loads
`CLAUDE.md`; `memory.md` is a plain project artifact we maintain by hand and load
deliberately during the Phase Start Protocol (it can grow large, so it is not
auto-loaded every turn).

### 3.2 `CLAUDE.md` spec + template

Durable, present-tense operating manual, auto-loaded every session. Keep it under
~250 lines (it costs context budget every turn). Link out to `implementation.md`,
`ARCHITECTURE.md`, `memory.md` rather than duplicating. Create it in Phase 1;
update it every phase (or explicitly confirm "reviewed, no change").

**Template (create at repo root as `CLAUDE.md`):**

```markdown
# CLAUDE.md — Arcflow (repo: Cheapzdo)

> Durable operating manual. Present tense = how things ARE now. History,
> decisions, and "why" live in memory.md. Loaded every session — keep < ~250
> lines and always current.

## Prime directive
- implementation.md is authoritative. Build one phase at a time on "go phase N".
  Do only that phase. Backend-first (migrations → types → data layer → UI).
- If the plan is wrong, fix implementation.md FIRST, log an ADR in memory.md,
  then continue.
- Verification golden rule: NO browser screenshots. Each phase ends with
  build + typecheck + lint + test + Supabase advisors green, then hand the user
  the phase's "You verify" checklist and STOP.
- Every phase updates CLAUDE.md + memory.md (see Definition of Done, §16).

## What this is
Arcflow: a Jira/Azure-DevOps-class board. Board → Arc (cycle of N sprints) →
Sprint; Epic (Arc Board) → Task (Sprint Board, exactly one parent Epic). Private
Daily checklists, team-vs-team Leaderboard, Announcements, LeetPing feed.
Multi-tenant, RLS-hardened, realtime, for thousands of users.
- Product name: <Arcflow | Cheapzdo> (decided Phase 1 — see memory.md ADR-000x).

## Stack (load-bearing; full list in package.json)
React 18.3 · TypeScript strict · Vite (SWC) · Tailwind v3 + CSS-var tokens ·
Radix (restyled) · Framer Motion · dnd-kit · TanStack Query + TanStack Table ·
Zustand · visx (+ restyled recharts) · Supabase JS v2 · react-hook-form + zod ·
date-fns · sonner · lucide-react · fractional-indexing.
- Package manager: npm (package-lock.json is source of truth). Do NOT use bun;
  delete bun.lockb if it reappears.

## Commands
- Dev:        npm run dev
- Build gate: npm run build
- Typecheck:  npm run typecheck    # tsc -p tsconfig.app.json --noEmit
- Lint:       npm run lint
- Test:       npm run test         # vitest run
- All gates:  npm run gate         # build && typecheck && lint && test
Supabase advisors after EVERY migration (both must be 0 findings):
- mcp__supabase__get_advisors type=security
- mcp__supabase__get_advisors type=performance

## Supabase / MCP rules
- Project ref: qjcpzozqzhsuveuytwlo (new prod project).
- Schema changes: apply_migration ONLY (named, versioned). Never execute_sql for
  anything permanent.
- After any schema change: generate_typescript_types →
  src/lib/supabase/database.types.ts, then commit it.
- After any migration: run BOTH advisors; resolve every finding before "done".
- Keys: publishable key (sb_publishable_…) is the ONLY Supabase key in the client
  / .env. Secret key + access token live ONLY in Edge Function env / shell —
  never committed, never client-side. (Rotate before launch: implementation.md §21.)

## Directory map (src/)
app/           providers, router, guards, layout shells, command palette
features/      auth · onboarding · boards · members · arc · sprint · daily ·
               leaderboard · dashboard · announcements · leetping
lib/
  supabase/    client · database.types.ts · queryKeys · result · <entity> modules · schemas/ (zod)
  design/      tokens.css · motion.ts · icons.ts · charts/
components/ui/ restyled Radix primitives
stores/        zustand stores (uiStore, boardStore, viewStore, dragStore)
Feature code goes under features/<feature>/. All DB access goes through a
lib/supabase/<entity>.ts module — UI NEVER calls supabase.from(...) directly.

## Conventions (detail: implementation.md §12)
- Server state → TanStack Query (optimistic + rollback + invalidate). Ephemeral
  UI state → Zustand only. NEVER put server data in Zustand.
- Every network boundary validated with zod (schemas shared form ⇄ data layer).
- Data-access fns return a typed Result; no swallowed catches.
- Errors surface via sonner + a global error boundary.
- RLS is the real security boundary; the client hides for UX only.
- Respect prefers-reduced-motion, keyboard focus, AA contrast everywhere.
- No hardcoded hex/tailwind color literals in components — colors via tokens.

## Commits & comments
- Commit at each sub-step; push the phase branch to origin after each commit
  (git push -u origin phase-N-<slug>). Run the secret-scan grep before first push.
- Author = repo owner only. Do NOT add any Co-Authored-By trailer (no Claude, no
  Cursor, no bots).
- Plain-English commit messages and code comments: no em dashes, no semicolons
  inside the prose, no marketing tone, no restating the code. Say the why, keep it
  short, match the surrounding comment density.
- Conventional, scoped messages: feat(scope): ..., fix(scope): ..., chore(db):
  apply NNNN_..., docs(memory): ..., wip(scope): ....

## Do
- Read implementation.md (target phase), CLAUDE.md, memory.md before starting.
- Run the full gate before declaring a phase done.
- Update CLAUDE.md + memory.md every phase; commit AND push every phase.
- Delete dead old-app code as phases retire it.

## Don't
- Don't commit secrets or a second lockfile. Don't select('*') whole tables.
- Don't add a permissive USING (true) RLS policy anywhere.
- Don't add Co-Authored-By trailers. Don't use em dashes or semicolons in comment/
  commit prose.
- Don't use Inter/system-default fonts or default shadcn styling.
- Don't put font-mono on <body>. Don't mark a phase done without doc updates + gates.

## Gotchas (living list — promote durable ones from memory.md)
- Two lockfiles existed at clone (bun.lockb + package-lock.json). We use npm.
- Old app code (AppContext, PasswordGate, WorkItemList/Row, MainBoard,
  WeatherParticles) is being gutted phase by phase — don't build on it.
- supabase-schema.sql is the OLD open-RLS schema; migrations are the source of
  truth. Deleted in Phase 2.
- <append new traps as found>

## Pointers
- Full plan & phases: implementation.md
- Decisions / history / resume state: memory.md
- System explainer: docs/ARCHITECTURE.md
```

### 3.3 Project `memory.md` spec + template

The project's long-term memory across sessions — append-mostly, capturing what
happened and why, plus a "State of the world" snapshot that lets a fresh session
resume with zero prior context. Create in Phase 1; append every decision and at
each phase end.

**Template (create at repo root as `memory.md`):**

```markdown
# memory.md — Arcflow project memory

> Running log across sessions. Append-mostly. Records what happened and WHY.
> - Differs from CLAUDE.md (durable present-tense instructions — how things ARE).
> - Differs from Claude Code's built-in memory (that auto-loads CLAUDE.md; THIS
>   file is loaded on purpose during the Phase Start Protocol, not every turn).
> - Differs from implementation.md (the intended plan; this is actual history).
> When a decision becomes a permanent rule, promote a one-liner to CLAUDE.md.
> Only the "State of the world" block is overwritten; everything else is append-only.

---

## STATE OF THE WORLD — resume here  (overwrite this block each update)
- Current phase: Phase N — <not-started | in-progress | done>
- Last updated: YYYY-MM-DD by <session>
- Active branch: phase-N-<slug>   (last commit: <sha> "<msg>")
- Built so far: <one line per completed phase>
- In-progress / half-done: <exact stopping point, files touched, next action>
- Next action: <the very next concrete step>
- Known-broken right now: <anything failing / stubbed / skipped>
- Env/config: migrations applied through <name>; types regenerated? <y/n>;
  advisors last run <date> = <clean/findings>.

---

## DECISION LOG (newest first) — ADR format in implementation.md §3.4
### ADR-0001 — Package manager = npm  [YYYY-MM-DD] — Status: Accepted
- Context: clone shipped both bun.lockb and package-lock.json.
- Decision: standardize on npm; delete bun.lockb.
- Rationale: plan commands are npm; avoid dual-lockfile drift.
- Alternatives: bun (faster) — rejected: adds a toolchain the plan doesn't assume.
- Consequences: CI/docs use npm.
- Phase: 1

---

## PHASE COMPLETION LOG (newest first)
### Phase 1 — Foundation & shell   [YYYY-MM-DD]
- Delivered: <bullets>
- Gates: build ✅ · typecheck ✅ · lint ✅ · test ✅ · advisors n/a
- Deviations from plan: <none | …>
- Follow-ups filed: <known-issue ids>
- Docs updated: CLAUDE.md ✅ · memory.md ✅ · ARCHITECTURE.md <n/a|✅>

---

## OPEN QUESTIONS
- [ ] Product name Arcflow vs Cheapzdo (default Arcflow).
- [ ] React 18.3 vs 19 (default 18.3).
- [ ] <new questions with status>

---

## KNOWN ISSUES / TECH DEBT
- [SEV 🔴] Rotate sb_secret_… + sbp_… before launch (plan §21) — Phase 10.
- [SEV low] <deferred thing> — planned fix: Phase <n>.

---

## GOTCHAS DISCOVERED
- <trap>: <symptom> → <workaround>. (promote to CLAUDE.md if durable)
```

### 3.4 ADR format

Default: keep ADRs inline in `memory.md`'s Decision Log (one file to read beats a
directory to crawl). Escalate to `docs/decisions/ADR-NNNN-title.md` only for
heavyweight decisions (the RLS model, auth flow, realtime reconciliation, scoring
engine, fractional-index scheme); leave a stub line in `memory.md`. Numbering is
global/monotonic.

```markdown
### ADR-NNNN — <short imperative title>   [YYYY-MM-DD] — Status: <Proposed|Accepted|Superseded by ADR-XXXX|Deprecated>
- Context: the forces at play; what prompted this.
- Decision: what we are doing (1–2 sentences).
- Rationale: why this wins for THIS product (tie to goals: multi-tenant,
  RLS-hardened, scale, design bar).
- Alternatives considered: each option + the specific reason it lost.
- Consequences / follow-ups: what it makes easy/hard; new debt or open questions.
- Phase: N   Supersedes: ADR-XXXX | —
```

Seed the log on day one with the choices this plan already implies: npm over bun;
React 18.3 over 19; Vite SPA over Next.js; TanStack Query + Zustand over a global
context; RLS-as-authz; migrations over execute_sql; email-verification auth;
`text` fractional-index `position` over numeric/double; epic-delete RESTRICT over
CASCADE. (Each of these has full rationale in §6/§7.)

### 3.5 Phase execution protocol

**Phase START** (before writing any code):
1. Read, in order: implementation.md (this phase only) → CLAUDE.md → memory.md
   ("State of the world" first).
2. Restate the phase goal + Definition of Done in your own words to the user
   (one short paragraph) — confirms the right phase is loaded.
3. Check prerequisites: are the phases this one "Depends on" actually done per
   memory.md's completion log? If not, STOP and tell the user.
4. Check state: does `git status` / `git log -3` match memory.md's "State of the
   world"? Reconcile surprises before proceeding.
5. Load the phase's skills (frontend-design / impeccable / taste-skill) for UI
   work; for backend phases, sanity-check Supabase MCP (`list_tables`).
6. Restate open decisions this phase touches; ask only the ones the phase says to
   ask; otherwise take the plan's default and note it.
7. Create the phase branch: `git checkout -b phase-N-<slug>`.
8. Write a "Phase N started" line to memory.md "State of the world".

**Phase END** (before telling the user it's done):
1. Run all gates (§16) — build, typecheck, lint, test, advisors (security +
   performance if schema touched). All must pass.
2. If schema changed: regenerate types → `database.types.ts`, confirm it compiles.
3. Update docs: CLAUDE.md (or confirm no change); memory.md (overwrite State of
   the world, append Phase Completion entry, add ADRs/open-questions/known-issues/
   gotchas); ARCHITECTURE.md (if data flow/auth/RLS/realtime/deploy changed).
4. Commit work + docs together on the phase branch (don't push unless asked).
5. Run any DoD-specific proof the phase requires (e.g. Phase 2 RLS matrix; Phase
   5 "every task has an epic_id") and record results in memory.md.
6. Hand the user the phase's "You verify" checklist + a 3-line change summary +
   run instructions. Then STOP — do not start phase N+1.

**Session handoff** (a phase may span sessions):
- On session end (finished or not): update memory.md "State of the world" (phase +
  status, branch, last commit, EXACT stopping point: file + function + next
  action, anything left broken); commit WIP on the phase branch with a `wip:`
  message.
- On session start (mid-phase resume): read memory.md "State of the world" FIRST,
  then `git status`/`git log -3` to confirm reality; if they diverge, trust git,
  fix memory.md, tell the user. Pick up at the recorded "next action" — do NOT
  re-run the whole phase. Re-load the phase's skills.

### 3.6 Testing & QA strategy

The gate is build + typecheck + lint + **test** + advisors + manual verify.
Introduce Vitest in Phase 1 (no test script exists at clone).

| Layer | Tool | Introduce | Covers |
|---|---|---|---|
| Unit — pure logic | **Vitest** | Phase 1 | scoring engine, sprint-date computation, fractional-index insert/reorder, zod round-trips, LeetPing commit parsing |
| Integration — data layer | Vitest + Supabase branch/test project | Phase 2+ | each `lib/supabase/<entity>` module against a real DB: CRUD typed results, FK constraints hold, triggers fire |
| RLS / security | SQL via `execute_sql` impersonating roles, scripted | Phase 2, rerun on every schema change, full sweep Phase 10 | non-member→0 rows; viewer can't write; editor can; owner-only; daily privacy; cross-board WITH CHECK |
| Type safety | `tsc --noEmit` | Phase 1 | strict gate; regenerated types compile |
| Lint + a11y | ESLint + `eslint-plugin-jsx-a11y` | Phase 1 | style + a11y machine checks |
| Component (targeted) | @testing-library/react + Vitest + jsdom | Phase 5+ | Kanban DnD status change, permission-gated buttons, form validation — few, behavior not pixels |
| Build gate | `npm run build` | Phase 1 | bundling; fail if a chunk >500 kB after Phase 1 |
| A11y static | `@axe-core/cli` / `vitest-axe` on key components | Phase 5+ | zero critical violations (headless, not the browser preview) |
| E2E (optional) | Playwright | Phase 10 only | one happy-path smoke against the deployed URL |
| Manual verify | phase "You verify" checklist | every phase | the human's eyes on design/UX |

Rules baked into the DoD: any pure function with real logic ships WITH Vitest
tests the same phase; RLS is verified by test, never by "the policy looks right";
don't snapshot the visual design; introduce a tool the phase before you first
need it.

### 3.7 Git / version-control workflow

Repo is a real git clone (branch `main`, remote
`github.com/SUMMERxKx/Cheapzdo.git`; `.env` gitignored + untracked; `.mcp.json`
uses `${ENV}` interpolation, no literal secrets). Local identity is the repo
owner: `Samar Khajuria <samar.k.khajuria@gmail.com>`.

- **Prerequisite (must be done before Phase 1): push access.** As of setup, push
  does not work in-session (no reachable GitHub credential; `gh` not installed).
  The owner enables it once (see the setup note the assistant provides), then the
  agent verifies with `git push --dry-run origin main` before starting phases.
- **Commit AND push every phase.** The agent commits at each coherent sub-step and
  **pushes the phase branch to `origin` after each commit** so the remote stays in
  sync continuously (`git push -u origin phase-N-<slug>`), not just at the end.
  Always run the secret-scan grep (below) before the first push of a branch.
- **Branch per phase:** `main` = always-buildable trunk; one branch per phase
  `phase-N-<slug>`; merge to main only after Phase End gates pass; ask before
  merging into main. Mid-phase across sessions: keep committing/pushing the same
  phase branch (wip commits expected).
- **Authorship policy (repo owner's rule, overrides any default trailer):**
  commits are authored solely by the owner's git identity. **Do NOT add any
  `Co-Authored-By` trailer** — no Claude, no Cursor, no bot co-authors. (History
  was checked: there is no Cursor/Claude co-author to remove.)
- **Commit-message & code-comment style (plain English, not "AI"):** write like a
  human engineer. No em dashes anywhere in messages or comments. No semicolons
  inside comment or message prose (code still uses semicolons normally). No
  marketing tone, no filler, no restating the code. Say the *why* in a short,
  plain sentence, lowercase-first is fine, and match the surrounding code's
  comment density. Prefer few good comments over many.
- **Conventional commits, scoped, examples:** `feat(sprint): kanban drag persists
  status`, `fix(rls): tighten daily_items policy to own rows`, `chore(db): apply
  0008_rls_policies`, `docs(memory): log ADR-0004 and phase 5 completion`,
  `wip(leaderboard): scoring skeleton, resumes at computeMomentum`. Migrations +
  regenerated types + doc updates commit WITH their code.
- **When to commit:** at each coherent sub-step (migration + advisors clean; a
  screen finished); always before ending a session; always docs alongside code;
  push after each commit.
- **Secret hygiene:** never commit `.env*`, `sb_secret_…`, `sbp_…`, or any token.
  Delete `bun.lockb` (ADR-0001). Add `supabase/.temp`, `*.local` to `.gitignore`
  before Phase 4. Before any push:
  `git grep -nE "sb_secret_|sbp_|SUPABASE_ACCESS_TOKEN"` over tracked files must be
  empty. If a token was configured into the remote URL for auth, keep it out of
  tracked files (it lives in `.git/config`, which is not tracked). Delete the old
  `supabase-schema.sql` in Phase 2. If a secret was ever committed, **rotate** it
  (§21), don't just remove.

### 3.8 `docs/ARCHITECTURE.md` outline

Onboarding doc for a new engineer; text-only C4-ish diagrams (diffable, no
tooling). Updated whenever data flow/auth/RLS/realtime/deploy changes.

Sections: 1 Context (external systems: Supabase, GitHub, SMTP/Resend, Vercel,
optional OpenRouter; a text diagram) · 2 Containers (SPA, Postgres, Edge
Functions, Realtime, Vault) · 3 Components inside the SPA (app/features/lib/
stores; the rule UI → Query hook → lib/supabase/<entity> → supabase-js) · 4 Data
model (link §7 + text ERD) · 5 Request lifecycle of a write (RHF+zod → Query
optimistic → data layer → supabase-js → RLS → row → Realtime → reconcile → error
rollback+toast) · 6 Auth flow · 7 RLS/authorization model · 8 Realtime model ·
9 Deployment topology · 10 Cross-cutting (errors, perf, a11y, observability).
See §19 for the one-page narrative to seed it.

---

## §4 Current-state audit (what exists, its fate, and the DNA to un-learn)

The current app is a **single-tenant personal-life tracker** behind a shared
password. It must be gutted. It was scaffolded by **Lovable** (`lovable-tagger`,
`@vercel/analytics`, `name: vite_react_shadcn_ts`) — so Vite + React 18 + shadcn/
Radix + Tailwind v3 are sunk-cost defaults, kept because they're genuinely right
here (see §6), not because they were chosen green-field.

**Backend / data (REPLACE entirely):** `supabase-schema.sql` defines `people`,
`sprints`, `work_items`, `comments`, `boards`+`board_notes`, `announcements` —
TEXT client-generated IDs, epoch-BIGINT dates, and **RLS = `USING (true)`** (wide
open to the anon key). The new project is empty, so there is no data to migrate.
Delete `supabase-schema.sql` in Phase 2; migrations become the source of truth.

**Auth (REPLACE):** `PasswordGate.tsx` + `VITE_BOARD_PASSWORD`, `authenticate()`
in `AppContext` — a single shared secret; `isAuthenticated` is a client boolean.
→ real Supabase email auth with verification (Phase 3).

**State (REPLACE):** `src/context/AppContext.tsx` (1215 lines) — one global blob
loaded once, optimistic writes + fire-and-forget upserts, `initializeDatabase()`
seeds demo data, hardcoded types, no user/team scoping. → TanStack Query (server)
+ Zustand (UI) + a typed data-access layer. Delete AppContext by end of Phase 5.

**UI (REDESIGN EVERY SCREEN, ditch components):** `MainBoard` (tab shell),
`Dashboard`, `Leaderboard`, `WorkItemList`+`WorkItemRow` (the only view = a
table), `Daily`, `Announcements`, `SprintNavigation`, `TaskCardModal`,
`Add*Dialog`, `PeopleManager`, `Header`, `ThemeSwitcher`, `WeatherParticles`,
`ai/*`. All rebuilt with the new design system. `src/components/ui/*` (shadcn)
primitives may be kept as headless Radix wrappers but **fully restyled**; delete
the ~40 unused ones.

**The design DNA to actively un-learn** (from reading the code — this is where AI
slop leaks in):
- `body { font-family: JetBrains Mono }` — the entire app is monospaced. **Remove
  this line**; scope JetBrains Mono to numerics only.
- Everything is wrapped in a bordered `Card` (`rounded-lg border bg-card
  shadow-sm`) → card-in-card everywhere. **Ban card-in-card.**
- `--radius: 0.25rem` hard corners everywhere → part of the "basic" read. Raise it.
- Charts use **hardcoded hex** (`#3b82f6`, `#10b981`) ignoring the theme. **Ban
  hardcoded color literals in components.**
- Only typographic device is uppercase `tracking-widest`. Use weight/size contrast.
- Navigation is a single `Tabs` shell (no router, no URL state).
- Drag is raw HTML5 `DragEvent`. → dnd-kit.
- "Daily" is tag-filtered sprint rows, not a real checklist.
- 8 seasonal themes drive full-screen `WeatherParticles` (z-index 50) — reads
  toy-like against "better than Jira." **Demote to an opt-in easter egg; ship
  dark + light as the two canonical themes.**

**Worth preserving as IDEAS (not code):**
- **Leaderboard scoring** (rate-based /100: Completion 50 + Priority 30 +
  Momentum 20; Critical=1/High=0.75/Medium=0.5/Low=0.25; momentum =
  active/(active+new); all-done → full momentum). Re-implemented server-side
  (§7 `leaderboard()` RPC, Phase 7).
- The **CSS-variable multi-theme architecture** (keep the mechanism, new palette).
- The AI (OpenRouter) task-creator/insights — optional, re-introduce in Phase 7/8.

**Keep as-is:** Vite, TypeScript, Tailwind, React Router, TanStack Query,
react-hook-form, zod, date-fns, sonner, lucide-react, `@supabase/supabase-js`.

---

## §5 Requirements traceability + resolved product decisions

Every requirement from the founders' conversation, mapped to where it lives, with
the ambiguities resolved so the executor never guesses. (Y=covered, and the
resolution for each previously-ambiguous point.)

**Core hierarchy & boards**
- Task's parent = an Arc-Board Epic; exactly one parent; one Epic → many Tasks →
  `tasks.epic_id NOT NULL` (§7). **Re-parenting allowed** (change `epic_id`) on
  the same board (Phase 5).
- Board creation sets **arc size** (# sprints) and **sprint length** (fixed days,
  same for all sprints in the arc). `create_board` RPC seeds Arc #1 + N sprints
  with contiguous computed dates (§7).
- **Sprint invariant:** within an arc every sprint's length = the arc's
  `sprint_length_days`; the last may differ only on manual edit; owners/editors
  may edit sprint dates with overlap validation.

**Views**
- Sprint Board offers **List (default on first load)** and **Kanban**; toggle
  persists per board in URL + Zustand. **No Gantt** (deferred).

**Lifecycle (was missing — now specified; must exist by Phase 5):**
- **Sprint rollover:** exactly one active sprint per arc (partial-unique index).
  Recommended: date-driven "current" + optional manual "start/close sprint"
  (owner/editor). On close, **incomplete tasks prompt "move to next sprint"** (no
  silent auto-move); completed tasks stay for history.
- **Start new arc:** an explicit "Start new arc" action (owner/editor) creates
  Arc #(k+1) + its N sprints (defaults from board), activates it, deactivates the
  previous; **unfinished epics may be carried over** by re-assigning `arc_id`.
- **Epics & arcs:** `epics.arc_id` is nullable → Arc Board shows the **active
  arc** by default **plus a reachable "Backlog (no arc)" bucket** so orphaned
  epics never disappear; an arc selector switches cycles.

**Daily (resolved):** a **single rolling personal list per board** (don't
auto-duplicate across days; `for_date` retained for a future daily view). Items
show a **checkbox, not a numeric index**. Private even from owners (RLS).
"Carry over unchecked" is a deferred option (§20).

**Teams & access**
- Provision **multiple teams per board, multiple members per team** now; freebie
  limits (1 team / ~6 members) **deferred** — but add provisioning columns now
  (`boards.plan text default 'free'`, nullable `max_teams`/`max_members`) + a
  no-op `checkPlanLimit()` so limits switch on later without a migration.
- A member belongs to **at most one team per board** (`board_members.team_id`);
  team-less members appear in an **"Unassigned"** bucket on the leaderboard.
- **Three board roles: owner / editor / viewer** for the entire board (§8).
- **Onboarding team step:** optional "create your first team" step in the wizard
  (founders tied team creation to board creation); assigns the owner to it.

**Customization**
- **Types** are user-created per board in **board settings** (defaults seeded);
  icon = a lucide name (validated, fallback icon). **Statuses** likewise (Kanban
  columns), each with a fixed **category**. Adding a task, the member picks a type
  from the board's set.
- **Priority stays a fixed enum** (load-bearing for scoring) — documented
  exception to "everything customizable"; weights configurable later (§20).
- **Analytics key off `status.category`, never status name** — so custom statuses
  are safe for leaderboard/burndown.

**Leaderboard (resolved — the most detailed feature):**
- Enumerate all four quadrants: {Overall, Per-Sprint} × {Team-vs-Team,
  Member-in-Team}. Team comparison available in **both** scopes; member drill-down
  available at least per-sprint (and overall). Default view = team-vs-team,
  scope = Overall (with a clear path to "your team").
- **Team score = average of members' /100 scores** (fair regardless of team
  size); members with 0 assigned tasks **excluded** from the average; tie-break
  by avg completion %, then name. "Overall" = the active arc's sprints by default,
  with an optional "all arcs" toggle.

**Announcements:** board-wide, authored by **editor+**, readable by all members
(viewers included); `author_id` attribution + optional pin. (Team-scoped
announcements deferred.)

**LeetPing (resolved):** person solves on their own LeetCode → auto-commits to
their GitHub repo. App connects GitHub (read-only repo scope), reads commits via
Edge Function, parses problem, writes `leetping_events`. **Backend first.**
- **Dedup:** `UNIQUE(board_id, user_id, commit_sha)`; parse per-problem so a
  multi-problem commit isn't dropped.
- **Board scoping:** one row per (board, user, commit) across the boards the user
  belongs to.
- **Privacy:** per-user **opt-in** (default off) — competitive grind is sensitive;
  clear consent at connect time; disconnect stops ingestion.

**Destructive-cascade correction (critical):** deleting an **Epic** must NOT
cascade-delete its Tasks. `tasks.epic_id` = **`ON DELETE RESTRICT`** + a guided
"this epic has N tasks — reparent or delete them" flow (`reparent_epic_tasks`
RPC). Removing a member with assigned tasks → set their tasks' `assignee_id` NULL
(keep the work). Deleting a status/type in use → block or reassign to a default.

**New meta-requirements (this round):** maintain `CLAUDE.md` + a separate
`memory.md` + a decision log; track decisions/iteration; document tech rationale;
provide an architecture explainer. All covered in §3, §6, §19.

---

## §6 Target architecture & technology decision record

Philosophy: a **thin, typed, headless client over a smart, secured database.**
Correctness (schema, constraints, and *authorization* via RLS) is pushed down to
Postgres; the client is a rendering/interaction layer that never re-implements
rules it can't be trusted to enforce — decisive for an AI-built app. Every UI
library is **headless** (owns logic, hands you rendering) so the design can be
genuinely distinctive, not templated.

### 6.1 Technology decision record (pros / cons / alternatives / why)

Each entry: Decision → Why → Pros → Cons → Alternatives (why rejected) → Use here.

**React 18.3 (not 19).** Why: 18.3 is a bridge release every dependency already
supports; concurrent features that matter here (`useTransition`,
`useDeferredValue`, automatic batching, Suspense-for-lazy) already exist; largest
training-data corpus (relevant for agent codegen). Pros: zero peer-dep risk,
ecosystem stability, hot paths can use `useDeferredValue`. Cons: no `use()`/
Actions/`ref`-as-prop; no React-Compiler auto-memo (hand-write `useMemo` on
Kanban/Table); it's now "N-1". Alternatives: React 19 now — rejected as default
because this is a client SPA on `supabase-js`, so 19's RSC/server-Actions wins are
inapplicable while its churn is real; do it only as an isolated Phase-1 step if
the user wants the Compiler. Use: SPA, `createRoot`, SWC fast-refresh.

**Vite SPA (not Next.js) — the most consequential choice.** Why: this is an
authenticated internal tool — nothing to SEO; data is user/board-scoped, realtime,
mutation-heavy (a client-state problem); security is simpler (browser holds only
the publishable key + JWT, RLS enforces) — no server tier tempted to hold the
secret key; fastest agent dev loop. Pros: instant HMR, trivial static deploy,
one clean security boundary. Cons: no SSR (hard dependency on skeletons — the plan
mandates them); the client bundle ships (Framer + dnd-kit + Table + recharts +
visx + Radix → must code-split); no edge auth middleware (guards are UX only).
Alternatives: Next.js (App Router/RSC) — rejected: adds a server trust boundary,
RSC/client-boundary complexity, secret-key temptation, all cost and little benefit
for a private realtime board; Remix/TanStack Start — pull toward an unneeded
server tier; Astro — wrong for a stateful app. Use: `vite build` → static on
Vercel; React Router v6 for `/b/:boardId/*`; `manualChunks`/`React.lazy` per route
is non-optional.

**Tailwind v3 + CSS-variable tokens.** Why: ideal substrate for multi-theme
(swap `--` variables at `[data-theme]` scope; restyle by editing tokens);
zero-runtime; native to shadcn/Radix; `cva` for variants. Pros: instant theme
switching, one source of truth for palette/spacing/radius/elevation, smallest
style payload, strong agent familiarity. Cons: class-soup (mitigate with `cva`);
purge strips dynamically-built class strings (per-status/type colors must use CSS
variables/safelist, not `bg-${x}`). Alternatives: CSS-in-JS (runtime cost —
rejected), vanilla-extract/Panda/StyleX (fight shadcn/Tailwind — rejected),
Tailwind v4 (breaking migration on a v3 scaffold — defer). Use: utilities +
`cva` + CSS-var palette (§11) toggled by `next-themes`.

**Radix + shadcn pattern (restyled).** Why: unstyled, accessible behavior (focus,
ARIA, keyboard, portalling) with you owning 100% of markup/CSS — the only way to
be both distinctive AND accessible; shadcn copies source into the repo (no library
version to fight). Pros: a11y for free, total visual control (no "MUI look"),
own-the-source. Cons: you build the visual system; manual updates; prune unused.
Alternatives: MUI/Mantine/Chakra (recognizable house styles — rejected against
"not basic"), Park UI (pairs with Panda, not Tailwind — rejected). Use: keep the
listed primitives, delete the rest, restyle to tokens; `vaul` mobile sheets,
`cmdk` command palette, `sonner` toasts.

**Framer Motion.** Why: declarative variants/AnimatePresence/springs/layout are
the whole motion brief (stagger, drag physics, count-ups, route transitions) and
the model an agent produces reliably; built-in reduced-motion. Pros: stagger &
exit & shared-element animations that are hard by hand; springs without dated
bounce. Cons: heaviest motion lib (code-split; use deliberately); overuse reads as
AI-generated. Alternatives: GSAP (imperative, licensing/bundle — overkill),
react-spring (weaker orchestration/layout), CSS/`tailwindcss-animate` (keep for
micro-interactions; can't do springs/exit/shared-element). Use: `lib/design/
motion.ts` shared variants; Framer for signature moments, CSS for hover/focus.

**dnd-kit.** Why: needs list-reorder AND move-between-columns; modern, maintained,
accessible (keyboard sensor), headless. Pros: a11y drag, full card visual control,
one model for list + Kanban, pairs with fractional `position`. Cons: more
boilerplate; care with many cards + virtualization. Alternatives: react-beautiful-
dnd (deprecated — rejected), Atlassian Pragmatic DnD (excellent, the escalation
path if dnd-kit hits a perf ceiling on huge boards), native HTML5 (no touch/a11y —
the current anti-pattern). Use: columns = statuses; cross-column drag → optimistic
`status_id` + new `position`; keyboard sensor; Framer for overlay physics.

**TanStack Query v5 (installed).** Why: Supabase-over-HTTP is a server-cache
problem (caching, dedup, background refetch, optimistic + rollback, realtime
reconcile). Pros: first-class optimistic/rollback, key-driven invalidation,
retries/backoff, devtools. Cons: foot-guns (wrong keys, over-broad invalidation)
→ need a key convention; server-cache only (hence Zustand); optimistic+realtime
races (handle deliberately). Alternatives: SWR (weaker mutations), RTK Query
(drags in Redux), raw supabase + useEffect (the old anti-pattern). Use: per-entity
typed hooks; optimistic Kanban/List/Daily with rollback; realtime reconciles the
cache (Phase 8); tuned stale/gc times (Phase 10).

**Zustand.** Why: a little global *client* state (active board, view mode,
filters, sidebar, theme) that doesn't belong in the server cache. Pros: ~1 kB, no
provider, selectors avoid re-renders, easy to persist to URL/localStorage. Cons:
un-opinionated → risk of leaking server data into it (**hard rule: never put
server data in Zustand**). Alternatives: Redux Toolkit (boilerplate), Jotai/Recoil
(fine; Zustand simpler for this small flag-set), Context (poor re-render for
frequently-changing state). Use: `uiStore`/`boardStore`/`viewStore`/`dragStore`;
view/filters mirrored to URL.

**TanStack Table (headless).** Why: List view needs sort/filter/group/column mgmt
+ inline edit in our own style. Pros: full visual control, rich built-ins,
composes with dnd-kit + Query, same family as Query. Cons: you build the cell UI;
big datasets need `@tanstack/react-virtual`. Alternatives: AG Grid (heavy, paid
features, own look), MUI DataGrid (MUI styling/paywall), hand-rolled (reinvents
sort/filter/group). Use: List over `tasks`; client sort/filter/group + server
keyset pagination; add react-virtual only if task counts warrant.

**Charts: visx for signature, recharts for routine.** Why: recharts defaults ARE
the card-slop cliché; visx (d3 as React primitives) gives unlimited control for
the podium/burndown/velocity. Pros (visx): total control, tree-shakeable, composes
with Framer + tokens. Cons: low-level (more code). Alternatives: nivo (opinionated
look — a middle option if visx is too much hand-work), tremor (generic dashboard —
the thing we're rejecting), Chart.js/ECharts (canvas fights SVG+CSS-var theming).
Use: visx+Framer for leaderboard/burndown/velocity; restyled recharts for
distributions/workload; count-ups via Framer.

**react-hook-form + zod (installed).** Why: uncontrolled-first (fast, minimal
re-renders); zod gives runtime validation + static types from one schema, reused
in the data layer to validate every payload in/out (the "validate everywhere"
linchpin). Pros: snappy forms, one schema → form + types + guard, agent-familiar.
Cons: `Controller` needed for Radix inputs; zod v3 bundle/parse cost (fine for
forms); zod v4 is a future isolated upgrade. Alternatives: Formik (heavier), Yup/
Valibot (Valibot smaller but zod installed + deeper ecosystem), manual (drops
shared types). Use: every form; schemas shared with `lib/supabase/schemas/`.

**Supabase (Postgres + Auth + Realtime + Edge + Storage + Vault), RLS as authz.**
Why: the domain is relational/multi-tenant (boards→arcs→sprints→epics→tasks +
members/teams) — Postgres models it with real FKs/constraints/triggers; RLS pushes
authorization into the DB so the security-critical logic lives in one auditable
place, not scattered across generated components; one vendor unifies DB/auth/
realtime/functions/storage/vault. Pros: portable SQL, integrated everything,
generated types, built-in advisors (a gift for AI-built code), extensions
(pg_cron/citext/pgcrypto). Cons: **RLS is unforgiving** (one wrong policy leaks or
hides data — hence advisors + test matrix every phase); realtime scaling caveats;
connection limits (use Supavisor); vendor coupling (confine to the data layer);
Edge limits/cold starts. Alternatives: Firebase (document model wrong for
join-heavy relational data — rejected), custom Node+Postgres (build auth/realtime/
API/authz yourself — huge surface to get wrong; moves authz back into app code),
Appwrite/Nhost/PocketBase (smaller ecosystems, weaker advisor/MCP tooling). Use:
every table has `board_id`; SECURITY DEFINER helpers drive policies; `create_board`
RPC bootstraps a tenant; Edge Functions hold the secret key; Vault holds GitHub
tokens; advisors every phase.

**Auth: Supabase email + verification** (+ GitHub OAuth later for LeetPing). Why:
founder asked for the verification-email flow; keeps identity inside the system
that enforces RLS (`auth.uid()` anchors every policy). Pros: native, brandable
templates, GitHub OAuth reuses the same auth. Cons: default email sender is
rate-limited/spam-prone (production SMTP/Resend in Phase 10); SPA token handling
needs XSS discipline. Alternatives: magic-link (founder wanted verification-email;
offer as optional), Clerk/Auth0 (great UX/MFA/org, but a second identity source to
bridge into `auth.uid()` — extra vendor/cost; the pick only if you need SSO/MFA
fast). Use: signup→verify→session; login/reset; `onAuthStateChange` `useAuth`;
guards for UX; SMTP in Phase 10.

**Deploy: Vercel** (repo already Vercel-flavored). Why: static SPA needs CDN + SPA
fallback + preview deploys + simple env. Pros: zero-config, per-PR previews (great
for the verify loop), `@vercel/analytics` present. Cons: paying for unused
serverless; client env is public (confirm only publishable key ships). Alternatives:
Netlify (equivalent), Cloudflare Pages (cheapest at scale; slightly more setup).
Use: `vite build` → Vercel static + SPA fallback; env = URL + publishable key only.

**fractional-indexing (`position` = `text`).** Why: both the DB and frontend
audits flagged that `double precision` positions **corrupt after ~50 same-slot
inserts** (float precision). Decision: `position text` using LexoRank-style keys
from the `fractional-indexing` npm lib; client computes a key between neighbors;
a `move_task` RPC validates permission and persists. Pros: O(1) reorder, no
renumber, no precision cliff, deterministic order with `(position, id)`
tie-break. Cons: string keys are opaque; occasional rebalance if keys get long.
Alternatives: `numeric` (arbitrary precision but still needs midpoint logic +
rebalance; the DB audit's fallback), integer reindex (O(n) writes — rejected).

### 6.2 Stack philosophy (why it's coherent) & top structural risk

Two throughlines: (1) **push correctness/authorization down to Postgres, keep the
client thin and typed** — the security-critical logic is in one auditable place
(migrations + policies + advisors), not scattered across agent-generated
components; (2) **headless everywhere** (Radix/TanStack/visx/dnd-kit own logic,
you own rendering) so "premium distinctive UI" and "correct/accessible/typed"
don't trade off. zod is the connective tissue keeping DB shape, payloads, and
forms in agreement. The one structural weakness inherent to the choices is
**client bundle weight** (SPA + heavy visual libs, no SSR) — actively managed with
code-splitting, not assumed away. The two launch-blocking dangers are **RLS
correctness** and **the already-shared secret keys** (§17, §21).

### 6.3 App structure / routing / state boundary

```
src/
  app/        providers · router · guards (RequireAuth/RequireBoard/RequireRole) ·
              RootLayout → AuthedLayout → BoardLayout · AppErrorBoundary ·
              CommandPalette (cmdk ⌘K) · KeyboardShortcuts + ShortcutCheatsheet
  features/   auth · onboarding · boards · members · arc · sprint · daily ·
              leaderboard · dashboard · announcements · leetping
  lib/
    supabase/ client · database.types.ts · queryKeys.ts · result.ts ·
              useOptimisticMutation.ts · fractionalIndex.ts · <entity>.ts · schemas/
    design/   tokens.css · motion.ts · icons.ts · charts/
  components/ui/  restyled Radix primitives (+ new: progress-ring, segmented-
                 control, empty-state, stat, kbd)
  stores/     uiStore · boardStore · viewStore · dragStore
```

**Routing (React Router v6, nested layouts):** `RootLayout` (providers) →
`AuthedLayout` (guard + sidebar + topbar + `<Outlet/>`) → `BoardLayout`
(`/b/:boardId`, resolves board, board nav + `<Outlet/>`) → features. Guards mount
in layout elements (not per-route) with an explicit `authStatus:'loading'`
skeleton to avoid flashing protected content. Data comes from TanStack Query, not
RR loaders (one data layer). URL is the source of truth for view/sprint/filters:
`/b/:id/sprint?view=kanban&sprint=<id>&assignee=<id>&type=<id>&q=...`; deep-link a
task with `?task=<id>`.

**State ownership (the hard rule):** Server (TanStack Query): boards, members,
teams, arcs, sprints, epics, tasks, daily_items, comments, announcements,
leetping, statuses, types, profiles. Client (Zustand): `activeBoardId`, `viewMode`
(list|kanban), filter/sort/group, sidebar, command-palette open, theme, transient
drag ghost, selected task id. **Nothing from Supabase lives in Zustand; nothing
ephemeral lives in Query.** Query keys via a `queryKeys.ts` factory (hierarchical,
filters part of the key). `staleTime`: reference data (statuses/types/teams/
members) 5 min; hot content (tasks/epics) 0 + realtime; aggregates 30 s.

**The four spines to build in Phase 1** (everything hangs on them): `motion.ts`,
`useOptimisticMutation.ts` (the onMutate→cancel→snapshot→patch→rollback→settle
recipe, once), `queryKeys.ts`, and `usePermissions()` (role → capabilities).

---

## §7 Data model — full DDL (migrations 0001–0014)

Copy-paste-ready. Apply in order via `apply_migration` (one named migration per
subsection). Conventions: all objects in `public` unless noted; PKs
`uuid default gen_random_uuid()`; all timestamps `timestamptz`; `position` is
**`text`** (LexoRank via `fractional-indexing`); helper/RPC functions are
`SECURITY DEFINER`, `SET search_path = public, extensions, pg_temp`,
`REVOKE ALL FROM public` + `GRANT EXECUTE TO authenticated`. Every child that
cross-references another board-scoped row uses **composite `(id, board_id)` FKs**
so a row on board A can never reference a row on board B (airtight multi-tenant
integrity — no trigger needed).

> **Why these differ from a naive schema (the audit's hard-won corrections):**
> (1) explicit `WITH CHECK` on every mutating policy (else an editor of board A
> can insert/move rows into board B — a cross-tenant leak); (2) composite FKs for
> cross-board integrity; (3) invitation **token_hash** not plaintext token;
> (4) `tasks.epic_id` **RESTRICT** not CASCADE (CASCADE silently destroys sprint
> work); (5) `position text` (double precision corrupts after ~50 reorders);
> (6) SECURITY DEFINER helpers with locked `search_path` to avoid RLS recursion;
> (7) partial-unique indexes so only one active arc/sprint can exist.

### 0001_extensions
```sql
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions; -- gen_random_uuid, digest, gen_random_bytes
create extension if not exists citext   with schema extensions;
create extension if not exists pg_trgm  with schema extensions; -- title search
-- vault is preinstalled (supabase_vault). pg_cron for leetping-sync: enable via dashboard/extensions.
```

### 0002_enums
```sql
create type public.board_role      as enum ('owner','editor','viewer');
create type public.item_priority   as enum ('critical','high','medium','low');
create type public.invite_status   as enum ('pending','accepted','revoked','expired');
create type public.status_category as enum ('todo','in_progress','done');
```

### 0003_profiles
```sql
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null default 'New user',
  handle          extensions.citext unique check (handle is null or handle ~ '^[a-z0-9_]{3,30}$'),
  avatar_url      text,
  github_username text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.profiles is 'Profile 1:1 with auth.users. NEVER store email here (email stays in auth.users).';
alter table public.profiles enable row level security;
```

### 0004_core_tables (boards, teams, board_members)
```sql
create table public.boards (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 1 and 120),
  owner_id           uuid not null references public.profiles(id) on delete restrict, -- block orphaning
  arc_size           int  not null default 5  check (arc_size between 1 and 24),
  sprint_length_days int  not null default 14 check (sprint_length_days between 1 and 60),
  plan               text not null default 'free',   -- plan-limit provisioning (enforcement deferred)
  max_teams          int,                             -- null = unlimited
  max_members        int,                             -- null = unlimited
  settings           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.boards enable row level security;

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  color      text,
  created_at timestamptz not null default now(),
  unique (board_id, name),
  unique (id, board_id)   -- composite anchor
);
alter table public.teams enable row level security;

create table public.board_members (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.board_role not null default 'viewer',
  team_id    uuid,
  created_at timestamptz not null default now(),
  unique (board_id, user_id),
  foreign key (team_id, board_id) references public.teams(id, board_id) on delete set null,
  unique (id, board_id)
);
alter table public.board_members enable row level security;
```
Note: `boards.owner_id` is `RESTRICT` — account deletion must transfer/relinquish
ownership first. Board delete cascades everything for that board (owner-only,
double-confirmed in UI). `arc_size`/`sprint_length_days` are defaults snapshotted
into each arc at creation; existing arcs/sprints are immutable snapshots.

### 0005_planning_and_work
```sql
create table public.arcs (
  id                 uuid primary key default gen_random_uuid(),
  board_id           uuid not null references public.boards(id) on delete cascade,
  name               text not null,
  position           int  not null default 0,
  sprint_length_days int  not null check (sprint_length_days between 1 and 60),
  start_date         date, end_date date,
  is_active          boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (board_id, position), unique (id, board_id)
);
alter table public.arcs enable row level security;

create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  arc_id uuid not null,
  name text not null, position int not null default 0,
  start_date date, end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (arc_id, board_id) references public.arcs(id, board_id) on delete cascade,
  unique (arc_id, position), unique (id, board_id),
  check (end_date is null or start_date is null or end_date >= start_date)
);
alter table public.sprints enable row level security;

create table public.board_statuses (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null, category public.status_category not null,
  color text, position int not null default 0,
  unique (board_id, name), unique (board_id, position), unique (id, board_id)
);
alter table public.board_statuses enable row level security;

create table public.work_item_types (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null, icon text, color text, position int not null default 0,
  unique (board_id, name), unique (id, board_id)
);
alter table public.work_item_types enable row level security;

create table public.epics (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  arc_id uuid,
  title text not null check (char_length(title) between 1 and 300),
  type_id uuid, status_id uuid,
  priority public.item_priority not null default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  description text,
  position text not null default 'a0',      -- fractional-indexing key
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (arc_id,    board_id) references public.arcs(id, board_id)             on delete set null,
  foreign key (type_id,   board_id) references public.work_item_types(id, board_id)  on delete restrict,
  foreign key (status_id, board_id) references public.board_statuses(id, board_id)   on delete restrict,
  unique (id, board_id)
);
alter table public.epics enable row level security;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  epic_id uuid not null,                    -- exactly one parent
  sprint_id uuid,
  title text not null check (char_length(title) between 1 and 300),
  type_id uuid, status_id uuid,
  priority public.item_priority not null default 'medium',
  assignee_id uuid references public.profiles(id) on delete set null,
  tags text[] not null default '{}',
  is_blocker boolean not null default false,
  description text,
  position text not null default 'a0',
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (epic_id,   board_id) references public.epics(id, board_id)            on delete restrict, -- NOT cascade
  foreign key (sprint_id, board_id) references public.sprints(id, board_id)          on delete set null,
  foreign key (type_id,   board_id) references public.work_item_types(id, board_id)  on delete restrict,
  foreign key (status_id, board_id) references public.board_statuses(id, board_id)   on delete restrict,
  unique (id, board_id)
);
alter table public.tasks enable row level security;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  task_id uuid, epic_id uuid,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (num_nonnulls(task_id, epic_id) = 1),
  foreign key (task_id, board_id) references public.tasks(id, board_id) on delete cascade,
  foreign key (epic_id, board_id) references public.epics(id, board_id) on delete cascade
);
alter table public.comments enable row level security;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  body text, is_pinned boolean not null default false, pinned_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.announcements enable row level security;

create table public.daily_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  is_done boolean not null default false,
  for_date date not null default current_date,   -- client passes local date; default is fallback
  position text not null default 'a0',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.daily_items enable row level security;
```

### 0006_integration (invitations, github_connections, leetping_events)
```sql
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  email extensions.citext not null,
  role public.board_role not null default 'viewer' check (role <> 'owner'),
  team_id uuid,
  token_hash text not null,                 -- sha256(raw token); raw token only in the email link
  invited_by uuid references public.profiles(id) on delete set null,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(), accepted_at timestamptz,
  foreign key (team_id, board_id) references public.teams(id, board_id) on delete set null
);
create unique index invitations_one_pending on public.invitations (board_id, email) where status = 'pending';
create unique index invitations_token_hash  on public.invitations (token_hash);
alter table public.invitations enable row level security;

create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  github_username text, repo_full_name text, installation_id text,
  token_secret_id uuid,                     -- FK to vault.secrets.id (Edge Function managed)
  share_to_boards boolean not null default false,   -- privacy opt-in (default OFF)
  connected_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.github_connections enable row level security;

create table public.leetping_events (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  problem_title text, problem_slug text, problem_url text,
  difficulty text check (difficulty in ('Easy','Medium','Hard') or difficulty is null),
  language text, repo_full_name text,
  commit_sha text not null, committed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (board_id, user_id, commit_sha)
);
alter table public.leetping_events enable row level security;
```

### 0007_functions_triggers (helpers, guards, updated_at, new-user)
```sql
-- RLS helpers (SECURITY DEFINER, recursion-safe, locked search_path)
create or replace function public.is_board_member(b uuid) returns boolean
  language sql stable security definer set search_path=public,pg_temp as
$$ select exists(select 1 from public.board_members m where m.board_id=b and m.user_id=auth.uid()); $$;
create or replace function public.board_role(b uuid) returns public.board_role
  language sql stable security definer set search_path=public,pg_temp as
$$ select m.role from public.board_members m where m.board_id=b and m.user_id=auth.uid(); $$;
create or replace function public.can_edit(b uuid) returns boolean
  language sql stable security definer set search_path=public,pg_temp as
$$ select exists(select 1 from public.board_members m where m.board_id=b and m.user_id=auth.uid() and m.role in ('owner','editor')); $$;
create or replace function public.is_board_owner(b uuid) returns boolean
  language sql stable security definer set search_path=public,pg_temp as
$$ select exists(select 1 from public.board_members m where m.board_id=b and m.user_id=auth.uid() and m.role='owner'); $$;
create or replace function public.shares_board_with(target uuid) returns boolean
  language sql stable security definer set search_path=public,pg_temp as
$$ select exists(select 1 from public.board_members me join public.board_members them on them.board_id=me.board_id
     where me.user_id=auth.uid() and them.user_id=target); $$;
revoke all on function public.is_board_member(uuid), public.board_role(uuid), public.can_edit(uuid),
  public.is_board_owner(uuid), public.shares_board_with(uuid) from public;
grant execute on function public.is_board_member(uuid), public.board_role(uuid), public.can_edit(uuid),
  public.is_board_owner(uuid), public.shares_board_with(uuid) to authenticated;

create or replace function public.set_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end; $$;

-- Defensive profile creation (never abort signup)
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1), 'New user');
  v_handle extensions.citext := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g'));
begin
  if length(v_handle) < 3 then v_handle := 'user_' || substr(new.id::text,1,8); end if;
  begin insert into public.profiles(id,display_name,handle) values (new.id,v_name,v_handle);
  exception when unique_violation then
    insert into public.profiles(id,display_name,handle) values (new.id,v_name,'user_'||substr(new.id::text,1,8))
    on conflict (id) do nothing;
  end; return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Assignee must be a board member
create or replace function public.assert_assignee_is_member() returns trigger
  language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.assignee_id is not null and not exists (
     select 1 from public.board_members m where m.board_id=new.board_id and m.user_id=new.assignee_id)
  then raise exception 'assignee % is not a member of board %', new.assignee_id, new.board_id using errcode='check_violation'; end if;
  return new;
end; $$;
create trigger tasks_assignee_member before insert or update of assignee_id,board_id on public.tasks
  for each row execute function public.assert_assignee_is_member();
create trigger epics_assignee_member before insert or update of assignee_id,board_id on public.epics
  for each row execute function public.assert_assignee_is_member();

-- Clean up a member's private dailies when they leave
create or replace function public.cleanup_member_dailies() returns trigger
  language plpgsql security definer set search_path=public,pg_temp as $$
begin delete from public.daily_items where board_id=old.board_id and user_id=old.user_id; return old; end; $$;
create trigger board_members_cleanup_dailies after delete on public.board_members
  for each row execute function public.cleanup_member_dailies();
```

### 0008_rls_policies (every table; SELECT=member, writes=editor with WITH CHECK; owner-only where noted)
```sql
-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id=auth.uid() or public.shares_board_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id=auth.uid()) with check (id=auth.uid());
-- boards
create policy boards_select on public.boards for select to authenticated using (public.is_board_member(id));
create policy boards_update on public.boards for update to authenticated using (public.is_board_owner(id)) with check (public.is_board_owner(id));
create policy boards_delete on public.boards for delete to authenticated using (public.is_board_owner(id));
-- (no client INSERT policy on boards — only create_board RPC)
-- board_members
create policy bm_select on public.board_members for select to authenticated using (public.is_board_member(board_id));
create policy bm_update on public.board_members for update to authenticated using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));
create policy bm_delete on public.board_members for delete to authenticated using (public.is_board_owner(board_id));
-- (no client INSERT policy — first owner via create_board, invitees via accept_invite)
-- teams
create policy teams_select on public.teams for select to authenticated using (public.is_board_member(board_id));
create policy teams_cud on public.teams for all to authenticated using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));
-- generic content: SELECT=member, INSERT/UPDATE/DELETE=editor, WITH CHECK on board_id
do $$ declare t text; begin
  foreach t in array array['arcs','sprints','board_statuses','work_item_types','epics','tasks','announcements'] loop
    execute format($f$
      create policy %1$s_select on public.%1$s for select to authenticated using (public.is_board_member(board_id));
      create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.can_edit(board_id));
      create policy %1$s_update on public.%1$s for update to authenticated using (public.can_edit(board_id)) with check (public.can_edit(board_id));
      create policy %1$s_delete on public.%1$s for delete to authenticated using (public.can_edit(board_id));
    $f$, t);
  end loop; end $$;
-- comments (author-scoped edits)
create policy comments_select on public.comments for select to authenticated using (public.is_board_member(board_id));
create policy comments_insert on public.comments for insert to authenticated with check (public.can_edit(board_id) and author_id=auth.uid());
create policy comments_update on public.comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (author_id=auth.uid() or public.can_edit(board_id));
-- daily_items (private)
create policy daily_all on public.daily_items for all to authenticated
  using (user_id=auth.uid()) with check (user_id=auth.uid() and public.is_board_member(board_id));
-- invitations (owner-only; invitee never selects the row — accepts via RPC/Edge)
create policy inv_select on public.invitations for select to authenticated using (public.is_board_owner(board_id));
create policy inv_cud on public.invitations for all to authenticated using (public.is_board_owner(board_id)) with check (public.is_board_owner(board_id));
-- github_connections (own row only)
create policy gh_all on public.github_connections for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
-- leetping_events (members read; writes only via Edge Function/service role)
create policy lp_select on public.leetping_events for select to authenticated using (public.is_board_member(board_id));
```

### 0009_rpcs (create_board, accept_invite, move_task, reparent_epic_tasks, board_roster, leaderboard)
```sql
-- Atomic tenant bootstrap
create or replace function public.create_board(p_name text, p_arc_size int, p_sprint_length int)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_board uuid; v_arc uuid; i int;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode='28000'; end if;
  if p_arc_size not between 1 and 24 then raise exception 'arc_size out of range'; end if;
  if p_sprint_length not between 1 and 60 then raise exception 'sprint_length out of range'; end if;
  if char_length(coalesce(p_name,'')) not between 1 and 120 then raise exception 'invalid name'; end if;
  insert into public.boards(name,owner_id,arc_size,sprint_length_days) values (p_name,v_uid,p_arc_size,p_sprint_length) returning id into v_board;
  insert into public.board_members(board_id,user_id,role) values (v_board,v_uid,'owner');
  insert into public.board_statuses(board_id,name,category,position,color) values
    (v_board,'New','todo',0,'#64748b'),(v_board,'Active','in_progress',1,'#3b82f6'),(v_board,'Done','done',2,'#22c55e');
  insert into public.work_item_types(board_id,name,icon,color,position) values
    (v_board,'Feature','sparkles','#8b5cf6',0),(v_board,'Bug','bug','#ef4444',1),(v_board,'Chore','wrench','#64748b',2),
    (v_board,'Research','flask-conical','#06b6d4',3),(v_board,'Design','palette','#ec4899',4);
  insert into public.arcs(board_id,name,position,sprint_length_days,start_date,is_active)
    values (v_board,'Arc 1',0,p_sprint_length,current_date,true) returning id into v_arc;
  for i in 0 .. p_arc_size-1 loop
    insert into public.sprints(board_id,arc_id,name,position,start_date,end_date,is_active)
    values (v_board,v_arc,'Sprint '||(i+1),i, current_date+(i*p_sprint_length), current_date+((i+1)*p_sprint_length)-1, i=0);
  end loop;
  return v_board;
end; $$;
revoke all on function public.create_board(text,int,int) from public;
grant execute on function public.create_board(text,int,int) to authenticated;

-- Accept invite (raw token → hash → validate → membership), atomic + email-match
create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_hash text:=encode(digest(p_token,'sha256'),'hex'); inv public.invitations; v_email extensions.citext;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode='28000'; end if;
  select email into v_email from auth.users where id=v_uid;
  select * into inv from public.invitations where token_hash=v_hash for update;
  if not found then raise exception 'invalid invite'; end if;
  if inv.status<>'pending' then raise exception 'invite not pending'; end if;
  if inv.expires_at<now() then update public.invitations set status='expired' where id=inv.id; raise exception 'invite expired'; end if;
  if lower(inv.email)<>lower(v_email) then raise exception 'invite email mismatch'; end if;
  insert into public.board_members(board_id,user_id,role,team_id) values (inv.board_id,v_uid,inv.role,inv.team_id) on conflict (board_id,user_id) do nothing;
  update public.invitations set status='accepted', accepted_at=now() where id=inv.id;
  return inv.board_id;
end; $$;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- Reorder a task: client computes the fractional key; RPC validates perms + persists
create or replace function public.move_task(p_item uuid, p_status uuid, p_position text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_board uuid; begin
  select board_id into v_board from public.tasks where id=p_item;
  if not public.can_edit(v_board) then raise exception 'forbidden' using errcode='42501'; end if;
  update public.tasks set position=p_position, status_id=coalesce(p_status,status_id), updated_at=now() where id=p_item;
end; $$;
revoke all on function public.move_task(uuid,uuid,text) from public;
grant execute on function public.move_task(uuid,uuid,text) to authenticated;

-- Safe alternative to cascade-delete (epic delete is RESTRICT)
create or replace function public.reparent_epic_tasks(p_from uuid, p_to uuid)
returns int language plpgsql security definer set search_path=public,pg_temp as $$
declare v_board uuid; n int; begin
  select board_id into v_board from public.epics where id=p_from;
  if v_board is null or v_board<>(select board_id from public.epics where id=p_to) then raise exception 'epics on different boards'; end if;
  if not public.can_edit(v_board) then raise exception 'forbidden' using errcode='42501'; end if;
  update public.tasks set epic_id=p_to, updated_at=now() where epic_id=p_from; get diagnostics n=row_count; return n;
end; $$;
revoke all on function public.reparent_epic_tasks(uuid,uuid) from public;
grant execute on function public.reparent_epic_tasks(uuid,uuid) to authenticated;

-- Member roster without leaking auth.users email
create or replace function public.board_roster(p_board uuid)
returns table(user_id uuid, display_name text, handle text, avatar_url text, role public.board_role, team_id uuid)
language sql stable security definer set search_path=public,pg_temp as $$
  select p.id,p.display_name,p.handle::text,p.avatar_url,m.role,m.team_id
  from public.board_members m join public.profiles p on p.id=m.user_id
  where m.board_id=p_board and public.is_board_member(p_board);
$$;
revoke all on function public.board_roster(uuid) from public;
grant execute on function public.board_roster(uuid) to authenticated;

-- Server-side leaderboard (Completion 50 + Priority 30 + Momentum 20), scope=sprint|overall
create or replace function public.leaderboard(p_board uuid, p_sprint uuid default null)
returns table(user_id uuid, display_name text, team_id uuid, assigned int, done int, active int, todo int,
              completion numeric, priority numeric, momentum numeric, total int)
language sql stable security definer set search_path=public,pg_temp as $$
  with mine as (
    select t.assignee_id, t.priority, s.category from public.tasks t
    join public.board_statuses s on s.id=t.status_id
    where t.board_id=p_board and t.assignee_id is not null
      and (p_sprint is null or t.sprint_id=p_sprint) and public.is_board_member(p_board)
  ), agg as (
    select assignee_id uid, count(*) assigned,
      count(*) filter (where category='done') done,
      count(*) filter (where category='in_progress') active,
      count(*) filter (where category='todo') todo,
      avg(case priority when 'critical' then 1.0 when 'high' then 0.75 when 'medium' then 0.5 else 0.25 end)
        filter (where category='done') avg_prio
    from mine group by assignee_id
  )
  select a.uid, p.display_name, m.team_id, a.assigned, a.done, a.active, a.todo,
    round(50.0*a.done/nullif(a.assigned,0),1) completion,
    round(30.0*coalesce(a.avg_prio,0),1) priority,
    round(20.0*case when (a.active+a.todo)=0 and a.done>0 then 1 when (a.active+a.todo)=0 then 0 else a.active::numeric/(a.active+a.todo) end,1) momentum,
    round(coalesce(50.0*a.done/nullif(a.assigned,0),0)+30.0*coalesce(a.avg_prio,0)
      +20.0*case when (a.active+a.todo)=0 and a.done>0 then 1 when (a.active+a.todo)=0 then 0 else a.active::numeric/(a.active+a.todo) end)::int total
  from agg a join public.profiles p on p.id=a.uid
  left join public.board_members m on m.user_id=a.uid and m.board_id=p_board
  order by total desc, completion desc;
$$;
revoke all on function public.leaderboard(uuid,uuid) from public;
grant execute on function public.leaderboard(uuid,uuid) to authenticated;
```
Team-vs-team = aggregate the (small) per-member result by `team_id` client-side or
in a thin wrapper RPC: **team score = AVG of member totals**, excluding members
with 0 assigned.

### 0010_updated_at_triggers
```sql
do $$ declare t text; begin
  foreach t in array array['profiles','boards','epics','tasks','comments','announcements','daily_items','github_connections'] loop
    execute format('create trigger set_updated_at before update on public.%1$s for each row execute function public.set_updated_at();', t);
  end loop; end $$;
```

### 0011_indexes (every FK + hot paths + partial-unique active guards)
```sql
create index on public.board_members(user_id);   create index on public.board_members(board_id);
create index on public.board_members(team_id);    create index on public.teams(board_id);
create index on public.arcs(board_id);            create index on public.sprints(board_id);
create index on public.sprints(arc_id);           create index on public.board_statuses(board_id);
create index on public.work_item_types(board_id); create index on public.epics(board_id);
create index on public.epics(created_by);         create index on public.epics(assignee_id);
create index on public.tasks(created_by);         create index on public.tasks(assignee_id);
create index on public.comments(author_id);       create index on public.announcements(author_id);
create index on public.epics(board_id, arc_id);   create index on public.epics(board_id, status_id);
create index on public.tasks(board_id, sprint_id);create index on public.tasks(board_id, epic_id);
create index on public.tasks(board_id, status_id);create index on public.tasks(board_id, sprint_id, status_id);
create index on public.tasks(board_id, assignee_id);
create index on public.tasks using gin (tags);
create index on public.comments(task_id, created_at); create index on public.comments(epic_id, created_at);
create index on public.daily_items(user_id, board_id, for_date);
create index on public.leetping_events(board_id, committed_at desc);
create index on public.invitations(board_id, email);
create index on public.epics using gin (title extensions.gin_trgm_ops);
create index on public.tasks using gin (title extensions.gin_trgm_ops);
create unique index one_active_arc_per_board on public.arcs(board_id) where is_active;
create unique index one_active_sprint_per_arc on public.sprints(arc_id) where is_active;
```

### 0012_storage_avatars
```sql
insert into storage.buckets(id,name,public) values ('avatars','avatars',true) on conflict (id) do nothing;
create policy "avatars public read"   on storage.objects for select using (bucket_id='avatars');
create policy "avatars owner write"   on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars owner update"  on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatars owner delete"  on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
```

### 0013_realtime
```sql
alter publication supabase_realtime add table public.tasks, public.epics, public.sprints,
  public.announcements, public.leetping_events, public.comments;
-- REPLICA IDENTITY FULL so DELETE/UPDATE events carry board_id for RLS row-filtering
alter table public.tasks replica identity full;   alter table public.epics replica identity full;
alter table public.sprints replica identity full; alter table public.announcements replica identity full;
alter table public.leetping_events replica identity full; alter table public.comments replica identity full;
```

### 0014_leaderboard_view (epic rollups; security_invoker so RLS applies)
```sql
create or replace view public.epic_rollups with (security_invoker=true) as
select e.id epic_id, e.board_id,
  count(t.*) task_count,
  count(t.*) filter (where s.category='done') done_count,
  case when count(t.*)=0 then 0 else round(100.0*count(t.*) filter (where s.category='done')/count(t.*)) end pct_done
from public.epics e
left join public.tasks t on t.epic_id=e.id
left join public.board_statuses s on s.id=t.status_id
group by e.id, e.board_id;
```

After the full set: `list_tables` shows 16 tables all `rls_enabled: true`;
`get_advisors` security AND performance return **zero** findings; then
`generate_typescript_types` → `src/lib/supabase/database.types.ts`.

---

## §8 Security / RLS model + test matrix

The browser only ever holds the **publishable key** + a user JWT. Every table has
RLS enabled; **no permissive `USING (true)` anywhere**. The secret key lives only
in Edge Functions. Authorization is board membership + role, enforced by the
SECURITY DEFINER helpers (`is_board_member`/`can_edit`/`is_board_owner`/
`shares_board_with`). RLS ordering safety: RLS is enabled per-table in
0003–0006 (a table with RLS on and no policy denies all — a safe interim state);
policies are added in 0008 (a policy calling a not-yet-created helper would error,
so helpers come first in 0007).

**Test matrix** — actors NM=non-member, V=viewer, E=editor, O=owner, SELF=row
owner. ✅ allow / ❌ deny. This is scripted (Phase 2) and rerun on every schema
change; full sweep in Phase 10.

| Table | Verb | NM | V | E | O |
|---|---|---|---|---|---|
| boards | SELECT | ❌ | ✅ | ✅ | ✅ |
| boards | UPDATE/DELETE | ❌ | ❌ | ❌ | ✅ |
| boards | INSERT (client) | ❌ | ❌ | ❌ | ❌ (create_board only) |
| board_members | SELECT | ❌ | ✅ | ✅ | ✅ |
| board_members | INSERT (client) | ❌ | ❌ | ❌ | ❌ (RPC/Edge only) |
| board_members | UPDATE/DELETE | ❌ | ❌ | ❌ | ✅ |
| teams | SELECT / write | ❌ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ✅ |
| arcs·sprints·statuses·types·epics·tasks·announcements | SELECT | ❌ | ✅ | ✅ | ✅ |
| " " | INSERT own board | ❌ | ❌ | ✅ | ✅ |
| " " | INSERT/UPDATE into OTHER board | ❌ | ❌ | ❌ (WITH CHECK) | ❌ |
| " " | DELETE | ❌ | ❌ | ✅ | ✅ |
| comments | INSERT (author=self, editor) | ❌ | ❌ | ✅ | ✅ |
| comments | INSERT (author≠self) | ❌ | ❌ | ❌ | ❌ |
| comments | UPDATE own / DELETE others' | ❌ | own only | ✅ | ✅ |
| daily_items | SELECT/ALL others' | ❌ | ❌ | ❌ | ❌ |
| daily_items | ALL (self, member) | — | ✅ | ✅ | ✅ |
| invitations | SELECT / write | ❌ | ❌ | ❌ | ✅ |
| github_connections | ALL self / others' | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| leetping_events | SELECT / INSERT(client) | ❌ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ (Edge only) |
| profiles | SELECT (shares board) / SELECT (no shared) / UPDATE self | ✅ / ❌ / ✅ (all rows) |

**Proof snippets** (run via `execute_sql`, impersonating; seed users u1/u2, board
B owned by u1, u2 a viewer):
```sql
select set_config('request.jwt.claims', json_build_object('sub',:'u2','role','authenticated')::text, true);
set role authenticated;
select count(*) from public.tasks where board_id=:'B';                         -- non-member → 0
insert into public.tasks(board_id,epic_id,title) values (:'B',:'epic','x');     -- viewer → RLS violation
insert into public.tasks(board_id,epic_id,title) values (:'C',:'epicC','leak'); -- cross-board (as editor of B) → violation
select count(*) from public.daily_items where user_id=:'u1';                    -- daily privacy → 0
update public.tasks set assignee_id=:'stranger' where id=:'t';                  -- assignee trigger → check_violation
select public.is_board_member(:'B');                                            -- helper never errors 42P17
reset role;
```
Also test: `create_board` atomicity (forced mid-failure leaves no partial board);
cross-board composite-FK rejection (task with an epic on another board fails at
insert); last-owner protection (owner cannot demote/remove the only owner —
enforce in an RPC/policy so a board is never orphaned).

---

## §9 Realtime & scale

**Realtime model (Phase 8).** Use Postgres Changes with RLS re-applied per
subscriber; publish only what the UI needs live (`tasks`, `epics`, `sprints`,
`announcements`, `leetping_events`, `comments` — migration 0013). Because SELECT
policies are `is_board_member(board_id)`, a non-member subscribed to `tasks`
receives nothing — **RLS is the row filter, not the client `.eq('board_id')`
filter** (that's convenience). `REPLICA IDENTITY FULL` is required so UPDATE/DELETE
events include the old row's `board_id`, letting RLS authorize deletes (without it,
deletes silently never arrive → ghost rows in the cache). Client subscribes per
active board: `channel('board:'+id).on('postgres_changes',{schema:'public',
table:'tasks',filter:'board_id=eq.'+id},…)` and reconciles into TanStack Query
(`setQueryData` for insert/update/delete) rather than refetching.

**Reconciliation & conflict policy:** ignore realtime echoes of your own mutations
(tag mutations with a client id / compare `updated_at`); last-write-wins on scalar
fields (server `updated_at` is truth); on the rare equal `position`, the next
reorder re-spaces via a fresh fractional key. Unsubscribe on board switch/unmount
(no leaked channels); refetch on reconnect.

**Scale caveat & Phase-10 path:** Postgres Changes re-checks RLS per client per row
via one WAL reader — at thousands of concurrent subscribers this is the first wall.
For that scale, migrate hot tables to **Broadcast from Postgres**
(`realtime.broadcast_changes()` in an AFTER trigger to a private `board:{id}`
topic, with an RLS policy on `realtime.messages` authorizing `is_board_member`).
Broadcast authorizes once at subscribe time, not per row per client.

**Scale/perf rules:** never `select('*')` a whole table; **keyset (cursor)
pagination** everywhere (feeds/comments on `(created_at,id)` desc; tasks on
`(position,id)`); indexes per 0011 (the three that matter most:
`tasks(board_id,sprint_id,status_id)` for the kanban load,
`tasks(board_id,assignee_id)` for leaderboard/workload, and the trigram title
indexes for search); leaderboard/rollups computed **in the DB** (the `leaderboard()`
RPC + `epic_rollups` view — never client-side over a full table pull); optionally,
for tens of thousands of tasks, maintain denormalized `board_members.done_count/
assigned_count` via an AFTER trigger for the *overall* board leaderboard (keep the
RPC for per-sprint). Do **not** use materialized views (can't be RLS-filtered).
Connections: at scale route through **Supavisor** (transaction mode); Edge
Functions use pooled connections, never open direct per-invocation.

---

## §10 Edge Functions

All: verify the caller's JWT (create a request-scoped client from the caller
token — never trust client-asserted identity), use the **secret key** only inside
the function, and rate-limit.

- **`invite-member`** — caller must be **owner** (verify via `is_board_owner` with
  the caller token). Input `{board_id,email,role∈(editor,viewer),team_id?}`.
  Normalize email; generate `token=base64url(gen_random_bytes(32))`; store
  `token_hash=sha256(token)`; send email via Resend with link
  `/accept?token=<raw>`. Never return the raw token in the body. Secrets:
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `SITE_URL`. Rate-limit:
  ~20/owner/hr, 60/IP/hr.
- **`accept-invite`** — authenticated, email-confirmed caller. Input `{token}`.
  Calls `public.accept_invite(token)` **as the caller** (so the email-match +
  atomic insert apply); maps errors. (If accept must work pre-session, use the
  secret key; otherwise the RPC alone suffices.) Rate-limit ~10/IP/10min.
- **`github-oauth-exchange`** — authenticated caller; validate `state` (CSRF).
  Input `{code,state}`. Exchange code for a token at GitHub; `vault.create_secret`
  → store `secret_id` in `github_connections.token_secret_id`; never return the
  token. Secrets: `GITHUB_CLIENT_ID/SECRET`, `SUPABASE_URL/SECRET_KEY`. Rate-limit
  ~5/user/hr.
- **`leetping-sync`** — (a) scheduled (pg_cron) over connected users with the
  secret key, or (b) manual "Sync now" (caller = connection owner). Read
  `github_connections` → fetch token from Vault (`vault.decrypted_secrets`) →
  GitHub API recent commits on `repo_full_name` → parse LeetCode format (title/
  slug/difficulty/language) **per problem** → for each board the user belongs to
  (respecting `share_to_boards`), upsert `leetping_events` `on conflict
  (board_id,user_id,commit_sha) do nothing`. Output `{inserted,skipped}`. Respect
  GitHub rate limits (backoff); manual sync ~1/min/user; degrade gracefully on
  repo renamed/deleted/token-revoked (surface a "reconnect" state, no poison rows).

---

## §11 Design system & the three design skills

Design intent: an **"engineering instrument"** — precise, dense-but-calm, one
confident accent, dark-first. The differentiator vs Jira is *typographic
confidence + bespoke data-viz + restrained motion*, not more color. Everything
below is the frozen design contract; capture it in `DESIGN.md` (via
`/impeccable init`) in Phase 1 so quality never depends on skill-install success.

### 11.1 The three skills — install once (Phase 1), use every UI phase

1. **Anthropic `frontend-design`** (primary). Source
   `github.com/anthropics/skills` → `skills/frontend-design/SKILL.md` (mirror:
   `anthropics/claude-code` → `plugins/frontend-design`). Install:
   `npx skills add anthropics/skills` or copy the folder into `.claude/skills/`.
2. **`impeccable`** (pbakaus). `github.com/pbakaus/impeccable`. `npx impeccable
   install`, then `/impeccable init` → authors `PRODUCT.md` + `DESIGN.md`. Commands
   used per screen: `shape, craft, critique, audit, polish, animate, typeset,
   colorize, layout, bolder, quieter, distill, harden, onboard, delight, clarify,
   adapt`.
3. **`taste-skill`** (leonxlnx). `npx skills add https://github.com/leonxlnx/
   taste-skill`. Dials for this product: `DESIGN_VARIANCE 7`, `MOTION_INTENSITY 6`,
   `VISUAL_DENSITY 6` (per-screen overrides in 11.7).

Per-screen contract: load `frontend-design` → `/impeccable shape` to plan → build
→ `/impeccable critique` + `audit` + `polish` → apply taste dials. **Fallback if a
skill can't install:** WebFetch the raw `SKILL.md`s and follow them; if none load,
use the local **`artifact-design`** skill and treat §11 as the contract. Create
`.claude/skills/` and commit fetched skills so later phases are reproducible.

### 11.2 Type pairing (kill `font-mono` on body)
Self-host via `@fontsource` (offline, no CDN):
- **Display / headings — Space Grotesk** (`@fontsource/space-grotesk`, 500/600/700)
  — board name, screen titles, big metric labels, empty-state headlines.
- **Body / UI — Geist** (`@fontsource/geist-sans`, 400/500/600) — all UI text.
  (Alt: Public Sans for a more neutral tone.)
- **Numerics / IDs / code / kbd — JetBrains Mono** (installed), scoped via a
  `.font-mono tabular-nums` utility — scores, counts, %, dates, task IDs.
**Remove `font-family: JetBrains Mono` from `body`.** Never fall back to a serif.

### 11.3 Palette — 6 named tokens (dark), avoiding the 3 AI clichés
Blue-tinted blacks (never `#000`); accent is cobalt-iris (not AI-green/terracotta).

| Token | Hex (dark) | Role |
|---|---|---|
| `--ink` (bg base) | `#0B0E14` | blue-black canvas |
| `--surface` | `#12161F` | raised panels (used sparingly — no card-in-card) |
| `--surface-2` | `#1A1F2B` | hovers, inputs, kanban columns |
| `--stroke` | `#232A38` | hairline structural strokes |
| `--paper` (text) | `#E6EAF2` | cool off-white (never pure #FFF) |
| `--iris` (accent) | `#5B7CFA` | interactive, focus, primary CTA |

Semantic hues (single-source; feed chart tokens): `--positive #3FB98C`,
`--warn #E8A13A`, `--danger #E5484D`, `--info #4CC2E0`, + a 6-stop categorical
chart ramp (iris→cyan→jade→amber→coral→violet). Priority ramp: danger→warn→iris→
muted (critical→low). **Light theme** (net-new): `--ink #F6F7FB`, `--surface
#FFFFFF`, `--stroke #E4E7EF`, `--paper #1B2130`, same `--iris`. Add the semantic/
elevation/chart token layers the old file lacked; charts must read tokens, never
hardcode hex.

**Themes (shipped in Phase 1).** Keep the CSS-variable `[data-theme]`
architecture. Six first-class themes, each a full token block in `index.css` with
a matching `color-scheme`, chosen from a topbar theme picker and persisted in the
Zustand `uiStore`:
- **dark** (default) — the blue-black iris palette above.
- **light** — the net-new light palette above.
- **cherry** (Cherry Blossom) — soft pink light theme, primary `#E85C93`.
- **retro** — warm arcade cream light theme, primary `#DE4B34`, teal accent.
- **neon** — cyberpunk dark theme, magenta `#FF33A8` and cyan `#4CC2E0`.
- **winter** (Winter Snow) — crisp icy light theme, primary `#2A93D8`.
Weather particles stay out of core. Adding a theme later is one `[data-theme]`
block, one `color-scheme` entry, and one row in the picker's `THEMES` list.

### 11.4 Scale, spacing, radius, elevation
- **Type scale:** xs 11 / sm 13 (UI base) / base 14 / md 16 / lg 20 / xl 26 /
  2xl 34 / display 46. Line-height UI 1.45, headings 1.15. Display tracking
  `-0.02em`. Retire uppercase `tracking-widest` as the only device (use weight/size
  contrast; reserve small-caps eyebrows for section labels).
- **Spacing** (4px base): 0,4,8,12,16,20,24,32,40,56,72. Dense surfaces (List,
  Kanban) use 8/12; marketing-y (auth, onboarding) use 24/40.
- **Radius** (raise off 0.25rem): `--r-sm 6 / --r-md 10 (workhorse) / --r-lg 14 /
  --r-full 999`.
- **Elevation** (dark = light+border, not just shadow): e0 flat; e1 inset hairline
  + soft shadow; e2 popovers; e3 dragged card + subtle iris glow. Glow reserved
  for drag overlay + focus (kill `.glow-red`).

### 11.5 Motion spec (`src/lib/design/motion.ts`)
- **Durations:** instant 80 / fast 150 / base 240 / slow 360 / deliberate 500 ms.
- **Easings:** enter `[0.2,0,0,1]`, exit `[0.4,0,1,1]`. No bounce/elastic (AI tell).
- **Springs:** snappy `{stiffness:500,damping:34}` (kanban settle, list reorder),
  soft `{260,26}` (panels/sheets), gentle `{170,22}` (count-ups, progress ring).
- **Stagger:** entrance `staggerChildren:0.03, delayChildren:0.04`, capped ~300ms.
- **Signature choreography:** page-load `fadeUp` (y:8→0) staggered by region; route
  crossfade + 6px slide; kanban drop = snappy spring + 120ms iris ring pulse;
  metric count-ups (gentle, tabular-nums); chart draw = `pathLength 0→1` over
  deliberate.
- **Reduced motion:** a `useReducedMotion()` gate (a `variants()` factory reading
  the pref) swaps all of the above for opacity-only ≤120ms, disables count-ups
  (show final), chart-draw (render final), and stagger. Enforced in `motion.ts`,
  not per-screen.

### 11.6 Component + file inventory (per feature — one-line each)
- **`app/`:** providers · router · RootLayout/AuthedLayout/BoardLayout · guards
  (RequireAuth/RequireBoard/RequireRole) · AppErrorBoundary/RouteFallback ·
  CommandPalette (cmdk) · KeyboardShortcuts + ShortcutCheatsheet.
- **`components/ui/` (restyle; delete the rest):** button, input, textarea, label,
  select, dropdown-menu, dialog, sheet, popover, tooltip, tabs, badge, avatar,
  checkbox, switch, toast(sonner), skeleton, separator, scroll-area, command,
  form/field + **new**: progress-ring, segmented-control (view toggle),
  empty-state, stat (metric tile), kbd. **Delete:** carousel, menubar,
  navigation-menu, pagination, resizable, shadcn sidebar (build a bespoke one),
  chart.tsx, input-otp (unless email OTP), drawer/vaul (Sheet covers), calendar/
  day-picker (unless needed), breadcrumb (unless used).
- **`lib/design/`:** tokens.css · motion.ts · icons.ts (lucide name→component
  resolver + IconPicker data + fallback) · charts/ (axis, useChartTheme,
  AnimatedPath, RadialGauge, Sparkline).
- **`lib/supabase/`:** client · database.types.ts · queryKeys · result ·
  useOptimisticMutation · fractionalIndex · per-entity modules (boards, members,
  teams, arcs, sprints, epics, tasks, daily, comments, announcements, leaderboard,
  leetping, profiles) · schemas/ (one zod file per entity, shared with forms).
- **`stores/`:** uiStore (theme, sidebar, cmd-palette) · boardStore (activeBoardId)
  · viewStore (viewMode/filters mirror of URL) · dragStore (transient drag).
- **`features/*`:** auth (Login/Signup/VerifyEmail/ResetRequest/UpdatePassword/
  AcceptInvite/AuthCard/PasswordField/useAuth) · onboarding (OnboardingWizard +
  StepBoardName/StepArcSize/StepSprintLength/StepTeam + ArcTimelinePreview +
  useCreateBoard) · boards (BoardSwitcher/CreateBoardButton/BoardSettings +
  General/StatusEditor/TypeEditor/DangerZone/useBoards) · members (MembersPage/
  MemberRosterTable/RoleSelect/InviteDialog/PendingInvitesList/TeamsPanel/
  usePermissions/useMembers/useTeams/useInvites) · arc (ArcBoardPage/EpicList/
  EpicCard[rollup ring]/EpicDetailPanel/CreateEpicDialog/ArcSelector/useEpics/
  useArcs) · sprint (SprintBoardPage/SprintHeader/ViewModeToggle/SprintFilters/
  ListView[TanStack Table+virtual]/KanbanView/KanbanColumn/TaskCard/
  TaskDragOverlay/TaskDetailPanel/CommentThread/CreateTaskDialog[requires parent
  Epic]/EpicPickerField/useTasks/useTaskDnd) · daily (DailyPage/DailyList/
  DailyItemRow[delightful checkbox]/AddDailyInline/DailyProgressRing/useDaily) ·
  leaderboard (LeaderboardPage/ScopeSwitch/LevelToggle/Podium/TeamComparisonChart/
  RankingTable/PillarBar/ScoringExplainer/useLeaderboard) · dashboard
  (DashboardPage/MetricStrip/BurndownChart/VelocityChart/StatusDonut/PriorityBars/
  WorkloadByAssignee/BlockerSpotlight/AIInsightsPanel[opt-in]/useDashboard) ·
  announcements (AnnouncementsPage/AnnouncementCard/PinnedBanner/Compose/useAnn) ·
  leetping (LeetPingFeed/LeetPingEvent/ConnectGithubCard/SyncNowButton/FeedFilters/
  useLeetPing/useGithubConnection).
- **Shared:** UserAvatar, PriorityDot, TypeChip, StatusPill, RelativeTime,
  MetricNumber (count-up + tabular-nums), EmptyState, ConfirmDialog (undo-aware),
  Skeletons/* (shape-matched per surface), AppSidebar, AppTopbar, RoleGate.

### 11.7 Screen-by-screen direction (signature · layout · interactions · motion)
- **Login/Signup:** left "instrument panel" with a faint live arc→sprint timeline,
  right form on `--ink` (not a centered card); 40/60 split → single column mobile;
  inline zod on blur, password strength, distinct verify state (email echoed +
  resend); fields fadeUp stagger, timeline draws its ticks. Dials V8/M5/D3.
- **Onboarding wizard (the wow moment):** `ArcTimelinePreview` rebuilds live as N
  and length change (each sprint a segment with computed dates); centered stepper +
  persistent preview rail; segment spring-in/out (snappy), step slide+crossfade;
  on submit, timeline "commits" (iris pulse) → board. Dials V8/M7/D3.
- **Arc Board (Epics):** each epic's primary visual is a child-rollup **progress
  ring** (RadialGauge, % done from `epic_rollups`); asymmetric wide list + sticky
  arc header + arc selector + "Backlog (no arc)" bucket; dnd reorder, inline title
  edit, click → EpicDetailPanel (right sheet). Dials V7/M5/D6.
- **Sprint Board — List (default):** dense keyboard-drivable grid (TanStack Table +
  react-virtual), inline quick-edit cells, group-by rail (status/assignee/epic with
  collapsible counts), parent-epic as a subtle chip; `j/k` nav, filters → URL,
  empty-vs-no-match distinction; row enter stagger, reorder spring. Dials V5/M4/D8.
- **Sprint Board — Kanban:** columns = custom statuses with a count/capacity meter;
  lifted DragOverlay card at e3 + iris glow; compact cards (avatar, priority dot,
  epic chip, blocker flag), no nested cards; dnd-kit multi-container (PointerSensor
  8px + KeyboardSensor + touch, closestCorners), cross-column → optimistic
  `move_task(status,position)` with rollback, auto-scroll, drop-into-empty,
  inline add at column foot; pickup lift, others part, snappy drop + ring pulse;
  `overflow-x-auto` + snap-scroll on mobile. Dials V7/M8/D7.
- **Daily:** satisfying custom checkbox (draw-in check path) + DailyProgressRing
  ("5/8"); single calm centered column, inline "add a thing…" composer, DateStrip;
  enter-to-add, check optimistic, reorder, swipe-delete mobile; check = path draw +
  settle, completed drift to a done section. Lower motion than Kanban. Dials
  V6/M5/D4.
- **Leaderboard:** animated **podium** (1st taller/center, spring rise; accents
  from tokens, not `text-yellow-400`) + radial team-comparison (visx) for
  team-vs-team; podium band + RankingTable with 3 animated pillar bars; default
  team-vs-team/Overall; click team → member drilldown via framer `layoutId`
  shared-element morph; scope switch recomputes with count-ups. Dials V8/M8/D6.
- **Dashboard:** animated **burndown** (ideal vs actual, actual draws with
  pathLength, iris area) as hero in a **bento** layout (not a 2×2 chart-card grid)
  with velocity, bespoke StatusDonut (center total, not a recharts pie),
  PriorityBars, WorkloadByAssignee, BlockerSpotlight, count-up metric tiles; charts
  draw on scroll-into-view; click a segment → filter the board. Dials V7/M7/D7.
- **Members/Teams:** roster table with role as inline segmented control
  (owner-gated) + team color chip + a visually-distinct pending-invites lane; two
  regions (Members / Teams), teams as swatches with stacked avatars; role change
  optimistic+rollback (RLS-backed), invite dialog, drag member → team. Dials
  V5/M3/D7.
- **Announcements:** pinned banner distinct from a timeline-style feed (date rail),
  generous ~65ch measure, author+relative-time eyebrow; editor+ compose inline,
  pin toggle, edit/delete with undo; new item fadeUp at top. Dials V6/M3/D4.
- **LeetPing feed:** each event a compact problem chip (difficulty dot Easy jade /
  Med amber / Hard coral, title link, relative time) reading like a live stream;
  narrow feed + sticky team/member filter; ConnectGithubCard empty state distinct
  from connected-but-empty; "Sync now" spinner→toast; realtime prepend with a
  decaying iris highlight. Dials V6/M6/D6.

---

## §12 Engineering conventions (apply every phase)

- **Migrations only** for schema (`apply_migration`, named/versioned); never
  ad-hoc DDL via `execute_sql`. Regenerate + commit types after every change.
- **Data-access layer:** one module per entity in `lib/supabase/`; each function
  returns a typed `Result`, validates input/output with zod. UI never calls
  `supabase.from(...)` directly.
- **TanStack Query** for all reads/mutations; optimistic via the shared
  `useOptimisticMutation` (onMutate→cancelQueries→snapshot→patch→return ctx;
  onError→restore+toast; onSettled→invalidate). **Zustand** only for ephemeral UI
  state; never server data.
- **Validation everywhere** with shared zod schemas (form ⇄ data layer); map
  Supabase errors to fields via `mapSupabaseErrorToForm()`.
- **Errors** typed + surfaced via sonner + a global error boundary; no swallowed
  `catch {}` (the old silent `console.error` pattern is banned).
- **RLS-first:** the client hides for UX; RLS enforces for real; test both.
- **Colors via tokens only** — grep new files for hardcoded hex / raw tailwind
  color classes; must be zero. Respect `prefers-reduced-motion`, keyboard focus,
  AA contrast.
- **Toasts:** silent on optimistic success; toast only on errors, undoable
  destructive actions (with Undo), and out-of-band successes (invite sent, sync
  done). No "Task updated" spam.
- **Gate each phase:** `npm run gate` (build + typecheck + lint + test) + advisors.
- **Commit + push + comment style (§3.7):** commit at each sub-step and push the
  phase branch to origin after each commit; author = the repo owner only, **no
  `Co-Authored-By` trailers**; write commit messages and code comments in plain,
  natural English with no em dashes and no semicolons inside the prose, explaining
  the why, not the what.
- **Secrets:** publishable key in client `.env`; secret key + access token only in
  Edge Function / shell env, never committed (rotate before launch — §21).

---

## §13 THE PHASES

Each phase is a complete work order. Every phase also runs the Phase Start/End
protocols (§3.5) and satisfies the Master DoD (§16) — including updating
`CLAUDE.md` + `memory.md`, logging ADRs, unit-testing new logic, and committing on
the phase branch — before the "You verify" checklist is posted.

### PHASE 1 — Foundation, process scaffolding, design system, app shell
**Goal:** modern toolchain, the meta-doc system, the design language, and an
empty-but-beautiful app shell with routing. No features yet — the skeleton every
later phase fills.
**Depends on:** nothing.
**Ask once (then default):** product name (Arcflow vs Cheapzdo); React 18.3
(default) vs 19.
**Skills:** `npx impeccable install` → `/impeccable init` (author `PRODUCT.md` +
`DESIGN.md` from §11); install `frontend-design` + `taste-skill` (dials §11.1).
**Step 0 — bootstrap the process system:**
1. Create `CLAUDE.md` (§3.2) + `memory.md` (§3.3); `docs/ARCHITECTURE.md` (§3.8
   outline, seeded from §19) + empty `docs/decisions/`.
2. Seed `memory.md` Decision Log with the ADRs from §3.4.
3. `package.json` scripts: `typecheck`, `test`, `test:watch`, `gate`; install
   Vitest (+ jsdom, @testing-library/react), `eslint-plugin-jsx-a11y`.
4. Delete `bun.lockb` (ADR-0001); confirm `.gitignore` covers `.env*`, `dist`,
   `node_modules`, `supabase/.temp`, `*.local`; run the secret-scan grep.
5. Delete/rename stale `CODEBASE_CONTEXT.md` (superseded by ARCHITECTURE.md).
6. Confirm push access works (`git push --dry-run origin main`); if not, stop and
   ask the owner to finish the push setup (§3.7 prerequisite).
7. Commit `chore: bootstrap engineering process and docs scaffolding` on branch
   `phase-1-foundation`, then push it to origin.
**Build:**
1. Install libs: `framer-motion`, `@dnd-kit/core @dnd-kit/sortable
   @dnd-kit/utilities`, `zustand`, `@tanstack/react-table` (+ `@tanstack/
   react-virtual`), `@visx/*` (group/scale/shape/axis), `fractional-indexing`,
   `@fontsource/space-grotesk` `@fontsource/geist-sans`. Keep existing.
2. `DESIGN.md` + `lib/design/tokens.css`: fonts (remove `font-mono` from body),
   the §11.3 palette + dark+light themes (keep multi-theme architecture), scale/
   spacing/radius/elevation, and `motion.ts` (variants/springs/reduced-motion).
3. Restyle the core `components/ui/*` primitives listed in §11.6; delete unused.
4. **The four spines:** `motion.ts`, `useOptimisticMutation.ts`, `queryKeys.ts`,
   `usePermissions.ts` (stub role→capabilities until Phase 4).
5. App shell: `app/` providers (QueryClient, Theme via next-themes, Tooltip,
   Toaster, ErrorBoundary), router with all §6.3 routes as stubs, AuthedLayout/
   BoardLayout with sidebar/topbar (empty nav) + `authStatus:'loading'` skeleton,
   `<ComingSoon/>` per route, polished loading/empty/error states, CommandPalette
   + KeyboardShortcuts scaffolds. Zustand stores skeleton.
6. Set route-level `React.lazy` + Vite `manualChunks` (recharts/visx/dnd/framer)
   so the bundle warning doesn't return.
7. Remove `WeatherParticles`, `PasswordGate`, `AppContext`, `MainBoard`, old
   feature components from the render path (delete unless a later phase reuses
   logic). App compiles to a shell.
**Acceptance:** gate green; `/impeccable audit` clean; `DESIGN.md`/`PRODUCT.md`/
`CLAUDE.md`/`memory.md`/`ARCHITECTURE.md` committed; theme switch persists +
defaults dark; body font is NOT monospaced (headings Space Grotesk, only numbers
mono); reduced-motion calms the app; bundle chunks <500 kB; no `bun.lockb`.
**You verify:** `npm run dev` — shell looks distinctive (fonts/palette/motion on
load), theme toggle works, routes render placeholders, tab-key shows focus rings,
OS reduce-motion calms it. Screenshot only if type/color/motion reads generic.

### PHASE 2 — Database schema, RLS, security foundation
**Goal:** the entire §7 data model, RLS-secured, typed, with the bootstrap RPC —
before any auth/UI touches it. Backend-only.
**Depends on:** Phase 1.
**Build:** apply migrations `0001`–`0014` (§7) in order; delete
`supabase-schema.sql`; `generate_typescript_types` → `database.types.ts`; build
the typed data-access-layer stubs + zod schemas in `lib/supabase/` (no UI yet) +
`supabaseClient` (publishable key); write the RLS test script (§8).
**Acceptance:** `list_tables` = 16 tables all `rls_enabled:true`;
`list_migrations` shows the ordered set; **advisors security AND performance = 0
findings**; types compile; RLS matrix (§8) proven (non-member→0, viewer no-write,
editor write, daily private, cross-board WITH CHECK blocked, `create_board`
atomic, cross-board composite-FK rejected, last-owner protected). Record results
in `memory.md`.
**You verify:** nothing visual — review the advisor report + RLS matrix results;
confirm table/enum names before UI is built on them (renames get expensive after
Phase 3).

### PHASE 3 — Authentication & onboarding wizard
**Goal:** Supabase email auth w/ verification, sessions, guards, profiles, and the
create-board wizard (name → arc size → sprint length → optional team) calling
`create_board`.
**Depends on:** 1–2. **Skills:** `frontend-design`; `/impeccable onboard` + `shape`.
**Build:** Supabase config (document exact dashboard steps: enable email
confirmations, Site URL + redirect allow-list for local+prod, brand the confirm/
reset templates); auth screens (Signup/Verify/Login/Reset/UpdatePassword)
replacing PasswordGate, zod-validated; session layer (`onAuthStateChange`,
`useAuth`, sign-out); route guards (§6.3); profile edit + avatar upload (0012
bucket); the animated onboarding wizard with the live `ArcTimelinePreview`;
scaffold the accept-invite entry screen.
**Acceptance (add to base):** signup with an existing email → clear specific error
(no enumeration beyond Supabase defaults); unverified user cannot reach `/b/*`
(guard + RLS); wizard computes correct contiguous sprint dates (verify rows via
MCP: arc_size=5,len=14 → 5 sprints, no gaps/overlaps); invalid inputs rejected by
zod (arc_size 1–24, length 1–60); optional team step works or is explicitly
deferred; logged-out invitee path routes signup→accept; abandon-before-verify →
re-login offers resend.
**You verify:** sign up with your real email → verify → wizard → land on an empty
board; confirm the arc timeline updates live and dates are right; note if email
hits spam (→ prioritize SMTP in Phase 10).

### PHASE 4 — Boards, teams, members & access control (RBAC)
**Goal:** multi-board switching, board settings (incl. custom types/statuses),
teams (multiple), invitations by email, role assignment (owner/editor/viewer), and
role-aware UI — all enforced by RLS.
**Depends on:** 1–3. **Skills:** `frontend-design`; `/impeccable shape`+`critique`+
`harden`.
**Build:** Edge Functions `invite-member` + `accept-invite` (§10, deploy via
`deploy_edge_function`); board switcher + create-another-board; board settings
(owner: rename, arc size/length for future arcs, danger-zone delete, StatusEditor
+ TypeEditor with dnd reorder/color/icon-picker); teams CRUD + assign member;
members panel (roster via `board_roster`, role dropdown owner-only, remove
owner-only, pending invites resend/revoke); finalize `usePermissions()` → viewers
read-only, editors mutate, owners get member/settings/danger controls.
**Acceptance (add):** a viewer calling a mutating data-access fn directly (bypass
UI) is rejected by RLS (network-layer test, not just hidden buttons); role change
takes effect without the target re-logging-in (realtime membership or documented
refresh); **owner cannot demote/remove the last owner**; invite token single-use +
expiring + revoke-safe + already-member no-op; deleting a type/status in use is
blocked or reassigned (no dangling refs); create multiple teams + reassign members.
**You verify:** invite a throwaway as viewer, accept in incognito → can see, can't
edit; try an edit via devtools → RLS denies; promote to editor → can add a task;
create two teams + assign. Report anything that lets a viewer write.

### PHASE 5 — Arc Board (Epics) + Sprint Board (List + Kanban) + lifecycle
**Goal:** the flagship. Epics on the Arc Board; Tasks (one parent Epic) on the
Sprint Board with List + Kanban; sprint navigation; sprint rollover + start-new-arc
lifecycle; custom types/statuses; blockers; comments; task detail.
**Depends on:** 1–4. **Skills:** `frontend-design`; `/impeccable shape`+`animate`+
`craft`+`bolder`; taste dials high (spend the signature boldness here).
**Build:**
- **Arc Board:** epic list/gallery for the active arc + arc selector + **Backlog
  (no arc) bucket**; CRUD; type/status/priority/assignee/description; dnd reorder
  (fractional key); child-rollup ring from `epic_rollups`.
- **Sprint nav:** prev/next + dropdown, name + date range + active flag;
  create/edit sprints (owner/editor) with overlap validation.
- **List view (default):** TanStack Table + react-virtual; columns type/title/
  assignee/status/priority/tags/parent-epic; inline quick-edit; filters
  (search/type/status/assignee/priority/blocker) → URL; group-by; drag reorder.
- **Kanban view:** columns = statuses; dnd-kit multi-container → `move_task`
  (optimistic status+position, rollback); WIP cards; add-card inline; view toggle
  persisted (URL + Zustand).
- **Parenting:** creating a Task **requires** a parent Epic (UI disables submit +
  DB `NOT NULL`); re-parent to another epic on the same board; move between
  sprints; blocker flag.
- **Lifecycle:** sprint close → prompt "move incomplete tasks to next sprint"
  (no silent move); **Start new arc** action (arc size + length + start date
  defaults) creating arc + N sprints, activating it, carry-over unfinished epics.
- **Task detail panel:** full fields + description + comment thread; delete w/
  confirm. Retire AppContext/WorkItemList/Row/TaskCardModal.
**Acceptance (add):** every task has an `epic_id` (verify via MCP); Kanban drag
persists `status_id` + survives reload; keyboard drag works; 60+ reorders don't
corrupt order (fractional keys); List is default on first load, toggle persists;
epic rollup % keys off status **category**; blocker surfaces + filters;
Backlog-no-arc epics never disappear; sprint close + start-new-arc flows work;
re-parent same-board ok, cross-board rejected; viewer is read-only.
**You verify:** create epics + tasks; toggle List⇄Kanban (URL changes, survives
reload); drag a card across columns, reload → stuck; keyboard-drag; try as viewer.
Screenshot the Kanban if cards/motion feel generic.

### PHASE 6 — Daily board (private, checkable)
**Goal:** a private, self-created, satisfying rolling checklist per user per board.
**Depends on:** 1–5. **Skills:** `frontend-design`; `/impeccable delight`+`animate`
(calmer than Kanban).
**Build:** `daily_items` CRUD scoped to `auth.uid()` (RLS private); rolling list
(no cross-day auto-dup); delightful accessible checkbox; reorder (fractional);
DailyProgressRing ("5/8"); inline composer; empty state with direction.
**Acceptance (add):** a second user on the same board cannot see/mutate my dailies
(RLS network test); check toggles `is_done` optimistically with reduced-motion-safe
animation; no auto-duplication across days; all-checked → calm celebratory state.
**You verify:** add items, check them off (feel good? ring fills?), reload
(persists), confirm privacy across two accounts.

### PHASE 7 — Leaderboard + Dashboard analytics
**Goal:** team-vs-team + member-drilldown leaderboard (overall + per-sprint) and a
bespoke animated dashboard.
**Depends on:** 1–6. **Skills:** `frontend-design`; `/impeccable bolder`+`animate`+
`colorize`; taste motion high, legibility first.
**Build:** scoring via the `leaderboard()` RPC (§7) — the exact rate-based model;
**team score = average of members' /100** (exclude 0-assigned; tie-break
completion% then name); the four quadrants {Overall,Per-Sprint}×{Team-vs-Team,
Member-in-Team}; default team-vs-team/Overall with a path to "your team";
"Unassigned" bucket for team-less members; animated podium + radial comparison +
3-pillar table; dashboard bento — animated burndown/velocity, bespoke StatusDonut,
PriorityBars, WorkloadByAssignee, BlockerSpotlight, count-up tiles; optional
opt-in AI insights (OpenRouter).
**Acceptance (add):** all four quadrants reachable; team compare in both scopes,
member compare per-sprint (and overall if easy); scores match a hand-checked
example; all analytics compute off status **category** (verify with renamed custom
statuses); per-sprint filters by `sprint_id`, Overall = active arc's sprints;
division-by-zero guarded (0-assigned member); charts themed + reduced-motion-safe.
**You verify:** hand-verify one member's score; switch scope overall↔sprint and
team↔member; confirm numbers recompute + charts redraw. Screenshot any generic
chart.

### PHASE 8 — Announcements, realtime & global polish
**Goal:** announcements, live collaboration, full polish.
**Depends on:** 1–7. **Skills:** `frontend-design`; `/impeccable polish`+`critique`+
`harden`+`clarify`.
**Build:** announcements per board (editor+ CRUD, viewers read, attribution, pin);
realtime (§9) subscribe per active board to tasks/epics/sprints/announcements/
leetping/comments, reconcile into Query cache (ignore self-echoes, LWW, unsubscribe
on switch, refetch on reconnect); polish pass (consistent motion, shape-matched
skeletons everywhere, empty states, error boundaries + retry, toasts, ⌘K command
palette + local hotkeys + `?` cheatsheet, responsive audit incl. Kanban
snap-scroll, reduced-motion, focus management, microcopy via `clarify`);
**drag-to-reorder Kanban columns on the board itself** (user request 2026-07-06 —
order already editable via Settings → Statuses arrows; this adds direct
manipulation: a second draggable kind in the Kanban DndContext discriminated by
`data.type` (column vs task), `horizontalListSortingStrategy` for the column
row, and an atomic position renumber — either an RPC or the existing temp-slot
swap chain — persisted on drop, keyboard-drag included);
**color-coded statuses + priorities everywhere** (user request 2026-07-06 —
statuses already store a color; render status as a tinted pill (stored color at
low-alpha bg, full text) and priority with its semantic colors in: List view
cells, Kanban cards, task/epic detail sheets, and select triggers — a shared
`StatusPill`/`PriorityBadge` pair in `itemAtoms`, no plain-text statuses left).
**Acceptance (add):** two browsers on one board see changes within ~1s **without
duplicate toasts/flicker** (echo dedupe); no leaked channels on board switch;
reconnect refetches; every async surface has a skeleton + empty state; global
boundary catches a thrown render with retry; a11y/axe pass on key components.
**You verify:** two windows on one board, edit in one → other updates; post an
announcement; click around for jank/blank states. Screenshot rough edges.

### PHASE 9 — LeetPing (backend first)
**Goal:** the "X solved <problem>" feed from a member's LeetCode→GitHub repo.
**Depends on:** 1–8. **Skills:** `frontend-design` for the feed only.
**Build (backend first):** GitHub connect (OAuth **read-only** repo scope via
`github-oauth-exchange`; token in Vault; metadata in `github_connections`; pick
repo; privacy `share_to_boards` opt-in default OFF); `leetping-sync` Edge Function
(read commits → parse per-problem → upsert `leetping_events` deduped on
(board,user,commit_sha); pg_cron schedule + manual "Sync now"); graceful failure.
**Build (frontend):** feed ("Deepash solved *Two Sum* (Easy) · 2h ago" + link),
filter team/member, live via realtime; Connect GitHub + Sync now in profile.
**Acceptance (add):** connecting a test GitHub repo produces events; multi-problem
commit not dropped, duplicates ignored; token in Vault + NOT in a column or the
client bundle (grep); OAuth is read-only; privacy opt-in governs surfacing;
repo-gone/token-revoked/rate-limit degrade gracefully.
**You verify:** connect GitHub, point at your LeetCode repo, Sync now → feed
populates; re-sync makes no duplicates. (No repo yet? I'll seed sample events to
verify the UI.)

### PHASE 10 — Hardening, scale, deploy
**Goal:** production-ready — security-reviewed, performant, monitored, deployed.
**Depends on:** all. **Skills:** `/impeccable audit`+`harden` final sweep.
**Build:** full RLS matrix (member/non-member × 3 roles × every table) automated +
green; advisors security clean; **🔴 rotate the shared `sb_secret_…` + `sbp_…`**
(reissue, update Edge env + Mac-app MCP config; confirm only the publishable key is
in `dist/` via grep — §21); performance (indexes via advisors, keyset pagination
proven with N=1000 seed + `EXPLAIN`, Supavisor for pooling, TanStack cache tuning,
route code-split, bundle <500 kB gate); reliability (global boundary + Sentry,
production SMTP/Resend + branded templates, PITR/backup note, rate-limit sensitive
Edge Functions); deploy (Vercel: env = URL + publishable key only; Supabase prod
redirect URLs; smoke-test the full flow on the live URL; update README +
DEPLOYMENT.md; ensure CLAUDE.md/memory.md/ARCHITECTURE.md reflect final state).
**Acceptance (add):** RLS matrix automated + green; bundle contains only the
publishable key; secrets rotated + old ones revoked; pagination proven; docs
current.
**You verify:** run signup → board → invite → plan → daily → leaderboard on the
live URL. Final sign-off.

### Dependency graph
```
P1 → P2 → P3 → P4 ─┬─ P5 (arc+sprint)   ┐
                   ├─ P6 (daily)         │
                   ├─ P7 (leaderboard)   ├─ P10 (harden/deploy)
                   ├─ P8 (announce/rt)   │
                   └─ P9 (leetping)      ┘
```
P5–P9 can reorder after P4; the order above is recommended.

---

## §14 Key user flows (end-to-end)

**A — First run / onboarding:** open app (unauth) → guard → `/login` → Sign up
(email, password, display name) → verification email → `/verify` "check inbox" →
click link → verified → session (`handle_new_user` created the profile) → guard:
0 boards → `/onboarding` → step 1 name → step 2 arc size (live arc→sprint visual)
→ step 3 sprint length (date preview) → step 4 optional team → submit
`create_board` (atomic: board + owner + statuses + types + Arc 1 + N sprints [+
team]) → `/b/:id` Sprint Board (List), empty state "Add your first epic."

**B — Invite + accept:** owner → Members → Invite (email + role + optional team) →
`invite-member` Edge Function (token_hash stored, branded email with raw token) →
invitee clicks `/accept-invite?token=…` (logged out → signup/login then return) →
`accept-invite` → `accept_invite` RPC (validate hash/expiry/email-match, atomic
membership + mark accepted) → `/b/:id` with granted role; RLS enforces; owner sees
invite move to accepted (realtime/refresh).

**C — Plan an arc:** Arc Board (active arc default + Backlog bucket) → create Epics
(title, type from board's custom set, status, priority, assignee) → reorder
(fractional) → assign to the active arc or leave in backlog → (cycle end) "Start
new arc" (defaults prefilled) → new arc + sprints, activated, carry over unfinished
epics.

**D — Run a sprint (Kanban):** Sprint Board → sprint nav to active sprint → toggle
List(default)⇄Kanban → Add Task (**must pick a parent Epic**, type, status,
priority, assignee, tags, blocker?) → drag card across columns → optimistic
`move_task` (status+position) → survives reload → task detail (edit, re-parent
same-board, comments, blocker, move sprint, delete) → sprint end → prompted to move
incomplete tasks. Viewer sees read-only.

**E — Daily check-off (private):** Daily → add items (checkbox, no numeric index)
→ check/uncheck (optimistic, animated) → ring "5/8" updates → reorder/edit/delete →
private (no other user, even owner, sees it) → empty state "Add your first thing."

**F — Leaderboard:** default team-vs-team, Overall → podium + ranking (team score =
avg member /100, 3 pillars) → switch scope Overall↔sprint → click a team →
member-vs-member (framer shared-element morph) → team-less members under
"Unassigned" → empty state when no scored data.

**G — LeetPing:** Profile → Connect GitHub (read-only scope) → token in Vault →
pick sync repo → privacy opt-in → Sync now / scheduled → parse commits → upsert
events (deduped) → feed "X solved Y (Easy) · 2h ago"; live via realtime; graceful
"reconnect" on failure.

---

## §15 Edge cases & failure modes (specify + test)

**Empty states (each a designed screen, not bare text):** no boards, empty arc,
empty sprint, empty Kanban column, no daily items, no teams, no announcements,
empty leaderboard (no scored tasks), LeetPing not-connected vs connected-but-empty,
no members beyond owner, no-match-vs-truly-empty in filtered lists.

**Permission-denied:** viewer mutation via direct call → RLS denies → typed error
→ toast ("read-only access"); non-member navigates to a board URL → 0 rows /
"not found or no access" (don't leak existence); editor attempts owner-only action
→ denied.

**Concurrent edits:** two users drag the same task (LWW via `updated_at`; realtime
corrects the loser); two cards land on the same fractional key (re-space on next
reorder); owner changes a user's role mid-action (next mutation fails cleanly; UI
updates via realtime).

**Deletes (the dangerous ones):** deleting an **Epic with tasks** → RESTRICT +
"reparent or delete N tasks" dialog (`reparent_epic_tasks`); deleting a status/type
in use → block or reassign to default (no dangling refs); removing a member with
assigned tasks → set their tasks' assignee NULL (keep the work); deleting a team →
members become team-less (→ Unassigned; warn); deleting a sprint → tasks'
`sprint_id` NULL (surface as backlog); deleting an arc → cascades its sprints
(warn); deleting a board → double-confirm ("type the board name"), cascades only
that board.

**Auth/invite:** existing-email signup (clear error); expired reset link; session
expiry mid-form (re-auth, warn about unsaved input); expired/revoked/used invite
token; invite to existing member (no-op); email send failure (surface + resend);
verification email in spam (→ SMTP Phase 10).

**LeetPing:** repo private/renamed/deleted, token revoked, GitHub rate-limit/5xx
(backoff), malformed non-LeetCode commit (skip), multi-problem/duplicate commit,
user disconnects (stop ingestion; keep or purge per decision).

**Realtime/network:** channel disconnect/reconnect (refetch), stale cache after
reconnect, leaked subscriptions on switch, optimistic mutation while offline
(rollback + retry backoff), global boundary catches render crashes with retry.

**Data/validation:** oversized title/description (zod length limits), huge tag
arrays, pagination on large lists, malformed manual sprint dates (overlap/gap
validation), last-owner protection.

---

## §16 Master Definition of Done (EVERY phase — all must be true)

**Code & gates**
- [ ] `npm run build` succeeds · [ ] `npm run typecheck` clean · [ ] `npm run lint`
  clean (incl. jsx-a11y) · [ ] `npm run test` green — new pure logic (scoring/
  dates/position/parsing) unit-tested THIS phase
- [ ] advisors **security** = 0 · [ ] advisors **performance** = 0 (if schema touched)
- [ ] no hardcoded color literals in new components (grep); reduced-motion honored

**Database**
- [ ] new/changed tables have RLS on with correct **non-permissive** policies (+
  `WITH CHECK` on mutations) · [ ] schema via `apply_migration` (not `execute_sql`)
- [ ] types regenerated to `database.types.ts`, compiling, committed · [ ] any RLS
  change re-verified by the matrix, results in `memory.md`

**Documentation (continuity — non-negotiable)**
- [ ] `CLAUDE.md` updated (or explicitly confirmed unchanged) · [ ] `memory.md`:
  State-of-the-world overwritten + Phase Completion entry + new ADRs/open-questions/
  known-issues/gotchas · [ ] `ARCHITECTURE.md` updated if data flow/auth/RLS/
  realtime/deploy changed · [ ] decisions logged as ADRs with rationale +
  alternatives

**Version control**
- [ ] work + docs committed together on the phase branch, conventional messages,
  plain-English (no em dashes / no semicolons in prose), **no `Co-Authored-By`
  trailer** · [ ] branch **pushed to origin** · [ ] no secrets, no second
  lockfile; secret-scan grep clean

**Handoff**
- [ ] phase "You verify" checklist handed over + 3-line change summary + run
  instructions · [ ] agent STOPPED (did not start the next phase)

---

## §17 Risk register (top 10)

L/I = Likelihood/Impact (Low/Med/High).

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| 1 | **RLS misconfig → cross-tenant leak** (the entire security model) | Med | **High** | advisors every phase; RLS matrix (§8); helpers w/ `search_path`; no `USING(true)`; `WITH CHECK` on all mutations; composite FKs; peer-review policy migrations |
| 2 | **Leaked secret keys** (`sb_secret_…`/`sbp_…` shared in chat/config) | **High** | **High** | **rotate before launch** (§21); only publishable key in the bundle; `.env*` gitignored; secrets in Edge env only |
| 3 | Realtime fan-out exceeds tier limits | Med | High | subscribe to active board + needed tables only; reconcile not refetch; unsubscribe on nav; Broadcast path (§9); load-test |
| 4 | Client bundle bloat (SPA + heavy libs, no SSR) | **High** | Med | route `React.lazy` + `manualChunks`; lazy chart/table/DnD; piecemeal visx/Radix; prune shadcn; bundle-size gate |
| 5 | SPA auth-token XSS | Med | High | no `dangerouslySetInnerHTML` (sanitize comments/desc); CSP/headers; SDK token storage; short-lived + refresh |
| 6 | Migration mistakes / schema drift | Med | High | migrations-only; one concern each; regen+commit types; advisors after each; atomic `create_board`; test on branch; PITR |
| 7 | Connection exhaustion (no pooler) | Med | High | Supavisor transaction mode; Edge uses pooled; Query caching cuts round-trips |
| 8 | Optimistic ⇄ realtime races | Med | Med | idempotent reconcile by id+`updated_at`; ignore self-echoes; keep rollback; LWW |
| 9 | Email deliverability (default sender rate-limited) | **High** | Med | production SMTP/Resend + branded templates + SPF/DKIM/DMARC (Phase 10); test spam early |
| 10 | Vendor lock-in + agent-driven inconsistency | Med | Med | confine Supabase to the data layer (one seam); enforce conventions via per-entity layer + shared zod + "no server data in Zustand" + the phase gate |

Honorable mentions: LeetPing ingestion cost/GitHub limits; zod v3 & React 18 both
"N-1" (planned isolated upgrades); Tailwind purge stripping dynamic color classes
(use CSS vars/safelist); dnd-kit perf ceiling on huge boards (→ Atlassian
Pragmatic DnD); a11y regressions when restyling Radix (re-test focus/ARIA).

---

## §18 Scale & cost (thousands of users)

- **Postgres/data:** scales if indexed (0011) + paginated (keyset). RLS adds
  per-query cost — kept cheap by `STABLE` SECURITY DEFINER helpers +
  `board_members(user_id)` index; verify hot paths with `EXPLAIN` (Phase 10).
- **Connections:** route through **Supavisor** (transaction mode); Edge Functions
  never open direct connections — the classic serverless-Postgres failure.
- **Realtime:** concurrent connections + messages/sec are tier-bound and the first
  wall; subscribe narrowly, reconcile into Query, unsubscribe on nav; Broadcast for
  scale (§9); load-test before launch.
- **Edge Functions:** per-invocation time/memory limits + cold starts; LeetPing
  polling is the scaler — batch, dedup, schedule sensibly, rate-limit.
- **Storage:** avatars small + CDN-cached (constrain upload size).
- **Auth email:** default sender rate-limited → production SMTP required.
- **Vercel:** static CDN scales trivially; cost = bandwidth (bundle × users) →
  code-split.

**Cost drivers (ranked):** (1) Supabase compute/DB tier as data+query load grows;
(2) realtime connections/messages; (3) Edge invocations (LeetPing); (4)
transactional email; (5) Vercel bandwidth. Bundle discipline + narrow realtime are
the two biggest levers. Verify current quotas against your Supabase plan before
launch.

---

## §19 Architecture in one page (seed for ARCHITECTURE.md)

Arcflow is a **multi-tenant, realtime, RLS-secured team board** — "our own sharper
Jira." It's a **Vite + React 18 SPA** (TypeScript strict, Tailwind + CSS-variable
tokens, Framer Motion). There is **no app server of our own**: the browser talks
straight to **Supabase** (Postgres + Auth + Realtime + Edge Functions + Storage +
Vault) holding only the **publishable** key + the user's JWT.

**Security is in the database, not the UI.** Every table carries `board_id`, and
**RLS** gates all access by board membership + role (owner/editor/viewer) via
SECURITY DEFINER helpers. Route guards and hidden buttons are *UX only*; RLS is the
real boundary. The **secret** key never reaches the browser — server-side work
(invites, LeetPing) runs in **Edge Functions**; GitHub tokens live in **Vault**;
avatars in **Storage**. Schema is versioned migrations; after every change we run
the **security + performance advisors** and regenerate TypeScript types.

**On the client, data flows through one typed layer.** Each entity has a module in
`src/lib/supabase/` that wraps Supabase calls, validates in/out with **zod**, and
returns typed results — UI never calls `supabase.from()` directly. **TanStack
Query** owns all server state (caching, pagination, optimistic + rollback, and
reconciling **Realtime** events). **Zustand** holds only ephemeral UI state (active
board, view mode, filters, theme) — never server data. Forms use **react-hook-form
+ zod**, reusing the data layer's schemas.

**The UI is headless-first so it looks distinctive, not templated.** **Radix**
(restyled shadcn source we own) provides accessible behavior; **dnd-kit** powers
Kanban + list reorder (writing a fractional `position`, optimistic `status_id`);
**TanStack Table** powers the List view; **visx** (+ restyled recharts for routine
charts) powers the signature leaderboard/burndown/velocity visuals. Motion is
purposeful and reduced-motion-aware.

**Feature layout** (`src/features/*`) mirrors the domain: auth, onboarding, boards,
members, arc (epics), sprint (tasks: list + kanban), daily (private), leaderboard,
dashboard, announcements, leetping. Routes: `/b/:boardId/{arc,sprint,daily,
leaderboard,dashboard,announcements,leetping,settings}`. Deploys as static assets
on **Vercel**; Supabase is the backend. Build is gated by build + typecheck + lint
+ test + advisors every phase.

**The two rules a new engineer must internalize:** (1) server data lives in
TanStack Query, UI flags in Zustand — never cross them; (2) never trust the client
for security — RLS is the gate; the client only hides things for UX.

---

## §20 Open decisions (defaults chosen; override anytime)

- **Product name:** Arcflow (default) vs keep "Cheapzdo".
- **React:** 18.3 (default) vs 19.
- **Default work-item types:** Feature/Bug/Chore/Research/Design (editable per board).
- **Priority:** fixed enum (default; scoring depends on it) vs custom later.
- **Daily rollover:** rolling list (default) vs per-day + carry-over.
- **LeetPing scoping:** all the user's boards (default) vs a chosen board; privacy
  opt-in default OFF.
- **Announcements:** board-wide, editor+ (default) vs team-scoped later.
- **AI insights:** keep OpenRouter as opt-in (default) vs drop.
- **Realtime tech:** Postgres Changes (default, Phase 8) vs Broadcast (scale, Phase 10).

---

## §20b Post-v1 feature backlog (user-requested, build after Phase 10)

Ordered by recommended build sequence. Full sketches in `memory.md` FEATURE
BACKLOG. Recommendation: do item 1 (onboarding) first since it is small and
fixes a live first-run pain point, then the admin console (item 2) as the
biggest-value feature, then friends (item 3).

1. **[DO FIRST, small] Onboarding without a forced board** (requested
   2026-07-06) — today a signed-in user with no boards is bounced straight to
   the full-screen `/onboarding` wizard (`HomeRedirect` in
   `src/app/guards.tsx` sends `list.length === 0` to `/onboarding`). That
   forces board creation as the very first act and makes people feel they are
   mid-task or making a mistake. Change it to a calm landing.

   **Behaviour:**
   - Board-less users land on a new **Home** screen inside the normal app
     chrome (under `AuthedLayout`), not the wizard. A friendly empty state: a
     short greeting, one line on what a board is (an arc of sprints for a
     team), a primary "Create your first board" button, and a secondary
     "accept an invite" hint. Nothing forced, they can look around first.
   - Users with boards keep landing on their board (today's behaviour).
     **Open question:** when they have several boards, jump to the first or
     show a boards list — recommend jump-to-first for one, a small list for
     many.
   - Turn the onboarding wizard into a **create-board dialog** launched from
     the CTA and reused by the sidebar "new board" action, so creating a board
     is an action, not a gate. Keep the arc-size and sprint-length inputs.

   **Start the first sprint when they choose (no rush):**
   - Add an optional start date to board creation. `create_arc` already takes
     `p_start date`, but `create_board` does not, so a new migration extends it
     to `create_board(p_name, p_arc_size, p_sprint_length, p_start date default
     current_date)` and passes it through to the seeded arc and sprints.
     Backward compatible (defaults to today).
   - The dialog offers gentle presets: start today, start tomorrow, start
     Monday, or a date picker. For a brand-new user default the first sprint to
     **tomorrow** so day one is not already half gone. A default, not a hard
     rule.

   **Scope:** one migration (create_board start-date passthrough) plus types
   regen, one new Home screen, a guard/router change (HomeRedirect stops
   forcing the wizard), and refactoring the wizard into a dialog. No RLS or
   security changes. Small to medium, one sitting.

2. **[HIGHEST] Admin console** (requested 2026-07-06) — a superadmin account and
   an `/admin` screen that manages and tracks the whole app from inside the app
   (no more poking the Supabase dashboard). Designed for 100k users from day one.

   **Security model (the crux — do not shortcut):**
   - `app_admins` table (`user_id PK → profiles`, `role text default
     'superadmin'` reserved for a future support tier, `granted_by`,
     `granted_at`). A **separate table, not a column on profiles** — profiles
     are self-updatable, so a role column there would be a privilege-escalation
     hole. **No client write policies at all**; the first admin is inserted by
     a migration/SQL by the owner, deliberately.
   - `is_app_admin()` SECURITY DEFINER helper (same pattern as
     `is_board_member`).
   - **Do NOT sprinkle `or is_app_admin()` into existing RLS policies** (too
     easy to accidentally widen writes). Instead: every admin capability is an
     explicit **`admin_*` SECURITY DEFINER RPC** that first checks
     `is_app_admin()` then queries/mutates without RLS. The admin surface stays
     enumerable, auditable, and normal-user policies stay untouched.
   - `admin_audit_log` (append-only: admin_id, action, target_type, target_id,
     detail jsonb, created_at, indexed by created_at). **Every admin RPC writes
     a row.** Superpower with a paper trail.
   - Auth-level operations (ban/unban, delete account, force password reset)
     need the auth admin API → an `admin-ops` **Edge Function** (service role)
     gated on `is_app_admin()`, same audit logging.
   - User **impersonation is deliberately out of v1** (highest-risk feature);
     start with a read-only inspector. If ever added: magic-link generation via
     the auth admin API, heavily audited, time-boxed sessions.

   **The `/admin` screen** (route guarded by an `is_app_admin` RPC check —
   hidden nav for everyone else, enforced server-side regardless):
   - **Overview:** total users / boards / teams / tasks / epics / events,
     signups last 7/30 days, boards created, most-active boards, storage use.
   - **Users tab:** paginated, searchable (email + handle) list via
     `admin_list_users` (joins auth.users for email/last-sign-in — data the
     client can never see otherwise): display name, boards count, created,
     last sign-in. Actions: view their boards, ban/unban, force reset, delete
     account (blocked while they own boards — transfer first).
   - **Boards tab:** paginated list via `admin_list_boards`: name, owner,
     member/task counts, created, last activity. Actions: read-only inspector,
     transfer ownership, delete board (type-name confirm).
   - **Audit tab:** the admin_audit_log, filterable.
   - **Config (later):** the already-provisioned plan limits (`boards.plan`,
     `max_teams`, `max_members`) get their enforcement switches here.

   **Built for 100k users from the start:**
   - Every list is a **keyset-paginated server-side RPC** — never "load all
     users". Search hits indexed columns (auth.users email, profiles.handle).
   - Counts come from aggregate RPCs (fine at 100k with indexes); growth
     charts come from a nightly **`admin_daily_stats` rollup** (date,
     new_users, new_boards, active_users, tasks_created) filled by pg_cron —
     O(1) chart reads at any scale.
   - Audit log append-only with a retention policy decision deferred.
   - Admin traffic is tiny (a handful of admins) — no rate limiting needed,
     but everything logged.

   **Build order when picked up:** A1 read-only (app_admins + helper + audit
   log + stats RPCs + overview + users/boards lists) → A2 management actions
   (admin-ops Edge Function: ban, delete, transfer, board delete, all with
   confirmations) → A3 scale layer (rollup table + charts + plan-limit
   controls + support-role tier).

3. **[HIGH] Friend system** (expanded 2026-07-06) — add the people you work
   with as friends so inviting them to a board is a picker, not a copied link.

   **Prerequisite, handles:** `profiles.handle` already exists but is nullable,
   so not everyone has one. Friend search needs stable public handles, so first
   make sure every user has a unique handle (backfill existing rows from
   display_name or the email local part, and set one at signup). Small
   migration plus a signup tweak.

   **Data model:** `friendships` (id, requester_id, addressee_id, status enum
   pending/accepted/blocked, created_at, responded_at). Block duplicate and
   mirror-image rows with a unique index on the ordered pair
   `least(requester,addressee), greatest(requester,addressee)`. Index both user
   columns.

   **RLS:** a row is visible only to its two users. Only the addressee can move
   pending to accepted or decline. Either side can delete an accepted
   friendship (unfriend). The requester can cancel a pending one. Blocking
   hides the other user and stops new requests. WITH CHECK on every mutation,
   same rigour as the board tables.

   **Discovery:** `search_users(q text)` SECURITY DEFINER RPC (profiles are
   shared-board-only readable, so a definer RPC is required) returning only
   safe public fields (id, handle, display_name, avatar_url) for handle or name
   matches, case-insensitive, capped near 20, excluding self and anyone already
   a friend or blocked.

   **Actions:** send request, accept, decline, cancel, unfriend, block, as
   RLS-guarded writes or small RPCs. Optional realtime on a per-user channel so
   incoming requests appear live, otherwise refetch on open.

   **Board integration:** `invite_friend(p_board, p_friend, p_role)` SECURITY
   DEFINER RPC (owner only) that drops an existing friend straight into a board
   with no copy-link token. Token-link invites (ADR-0013) stay for people who
   are not users yet.

   **UI:** a Friends screen (search, incoming and outgoing requests, friends
   list) and an "add a friend" picker inside the board members panel. Nav entry
   guarded like the rest.

   **Scope:** medium. Handle backfill migration, `friendships` table and RLS,
   `search_users` and `invite_friend` RPCs, a Friends feature folder, and the
   members-panel picker. Depends only on the handle prerequisite. Live messaging
   (item 5) depends on this.

4. **[MEDIUM — ship together with the SMTP/Resend setup] Branded email
   templates** (requested 2026-07-06) — replace the default plain Supabase
   emails with professional, on-brand templates so the first thing a new user
   sees looks like a product, not a database.
   - **Which emails:** signup confirmation, password reset, email change
     (Supabase Auth → Authentication → Emails → Templates, HTML with the Go
     template variables like `{{ .ConfirmationURL }}`), plus the **board invite
     email** once Resend lands (sent by the future `invite-member` Edge
     Function per ADR-0013 — same visual system).
   - **Design:** one shared email shell in the Arcflow language — the "A" logo
     mark, the iris accent on a light background (dark-mode-friendly colors,
     never rely on images loading), a single clear CTA button, plain-text
     fallback line with the raw link, and a quiet footer ("You're receiving
     this because…"). Email reality: **table-based layout, fully inlined CSS,
     web-safe font stack** (emails can't load Space Grotesk — use
     system-ui/Arial with matching weights), max-width ~560px, tested in
     Gmail, Outlook, and Apple Mail before shipping.
   - **Where the source lives:** keep the HTML sources in the repo under
     `emails/` (they're pasted into the Supabase dashboard, but the repo stays
     the source of truth; the invite template is consumed by the Edge
     Function directly).
   - **Deliverability:** goes live with DEPLOYMENT.md step 3 (Resend + domain
     verification + SPF/DKIM) — a beautiful template in spam is worthless, so
     these ship as one unit.
5. **[LOW] Live messaging** — board/team channels + DMs between friends
   (depends on #3), Supabase Realtime delivery, `messages` table with keyset
   history, RLS by membership/friendship. Only after Phase 8 realtime is proven.

(Shared team dailies, previously listed here, shipped in Phase 8.)

---

## §21 🔴 Security note — rotate the shared keys before launch

During setup, the **Supabase secret key** (`sb_secret_…`) and the **personal
access token** (`sbp_…`) were pasted into chat and written to local config
(`~/Library/Application Support/Claude/claude_desktop_config.json`,
`Cheapzdo/.env`). These are powerful. Before production (Phase 10, or sooner if the
repo is pushed):
1. Rotate/reissue both in the Supabase dashboard.
2. Update the Mac-app MCP config + any Edge Function env with the new values.
3. Confirm the **publishable key** is the ONLY Supabase key in the client bundle
   (`grep dist/ -rE "sb_secret_|sbp_"` → empty), and `.env*` stay gitignored.
4. **Rotate the GitHub fine-grained PAT** (`github_pat_…`) that was pasted in chat
   and stored at `.git/.git-credentials` (repo-local, keychain disabled). Revoke
   it at github.com/settings/personal-access-tokens and reissue, or remove it once
   pushing is no longer needed. It grants Contents write to this repo.
The publishable key (`sb_publishable_…`) is safe to ship; the Supabase secret key,
the Supabase access token, and the GitHub PAT are not.

---

*End of plan (v2). Say "go phase 1" to begin.*
