# CODEBASE_CONTEXT

## Project and navigation

Cheapzdo is a React 18 and TypeScript single-page task board built with Vite,
Tailwind, shadcn/ui, Radix, Lucide and Recharts. The workspace has Announcements,
Dashboard, Sprint Board and Daily tabs. Dashboard is the default. Arc Board and
Leaderboard have been removed. Existing task tags are preserved as ordinary tags.

`src/main.tsx` mounts `App.tsx`, whose providers wrap the router. `pages/Index.tsx`
mounts `AppProvider` and switches between PasswordGate and MainBoard.
`context/AppContext.tsx` owns domain state, Supabase loading and optimistic CRUD.
React Query is installed but domain access uses context directly.

## Persistence and schema

The browser talks directly to Supabase using `lib/supabase.ts`. Core tables are
`people`, `sprints`, `work_items`, `comments`, `announcements` and `work_item_types`.
The dormant bulletin board domain still uses `boards` and `board_notes`, separate
from the removed Arc task tab. RLS policies currently allow all operations.

`types/index.ts` mirrors database records in camelCase. Important conventions:

- People have `id`, `name`, optional `handle` and optional `email`.
- Work items have title, type, state, priority, optional assignee/sprint/parent,
  tags, description, comments, order, optional `pingOnAssign` and `groupId`.
- Daily tasks carry the `Daily` tag. Sprint tasks match the active sprint and
  exclude Daily tasks. Blockers carry the `Blocker` tag.
- Parent tasks can contain child tasks through `parent_id`.
- Types come from `work_item_types`, with built-in defaults and an Other fallback.
- Groups have `id` and `name` in `task_groups`. `work_items.group_id` references
  them with `ON DELETE SET NULL`. Deleting a group preserves its tasks.
- Most IDs use timestamp strings. Task groups and email event IDs use UUIDs.

`supabase-schema.sql` is the schema for fresh installs. Existing owners apply
`migrations/20261113_email_and_task_groups.sql` in the Supabase SQL Editor before
deploying. It adds email, ping preference and groups idempotently, then refreshes
PostgREST's schema cache. No remote Supabase commands are part of development.

Loads tolerate missing new fields and a missing groups table. Saves that encounter
missing-column errors retry legacy task/person fields. A quiet migration note
explains that the new fields are kept for this visit only until SQL is applied.
Persistence otherwise retains the app's optimistic behavior and logs failures.

## Authentication and server endpoints

Authentication is a shared password gate, not Supabase Auth. Data is loaded or
seeded only after the password check succeeds. `BOARD_PASSWORD` stays on the server.
The React authentication state is memory-only and refresh requires login again.

`api/board-login.ts` calls `server/board-login.ts`. POST checks the password using
timing-safe hashes and issues an eight-hour HMAC-signed HttpOnly, SameSite=Strict
cookie scoped to `/api`. Cookies are Secure on Vercel/HTTPS. The signature derives
from the private board password. `server/board-session.ts` validates the cookie's
signature and expiry. DELETE clears the cookie on logout.

`api/assign-email.ts` calls `server/assign-email.ts`. It requires that same signed
board session before parsing a bounded JSON request. It validates task ID, event
ID, recipient email, title, board, priority, description and HTTP(S) app URL.
It sends plain text through Resend's HTTPS API using server-only `RESEND_API_KEY`
and `RESEND_FROM`. No new SDK is needed. Missing variables return
`status: not_configured`, surfaced as a quiet board note. Failures do not undo an
assignment. An event ID becomes a Resend idempotency key. A process-local guard
limits a task/recipient pair to one send a minute and total sends to 30 per minute
per instance. It is basic protection, not a distributed quota.

`vite.config.ts` exposes the same login and email handlers in dev and preview.
Local Resend values come from the shell environment. Vercel bundles the `api/`
functions. `vercel.json` deploys the default branch only.

## People, tasks and groups

Dashboard uses `PeopleManager.tsx` for adding, renaming, editing handles/emails
and deleting people. Optional email inputs and context mutations validate basic
email shape. Task creation (`AddWorkItemDialog`, `AddChildItemDialog`) and editing
(`TaskCardModal`) show Ping on assign only for an assignee with email.

AppContext sends email on task creation or an assignee change only when the new
assignee has email and the task's ping preference is on. Enabling ping by itself,
unassigning and unrelated edits do not send. A copied task retains its ping
preference and can send as a new assignment. Email side effects run
outside React state updater callbacks to avoid duplicate sends during replay.

`MainBoard.tsx` filters Sprint tasks and hosts SprintNavigation. `Daily.tsx` passes
Daily tasks into the shared `WorkItemList.tsx`. `WorkItemRow.tsx` supports task
selection, nested children, task actions, state and priority, and drag order.
`TaskCardModal` receives the current task from context so saves do not use stale
assignment or ping data.

WorkItemList selects top-level tasks, creates named groups, moves selected tasks
into another visible board group or removes them from a group. `TaskGroupRow.tsx`
renders a collapsible table row with name, count, done progress, rename and ungroup
controls. Local storage key `cheapzdo-group-<id>` remembers expansion per device.
Tasks retain all their fields and children. Filters match member tasks and hide
groups with no matches. Progress counts all top-level members on the current board.
Group membership follows a task between sprints.

## Other features

- Dashboard computes aggregate task charts, blockers and team statistics.
- Announcements supports add, edit and delete.
- SprintNavigation manages sprint dates, selection and creation.
- WorkItemTypeManager manages task type icons and colors.
- ThemeContext stores `cheapzdo-theme` in local storage and sets the HTML theme
  attribute. Chinese New Year is the default, with transform-based lanterns.
- Header supports a locally stored subtitle and logout.
- PeopleManager is active in Dashboard. NavLink remains unused.

## AI

`lib/ai.ts` calls OpenRouter from the browser. `VITE_OPENROUTER_API_KEY` enables
AI task generation on Sprint and Daily and AI insights in Dashboard. Without it
those controls are hidden or disabled. AppContext builds prompts, validates
responses and exposes generateAITask and generateAIInsights. Components live in
`components/ai/`. There is no AI tab. Insights send a compact task/person/sprint
snapshot without descriptions or comments. AI output is not persisted until a
user accepts a generated task.

## Environment and verification

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configure public Supabase access.
  Without them the app uses default people/sprints and memory-only changes.
- `BOARD_PASSWORD` is required for login and session verification.
- `RESEND_API_KEY` and `RESEND_FROM` are optional private server configuration.
  Set them in Vercel settings, never in source or `.env` files. Resend requires a
  verified domain to send beyond the account owner's own address.
- `VITE_OPENROUTER_API_KEY` enables the existing browser-side AI features.

`npm test` runs Node tests with TypeScript stripping for login and the email
endpoint. Resend is mocked. `npm run test:password` retains the login-only suite.
`npx tsc -b` checks app, API and server types. `npm run build` builds the frontend.
`npm run lint` also covers existing AI helpers and UI primitives with known
pre-existing lint errors. README includes SQL upgrade and Resend setup instructions.
