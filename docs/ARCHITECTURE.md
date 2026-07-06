# Arcflow — Architecture

Onboarding doc for a new engineer. Text only diagrams so it stays diffable.
Updated whenever data flow, auth, RLS, realtime, or deployment changes.

## 1. Context
Arcflow is a multi tenant, realtime, RLS secured team board, our own sharper Jira.
It is a Vite and React 18 single page app. There is no app server of our own, the
browser talks straight to Supabase holding only the publishable key and the signed
in user token.

External systems: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage,
Vault), GitHub (LeetPing), email through SMTP or Resend, Vercel (static host),
optional OpenRouter (AI insights).

```
[Browser SPA] --JWT + publishable key--> [Supabase: Postgres, Auth, Realtime, Storage]
      |                                          ^
      |                                          | secret key (server only)
      +--> [Edge Functions] --> GitHub API / SMTP / Vault
```

## 2. Containers
- SPA (React and Vite): the app shell and feature folders, talks to Supabase only
  through the typed data access layer.
- Supabase Postgres: sixteen tables, RLS enforced, helper functions, RPCs, triggers.
- Edge Functions: invite-member, accept-invite, leetping-sync, github-oauth-exchange.
  They hold the secret key.
- Realtime: per board channels.
- Vault: GitHub tokens and other secrets.

## 3. Components inside the SPA
- app/ providers, router, layouts, error boundary.
- features/ auth, onboarding, boards, members, arc, sprint, daily, leaderboard,
  dashboard, announcements, leetping (added from phase 3 on).
- lib/supabase client, database.types.ts, entity modules, zod schemas, queryKeys,
  useOptimisticMutation.
- lib/design tokens and motion. stores/ Zustand.
- Rule: UI to a TanStack Query hook to a lib/supabase entity module to supabase-js.
  Never skip the entity module.

## 4. Data model
See implementation.md section 7 for the full DDL. Shape in short:
Board 1 to many Arc 1 to many Sprint. Board 1 to many Epic 1 to many Task
(task.epic_id is required). Board 1 to many Member with a role, Member optionally
in one Team. Per user private Daily. Comments on a task or an epic. Announcements,
custom statuses, custom types, invitations, github connections, leetping events.

## 5. Request lifecycle of a write
User action, then react-hook-form and zod validate, then a TanStack Query mutation
applies an optimistic cache update, then the lib/supabase entity module validates
the payload with zod and calls supabase-js with the user token, then Postgres RLS
checks membership and role, then the row is written, then Realtime broadcasts, then
other clients reconcile their cache. On error the mutation rolls back and shows a toast.

## 6. Auth flow
Signup with email and password, a verification email, the verify callback, then a
session tracked by onAuthStateChange. A trigger creates the profiles row. Route
guards send no session to login, a session with no boards to onboarding, otherwise
to the board. Guards are UX, RLS is the security.

## 7. RLS and authorization
Every table has RLS on with no permissive USING (true). SECURITY DEFINER helpers
(is_board_member, board_role, can_edit, is_board_owner, shares_board_with) gate
select versus write, with an explicit WITH CHECK on every mutating policy.
Owner only actions: board members writes, board delete, plan settings. Daily items
are private to the user. Board bootstrap goes through the SECURITY DEFINER
create_board RPC to avoid the membership chicken and egg. Invites are accepted
server side.

## 8. Realtime
Per board channels for tasks, epics, sprints, announcements, leetping events, and
comments. Events reconcile into the TanStack Query cache. REPLICA IDENTITY FULL on
the published tables so delete events carry board_id for RLS. Broadcast from
Postgres is the scale path in phase 10.

## 9. Deployment
Vercel serves the static build, env is the Supabase URL and the publishable key
only. Supabase is the backend, project qjcpzozqzhsuveuytwlo. Prod redirect URLs
and SMTP are set in phase 10. The secret key and access token live only in Edge
Function env.

## 10. Cross cutting
Errors go through typed results, the app error boundary, and sonner. Performance
uses keyset pagination, text fractional index positions, indexes on every FK, and
route code splitting. Accessibility means reduced motion support, visible focus,
and AA contrast. Observability is the Supabase advisors and logs now, Sentry in phase 10.

## Current state (phase 1)
The shell, design system, routing, stores, and the four spines exist. All routes
render ComingSoon placeholders. No database or auth yet, those are phases 2 and 3.
