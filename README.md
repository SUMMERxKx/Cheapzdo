# Cheapzdo Task Board

A personal task management board for friends - built with React, TypeScript, and Supabase.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run `supabase-schema.sql`
4. Get your credentials from Settings → API

### 3. Configure Environment
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BOARD_PASSWORD=your_password
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Password
Password is configured via `VITE_BOARD_PASSWORD` environment variable.

## Features

- Dashboard: Overview with graphs and statistics
- Sprint Board: Manage tasks with sprints
- Announcements: Post and manage announcements
- Task Types: Study, Gym, Sports, Running, Entertainment, Other
- People Management: Add and remove team members
- Sprint Management: Create, edit, and delete sprints
- Task Management: Full CRUD with descriptions and comments

## Database Schema

The app uses Supabase (PostgreSQL) with the following tables:
- `people` - Team members
- `sprints` - Sprint definitions
- `work_items` - Tasks and items
- `comments` - Comments on work items
- `boards` - Bulletin boards (for future use)
- `board_notes` - Notes on boards (for future use)
- `announcements` - Announcements

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- date-fns
- recharts

## License

Private project
