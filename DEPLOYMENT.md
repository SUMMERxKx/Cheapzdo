# Deployment Checklist for Cheapzdo Task Board

## ✅ Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Create Supabase account at https://supabase.com
- [ ] Create a new project
- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Verify all tables are created:
  - `people`
  - `sprints`
  - `work_items`
  - `comments`
  - `boards`
  - `board_notes`
  - `announcements`
- [ ] Get your credentials from Settings → API:
  - Project URL
  - Anon/Public Key

### 2. Environment Variables
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BOARD_PASSWORD=your_password_here
```

**Note:** 
- Vite requires the `VITE_` prefix for environment variables that are accessed in client-side code
- In deployment platforms (Vercel/Netlify), you can set `BOARD_PASSWORD` and it will be available as `VITE_BOARD_PASSWORD` in the build

### 3. Build & Test
```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Deployment Options

#### Option A: Vercel (Recommended)
1. Push code to GitHub
2. Go to https://vercel.com
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BOARD_PASSWORD` (or `BOARD_PASSWORD` - Vercel will map it)
5. Deploy

#### Option B: Netlify
1. Push code to GitHub
2. Go to https://netlify.com
3. Import your GitHub repository
4. Add environment variables in Site settings
5. Deploy

#### Option C: GitHub Pages
1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages
3. Note: You'll need to configure environment variables differently

### 5. Post-Deployment
- [ ] Test password login (use password from `VITE_BOARD_PASSWORD` env var)
- [ ] Verify data persists (create a task, refresh page)
- [ ] Test all features:
  - [ ] Create/edit/delete tasks
  - [ ] Create/edit/delete sprints
  - [ ] Add/edit/delete announcements
  - [ ] Add/edit/delete people
  - [ ] Add comments to tasks

## 🔒 Security Notes

- The password is configured via `VITE_BOARD_PASSWORD` environment variable
- Supabase RLS policies allow all operations (simple setup)
- For production, consider:
  - Setting a strong password via environment variable
  - Adding rate limiting
  - Restricting RLS policies if needed

## 📝 Important Files

- `supabase-schema.sql` - Run this in Supabase SQL Editor
- `.env` - Contains Supabase credentials (DO NOT COMMIT)
- `package.json` - Dependencies
- `vite.config.ts` - Build configuration

## 🐛 Troubleshooting

### Data not loading?
- Check browser console for errors
- Verify Supabase credentials in `.env`
- Check Supabase dashboard for table creation
- Verify RLS policies are set correctly

### Build errors?
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (should be 18+)
- Clear `node_modules` and reinstall if needed

### Supabase connection issues?
- Verify your project URL and anon key
- Check Supabase project status
- Verify network connectivity

