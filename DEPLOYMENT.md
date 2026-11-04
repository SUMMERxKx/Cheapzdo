# Deployment

## Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in SQL Editor
3. Get credentials from Settings → API

## Environment Variables

Create `.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BOARD_PASSWORD=your_password
```

## Deploy

### Vercel
1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Netlify
1. Push to GitHub
2. Import repository in Netlify
3. Add environment variables in Site settings
4. Deploy
