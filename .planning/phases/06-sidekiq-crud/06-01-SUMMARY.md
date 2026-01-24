---
phase: 06-sidekiq-crud
plan: 01
subsystem: api
tags: [tRPC, drizzle, zod, rate-limiting, crud]

# Dependency graph
requires:
  - phase: 03-thread-management
    provides: Thread schema and tRPC router patterns
provides:
  - Extended sidekiq schema with avatar, conversation starters, favorites
  - Sidekiq validation schemas for CRUD operations
  - sidekiqRouter with full CRUD + rate limiting
affects: [06-02, 06-03, 06-04, 07-sidekiq-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - In-memory rate limiting with sliding window
    - Case-insensitive unique name validation via SQL LOWER()
    - JSONB fields for flexible config (avatar, conversationStarters)

key-files:
  created:
    - sidekiq-webapp/src/lib/validations/sidekiq.ts
    - sidekiq-webapp/src/server/api/routers/sidekiq.ts
  modified:
    - sidekiq-webapp/src/server/db/schema.ts
    - sidekiq-webapp/src/server/api/root.ts

key-decisions:
  - "Custom in-memory rate limiter instead of @trpc-limiter/memory (type incompatibility with tRPC 11)"
  - "25 creations/hour limit (middle of CONTEXT.md 20-30 range)"
  - "Duplicate naming pattern: Copy of [Name], Copy of [Name] (2)"

patterns-established:
  - "RateLimiter class pattern for in-memory sliding window rate limiting"
  - "Case-insensitive name uniqueness via SQL LOWER() in WHERE clause"

# Metrics
duration: 12min
completed: 2026-01-24
---

# Phase 6 Plan 1: Data Layer & tRPC Router Summary

**Extended sidekiq schema with 6 new columns and created tRPC router with CRUD operations plus 25/hour rate limiting**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-24T11:14:00Z
- **Completed:** 2026-01-24T11:26:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended sidekiqs table with conversationStarters, defaultModel, avatar, isFavorite, lastUsedAt, threadCount columns
- Created Zod validation schemas with field limits from CONTEXT.md (name 100 chars, description 500 chars, instructions 8000 chars)
- Built sidekiqRouter with list, getById, create, update, delete, toggleFavorite, duplicate mutations
- Implemented rate limiting (25 creates/hour) using custom sliding window algorithm
- Added unique constraint on (ownerId, LOWER(name)) for case-insensitive name uniqueness

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend sidekiqs schema with new fields** - `c64d90a` (feat)
2. **Task 2: Create Sidekiq validation schemas** - `8e47979` (feat)
3. **Task 3: Create Sidekiq tRPC router with CRUD and rate limiting** - `7b3bb0b` (feat)

## Files Created/Modified
- `sidekiq-webapp/src/server/db/schema.ts` - Extended sidekiqs table, added SidekiqAvatar interface
- `sidekiq-webapp/src/lib/validations/sidekiq.ts` - Zod schemas for all CRUD operations
- `sidekiq-webapp/src/server/api/routers/sidekiq.ts` - Full tRPC router with rate limiting
- `sidekiq-webapp/src/server/api/root.ts` - Registered sidekiqRouter

## Decisions Made
- **Custom rate limiter:** @trpc-limiter/memory has type incompatibilities with tRPC 11 stable (expects "next" tagged versions). Implemented simple in-memory sliding window rate limiter class instead.
- **25/hour limit:** Chose middle of CONTEXT.md recommended range (20-30) for anti-spam protection.
- **Duplicate naming:** "Copy of [Name]" with incrementing suffix "(2)", "(3)" etc. for multiple copies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced @trpc-limiter/memory with custom rate limiter**
- **Found during:** Task 3 (tRPC router implementation)
- **Issue:** @trpc-limiter/memory middleware types incompatible with tRPC 11 stable - caused 17 TypeScript/ESLint errors about unsafe any types when using `.use(middleware)`
- **Fix:** Removed package, implemented custom RateLimiter class with sliding window algorithm
- **Files modified:** sidekiq-webapp/src/server/api/routers/sidekiq.ts, sidekiq-webapp/package.json
- **Verification:** TypeScript compiles, ESLint passes, rate limiting works as expected
- **Committed in:** 7b3bb0b (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary change - library incompatibility. Custom implementation is simpler and has no external dependencies. Same functionality achieved.

## Issues Encountered
- None beyond the rate limiter library issue (documented above)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer complete with schema and router ready for UI consumption
- Ready for Plan 02: Form components and pages
- All tRPC endpoints tested via TypeScript compilation

---
*Phase: 06-sidekiq-crud*
*Completed: 2026-01-24*
