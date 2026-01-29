---
phase: quick-023
plan: 01
subsystem: infra
tags: [shiki, next.js, pnpm, build-warning, syntax-highlighting]

# Dependency graph
requires:
  - phase: none
    provides: n/a
provides:
  - Clean Next.js build with no shiki externalization warning
  - shiki as direct dependency for @streamdown/code syntax highlighting
affects: []

# Tech tracking
tech-stack:
  added: [shiki ^3.21.0 (direct dependency, was transitive via @streamdown/code)]
  patterns: []

key-files:
  created: []
  modified:
    - sidekiq-webapp/package.json
    - sidekiq-webapp/pnpm-lock.yaml

key-decisions:
  - "Added shiki as direct dependency rather than modifying next.config.js serverExternalPackages -- root cause was pnpm strict isolation not hoisting transitive dep"

patterns-established: []

# Metrics
duration: 5min
completed: 2026-01-29
---

# Quick 023: Fix Shiki Package Externalization Warning Summary

**Added shiki as direct dependency to resolve pnpm strict isolation preventing Next.js from externalizing the transitive shiki package**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-01-29T01:35:59Z
- **Completed:** 2026-01-29T01:41:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Eliminated "Package shiki can't be external" Next.js build warning
- Added shiki ^3.21.0 as direct dependency (deduplicates with @streamdown/code's transitive dep)
- Verified clean build, TypeScript compilation, and import chain integrity

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shiki as direct dependency and verify build** - `a0f8cf1` (fix)

## Files Created/Modified
- `sidekiq-webapp/package.json` - Added shiki ^3.21.0 to dependencies
- `sidekiq-webapp/pnpm-lock.yaml` - Updated lockfile with shiki hoisted to root

## Decisions Made
- Added shiki as direct dependency rather than modifying `next.config.js` `serverExternalPackages` -- the root cause was pnpm's strict node_modules isolation not hoisting the transitive dependency to the project root where Next.js tries to resolve it

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Build is clean, ready for continued development
- No blockers introduced

---
*Quick task: 023*
*Completed: 2026-01-29*
