# Arcflow

A team planning board in the class of Jira and Azure DevOps, but sharper. Teams
plan in **arcs** (a cycle of equal length sprints), work flows from **epics** on
the Arc Board down to **tasks** on the Sprint Board, and every member gets a
private **daily** checklist plus a shared team one. A competitive leaderboard,
live realtime sync, announcements, and a LeetCode activity feed round it out.

Built on React 18, TypeScript strict, Vite, Tailwind, TanStack Query and Table,
dnd-kit, Framer Motion, and Supabase (Postgres with row level security, Auth,
Realtime, Edge Functions).

## Features

- **Arc Board.** Epics with live progress rings, an arc selector with a backlog
  bucket, and a one click "start new arc" that spins up the next cycle.
- **Sprint Board.** A list view (sortable, inline edits, drag to reorder rows
  and rearrange columns) and a kanban view (drag cards across custom status
  columns, drag the columns themselves). Sprint navigation with a close sprint
  flow that carries unfinished work forward.
- **Every task has exactly one parent epic**, enforced by the database.
- **Daily.** A private personal checklist nobody else can read, and a shared
  team lane where items are assigned to members.
- **Leaderboard.** Team vs team by default (average of member scores), drill
  into any team, per sprint or overall. Rate based scoring, so more tasks never
  means more points.
- **Dashboard.** Burndown, status donut, priority bars, workload, blockers.
- **LeetPing.** Connect a public LeetCode sync repo (LeetHub style) and every
  accepted solution shows up on the board feed.
- **Roles.** Owner, editor, viewer per board, enforced by RLS, not just the UI.
- **Six themes.** Dark, light, cherry blossom, retro, neon, winter snow.

## Development

```bash
npm install
npm run dev        # http://localhost:8080
npm run gate       # build + typecheck + lint + test
```

Create `.env` with the Supabase project values:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Only the publishable key ever ships to the browser. Row level security is the
real boundary, the client just hides things for UX.

## Repo guide

- `implementation.md` — the master build plan, phase by phase.
- `CLAUDE.md` — operating manual for the codebase.
- `memory.md` — decision log and project history.
- `docs/ARCHITECTURE.md` — how the system fits together.
- `supabase/functions/` — edge functions (leetping-sync).
- `DEPLOYMENT.md` — production deploy steps.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Short version: static Vite build on Vercel,
Supabase as the backend, `vercel.json` handles SPA rewrites and headers.
