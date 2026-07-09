# memory.md — Arcflow project memory

> Running log across sessions. Append mostly. Records what happened and why.
> - Differs from CLAUDE.md (durable present tense instructions).
> - Differs from Claude Code built in memory (that auto loads CLAUDE.md, this file
>   is loaded on purpose during the phase start protocol).
> - Differs from implementation.md (the intended plan, this is actual history).
> When a decision becomes a permanent rule, promote a one liner to CLAUDE.md.
> Only the State of the world block is overwritten, everything else is append only.

---

## STATE OF THE WORLD — resume here  (overwrite this block each update)
- Current phase: Post v1 features. Owner order: 1 onboarding (DONE, merged),
  2 friends (DONE, merged), 3 branded email (templates DONE on branch, owner
  does SMTP), 4 messaging, 5 admin console.
- Last updated: 2026-07-06
- Active branch: feat-email (branded email templates in emails/, pushed, NOT yet
  merged to main). main has everything through the friend system.
- Branded email is a code-plus-setup item: the templates are done, but going
  live needs the OWNER to set up Resend, verify a domain (SPF/DKIM), turn on
  custom SMTP, and paste the templates into the dashboard. Steps in
  emails/README.md and DEPLOYMENT.md step 3.
- Next up when the owner says go: live messaging (item 4). Depends on friends,
  which is done. See FEATURE BACKLOG.
- Built so far: the whole plan. Hardening round added a one minute sync cooldown
  to leetping-sync (v2 deployed), a 33 assertion RLS matrix across every table
  and role (all pass), a 1000 task scale seed proving index scans (kanban query
  16.5 ms with RLS, leaderboard RPC 7.5 ms), a clean bundle secret sweep (only
  the publishable key ships), vercel.json with SPA rewrites and security
  headers, and rewritten README and DEPLOYMENT docs.
- Remaining for the OWNER (cannot be done from here): rotate the Supabase secret
  key, the sbp access token, and the GitHub PAT (rotate the PAT last, it is the
  push credential), connect the repo in Vercel with the two VITE env vars, set
  prod auth URLs, set up SMTP through Resend, and flip on leaked password
  protection. Exact steps in DEPLOYMENT.md.
- Post v1 fixes applied on main (2026-07-06): (1) create_board was failing with
  a PostgREST "could not find function in the schema cache" error, the function
  and grants were fine so it was a stale schema cache, fixed with NOTIFY pgrst
  reload schema and verified through the REST layer. (2) Rebranded the favicon
  and index.html metadata from Cheapzdo to Arcflow.
- Post v1 backlog, owner's chosen order (2026-07-06): 1 onboarding DONE, then
  2 friends, 3 branded emails (with SMTP), 4 messaging, 5 admin console. Plus
  OAuth for private LeetPing repos and scheduled sync. Note the owner moved the
  admin console to last, it is no longer next. See FEATURE BACKLOG below and
  implementation.md 20b.
- Known broken right now: nothing. Gate green, 20 unit tests pass.
- Env and config: migrations 0001 to 0026 applied, leetping-sync v2 ACTIVE.
  0023 added the create_board start date, 0024 revoked its anon execute, 0025
  added friendships plus the friend rpcs, 0026 added the friend list rpcs. If
  create_board (or any RPC) ever 404s with a schema-cache error again, the one
  line fix is NOTIFY pgrst, 'reload schema'.

---

## DECISION LOG (newest first)

### ADR-0017 — Branded email templates live in the repo, pasted into the dashboard  [2026-07-06] — Status: Accepted
- Context: the default Supabase auth emails are plain and unbranded, the first
  thing a new user sees. We want on-brand mail without a build step or a mail
  service dependency in the app.
- Decision: keep the HTML templates in the repo under emails/ as the source of
  truth (confirm-signup, reset-password, change-email, plus a board-invite for
  the future Resend flow). Each is a full standalone document, table based, with
  fully inlined CSS and a web safe font stack, light with a dark mode hint, one
  bulletproof button, a plain text link fallback, and the Arcflow iris accent.
  The owner pastes them into Authentication, Emails, Templates and wires custom
  SMTP through Resend. There is no MCP or API path to set auth templates, so
  this stays a dashboard step.
- Rationale: emails cannot load the app's font or external images, so a self
  contained inlined document is the only thing that renders consistently across
  Gmail, Outlook, and Apple Mail. Repo as source of truth means they are
  reviewable and versioned even though they are applied by hand.
- Consequences: going live needs owner action (Resend account, domain plus
  SPF/DKIM, custom SMTP, paste). board-invite is not wired, it waits on the
  future invite-member Edge Function. If a template changes, mirror the shell
  across all files by hand.
- Phase: post v1, item 3

### ADR-0016 — Friend system: one row per pair, writes via SECURITY DEFINER rpcs  [2026-07-06] — Status: Accepted
- Context: friends need user search (but the profiles select policy is self or
  shares-a-board only, so strangers are invisible), request and accept flows,
  and a way to drop a friend into a board without a copied link.
- Decision: a single friendships table holds one row per unordered pair (unique
  index on least/greatest of the two ids) with status pending, accepted, or
  blocked. RLS is select only, limited to the two people in the row. Every write
  is a SECURITY DEFINER rpc that checks auth.uid(): send_friend_request (which
  auto-accepts if the other side already asked), respond_friend_request,
  remove_friend, block_user, unblock_user, plus invite_friend for board adds.
  Reads that need the other person's profile go through search_users,
  list_friends, and list_friend_requests, which return only safe public fields,
  so the profiles policy did not have to be widened. handle is now not null.
- Rationale: the pair model makes duplicates and reverse duplicates impossible,
  the rpc-only writes keep the transition rules in one auditable place and match
  the rest of the app, and definer read rpcs avoid loosening profile visibility
  for everyone. Proven by a 20 assertion self-cleaning SQL test.
- Consequences: blocking is one directional flag on the shared pair row, the
  blocker is recorded as requester_id. invite_friend is owner only and requires
  an accepted friendship. Realtime for live request notifications was left out
  for now, the UI refetches on open (staleTime 30s).
- Phase: post v1, item 2

### ADR-0015 — No forced onboarding, board creation gains a start date  [2026-07-06] — Status: Accepted
- Context: a brand new user with no boards was bounced straight into a full
  screen onboarding wizard that forced board creation as their first act. The
  owner felt this rushes people and makes them think they are making a mistake.
- Decision: board-less users land on a calm Home screen inside the app chrome
  with a "create your first board" call to action. The wizard becomes a create
  board dialog (CreateBoardDialog) opened from that call to action and from the
  sidebar new-board button, driven by a uiStore flag. Board creation also gains
  an optional first sprint start date: migration 0023 extends create_board with
  p_start date default current_date and passes it through to the seeded arc and
  sprints, and the dialog offers Today, Tomorrow, Next Monday, or a custom date.
  A brand new user defaults to Tomorrow so day one is not already half gone.
- Rationale: removes first-run friction, matches how real products let people
  look around before committing, and lets a team line the first sprint up with
  a real start day instead of always today.
- Consequences: the /onboarding route and RequireAuth guard are gone (dead code
  removed). create_board is now a four arg overload, the old three arg version
  was dropped so PostgREST has one unambiguous signature. Recreating the
  function re-granted execute to anon via Supabase default privileges, migration
  0024 revoked it to match every other RPC.
- Phase: post v1, item 1

### ADR-0014 — LeetPing v1 reads public repos by name, OAuth deferred  [2026-07-06] — Status: Accepted
- Context: the plan called for GitHub OAuth with tokens in Vault, but an OAuth
  app with a client id and secret can only be created by the owner, and none
  exists. LeetCode sync tools like LeetHub create public repos by default.
- Decision: v1 connects by GitHub username plus repo name. The edge function
  reads commits through the public GitHub API with the service role handling
  database writes. An optional GITHUB_TOKEN function secret raises rate limits.
  The token_secret_id column and Vault path stay reserved for the OAuth upgrade.
- Rationale: fully functional today for the actual use case with zero setup,
  same pragmatism as ADR-0013. Private repo support arrives with OAuth later.
- Consequences: private sync repos are not readable in v1 and the function says
  so. Scheduled background sync (pg_cron plus pg_net) is deferred to phase 10
  alongside rate limiting, sync is manual for now.
- Phase: 9

### ADR-0013 — Copy link invitations now, email delivery in phase 10  [2026-07-06] — Status: Accepted
- Context: the plan called for an invite-member Edge Function that sends email,
  but no email provider key exists yet (SMTP and Resend are phase 10 work), so a
  deployed function would just fail at runtime.
- Decision: create invitations client side under the owner only RLS policy. The
  browser generates a 32 byte token, stores only its sha256 hash, and shows the
  owner a copyable accept link exactly once. accept_invite validates the hash,
  expiry, and email match server side.
- Rationale: fully functional and secure today with zero email dependency, the
  same flow Slack and Notion offer as share links. The raw token never touches
  the database or leaves the owner's browser except in the link itself.
- Alternatives: deploy the Edge Function without a mail key, rejected as dead
  code. Email sending gets added in phase 10 alongside Resend, reusing the same
  invitations table.
- Consequences: links cannot be reshown later (only the hash is stored), so the
  UI says revoke and reinvite to reshare. The invite email match still applies.
- Phase: 4

### ADR-0012 — TypeScript strict mode on  [2026-07-06] — Status: Accepted
- Context: the Lovable template shipped with strict false and strictNullChecks
  false, which silently broke discriminated union narrowing on our Result type.
- Decision: set strict true in tsconfig.app.json. The whole codebase compiles
  clean under strict after the phase 1 and 2 rewrites.
- Rationale: the plan requires strict TypeScript, and Result-based error handling
  depends on proper narrowing.
- Consequences: any future code must be strict clean. noUnusedLocals stays off
  (lint covers that concern).
- Phase: 3

### ADR-0011 — Accept the SECURITY DEFINER advisor warnings as intentional  [2026-07-06] — Status: Accepted
- Context: after remediation the security advisor still reports 11 warnings, all
  authenticated_security_definer_function_executable, for the 5 RLS helper
  functions and the 6 API RPCs.
- Decision: accept these as intentional. Zero ERROR findings, zero anon exposure.
- Rationale: RLS policy evaluation requires the authenticated role to have EXECUTE
  on the helper functions, so they cannot be revoked without breaking RLS. The 6
  RPCs (create_board, accept_invite, move_task, reparent_epic_tasks, board_roster,
  leaderboard) are the intended signed in API. This is the standard Supabase
  pattern and the residual risk is negligible (a signed in user can at most learn
  their own membership booleans).
- Alternatives: move the 5 helpers to a private schema not exposed by PostgREST to
  drop those 5 warnings. Deferred as optional Phase 10 hardening, since the 6 RPC
  warnings are unavoidable regardless and a full policy rewrite carries more risk
  than the warnings do.
- Consequences: the "advisors security = 0" DoD is read as "0 ERROR, 0 anon, and
  only the documented intentional SECURITY DEFINER warnings." Performance advisor
  shows only unused_index INFO, an artifact of a zero row database.
- Phase: 2

### ADR-0010 — Six selectable themes, not just dark and light  [2026-07-06] — Status: Accepted
- Context: the old app had many seasonal themes, the owner wants variety back.
- Decision: ship six first class themes: dark (default), light, cherry (Cherry
  Blossom), retro, neon (cyberpunk), winter (Winter Snow). Each is a full token
  block in index.css with a matching color-scheme, chosen from a topbar picker and
  persisted in uiStore.
- Rationale: the CSS variable architecture makes extra themes cheap, and it gives
  the product personality without weather particles.
- Alternatives: dark and light only (the earlier plan default), rejected by the owner.
- Consequences: adding a theme later is one data-theme block, one color-scheme
  entry, and one row in the picker THEMES list.
- Phase: 1

### ADR-0009 — Product name is Arcflow  [2026-07-05] — Status: Accepted
- Context: the plan left the product name open, repo stays Cheapzdo.
- Decision: user chose Arcflow as the product and display name.
- Rationale: Arc is the core concept, the name follows the domain.
- Alternatives: keep Cheapzdo, rejected by the user for the product name.
- Phase: 1

### ADR-0008 — No Co-Authored-By trailers, plain comment style  [2026-07-05] — Status: Accepted
- Context: repo owner wants human sounding history, and there is a Cursor and
  Claude co author habit to avoid.
- Decision: commits are authored by the owner only, no Co-Authored-By trailer.
  Comments and messages use plain English, no em dashes, no semicolons in prose.
- Rationale: owner preference for their own repo, overrides the default trailer.
- Alternatives: keep the default Claude trailer, rejected by the owner.
- Phase: 1

### ADR-0007 — Push via repo local credential file, not keychain  [2026-07-05] — Status: Accepted
- Context: the sandbox could not read the macOS keychain, and the owner did not
  want the keychain used.
- Decision: store a fine grained GitHub PAT in .git/.git-credentials, disable the
  keychain helper for this repo.
- Rationale: works from the sandbox, persists across sessions, keeps the token out
  of tracked files.
- Consequences: the PAT is on the phase 10 rotation list.
- Phase: 1

### ADR-0006 — Position ordering uses text fractional index  [2026-07-05] — Status: Accepted
- Decision: position columns are text using the fractional-indexing library.
- Rationale: double precision numbers collide after about fifty inserts in the same slot.
- Alternatives: numeric, integer reindex, both rejected.
- Phase: 1 decided, applied in phase 2 schema

### ADR-0005 — Epic delete is RESTRICT not CASCADE  [2026-07-05] — Status: Accepted
- Decision: tasks.epic_id uses ON DELETE RESTRICT plus a reparent flow.
- Rationale: CASCADE would silently destroy sprint work and leaderboard history.
- Phase: 1 decided, applied in phase 2

### ADR-0004 — Email verification auth  [2026-07-05] — Status: Accepted
- Decision: Supabase email and password with email confirmation is the primary auth.
- Rationale: the founder asked for the verification email flow, identity stays inside Supabase for RLS.
- Alternatives: magic link, Clerk or Auth0, both deferred or rejected.
- Phase: 1 decided, built in phase 3

### ADR-0003 — TanStack Query for server state, Zustand for UI state  [2026-07-05] — Status: Accepted
- Decision: server state in TanStack Query, ephemeral UI state in Zustand, never crossed.
- Rationale: replaces the old single global context that fire and forgot writes.
- Phase: 1

### ADR-0002 — Vite SPA, stay on React 18.3  [2026-07-05] — Status: Accepted
- Decision: keep a Vite single page app, React 18.3, do not move to Next.js.
- Rationale: private realtime tool with nothing to SEO, RLS is the security boundary,
  a server tier would only add a secret key temptation. React 18.3 has full ecosystem support.
- Alternatives: Next.js, React 19, both rejected for now.
- Phase: 1

### ADR-0001 — Package manager is npm  [2026-07-05] — Status: Accepted
- Context: clone shipped both bun.lockb and package-lock.json.
- Decision: standardize on npm, delete bun.lockb.
- Rationale: plan commands are npm, avoid dual lockfile drift.
- Alternatives: bun, rejected.
- Phase: 1

---

## PHASE COMPLETION LOG (newest first)

### Post v1, item 3 — Branded email templates   [2026-07-06]  (branch feat-email)
- Delivered: emails/ folder with confirm-signup.html, reset-password.html,
  change-email.html (Supabase auth templates, {{ .ConfirmationURL }}), and
  board-invite.html (custom placeholders, for the future Resend invite Edge
  Function, not wired yet). One shared Arcflow shell, table based, inlined CSS,
  web safe fonts, 560px, light with a dark mode hint, bulletproof button, plain
  text link fallback. emails/README.md maps each file to its dashboard template
  with subjects and a test checklist. DEPLOYMENT.md step 3 now points at the
  folder.
- Verified: structural check on all four (balanced tables, single body, required
  variables present, no color typos). No app code changed, so no migration or
  gate needed.
- Owner action to go live (cannot be done from here): Resend account, verify a
  domain with SPF and DKIM, turn on custom SMTP in Supabase, paste the templates
  into Authentication, Emails, Templates. Steps in emails/README.md.

### Post v1, item 2 — Friend system   [2026-07-06]  (branch feat-friends)
- Delivered:
  - Migration 0025: friendships table (one row per unordered pair, status enum),
    select only RLS, and the write rpcs search_users, send_friend_request (with
    reverse auto-accept), respond_friend_request, remove_friend, block_user,
    unblock_user, invite_friend. Migration 0026: list_friends and
    list_friend_requests read rpcs. handle set not null. anon revoked on all.
  - Data layer src/lib/supabase/friends.ts, hooks src/features/friends/useFriends.ts.
  - Friends page (src/features/friends/FriendsPage.tsx): debounced search with
    per-result add/accept/pending/friends state, a requests inbox (incoming
    accept or decline, outgoing cancel), and the friends list with remove and
    block. Nav entry added to the app sidebar, route /friends.
  - Board integration: InviteFriendDialog in the members panel (owner only) adds
    an accepted friend straight to the board with a chosen role, filtering out
    people already on the board.
  - database.types.ts hand-extended (friendships table, 9 rpcs, friendship_status
    enum) preserving the move_task nullable fix.
- Verified: 20 assertion self-cleaning SQL test covering search, request,
  reverse auto-accept, RLS isolation from third parties, accept, remove, block
  (search hiding plus request refusal), unblock, and invite_friend (adds member,
  owner only, requires friend), all pass and cleaned up. Advisors show only the
  intentional definer warnings. Gate green, 20 unit tests pass. FriendsPage is
  its own lazy chunk.
- Not merged to main yet, waiting on the owner's verify pass.

### Post v1, item 1 — Onboarding without a forced board   [2026-07-06]  (branch feat-onboarding)
- Delivered:
  - Migration 0023: create_board gains p_start date default current_date, drops
    the old three arg version, passes the start through to the arc and sprints,
    with a sane date window guard. Migration 0024 revokes anon execute (default
    privileges had re-granted it on recreate).
  - New Home screen (src/features/home/HomePage.tsx): welcome plus a create your
    first board call to action, rendered inside the app chrome. HomeRedirect now
    shows it for board-less users instead of forcing /onboarding.
  - New CreateBoardDialog (src/features/boards/): name, arc shape steppers, a
    start date picker (Today, Tomorrow, Next Monday, custom), and the live arc
    timeline preview which now honors the chosen start. Opened from the Home
    call to action and the sidebar new-board button via a uiStore flag, mounted
    once in AuthedLayout, lazy loaded into its own chunk.
  - Removed the forced onboarding wizard, the /onboarding route, and the
    RequireAuth guard. Moved useCreateBoard and ArcTimelinePreview into
    features/boards.
  - database.types, the zod schema, and boards.ts updated for the optional
    startDate.
- Verified: advisors unchanged (only the ADR-0011 intentional warnings plus the
  leaked password toggle), schema cache reloaded, create_board resolves through
  REST. Gate green, build and typecheck clean, 20 tests pass.
- Not merged to main yet, waiting on the owner's verify pass.

### Phase 10 — Hardening, scale, deploy prep   [2026-07-06]
- Delivered:
  - Migration 0022 plus leetping-sync v2: a one minute per user sync cooldown
    tracked in github_connections.last_synced_at.
  - Full RLS matrix, 33 assertions across all 16 tables and four role classes
    (non member, viewer, editor, owner), all pass. Covers cross scope daily
    privacy, invitation invisibility, write denials per role, and owner powers.
  - Scale proof: seeded 1000 tasks on a throwaway board, EXPLAIN under the
    authenticated role shows an Index Scan on tasks_sprint_id_board_id_idx at
    16.5 ms including the RLS membership filter, leaderboard RPC at 7.5 ms.
    Seed removed cleanly.
  - Advisors: zero errors, only the ADR-0011 intentional SECURITY DEFINER
    warnings plus the leaked password dashboard toggle (owner checklist).
  - Bundle sweep: dist contains no sb_secret, sbp, github_pat, or service role
    strings, only the publishable key.
  - vercel.json (SPA rewrites, nosniff, frame deny, referrer policy, immutable
    asset caching), README rewritten for Arcflow, DEPLOYMENT.md rewritten with
    Vercel steps, auth URLs, SMTP via Resend, hardening toggles, the secret
    rotation list, and a smoke test script. ARCHITECTURE.md current state
    updated.
  - Branch stack merged to main and pushed.
- Handed to the owner: secret rotation (Supabase secret key, sbp token, GitHub
  PAT last), Vercel project setup with the two VITE env vars, prod auth URLs,
  SMTP, leaked password protection.
- Deviations: Sentry left out (needs an owner account and DSN), noted as a
  future add alongside scheduled LeetPing sync and the post v1 backlog.

### Phase 9 — LeetPing   [2026-07-06]
- Delivered:
  - supabase/functions/leetping-sync: verifies the caller's jwt, loads their
    github_connections row, pulls up to 30 recent commits from the public
    GitHub API (optional GITHUB_TOKEN secret for higher limits), skips already
    ingested shas, parses solves from commit messages with a budgeted file path
    fallback (8 detail fetches per run), honors the share_to_boards opt in, and
    upserts events to every board the caller belongs to, deduped on
    (board_id, user_id, commit_sha). Clear error messages for missing repo,
    private or renamed repo, and rate limits.
  - parse.ts is a dependency free module shared verbatim between the Deno
    function and vitest, covering leetcode.com urls, numbered directory names,
    verb prefixes, bracket styles, lone slugs, LeetHub runtime messages
    (returns null so the path fallback runs), LeetHub directory layouts,
    difficulty folders, flat single file repos, and language from extension.
    Nine tests.
  - leetping data module (connection get, save, delete, feed list, syncNow via
    functions.invoke with readable error unwrapping).
  - LeetPingPage: connect card (username, owner/name repo, share opt in),
    connection summary with share toggle and disconnect, sync now with spinner,
    feed of "Name solved Problem" rows with difficulty tone chips, language,
    relative time, and a member filter. leetping_events joined the realtime
    invalidation list so feeds update live.
- Gates: build, typecheck, lint green, 20 unit tests pass. LeetPingPage is a
  9.2 kB lazy chunk. Edge function deployed ACTIVE with verify_jwt.
- Deviations from plan: see ADR-0014 (public repo by name instead of OAuth,
  manual sync instead of scheduled for now).
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 8 feedback round — list view drag and team dailies   [2026-07-06]
- Context: the user clarified that column drag meant the list view table
  columns (type, title, epic, and so on) plus manual row reordering there, and
  asked for the shared daily lane to be pulled forward from the backlog with
  the visibility design left to me.
- Delivered:
  - List view header cells drag horizontally to rearrange columns, order stored
    per user in the persisted uiStore. Clicking a header still sorts.
  - List view rows drag vertically by a grip to reorder tasks, persisted through
    move_task with a fresh fractional key. Row drag disables itself while a
    header sort is active since manual order only makes sense in position order.
  - Daily now has two lanes with a URL backed toggle. Personal is exactly the
    old private list. Team is shared with the whole board, each item can be
    assigned to a member (Anyone by default), editors add, rename, assign,
    check, reorder, and delete, viewers see everything read only. Migration
    0020 adds scope and assignee_id with split RLS policies and updates the
    member removal cleanup (personal rows leave with the member, team rows just
    lose the assignee). Migration 0021 adds daily_items to realtime.
  - Three SQL assertions pass: personal hidden from others, team visible to
    members, viewer cannot write team items.
- Gates: build, typecheck, lint, tests all green.
- Decision note: team lane visibility went to all board members with writes for
  editors, matching the rest of the app's role model.

### Phase 8 — Announcements, realtime, polish   [2026-07-06]
- Delivered:
  - Migration 0018 reorder_statuses RPC (park high then renumber, atomic,
    can_edit checked, proven by SQL test). Migration 0019 adds arcs,
    board_statuses, and work_item_types to the realtime publication with full
    replica identity.
  - Announcements: data module and page, pinned posts float first with a tinted
    card, author chip and relative time, inline composer for editors, pin and
    delete controls, viewers read only per RLS.
  - Realtime: useBoardRealtime mounts in BoardLayout, one channel per board over
    eight tables filtered by board_id, events invalidate the matching query keys
    (idempotent, so self echoes are harmless and nothing toasts), reconnect
    triggers a full board refetch, channel removed on unmount.
  - Kanban column drag (user backlog item): columns are sortable by a header
    grip, discriminated from card drags by a col: id prefix and data.type, live
    horizontal parting during drag, drop persists through reorder_statuses with
    rollback on error. Settings arrows still work.
  - Color coding (user backlog item): StatusPill (stored status color as tinted
    pill) and PriorityBadge (semantic tinted badge) in itemAtoms, applied to the
    list view cells for viewers and as tinted select triggers for editors, and
    inside the select menus.
  - Command palette: cmd K or ctrl K opens it anywhere in the app shell, jumps
    to any section of the active board or any board, switches all six themes,
    profile and sign out. The topbar search button now opens it too.
- Gates: build, typecheck, lint green, 11 unit tests pass, reorder RPC proven by
  two SQL assertions. Announcements is a 5.7 kB lazy chunk.
- Deviations from plan: realtime reconciles by query invalidation rather than
  surgical setQueryData, simpler and correct at this scale, revisit only if
  refetch volume becomes a problem. The keyboard cheatsheet overlay and presence
  are deferred to phase 10 polish.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 7 — Leaderboard and Dashboard   [2026-07-06]
- Delivered:
  - leaderboardApi wrapper over the leaderboard RPC (scores computed in the
    database). features/leaderboard/score.ts aggregates teams (average of member
    totals, zero assigned members excluded, unassigned bucket, completion tie
    break) with four unit tests.
  - LeaderboardPage: team vs team by default when teams exist, spring rise
    podium (second, first, third), click a team to drill into its members, each
    member row shows Done, Weight, and Motion pillar bars out of 50, 30, 20,
    scope select for overall or any sprint, and a how scoring works explainer.
  - features/dashboard/burndown.ts computes ideal and actual lines per sprint
    day (done day approximated by updated_at once a task sits in a done status,
    labeled as an estimate) with three unit tests.
  - DashboardPage: metric tiles, animated burndown with a dashed ideal line, a
    bespoke status donut using each status stored color, priority bars with
    semantic colors, open work by member, and an open blockers panel. Scope
    select for whole board or one sprint.
- Gates: build, typecheck, lint green, 11 unit tests pass. LeaderboardPage 8.5 kB
  and DashboardPage 10.6 kB lazy chunks. No schema changes.
- Deviations from plan: Overall scope means the whole board rather than only the
  active arc, since the leaderboard RPC has no arc filter. Acceptable for now,
  revisit if arcs accumulate. Charts are hand rolled SVG plus framer rather than
  visx, fewer moving parts for the same visuals.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 6 — Daily board   [2026-07-06]
- Delivered:
  - daily data module (list, create with the client local date, update, delete).
  - DailyCheckbox with a drawn in check mark and a tap spring, instant under
    reduced motion.
  - DailyPage: progress ring plus n of m header, inline add composer with enter,
    inline rename, hover delete, drag reorder of open items (dnd-kit vertical
    with the new @dnd-kit/modifiers restrictToVerticalAxis), done items sink to
    a faded done section, an all done message, and a private empty state.
  - Rolling list model per the plan decision, for_date recorded from the client
    local date for a future per day view.
- Gates: build, typecheck, lint, test green. DailyPage is a 7.7 kB lazy chunk.
  Privacy was proven by the phase 2 RLS matrix (daily_private), no schema change
  this phase so advisors are unchanged.
- Deviations from plan: none.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 5 — Arc Board and Sprint Board   [2026-07-06]
- Delivered:
  - Migration 0017: create_arc (atomic next arc with N sprints, deactivates the
    old arc and its sprints, activates the new first sprint) and close_sprint
    (optionally moves unfinished tasks to the next sprint by status category,
    hands over the active flag). Ten SQL assertions pass.
  - Data modules: arcs, sprints, epics (with rollups from the epic_rollups
    view and a RESTRICT aware delete message), tasks (create, update, move_task
    RPC wrapper, delete), comments. Types for create_arc and close_sprint added
    to database.types.ts, move_task p_status corrected to nullable.
  - Arc Board: epic cards with an animated RadialGauge rollup ring, priority dot,
    type chip, assignee avatar, done over total badge. Arc selector defaults to
    the active arc and always offers the Backlog bucket. Start new arc button.
    Epic detail sheet edits everything and deletes with the reparent message.
  - Sprint Board: URL driven state (sprint, view, q, assignee, blockers). List
    view is the default, TanStack Table with sortable columns and inline status
    and priority selects. Kanban view on dnd-kit with pointer and keyboard
    sensors, live cross column parting during drag, a rotated drag overlay, and
    drops committed through move_task with a fresh fractional key. Sprint nav
    with prev and next and an active badge, close sprint flow, new task dialog
    that requires a parent epic, task detail sheet with comments and reparenting.
- Gates: build, typecheck, lint, test green. ArcBoardPage 10 kB and
  SprintBoardPage 31 kB lazy chunks, dnd-kit 50 kB loads with the sprint page.
- Deviations from plan: task list virtualization and group by deferred (fine at
  current scale, phase 10 revisits with seeded data). Comments are on tasks only
  for now even though the schema supports epic comments.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 4 — Boards, teams, members, RBAC   [2026-07-06]
- Delivered:
  - Migration 0016: a board always keeps at least one owner (demote and delete of
    the last owner are blocked, board deletion still cascades), and removing a
    member unassigns their tasks and epics. All three proven by SQL test.
  - Data modules: members (roster RPC, my role, role update, remove, team
    assign), teams (CRUD), invitations (client side hashed token creation with a
    one time copy link, pending list, revoke), statuses (CRUD plus position swap
    through a temp slot), work item types (CRUD), boards (get, update, delete).
  - usePermissions now reads the real membership role through the board_role RPC.
  - Board settings page at /b/:id/settings with tabs: General (rename and arc
    defaults, owner only), Members (roster with role select, team assign, remove,
    invite dialog with the one time link, pending invites with revoke), Teams
    (create, rename, recolor via creation, delete, member avatars), Statuses
    (add, rename, recolor, reorder, delete with in use guard, category fixed and
    labeled), Types (add, rename, icon picker from a curated lucide set, recolor,
    delete with in use guard), Danger (type the board name to delete, owner only).
  - Viewers see read only panels, editors can edit statuses and types, owners get
    members, teams, general, and danger controls.
- Gates: build, typecheck, lint, test all green. Settings page is its own lazy
  chunk (67 kB). Advisors: same intentional pattern as phase 2, plus a new
  dashboard toggle to enable (leaked password protection).
- Deviations from plan: invitations are copy link instead of emailed, see
  ADR-0013. Email arrives in phase 10 with Resend.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 3 — Authentication and onboarding   [2026-07-06]
- Delivered:
  - Auth data module (signUp with verification redirect, signIn, signOut, resend,
    password reset request and update, acceptInvite RPC wrapper) and zod schemas
    shared by all auth forms.
  - Session layer: authStore plus an AuthListener in providers fed by getSession
    and onAuthStateChange. useAuth hook.
  - Guards: RequireGuest, RequireAuth, HomeRedirect (no boards goes to onboarding,
    otherwise first board), and AuthedLayout now guards with a loader so protected
    content never flashes.
  - Screens: Login, Signup, VerifyEmail (with resend), ResetRequest,
    UpdatePassword, AcceptInvite, all on the split AuthCard shell with the
    animated sprint bars motif. Profile page with display name, handle, and
    avatar upload to the avatars bucket. UserMenu with sign out in the topbar.
  - Onboarding wizard: two steps (name, then arc shape) with steppers and the
    live ArcTimelinePreview that rebuilds as arc size and sprint length change,
    submitting through the create_board RPC and landing on the new board.
  - Sidebar now lists the user's real boards from useMyBoards.
  - All page routes lazy loaded, and supabase-js and forms split into their own
    vendor chunks. App index chunk 173 kB, largest chunk 206 kB.
  - TypeScript strict mode enabled (ADR-0012).
- Gates: build ok, typecheck ok (strict), lint ok, test ok. No schema changes, so
  advisors unchanged from phase 2.
- Deviations from plan: the optional "create your first team" wizard step is
  deferred to phase 4 where teams exist end to end. Documented here on purpose.
- Follow ups: user must set Supabase auth URL config in the dashboard (Site URL
  and redirect allow list for localhost 8080) and confirm a real signup email.
- Docs updated: memory.md. CLAUDE.md reviewed, no change needed.

### Phase 2 — Database schema, RLS, security foundation   [2026-07-06]
- Delivered:
  - Migrations 0001 to 0015 applied to project qjcpzozqzhsuveuytwlo. 16 tables,
    all RLS enabled, no permissive USING (true) anywhere.
  - Composite (id, board_id) foreign keys for airtight cross tenant integrity,
    SECURITY DEFINER helper functions with locked search_path, WITH CHECK on every
    mutating policy, invitation token stored as a hash, text fractional index
    positions, epic delete is RESTRICT.
  - RPCs: create_board, accept_invite, move_task, reparent_epic_tasks,
    board_roster, leaderboard. View: epic_rollups (security_invoker).
  - 0015 remediation: search_path on set_updated_at, revoked anon and public from
    functions, dropped the broad avatars listing policy, wrapped auth.uid() in a
    scalar subselect in the direct policies, de-duped permissive policies, added
    covering indexes for every foreign key.
  - Types generated to src/lib/supabase/database.types.ts. Data layer: client,
    Result helper, board zod schema, and boards module as the pattern. Deleted the
    old supabase-schema.sql.
  - RLS test matrix: all 7 assertions pass (viewer sees, viewer cannot write,
    non member sees nothing, owner writes, cross board blocked, daily private,
    assignee must be a member). Test data created and cleaned up.
- Gates: build ok, typecheck ok, lint ok, test ok. Advisors: 0 ERROR. Security has
  11 intentional SECURITY DEFINER warnings (see ADR-0011). Performance has only
  unused_index INFO (empty database artifact).
- Deviations from plan: added migration 0015 for advisor remediation beyond the
  planned 0001 to 0014. The per entity data modules beyond boards are added in
  their feature phases, following the boards pattern.
- Docs updated: memory.md, implementation.md unchanged (schema matched the plan).

### Phase 1 — Foundation, process scaffolding, design system, app shell   [2026-07-05]
- Delivered:
  - Process docs: CLAUDE.md, memory.md, docs/ARCHITECTURE.md, docs/decisions/,
    PRODUCT.md, DESIGN.md.
  - Toolchain: added typecheck, test, test:watch, gate scripts. Vitest, jsdom,
    testing library, jsx-a11y installed. Deleted bun.lockb and the stale CODEBASE_CONTEXT.md.
  - Deps: framer-motion, dnd-kit, zustand, tanstack table and virtual, visx,
    fractional-indexing, Space Grotesk and Geist fonts.
  - Design system: new tokens in src/index.css for dark (default) and light,
    Geist body, Space Grotesk display, JetBrains Mono for numerics only, removed
    font-mono from the body. Tailwind config updated for fonts and chart colors.
  - Four spines: lib/design/motion.ts, lib/supabase/queryKeys.ts,
    lib/supabase/useOptimisticMutation.ts, lib/permissions.ts. Plus
    lib/fractionalIndex.ts with a passing unit test.
  - App shell: app/providers, app/router (all routes stubbed with ComingSoon),
    AuthedLayout, BoardLayout, AppErrorBoundary, AppSidebar, AppTopbar,
    ThemeToggle, EmptyState, ComingSoon. Stores: uiStore, boardStore, viewStore.
    Vite manualChunks for the heavy libs.
  - Removed the entire old app: AppContext, ThemeContext, PasswordGate, MainBoard,
    Dashboard, Leaderboard, WorkItem list and row and filters, Daily,
    Announcements, SprintNavigation, TaskCardModal, the add dialogs, PeopleManager,
    Header, ThemeSwitcher, WeatherParticles, NavLink, ai components, old Index page,
    old supabase client, old types, App.css, and ten unused ui primitives.
- Gates: build ok, typecheck ok, lint ok (0 errors, a few react-refresh warnings
  in kept shadcn files), test ok (4 of 4). Advisors not applicable, no schema yet.
- Deviations from plan: design skills (frontend-design, impeccable, taste-skill)
  were not installed into the harness. The design contract in implementation.md
  section 11 was followed directly, which the plan allows as the fallback.
- Follow ups: features/ folders start in phase 3. Command palette and keyboard
  shortcuts are scaffolded in the topbar but not wired yet.
- Docs updated: CLAUDE.md, memory.md, ARCHITECTURE.md, PRODUCT.md, DESIGN.md.

---

## OPEN QUESTIONS
- [ ] Priority stays a fixed enum (scoring depends on it) vs custom later. Default fixed.
- [ ] Daily rollover: rolling list (default) vs per day with carry over.
- [ ] LeetPing board scoping and privacy default (default off).
- [ ] AI insights kept as opt in (default) vs dropped.

## FEATURE BACKLOG
- SHIPPED in phase 8: kanban column drag, color coded statuses and priorities,
  list view column rearranging, list view row reordering, and the shared team
  daily lane with assignees. Entries below are still open.
- [SHIPPED 2026-07-06] Onboarding without a forced board (user request 2026-07-06).
  Today HomeRedirect in src/app/guards.tsx sends a board-less user straight to
  the full screen /onboarding wizard, which forces board creation as their
  first act. Change it so board-less users land on a calm Home screen inside the
  app chrome with a "create your first board" call to action, nothing forced.
  Turn the wizard into a create-board dialog reused by the sidebar new-board
  action. Add an optional start date to board creation so the first sprint can
  start later (create_arc already takes p_start, create_board does not, so a
  migration extends create_board with p_start default current_date and passes it
  through), default a brand-new user's first sprint to tomorrow so they are not
  rushed. No RLS changes. Full design in implementation.md 20b item 1. Ranked
  first because it is small and fixes a live first-run pain point.
- [HIGHEST] Admin console (user request 2026-07-06). A superadmin account plus
  an /admin screen that tracks and manages the whole app from inside the app:
  how many users, boards, teams, tasks, signups over time, plus direct actions
  on users (ban, force reset, delete with an ownership transfer guard) and
  boards (inspect, transfer, delete). Security shape: an app_admins table with
  no client write policies (first admin inserted by migration, never a column
  on profiles), an is_app_admin helper, every capability an explicit admin_*
  SECURITY DEFINER rpc that logs to an append only admin_audit_log, and an
  admin-ops edge function for auth level operations. Scale shape for 100k
  users: keyset paginated list rpcs, indexed search, aggregate count rpcs, and
  a nightly admin_daily_stats rollup via pg_cron for O(1) growth charts.
  Impersonation deliberately excluded from v1. Build order A1 read only, A2
  management actions, A3 rollup and plan limit controls. Full design in
  implementation.md section 20b item 1. Ranked above the friend system.
- [SHIPPED 2026-07-06] Friend system (user request 2026-07-06). Search a user by handle, send a
  friend request, accept or decline, then invite friends to boards from a picker
  instead of copy pasting a token link. Needs a friendships table
  (requester_id, addressee_id, status pending or accepted or declined or
  blocked, unique pair), a SECURITY DEFINER search_users RPC that matches
  profiles.handle with a limit and returns only public fields (the profiles
  SELECT policy is shared board only, so search must go through an RPC), a
  requests inbox UI, and an invite_friend RPC that adds an accepted friend to a
  board directly with a chosen role, reusing the last owner and role guards.
  The token link flow stays for people who are not on the app yet.
- [SHIPPED 2026-07-06] Shared team dailies with assignees (user request 2026-07-06). Today
  Daily is private per user. Add a second lane: a shared board daily list where
  each item can be assigned to a member, everyone on the board sees the list and
  who each item is for, and members check off their own. Personal lane stays
  private exactly as built. Likely shape: daily_items gets a scope column
  (personal or team) plus an assignee_id, RLS splits by scope (personal rows
  keep the owner only policy, team rows use is_board_member for select and
  can_edit or self assign for writes), UI shows Team and Personal tabs with the
  same checkbox interaction and per person grouping in the team lane.
- [TEMPLATES SHIPPED 2026-07-06, owner does SMTP] Branded email templates (user request
  2026-07-06). Replace the default Supabase auth emails (confirmation, reset,
  email change) and the future Resend invite email with one professional
  Arcflow email shell: logo mark, iris accent, one clear CTA button, plain
  text link fallback, quiet footer. Email constraints apply: table layout,
  inlined CSS, web safe font stack, about 560px wide, tested in Gmail,
  Outlook, and Apple Mail. HTML sources live in the repo under emails/ and get
  pasted into Authentication, Emails, Templates. Worthless without
  deliverability, so it ships as one unit with DEPLOYMENT.md step 3 (Resend,
  domain verification, SPF and DKIM). Design detail in implementation.md 20b
  item 3.
- [LOW] Live messaging (user request 2026-07-06). Two surfaces: a board or team
  channel, and direct messages between friends (depends on the friend system).
  Realtime delivery over Supabase channels, a messages table with board_id or
  team_id or a dm pair, keyset paginated history, RLS by membership or
  friendship. Deliberately after friends ship, and only once realtime
  infrastructure from phase 8 is in and proven.
- Color coded statuses and priorities everywhere they appear (user request
  2026-07-06). Statuses already store a color (picked in Settings, Statuses) and
  the kanban column headers show it, but the list view status cell, the detail
  sheet selects, and the epic sheet all render plain text. Make status render as
  a tinted pill using its stored color (background at low alpha, text at full),
  and give priority the same treatment with its semantic colors (critical
  destructive, high warning, medium primary, low muted) instead of only a dot.
  Applies to list view cells, kanban cards, detail sheets, and select triggers.
  Scheduled for phase 8 polish alongside the column drag reorder.
- Drag to reorder Kanban columns directly on the board (user request 2026-07-06).
  Column order is already editable through Settings, Statuses, up and down
  arrows. This adds direct drag on the board: a second draggable kind in the
  Kanban DndContext (column vs task via data.type), horizontal sorting for the
  column row, atomic position renumber persisted on drop, keyboard drag too.
  Scheduled for phase 8 polish, see implementation.md phase 8 build list.

## KNOWN ISSUES / TECH DEBT
- [SEV high] Rotate the Supabase secret key, the Supabase access token, and the
  GitHub PAT before launch, see implementation.md section 21. Phase 10.
- [SEV low] A few react-refresh only-export-components warnings remain in kept
  shadcn files (form, toggle, and similar). Warnings only, not errors.

## GOTCHAS DISCOVERED
- The shell tool had a transient PATH drop during one command, coreutils went
  missing for that call. Re running with simpler commands worked. If a command
  fails with command not found for wc or tail, just retry.
- @fontsource-variable/geist exposes the family name "Geist Variable", used in the
  font stack in index.css and tailwind.config.ts.
