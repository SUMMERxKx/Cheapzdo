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
VITE_BOARD_PASSWORD=your_password
```

4. (Optional) AI features — add an [OpenRouter](https://openrouter.ai) API key to enable AI task generation and board insights:
```
VITE_OPENROUTER_API_KEY=your_openrouter_key
```

5. Run dev server:
```bash
npm run dev
```

## Features

- **Dashboard** — Statistics, team overview, and AI Trends & Insights (when API key is set)
- **Sprint Board** — Sprint-based task management with drag-and-drop, child tasks, blockers, and AI task creator
- **Daily Board** — Simplified daily task view (no blockers, no state/priority/tags columns) with AI task creator
- **Leaderboard** — Team rankings by fair rate-based score (completion, priority impact, momentum), with per-sprint or overall view
- **Announcements** — Team announcements and updates
- **People management** — Manage team members and assignees
- **Task types** — Study, Gym, Sports, Running, Entertainment, Other
- **Customizable header** — Editable festive subtitle next to the logo (e.g. “Year of the Horse”), persisted in `localStorage`

### Tab Navigation

All views live under a single-page tabbed interface:

| Tab | Description |
|-----|-------------|
| Announcements | Team announcements and updates |
| Dashboard | Analytics, team overview, and AI Insights panel |
| Sprint Board | Full-featured sprint task management + AI Generate |
| Daily | Simplified daily task board + AI Generate |
| Leaderboard | Team performance rankings (per sprint or overall) |

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

- **AI Generate** — On Sprint Board and Daily Board, an “AI Generate” button opens a dialog. Describe a task in natural language; the AI returns a structured preview (title, type, priority, assignee, sprint, tags). Accept to add the task, or regenerate/edit.
- **AI Insights** — On the Dashboard tab, the “AI Trends & Insights” panel lets you choose scope (current sprint, whole board, or a specific sprint), then generates a summary, risks, blockers, workload imbalance, momentum, and recommendations.

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
│   ├── MainBoard.tsx        # Tabbed layout (Announcements, Dashboard, Sprint, Daily, Leaderboard)
│   ├── Daily.tsx            # Daily board content
│   ├── Dashboard.tsx        # Dashboard analytics + AI Insights
│   ├── Leaderboard.tsx      # Team rankings (podium + table, sprint filter)
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

- **Daily as a tab** — Daily board is inside the main tab system; tasks with the `"Daily"` tag are shown there. Sprint Board shows tasks by `sprintId` and excludes `"Daily"` tag.
- **No blockers on Daily** — “Add Blocker” is hidden on the Daily board; blockers stay on the Sprint Board.
- **Theme via CSS variables** — Each theme sets HSL custom properties under `[data-theme="..."]`; shadcn components pick them up automatically.
- **Particle performance** — Lanterns and other particles use transform-only animations, `will-change: transform`, and `contain: layout paint` to keep the Chinese New Year theme smooth.
- **AI in context** — All AI logic (prompts, validation, OpenRouter calls) lives in `AppContext`; components only call `generateAITask` / `generateAIInsights`.

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Supabase, OpenRouter (optional)
