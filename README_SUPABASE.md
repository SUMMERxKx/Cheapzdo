# Quick Start with Supabase

## What Changed?

The app now uses **Supabase** (PostgreSQL database) instead of localStorage. This means:
- ✅ Data is stored in the cloud
- ✅ Works across devices/browsers
- ✅ Data persists even if you clear browser cache
- ✅ Same simple password gate (no complex auth)

## Setup (5 minutes)

### 1. Install Supabase package
```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait ~2 minutes for it to initialize

### 3. Get your credentials
In Supabase dashboard → Settings → API:
- Copy **Project URL**
- Copy **anon/public key**

### 4. Run the database schema
1. In Supabase dashboard → SQL Editor
2. Open `supabase-schema.sql` from this project
3. Copy and paste into SQL Editor
4. Click "Run"

### 5. Create `.env` file
In the project root, create `.env`:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 6. Start the app
```bash
npm run dev
```

That's it! The app will automatically:
- Connect to Supabase
- Initialize with default data if database is empty
- Load all your data from the cloud

## Password

Still the same: `lockin2024`

## Fallback Mode

If Supabase isn't configured (no `.env` file), the app will:
- Show a warning in console
- Use default data (won't persist)
- Still work for testing

## Need Help?

See `SUPABASE_SETUP.md` for detailed instructions.

