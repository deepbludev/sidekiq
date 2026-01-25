---
phase: 08-team-foundation
plan: 02
subsystem: api
tags: [trpc, teams, invites, rbac, email, typescript]

# Dependency graph
requires:
  - phase: 08-team-foundation
    plan: 01
    provides: Team schema, validation schemas, permission helpers
provides:
  - Full team tRPC router with 15 procedures
  - Email template function for team invites
  - Router registration in appRouter
affects: [08-03 through 08-07, team UI components, invite acceptance page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Resend API for transactional email with console fallback"
    - "Transaction-wrapped invite acceptance for race condition prevention"
    - "Null-check before permission helper calls for type safety"

key-files:
  created:
    - sidekiq-webapp/src/lib/emails/team-invite.ts
    - sidekiq-webapp/src/server/api/routers/team.ts
  modified:
    - sidekiq-webapp/src/server/api/root.ts

key-decisions:
  - "Null-check pattern before permission helpers instead of type casting"
  - "MAX_PENDING_INVITES_PER_TEAM = 20 to prevent spam"
  - "INVITE_EXPIRY_DAYS = 7 for security"
  - "Case-insensitive email matching for invites and members"
  - "Transaction for acceptInvite to prevent race conditions"
  - "Old owner becomes admin after ownership transfer"

patterns-established:
  - "Email template with HTML + fallback URL for non-configured Resend"
  - "Role ordering in listMembers using CASE expression"

# Metrics
duration: 6min
completed: 2026-01-25
---

# Phase 8 Plan 02: Team tRPC Router Summary

**Full team tRPC router with CRUD operations, member management, and invite system using Resend for email delivery**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-25T23:24:22Z
- **Completed:** 2026-01-25T23:30:22Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1

## Accomplishments
- Created email template function using Resend API with console fallback
- Implemented 15 tRPC procedures for team management
- Full CRUD: list, getById, create, update, delete
- Member management: listMembers, removeMember, changeRole, leave
- Invite system: listInvites, invite, acceptInvite, getInviteByToken, revokeInvite, resendInvite
- Ownership transfer with atomic transaction
- Registered teamRouter in appRouter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create email template function for team invites** - `28b1467` (feat)
2. **Task 2: Create team tRPC router with CRUD and member operations** - `8822d0d` (feat)
3. **Task 3: Register team router in root** - `0d509b3` (feat)

## Files Created/Modified
- `sidekiq-webapp/src/lib/emails/team-invite.ts` - Email template with Resend + fallback
- `sidekiq-webapp/src/server/api/routers/team.ts` - 15 tRPC procedures (~900 lines)
- `sidekiq-webapp/src/server/api/root.ts` - Added teamRouter to appRouter

## Router Procedures

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| list | query | protected | List user's teams |
| getById | query | protected | Get team by ID with member count |
| create | mutation | protected | Create team (caller becomes owner) |
| update | mutation | protected | Update team name/avatar (owner/admin) |
| delete | mutation | protected | Delete team (owner only) |
| listMembers | query | protected | List members sorted by role |
| listInvites | query | protected | List pending invites (owner/admin) |
| invite | mutation | protected | Send invite (owner/admin) |
| acceptInvite | mutation | protected | Accept invite by token |
| getInviteByToken | query | public | Get invite details for acceptance page |
| revokeInvite | mutation | protected | Delete pending invite |
| resendInvite | mutation | protected | Regenerate token and resend email |
| removeMember | mutation | protected | Remove member (owner/admin) |
| changeRole | mutation | protected | Change member role (owner/admin) |
| transferOwnership | mutation | protected | Transfer ownership (owner only) |
| leave | mutation | protected | Leave team (non-owners) |

## Decisions Made
- **Null-check pattern:** Check `if (!role || !canXxx(role))` instead of type casting for eslint compatibility
- **Pending invite limit:** 20 per team to prevent abuse
- **Invite expiry:** 7 days for security
- **Email case-insensitivity:** All email comparisons use LOWER() for consistency
- **Ownership transfer:** Old owner becomes admin (not member) to preserve management access
- **Transaction for accept:** Prevents race conditions when multiple users try to accept

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- ESLint errors with `as TeamRole` casts conflicting with `no-non-null-asserted-optional-chain` rule
- Fixed by adding explicit null checks before permission helper calls

## User Setup Required
None - RESEND_API_KEY is optional (falls back to console logging in development).

## Next Phase Readiness
- Team router fully functional and ready for UI integration
- All permission checks in place for role-based access control
- Invite system ready for acceptance page (Plan 03)
- Email sending ready for production when RESEND_API_KEY is configured

---
*Phase: 08-team-foundation*
*Completed: 2026-01-25*
