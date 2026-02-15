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

4. Run dev server:
```bash
npm run dev
```

## Features

- **Dashboard** — Statistics and team overview
- **Sprint Board** — Sprint-based task management with drag-and-drop, child tasks, and blockers
- **Daily Board** — Simplified daily task view (no blockers, no state/priority/tags columns)
- **Announcements** — Team announcements and updates
- **People management** — Manage team members and assignees
- **Task types** — Study, Gym, Sports, Running, Entertainment, Other

### Tab Navigation

All views live under a single-page tabbed interface:

| Tab | Description |
|-----|-------------|
| Announcements | Team announcements and updates |
| Dashboard | Analytics and team overview |
| Sprint Board | Full-featured sprint task management |
| Daily | Simplified daily task board |

### Weather / Season Themes

The app includes 7 weather and season themes, each with a unique color palette and animated particle effects. The selected theme is persisted in `localStorage`.

| Theme | Accent | Particles |
|-------|--------|-----------|
| Default | Dark crimson | None |
| Rainy | Steel-blue | Rain drops |
| Snowy | Cool white-blue | Snowflakes |
| Sunny | Golden amber | Sun rays |
| Winter | Icy cyan | Snowflakes |
| Autumn | Burnt orange | Falling leaves |
| Spring | Cherry-blossom pink | Floating petals |

Use the theme switcher button in the header (palette icon) to switch between themes.

## Architecture

```
src/
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── Header.tsx           # App header with theme switcher and logout
│   ├── MainBoard.tsx        # Tabbed layout (Announcements, Dashboard, Sprint, Daily)
│   ├── Daily.tsx            # Daily board content (DailyContent component)
│   ├── Dashboard.tsx        # Dashboard analytics
│   ├── Announcements.tsx    # Announcements view
│   ├── WorkItemList.tsx     # Task list with filtering, sorting, drag-and-drop
│   ├── WorkItemRow.tsx      # Individual task row
│   ├── SprintNavigation.tsx # Sprint selector (previous/next/create/edit/delete)
│   ├── ThemeSwitcher.tsx    # Theme dropdown selector
│   ├── WeatherParticles.tsx # Animated weather particle overlay
│   └── ...
├── context/
│   ├── AppContext.tsx        # Main app state (tasks, sprints, people, auth)
│   └── ThemeContext.tsx      # Theme state and persistence
├── pages/
│   └── Index.tsx            # Entry page (auth gate + MainBoard)
├── index.css                # Theme CSS variables, particle animations
└── App.tsx                  # Root component (providers, routing)
```

### Key Design Decisions

- **Daily as a tab, not a route** — The Daily board is rendered inside the Index page tab system rather than as a separate `/daily` route. This keeps navigation simple and state shared.
- **Task separation** — Sprint tasks are filtered by `sprintId` and exclude the `"Daily"` tag. Daily tasks are filtered by the `"Daily"` tag regardless of sprint.
- **No blockers on Daily board** — The Daily board hides the "Add Blocker" option to keep the view simplified. Blockers remain available on the Sprint Board.
- **Theme via CSS variables** — Each theme overrides the full set of HSL CSS custom properties via `[data-theme="..."]` selectors, so every shadcn/ui component adapts automatically.
- **Particle animations** — Weather effects use CSS `@keyframes` with fixed-position overlays and `pointer-events: none` so they never interfere with interaction.

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Supabase
