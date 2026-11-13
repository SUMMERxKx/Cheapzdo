# Cheapzdo Task Board

Task management board built with React, TypeScript, and Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Run `supabase-schema.sql` in SQL Editor
   - Get credentials from Settings → API

3. Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
BOARD_PASSWORD=your_password
```

The board password is checked by `/api/board-login` on the server. Keep
`BOARD_PASSWORD` private and use the Secret type in Vercel. The Supabase URL and
public key use Config. The local Vite server also provides the login endpoint.
See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting instructions.

4. (Optional) AI features - add an [OpenRouter](https://openrouter.ai) API key to enable AI task generation and board insights:
```
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

5. Run dev server:
```bash
npm run dev
```

## Features

- **Dashboard** - Statistics, team overview, and AI Trends & Insights (when API key is set)
- **Sprint Board** - Sprint-based task management with drag-and-drop, child tasks, blockers, and AI task creator
- **Daily Board** - Simplified daily task view (no blockers, no state/priority/tags columns) with AI task creator
- **Announcements** - Team announcements and updates
- **People management** - Manage team members and assignees
- **Task types** - Study, Gym, Sports, Running, Entertainment, Other
- **Customizable header** - Editable festive subtitle next to the logo (e.g. “Year of the Horse”), persisted in `localStorage`

### Tab Navigation

All views live under a single-page tabbed interface:

| Tab | Description |
|-----|-------------|
| Announcements | Team announcements and updates |
| Dashboard | Analytics, team overview, and AI Insights panel |
| Sprint Board | Full-featured sprint task management + AI Generate |
| Daily | Simplified daily task board + AI Generate |

### Weather / Season Themes

The app includes 8 themes, each with a unique color palette and optional animated particle effects. The selected theme is persisted in `localStorage`. **Chinese New Year** is the default theme.

| Theme | Accent | Particles |
|-------|--------|-----------|
| Chinese New Year | Red & gold | Floating lanterns |
| Default | Dark crimson | None |
| Rainy | Steel-blue | Rain drops |
| Snowy | Cool white-blue | Snowflakes |
| Sunny | Golden amber | Sun rays |
| Winter | Icy cyan | Snowflakes |
| Autumn | Burnt orange | Falling leaves |
| Spring | Cherry-blossom pink | Floating petals |

Use the theme switcher in the header to switch between themes.

### AI Features (optional)

When `VITE_OPENROUTER_API_KEY` is set:

- **AI Generate** - On Sprint Board and Daily Board, an “AI Generate” button opens a dialog. Describe a task in natural language. The AI returns a structured preview (title, type, priority, assignee, sprint, tags). Accept to add the task, or regenerate/edit.
- **AI Insights** - On the Dashboard tab, the “AI Trends & Insights” panel lets you choose scope (current sprint, whole board, or a specific sprint), then generates a summary, risks, blockers, workload imbalance, momentum, and recommendations.

AI calls use OpenRouter (e.g. DeepSeek with a free fallback). No backend required; keys and usage are client-side only.

## Architecture

```
src/
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── ai/
│   │   ├── AITaskCreator.tsx   # AI task generation dialog (Sprint/Daily)
│   │   └── AIInsightsPanel.tsx # AI board insights (Dashboard)
│   ├── Header.tsx           # App header, theme switcher, editable subtitle, logout
│   ├── MainBoard.tsx        # Announcements, Dashboard, Sprint and Daily tabs
│   ├── Daily.tsx            # Daily board content
│   ├── Dashboard.tsx        # Dashboard analytics + AI Insights
│   ├── Announcements.tsx    # Announcements view
│   ├── WorkItemList.tsx     # Task list with filters, drag-and-drop, AI Generate
│   ├── SprintNavigation.tsx # Sprint selector
│   ├── ThemeSwitcher.tsx    # Theme dropdown
│   ├── WeatherParticles.tsx # Animated particle overlay (GPU-optimized)
│   └── ...
├── context/
│   ├── AppContext.tsx       # App state, CRUD, AI methods (generateAITask, generateAIInsights)
│   └── ThemeContext.tsx     # Theme state and persistence
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── ai.ts                # OpenRouter API wrapper (queryAI, isAIConfigured)
├── pages/
│   └── Index.tsx            # Entry page (auth gate + MainBoard)
├── types/
│   └── index.ts             # WorkItem, Person, Sprint, AI types, etc.
├── index.css                # Theme variables, particle keyframes
└── App.tsx                  # Root (providers, routing)
```

### Key Design Decisions

- **Daily as a tab** - Daily board is inside the main tab system. Tasks with the `"Daily"` tag are shown there. Sprint Board shows tasks by `sprintId` and excludes `"Daily"` tag.
- **No blockers on Daily** - “Add Blocker” is hidden on the Daily board. Blockers stay on the Sprint Board.
- **Theme via CSS variables** - Each theme sets HSL custom properties under `[data-theme="..."]`. shadcn components pick them up automatically.
- **Particle performance** - Lanterns and other particles use transform-only animations, `will-change: transform`, and `contain: layout paint` to keep the Chinese New Year theme smooth.
- **AI in context** - All AI logic (prompts, validation, OpenRouter calls) lives in `AppContext`. Components only call `generateAITask` / `generateAIInsights`.

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Supabase, OpenRouter (optional)

## Assignment email with Resend

1. Create an account at [Resend](https://resend.com) and create an API key.
2. In the Vercel project, open Settings > Environment Variables. Set `RESEND_API_KEY` and `RESEND_FROM` for the environments you deploy to. Use a sender address allowed by Resend.
3. Redeploy after setting these variables. Keep the key on the server. Never put it in frontend variables, code, `.env` files or the repository.
4. Resend can send to people other than the account owner only after you verify a domain with Resend. Until then, test mail can go only to the owner's own address.

Add or edit a person in Dashboard > Team Members and enter their optional email.
The task creation and editing forms show **Ping on assign** when the chosen person has an email.
Enable it before assigning or reassigning a task to send the title, board, priority,
description and an app link. Enabling it alone, unrelated edits and unassigning do
not send mail. A copied task keeps its ping preference and sends if it has an assignee with email.

The `/api/assign-email` Vercel function requires the signed, HttpOnly board session
issued by `/api/board-login`. Sessions last eight hours. Log in again if the email
session expires. Logout clears the cookie. Resend uses an assignment event key to
avoid duplicate delivery on retries. A process-local guard also limits repeat mail
for the same task and recipient to once a minute, with a cap of 30 per minute per
function instance. These limits are basic protection, not a distributed quota.

Without the Resend variables, assignments still work and the board shows a quiet
"Email not set up" note. Failed email sends also leave the assignment in place.
The local Vite middleware exposes the same endpoints. Local email configuration
can be passed through the shell environment without writing a secret file.

## Database upgrade before deployment

For an existing database, open the Supabase project > SQL Editor > New query.
Paste the full contents of [migrations/20261113_email_and_task_groups.sql](migrations/20261113_email_and_task_groups.sql)
and click Run. Confirm success before deploying this branch to Vercel.
The migration is idempotent and adds `people.email`, `work_items.ping_on_assign`,
`task_groups` and `work_items.group_id`, plus the group index and policy.
New installations can run `supabase-schema.sql`, which includes the same changes.
No Supabase CLI login, remote command or access token is needed.

If deployed before the migration, ordinary task and person saves retry with the
old fields. Email addresses, ping preferences and groups remain available for the
current visit, with a migration note, but do not persist until the SQL is applied.

## Task groups

On Sprint Board or Daily, select task checkboxes, enter a group name and choose
**Group selected**. A collapsed row shows the name, task count and done progress.
Expand it to view tasks, use **Rename** to change its name or **Ungroup** to remove
the group while keeping its tasks. Select tasks and use **Move to group** to move
them into another group on that board or remove them from a group.
Each device remembers expanded groups in local storage. Filters apply to tasks
inside groups and show how many match. Tasks retain their assignee, priority,
state and child tasks. Group membership travels with tasks moved between sprints.

## Validation

Run `npm test`, `npx tsc -b` and `npm run build`. The server tests mock Resend and
cover login requirements, missing configuration, payload validation and repeat sends.
