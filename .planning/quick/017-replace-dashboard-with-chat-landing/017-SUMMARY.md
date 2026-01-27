---
phase: quick-017
plan: 01
subsystem: ui
tags: [next.js, routing, middleware, auth-redirect]

# Dependency graph
requires:
  - phase: v0.1 auth (Phase 0.1)
    provides: Auth pages, middleware, dashboard page
provides:
  - "/chat as the default authenticated landing page"
  - "Dashboard page and sign-out-button removed"
  - "Updated middleware, auth pages, and form components to redirect to /chat"
affects: [auth, routing, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "/chat is the canonical post-auth landing route"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/middleware.ts
    - sidekiq-webapp/src/app/page.tsx
    - sidekiq-webapp/src/app/(auth)/layout.tsx
    - sidekiq-webapp/src/app/(auth)/sign-in/page.tsx
    - sidekiq-webapp/src/app/(auth)/sign-up/page.tsx
    - sidekiq-webapp/src/components/auth/sign-in-form.tsx
    - sidekiq-webapp/src/components/auth/sign-up-form.tsx
    - sidekiq-webapp/src/components/auth/oauth-buttons.tsx
    - sidekiq-webapp/tests/unit/middleware.test.ts
    - sidekiq-webapp/tests/e2e/auth.spec.ts

key-decisions:
  - "Deleted entire (dashboard)/dashboard/ directory since SignOutButton was only used there"

patterns-established:
  - "/chat is the post-authentication default route for all auth flows"

# Metrics
duration: 2min
completed: 2026-01-27
---

# Quick Task 017: Replace Dashboard with Chat Landing Summary

**All auth redirects now point to /chat instead of /dashboard; dashboard page and sign-out-button deleted; 16/16 middleware unit tests passing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-27T10:40:39Z
- **Completed:** 2026-01-27T10:42:41Z
- **Tasks:** 2
- **Files modified:** 10 (8 source + 2 test)

## Accomplishments
- Replaced all `/dashboard` route references with `/chat` across 8 source files
- Deleted dashboard page (`page.tsx`) and its `sign-out-button.tsx` component
- Updated all unit and E2E test assertions from `/dashboard` to `/chat`
- All 16 middleware unit tests passing, zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace all /dashboard references with /chat and delete dashboard files** - `70233ad` (feat)
2. **Task 2: Update unit and E2E tests to reflect /chat as the default route** - `8a897d3` (test)

## Files Created/Modified
- `sidekiq-webapp/src/middleware.ts` - Redirect authenticated users from auth routes to /chat
- `sidekiq-webapp/src/app/page.tsx` - Root page redirects authenticated users to /chat
- `sidekiq-webapp/src/app/(auth)/layout.tsx` - Auth layout redirects authenticated users to /chat
- `sidekiq-webapp/src/app/(auth)/sign-in/page.tsx` - Default callbackUrl changed to /chat
- `sidekiq-webapp/src/app/(auth)/sign-up/page.tsx` - Default callbackUrl changed to /chat
- `sidekiq-webapp/src/components/auth/sign-in-form.tsx` - Default callbackURL prop changed to /chat
- `sidekiq-webapp/src/components/auth/sign-up-form.tsx` - Default callbackURL prop changed to /chat
- `sidekiq-webapp/src/components/auth/oauth-buttons.tsx` - Default callbackURL prop changed to /chat
- `sidekiq-webapp/src/app/(dashboard)/dashboard/page.tsx` - DELETED
- `sidekiq-webapp/src/app/(dashboard)/dashboard/sign-out-button.tsx` - DELETED
- `sidekiq-webapp/tests/unit/middleware.test.ts` - Updated assertions to /chat
- `sidekiq-webapp/tests/e2e/auth.spec.ts` - Updated route protection tests to /chat

## Decisions Made
- Deleted the entire `(dashboard)/dashboard/` directory since `SignOutButton` was only used by the dashboard page (sign-out functionality exists elsewhere in the sidebar)
- Cleaned stale `.next/types` cache for deleted dashboard route to avoid false TypeScript errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleaned stale .next/types cache for deleted dashboard route**
- **Found during:** Task 1 (verification step)
- **Issue:** `npx tsc --noEmit` failed with TS2307 errors in `.next/types/app/(dashboard)/dashboard/page.ts` referencing the deleted source file
- **Fix:** Removed `.next/types/app/(dashboard)/` directory (build cache, not source)
- **Files modified:** `.next/types/` (build artifact, not committed)
- **Verification:** `npx tsc --noEmit` passes cleanly after cleanup
- **Committed in:** Not committed (build artifact)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor build cache cleanup. No scope creep.

## Issues Encountered
None beyond the stale `.next/types` cache documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All auth flows now redirect to /chat as the natural landing experience
- The `(dashboard)` route group still contains `chat/`, `settings/`, `sidekiqs/`, and its `layout.tsx`
- No blockers

---
*Quick Task: 017-replace-dashboard-with-chat-landing*
*Completed: 2026-01-27*
