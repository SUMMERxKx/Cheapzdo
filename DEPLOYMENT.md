# Deployment

## Setup

For a new project, run `supabase-schema.sql` in the Supabase SQL Editor. The
existing project has already been reset for the historical Cheapzdo schema.

## Environment Variables

| Name | Value | Vercel type |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Config |
| `VITE_SUPABASE_ANON_KEY` | Supabase public publishable or anon key | Config |
| `BOARD_PASSWORD` | Your chosen board password | Secret |

Remove the old `VITE_BOARD_PASSWORD` variable. The password now stays on the
server, where `/api/board-login` checks it. A missing or blank `BOARD_PASSWORD`
disables entry instead of accepting an empty password.

The Supabase URL and public key are intended for browser use. Never put a
Supabase secret key, service role key, or management token in a `VITE_` variable.

This change keeps the board password out of the browser bundle. The historical
Supabase schema still allows public database access. Protecting database reads
and writes requires a separate authorization change.

## Deploy

### Vercel
1. Import the GitHub repository into Vercel using the Vite preset.
2. Add the variables above for Production and any Preview deployments you use.
3. Redeploy the latest commit after changing variables.
4. Open the site and enter your board password. Individual accounts are not used.

Vercel deploys `api/board-login.ts` as a Node.js function alongside the Vite site.
A static-only host needs a server implementation of the same endpoint.

## Local development

Copy `.env.example` to `.env.local`, or add `BOARD_PASSWORD` to your existing
ignored `.env.local` without replacing its other values. Then run `npm run dev`.
Restart the dev server after changing the password. `npm run preview` also
provides the endpoint for checking the local production build.

## Verification

Run `npm run test:password`, `npm run build`, and both TypeScript configurations:
`npx tsc -p tsconfig.app.json` and `npx tsc -p tsconfig.node.json`.
