# CODEBASE_CONTEXT

## 1. Project Overview

`Cheapzdo Task Board` is a single-page React application for lightweight team/task coordination. It combines sprint planning, daily task tracking, announcements, analytics, and a leaderboard in one authenticated dashboard.

Primary user profile:
- Small teams or groups coordinating personal/professional tasks
- Users who need fast task editing with minimal workflow overhead

Primary problem solved:
- Keep all team execution signals (tasks, sprint context, blockers, announcements, and performance ranking) in one shared board without a complex backend app layer.

Product behavior at a glance:
- Password gate before board access
- Tabbed workspace with `Announcements`, `Dashboard`, `Sprint Board`, `Daily`, `Leaderboard`
- Supabase-backed persistence for all core entities
- Optional theme system with weather/season visual effects


## 2. Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build/dev server)
- Tailwind CSS + `tailwindcss-animate`
- shadcn/ui + Radix UI primitives
- Lucide icons
- Recharts (dashboard visualizations)
- Sonner + Radix Toast (notifications)
- React Router (`/` + `*`)

### State / Data Access
- Custom React Context state store (`AppContext`)
- Supabase JS client (`@supabase/supabase-js`)
- React Query provider is present, but app data flow is context-driven (React Query not used for domain fetch/mutation logic)

### Database
- Supabase Postgres
- Schema defined in `supabase-schema.sql`
- RLS enabled with permissive policies (`FOR ALL USING true`)

### Deployment Tooling
- Vercel / Netlify guidance in `DEPLOYMENT.md`
- Static build output via `vite build`


## 3. Architecture Overview

High-level architecture:
1. Browser loads SPA (`src/main.tsx` -> `src/App.tsx`)
2. App initializes providers (`QueryClientProvider`, `ThemeProvider`, `TooltipProvider`)
3. Router serves index page at `/`
4. `Index` mounts `AppProvider` (global domain state)
5. `AppProvider` bootstraps Supabase + in-memory state
6. UI tabs consume and mutate state via `useApp()`
7. Mutations update local state optimistically, then persist to Supabase

Interaction model:
- **No custom backend server** (no Express/Nest/controllers in repo)
- Frontend talks directly to Supabase tables through JS client in `AppContext`
- Data shaping (DB row -> frontend types) is done in context load functions

Core architectural decision:
- Treat `AppContext` as the application service layer (state store + command layer + persistence adapter).


## 4. Folder Structure Explanation

Top-level (major files/folders):
- `src/` - all application source
- `supabase-schema.sql` - DB schema + indexes + RLS + policies
- `DEPLOYMENT.md` - deployment instructions
- `README.md` - user-facing setup/features docs
- `vite.config.ts` / `tailwind.config.ts` / `tsconfig*.json` - build/style/type config

Inside `src/`:
- `App.tsx` - root provider composition and routing
- `main.tsx` - React mount entry
- `index.css` - design tokens, theme variants, weather animations, UI fixes
- `types/index.ts` - shared domain interfaces and enums
- `context/`
  - `AppContext.tsx` - main app state, bootstrapping, CRUD actions, Supabase persistence
  - `ThemeContext.tsx` - current theme + persistence to localStorage
- `lib/`
  - `supabase.ts` - Supabase client initialization from env vars
  - `utils.ts` - `cn()` class merging helper
- `pages/`
  - `Index.tsx` - auth gate and main board entry
  - `NotFound.tsx` - fallback route
- `components/`
  - Feature components (`MainBoard`, `WorkItemList`, `TaskCardModal`, `Dashboard`, `Announcements`, `Leaderboard`, etc.)
  - `ui/` contains reusable shadcn/Radix wrappers

Notable currently-unused/dormant pieces:
- `components/PeopleManager.tsx` and `components/NavLink.tsx` exist but are not wired into current route/tab flow.
- Board/board-note domain exists in state/persistence but no active UI tab currently uses it.


## 5. Data Model

Defined in `supabase-schema.sql` and mirrored in `src/types/index.ts`.

### Tables

1. `people`
- `id` (TEXT PK)
- `name` (required)
- `handle` (optional)
- `created_at`

2. `sprints`
- `id` (TEXT PK)
- `name`
- `is_active` (boolean)
- `start_date` (BIGINT epoch ms)
- `end_date` (BIGINT epoch ms)
- `created_at`

3. `work_items`
- `id` (TEXT PK)
- `title`, `type`, `state`, `priority`
- `assignee_id` -> `people.id` (nullable, `ON DELETE SET NULL`)
- `tags` (TEXT[])
- `parent_id` -> `work_items.id` (`ON DELETE CASCADE`) for nested child tasks
- `sprint_id` -> `sprints.id` (nullable, `ON DELETE SET NULL`)
- `description`
- `created_at` (BIGINT)
- `order` (INTEGER for drag-ordering top-level items)
- `updated_at`

4. `comments`
- `id` (TEXT PK)
- `work_item_id` -> `work_items.id` (`ON DELETE CASCADE`)
- `text`
- `author_id` -> `people.id` (nullable)
- `created_at` (BIGINT)

5. `boards` (bulletin board domain)
- `id`, `name`, `created_at`

6. `board_notes` (bulletin board notes)
- `id`, `board_id`, `title`, `content`, `x`, `y`, `color`, `created_at`
- FK `board_id` -> `boards.id` (`ON DELETE CASCADE`)

7. `announcements`
- `id`, `title`, `description`, `created_at`

### Relationships
- One person can own many work items
- One sprint can contain many work items
- One work item can have many child work items (self-referencing tree)
- One work item can have many comments
- One board can have many board notes

### Important conventions
- IDs are generated client-side with timestamp-based strings (`wi-${Date.now()}`, etc.)
- Daily tasks are identified by tag `"Daily"` (not separate table)
- Blockers are represented by tag `"Blocker"`


## 6. API Layer

There is no internal REST/GraphQL controller layer in this repository.

API behavior is direct Supabase table access from `AppContext`.

### Request flow pattern
1. UI component calls a context action (`addWorkItem`, `deleteSprint`, etc.)
2. Context updates in-memory React state (usually optimistic)
3. Context executes Supabase mutation (`upsert`, `insert`, `delete`, `update`)
4. Errors are logged; optimistic state is generally retained

### Supabase operations by domain
- `people`: load, upsert, delete
- `sprints`: load, upsert, delete
- `work_items`: load, upsert, delete, bulk update for assignee/sprint nulling
- `comments`: load, insert, delete by work item
- `boards`, `board_notes`: load/upsert/delete
- `announcements`: load/upsert/delete

### Bootstrapping APIs
- `initializeDatabase()` checks key tables and seeds defaults if empty
- `loadDataFromSupabase()` loads all domain tables and maps DB shape -> app shape


## 7. State Management

State is centralized in `src/context/AppContext.tsx`.

### Core state (`AppState`)
- `workItems`, `people`, `sprints`, `activeSprint`
- `boards`, `boardNotes`, `activeBoard`
- `announcements`
- `isAuthenticated`
- plus provider-local `isLoading`

### Mutation model
- Actions are exposed via context value (add/update/delete/reorder/auth/navigation helpers)
- Most mutations are optimistic:
  - update React state immediately
  - then persist asynchronously to Supabase

### Read model
- Components consume via `useApp()`
- Most component-level derived state is computed with `useMemo` (filters, chart data, leaderboard scoring)

### Theming state
- Separate `ThemeContext` tracks selected theme
- Persists to localStorage key `cheapzdo-theme`
- Sets `data-theme` on `<html>`


## 8. Authentication Flow

Authentication is a simple password gate; it is not Supabase Auth.

Flow:
1. `Index.tsx` checks `isLoading` and `isAuthenticated`
2. If unauthenticated, render `PasswordGate`
3. `PasswordGate` calls `authenticate(password)` from context
4. Context compares against env password:
   - `VITE_BOARD_PASSWORD` fallback `BOARD_PASSWORD`
5. On success, sets in-memory `isAuthenticated=true`
6. Logout sets `isAuthenticated=false`

Session/token model:
- No JWT/cookie/session persistence layer
- Auth state is in-memory only (resets on refresh)

Permissions:
- No role-based authorization
- Database RLS policies are fully permissive currently


## 9. Key Features and How They Work

### A. Tabbed Main Workspace
- **What it does:** Renders the app’s primary sections in one page
- **Files:** `components/MainBoard.tsx`, `components/ui/tabs.tsx`
- **Data flow:** `MainBoard` reads `workItems` + `activeSprint`; passes filtered arrays into feature components by tab

### B. Sprint Board (Task Table + Drag Reorder)
- **What it does:** Full task management for current sprint with nested child tasks, blockers, filters, modal editing
- **Files:** `WorkItemList.tsx`, `WorkItemRow.tsx`, `TaskCardModal.tsx`, `AddWorkItemDialog.tsx`, `AddChildItemDialog.tsx`, `WorkItemFilters.tsx`
- **Data flow:** 
  - `MainBoard` filters sprint tasks (`sprintId===activeSprint` and not `Daily`)
  - `WorkItemList` filters/sorts top-level tasks
  - `WorkItemRow` renders rows recursively for children
  - mutations call context (`updateWorkItem`, `reorderWorkItems`, etc.)

### C. Daily Board
- **What it does:** Simplified board view for daily tasks
- **Files:** `Daily.tsx`, `WorkItemList.tsx`, `WorkItemRow.tsx`
- **Data flow:**
  - Tasks filtered by tag `"Daily"` only
  - UI hides state/priority/tags columns
  - new daily tasks auto-tagged `"Daily"` in `AddWorkItemDialog`
  - blocker add option is hidden in daily row actions

### D. Sprint Navigation Management
- **What it does:** Move between sprints, create/edit/delete sprint, show sprint date range
- **Files:** `SprintNavigation.tsx`, `AppContext.tsx`
- **Data flow:** nav actions call context (`navigateToNextSprint`, `addSprint`, etc.); context toggles `is_active` flags and persists

### E. Task Detail Modal
- **What it does:** Inline editing of all major task fields plus comments
- **Files:** `TaskCardModal.tsx`
- **Data flow:** user changes fields -> `updateWorkItem`; comment creation -> `addComment`

### F. Dashboard + Team Analytics
- **What it does:** charts and stat cards (active, done, blockers, distribution), plus person management
- **Files:** `Dashboard.tsx`
- **Data flow:** computes aggregates from `workItems`/`people`; person CRUD calls context

### G. Announcements
- **What it does:** CRUD announcements feed with add/edit/delete dialogs
- **Files:** `Announcements.tsx`
- **Data flow:** `announcements` list from context; actions call `addAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`

### H. Leaderboard (Overall + Per Sprint)
- **What it does:** ranks users with fair score model, podium + detailed table
- **Files:** `Leaderboard.tsx`
- **Data flow:**
  - optional sprint filter (`Overall` or selected sprint)
  - score computed from assigned tasks only using three normalized pillars:
    - Completion Rate (50)
    - Priority Impact (30)
    - Momentum (20)
  - renders top-3 podium and full ranked table

### I. Theming + Weather Effects
- **What it does:** 7 themes with tokenized colors + animated visual overlays
- **Files:** `ThemeContext.tsx`, `ThemeSwitcher.tsx`, `WeatherParticles.tsx`, `index.css`
- **Data flow:** theme selection updates `data-theme` attribute; CSS variable sets + particle classes drive visuals


## 10. Environment Variables

Used variables:

1. `VITE_SUPABASE_URL`
- Used in `lib/supabase.ts` and guards in `AppContext`
- Defines Supabase project URL

2. `VITE_SUPABASE_ANON_KEY`
- Used in `lib/supabase.ts`
- Public anon key for client-side Supabase access

3. `VITE_BOARD_PASSWORD`
- Used in `AppContext` auth check
- Primary password gate value

4. `BOARD_PASSWORD` (fallback)
- Also checked in `AppContext`
- Fallback source if `VITE_BOARD_PASSWORD` missing

Behavior when Supabase env missing:
- App logs warning and continues with default/local in-memory behavior


## 11. Deployment Flow

Build/deploy process:
1. Install dependencies (`npm install`)
2. Configure env vars in deployment platform
3. Build with `npm run build` (Vite static bundle)
4. Host static output on Vercel or Netlify

Runtime dependencies:
- Frontend must access Supabase directly from browser
- Deployment platform must inject `VITE_*` variables at build/runtime as needed

From repo docs:
- `DEPLOYMENT.md` provides Vercel/Netlify steps
- Database must be initialized by running `supabase-schema.sql`


## 12. Known Constraints and Assumptions

1. **No backend service layer**
- Business logic and persistence orchestration live in frontend context

2. **Authentication is lightweight**
- Single shared password, no user identity/session persistence

3. **Permissive database security**
- RLS policies currently allow all operations

4. **Optimistic updates without reconciliation**
- State often updates first; failures log errors but do not always rollback

5. **No realtime subscriptions**
- No Supabase realtime listeners; data refresh depends on local mutations or reload

6. **Type strictness intentionally relaxed**
- `tsconfig` disables strict checks (`strict: false`, noImplicitAny false, etc.)

7. **Client-side ID generation**
- Timestamp-based IDs may collide in extreme concurrent scenarios

8. **Dormant board domain**
- `boards`/`board_notes` persisted but no active UI tab currently exposes this feature

9. **App.css legacy**
- `src/App.css` contains scaffold styles and is not part of active UI path


## 13. Developer Mental Model

Think of this project as:
- A **single-page operations cockpit** driven by one context store
- A **direct-to-database client app** (Supabase as data backend, no middle tier)
- A **feature-first component tree** where tabs are the top-level domain boundaries

How to reason effectively:
1. Start at `App.tsx` -> `pages/Index.tsx` -> `context/AppContext.tsx`
2. Treat `AppContext` as the source of truth for:
   - data loading
   - persistence
   - domain actions
3. For any feature bug, trace:
   - tab entry component
   - called context action
   - Supabase table mapping in context
4. For UI-only changes (theme/layout/animations), check `index.css`, `ThemeContext`, and feature component classes
5. For data integrity issues, inspect:
   - conversion logic in `loadDataFromSupabase()`
   - optimistic mutation actions
   - SQL constraints in `supabase-schema.sql`

Practical onboarding sequence:
1. Read `types/index.ts`
2. Read `AppContext.tsx` (load/init + actions)
3. Read `MainBoard.tsx` for app navigation model
4. Read `WorkItemList`/`WorkItemRow` for core task workflow
5. Read `Leaderboard.tsx` and `Daily.tsx` for recent domain rules

