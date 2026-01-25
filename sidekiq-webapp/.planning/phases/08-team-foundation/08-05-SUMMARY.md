---
phase: 08-team-foundation
plan: 05
subsystem: ui
tags: [invite, team, trpc, react, typescript]

# Dependency graph
requires:
  - phase: 08-team-foundation
    plan: 02
    provides: Team tRPC router with getInviteByToken and acceptInvite procedures
provides:
  - Public invite acceptance page at /invite/[token]
  - InviteAcceptCard component handling 5 invite states
affects: [08-06, 08-07, team invite flow, user onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-side tRPC caller for public pages"
    - "Multi-state card component for flow handling"
    - "Callback URL pattern for post-auth redirect"

key-files:
  created:
    - sidekiq-webapp/src/app/invite/[token]/page.tsx
    - sidekiq-webapp/src/app/invite/[token]/layout.tsx
    - sidekiq-webapp/src/components/team/invite-accept-card.tsx
  modified: []

key-decisions:
  - "Server-side invite fetch with createCaller for public access"
  - "Five distinct card states: not found, expired, unauthenticated, wrong email, valid"
  - "Sign-in callback URL preserves invite token for post-auth flow"
  - "Centered gradient layout without sidebar for invite pages"

patterns-established:
  - "Public page with optional auth check pattern"
  - "Dynamic metadata based on fetched data"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 8 Plan 05: Invite Acceptance Page Summary

**Public invite page at /invite/[token] with multi-state card handling all edge cases**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T23:32:29Z
- **Completed:** 2026-01-25T23:37:32Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Created InviteAcceptCard component handling 5 invite states
- Created invite page layout with centered gradient background
- Created invite page with server-side tRPC caller
- Dynamic metadata showing team name for valid invites
- Authentication flow with callback URL preservation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create InviteAcceptCard component** - `7980dde` (feat)
2. **Task 2: Create invite page layout and route** - `58cdb50` (feat, committed with 08-04)
3. **Lint fix: Remove unused import** - `392079e` (fix)

## Files Created

- `sidekiq-webapp/src/app/invite/[token]/page.tsx` - Server component fetching invite data
- `sidekiq-webapp/src/app/invite/[token]/layout.tsx` - Centered layout without sidebar
- `sidekiq-webapp/src/components/team/invite-accept-card.tsx` - Multi-state card component

## Component States

The InviteAcceptCard handles these states:

| State           | Icon                  | Description          | Action            |
| --------------- | --------------------- | -------------------- | ----------------- |
| Not Found       | XCircle (red)         | Invalid/used token   | Go to Sidekiq     |
| Expired         | Clock (amber)         | Past expiration date | Go to Sidekiq     |
| Unauthenticated | TeamAvatar            | User not logged in   | Sign In to Accept |
| Wrong Email     | AlertTriangle (amber) | Email mismatch       | Sign Out & Switch |
| Valid           | TeamAvatar            | Ready to accept      | Accept Invitation |

## Key Patterns

### Server-side tRPC Caller

```typescript
const ctx = await createTRPCContext({ headers: await headers() });
const caller = createCaller(ctx);
const invite = await caller.team.getInviteByToken({ token });
```

### Callback URL for Auth Flow

```typescript
const currentUrl = `${env.BETTER_AUTH_URL}/invite/${token}`;
const signInUrl = `/sign-in?callbackUrl=${encodeURIComponent(currentUrl)}`;
```

## Decisions Made

- **Server-side fetch:** Public procedure called via createCaller on server
- **Five card states:** Comprehensive handling of all edge cases
- **Callback preservation:** Sign-in redirects back to invite after auth
- **Gradient background:** Clean centered layout for invite flow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Concurrent commits from 08-04 interleaved during execution
- Pre-existing lint warnings (unused import) fixed inline

## Next Phase Readiness

- Invite acceptance flow complete and functional
- Team router integration verified
- Ready for 08-06 (team selection) and 08-07 (integration)

---

_Phase: 08-team-foundation_
_Completed: 2026-01-25_
