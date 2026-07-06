# Deployment

Arcflow is a static Vite build on Vercel with Supabase as the backend. Project
ref: `qjcpzozqzhsuveuytwlo`.

## 1. Vercel

1. Go to vercel.com, Add New, Project, and import the GitHub repo
   `SUMMERxKx/Cheapzdo` (framework preset Vite, defaults are fine,
   `vercel.json` in the repo handles SPA rewrites, security headers, and asset
   caching).
2. Environment variables (Production and Preview):
   - `VITE_SUPABASE_URL` = `https://qjcpzozqzhsuveuytwlo.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the publishable key from the Supabase
     dashboard (API Keys page). Never put the secret key here.
3. Deploy, then note the production domain.

## 2. Supabase auth URLs

Dashboard, Authentication, URL Configuration:
- Site URL: the production domain, for example `https://arcflow.vercel.app`
- Redirect URLs: add `https://<production-domain>/**` and keep
  `http://localhost:8080/**` for local work.

## 3. Production email (SMTP)

The default Supabase sender is rate limited and lands in spam. Before inviting
real users: create a Resend account (or any SMTP provider), verify a domain,
then in Supabase go to Authentication, Emails, SMTP Settings and fill in the
host, port, user, and password from the provider. Customize the confirmation
and reset templates under Authentication, Emails, Templates. Use the branded
email templates from the backlog (implementation.md section 20b item 3) so the
first email a user gets looks like Arcflow, not a default.

## 4. Hardening toggles

- Authentication, Passwords: enable leaked password protection.
- Optional: add a `GITHUB_TOKEN` secret to the `leetping-sync` edge function
  (Edge Functions, leetping-sync, Secrets) to raise GitHub API rate limits.

## 5. Secret rotation (required before going public)

These credentials were used during development and must be rotated:
1. Supabase secret key (`sb_secret_...`): dashboard, API Keys, create a new
   secret key and revoke the old one. Nothing in the app uses it directly,
   edge functions get their own service role injection.
2. Supabase personal access token (`sbp_...`): account settings, Access Tokens,
   revoke and reissue. Update the local MCP config with the new value.
3. GitHub fine grained PAT (`github_pat_...`): github.com settings, Fine
   grained tokens, revoke. Reissue only if automated pushes are still wanted.

## 6. Smoke test

On the production URL run through: sign up, verify email, create a board,
invite a second account by link, add an epic and tasks, drag on the kanban,
check the daily and leaderboard, post an announcement, connect LeetPing and
sync. Two windows on one board should sync live.

## Notes

- Backups: the Supabase free tier keeps daily backups. For production consider
  Pro with point in time recovery.
- At real scale route database access through the Supavisor pooler and consider
  the realtime Broadcast pattern, see implementation.md section 9.
