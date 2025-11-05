# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `topi-gang-board` (or any name)
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string)

## Step 3: Run the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

1. In the project root, create a file named `.env`:
   ```bash
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Replace the placeholders with your actual values from Step 2

**Example:**
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
```

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 6: Start the App

```bash
npm run dev
```

The app will:
- Connect to Supabase
- Initialize the database with default data if empty
- Load all data from Supabase
- Work exactly like before, but with cloud storage!

## Troubleshooting

### "Supabase not configured" warning
- Make sure your `.env` file exists in the project root
- Make sure the variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating/updating `.env`

### Database errors
- Make sure you ran the `supabase-schema.sql` file in the SQL Editor
- Check that all tables were created (people, sprints, work_items, comments)

### Data not loading
- Check the browser console for errors
- Verify your Supabase credentials are correct
- Make sure Row Level Security policies are set (they should allow all operations)

## Security Note

The `anon` key is safe to use in the frontend. Supabase Row Level Security (RLS) policies control access. The current setup allows all operations, which is fine for a simple password-protected app. You can restrict this later if needed.

## Password

The password is still `lockin2024` (hardcoded, no Supabase auth needed).

