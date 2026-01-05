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

- Dashboard with statistics
- Sprint Board for task management
- Announcements
- People management
- Task types: Study, Gym, Sports, Running, Entertainment, Other

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase
