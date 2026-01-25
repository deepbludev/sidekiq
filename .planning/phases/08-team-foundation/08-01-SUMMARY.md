---
phase: 08-team-foundation
plan: 01
subsystem: database
tags: [drizzle, zod, teams, rbac, typescript]

# Dependency graph
requires:
  - phase: 06-sidekiq-management
    provides: SidekiqAvatar type and avatar schema pattern
provides:
  - Extended team schema with admin role, avatar, memberLimit
  - Zod validation schemas for all team operations
  - Role-based permission helper functions
affects: [08-02 through 08-07, team router, team UI components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Re-exported avatar schema for type reuse across features"
    - "Pure function permission helpers for testable authorization"

key-files:
  created:
    - sidekiq-webapp/src/lib/validations/team.ts
    - sidekiq-webapp/src/lib/team-permissions.ts
  modified:
    - sidekiq-webapp/src/server/db/schema.ts

key-decisions:
  - "Teams use same SidekiqAvatar type for consistency"
  - "Admin role added to teamRoleEnum for three-tier permissions"
  - "Default memberLimit of 50 stored per-team for future upgradeability"
  - "Email always lowercased in inviteMemberSchema for case-insensitive matching"
  - "changeRoleSchema only allows admin/member (owner transfer is separate flow)"

patterns-established:
  - "Team permission helpers as pure functions for easy unit testing"
  - "Re-export pattern for shared types across validation schemas"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 8 Plan 01: Team Schema & Validation Summary

**Extended team schema with admin role and avatar support, plus comprehensive Zod validation schemas and pure-function permission helpers for authorization**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T23:20:11Z
- **Completed:** 2026-01-25T23:22:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Extended teamRoleEnum to include "admin" role alongside owner/member
- Added avatar JSONB column to teams table (reuses SidekiqAvatar type)
- Added memberLimit column with default 50 for configurable team sizes
- Created 12 Zod validation schemas covering all team operations
- Implemented 10 permission helper functions matching CONTEXT.md rules

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend team schema with avatar, admin role, and member limit** - `24b3333` (feat)
2. **Task 2: Create team validation schemas** - `b19230c` (feat)
3. **Task 3: Create role permission helpers** - `c9913af` (feat)

## Files Created/Modified
- `sidekiq-webapp/src/server/db/schema.ts` - Extended teams table and teamRoleEnum
- `sidekiq-webapp/src/lib/validations/team.ts` - All team operation Zod schemas
- `sidekiq-webapp/src/lib/team-permissions.ts` - Role-based permission helpers

## Decisions Made
- **Re-use SidekiqAvatar type:** Teams use the same avatar system as Sidekiqs for UI consistency
- **Store memberLimit per-team:** Allows future upgrade tiers without schema changes
- **Separate transfer from changeRole:** Owner transfer is a distinct operation for safety
- **Pure function permissions:** No side effects, easily testable, can be used client and server side

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema extended with all required columns for team management
- Validation schemas ready for tRPC router procedures in Plan 02
- Permission helpers ready for authorization checks in router and UI
- Note: Database migration will be generated when running `pnpm db:generate`

---
*Phase: 08-team-foundation*
*Completed: 2026-01-25*
