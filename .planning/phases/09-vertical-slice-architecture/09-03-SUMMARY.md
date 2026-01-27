---
phase: 09-vertical-slice-architecture
plan: 03
subsystem: chats
tags: [feature-slice, chats, threads, components, hooks, router, validations]
dependency-graph:
  requires: [09-01, 09-02]
  provides: [chats-feature-slice, chats-components, chats-hooks, chats-router, chats-validations]
  affects: [09-06]
tech-stack:
  added: []
  patterns: [feature-slice-components, feature-slice-hooks, feature-slice-api, feature-slice-validations]
key-files:
  created:
    - sidekiq-webapp/src/features/chats/validations.ts
  modified:
    - sidekiq-webapp/src/features/chats/components/ (20 files moved)
    - sidekiq-webapp/src/features/chats/hooks/ (5 files moved)
    - sidekiq-webapp/src/features/chats/api/router.ts (moved)
    - sidekiq-webapp/src/shared/trpc/root.ts
    - sidekiq-webapp/src/shared/layout/sidebar-panel.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-mobile-overlay.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-layout.tsx
    - sidekiq-webapp/src/app/(dashboard)/chat/page.tsx
    - sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/components/sidebar/index.ts
    - sidekiq-webapp/vitest.config.ts
    - sidekiq-webapp/tests/ (16 test files updated)
decisions:
  - id: CHAT-SLICE-01
    description: "Merged chat.ts and thread.ts validations into single features/chats/validations.ts"
    rationale: "Chat and thread are a single domain; consolidating reduces duplication and establishes the feature-owns-validations pattern"
  - id: CHAT-SLICE-02
    description: "Added wildcard aliases to vitest.config.ts for all feature slice subpaths"
    rationale: "vitest.config.ts only had barrel aliases (e.g., @sidekiq/chats -> index.ts) but lacked wildcard aliases (@sidekiq/chats/* -> src/features/chats/*) needed for subpath imports in tests"
  - id: CHAT-SLICE-03
    description: "Updated sidekiq-related imports in chat components to use @sidekiq/sidekiqs/* paths"
    rationale: "Parallel plan 09-04 already moved sidekiq files to features/sidekiqs/; imports must reference the new locations"
metrics:
  duration: ~12 minutes
  completed: 2026-01-27
---

# Phase 9 Plan 3: Chats Feature Slice Summary

Moved all chat and thread domain code into the `src/features/chats/` feature slice -- the largest slice at ~25 source files.

## One-liner

Complete chats feature slice with 20 components, 5 hooks, tRPC router, and merged validations migrated to features/chats/

## What Was Done

### Task 1: Move chat components, thread components, sidebar panels, and hooks (8696bdc)

Moved 25 files into the chats feature slice:

**12 chat components** from `components/chat/`:
- chat-header, chat-input, chat-interface, chat-scroll-anchor
- empty-state, message-actions, message-content, message-item
- message-list, model-switch-hint, scroll-to-bottom, typing-indicator

**4 thread components** from `components/thread/`:
- thread-item, thread-context-menu, delete-thread-dialog, rename-thread-input

**3 sidebar panels** from `components/sidebar/`:
- sidebar-panel-chats, sidebar-thread-list, sidebar-thread-group

**5 hooks** from `hooks/`:
- use-thread-actions, use-auto-scroll, use-scroll-position
- use-keyboard-shortcuts, use-thread-search

Fixed all imports:
- Internal: relative paths for siblings within the feature
- External: `@sidekiq/chats/*` path aliases for consumers (app pages, layout, tests)
- Removed moved exports from `components/sidebar/index.ts`
- Updated 11 test files with new import paths

### Task 2: Move chat router and validations (9f75a35)

**Router migration:**
- Moved `server/api/routers/thread.ts` to `features/chats/api/router.ts`
- Updated import in router from `@sidekiq/lib/validations/thread` to relative `../validations`
- Updated root tRPC router (`shared/trpc/root.ts`) to import from `@sidekiq/chats/api/router`

**Validations consolidation:**
- Merged `lib/validations/chat.ts` (chat request schemas) and `lib/validations/thread.ts` (thread CRUD schemas) into `features/chats/validations.ts`
- Removed original validation files via `git rm`
- Updated all consumers: API route, router, test files

**Vitest config fix (Rule 3 - Blocking):**
- Added wildcard aliases for all feature slices to `vitest.config.ts`
- Changed exact-match aliases to regex patterns (`@sidekiq/chats` -> `/^@sidekiq\/chats$/`)
- Added subpath patterns (`@sidekiq/chats/*` -> `src/features/chats/$1`)
- Required for tests to resolve subpath imports like `@sidekiq/chats/components/thread-item`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest wildcard aliases missing**
- **Found during:** Task 2 verification
- **Issue:** vitest.config.ts had exact-match aliases for feature barrels but no wildcard aliases for subpath imports (e.g., `@sidekiq/chats/components/*`)
- **Fix:** Converted all feature aliases to regex patterns with both exact and wildcard variants
- **Files modified:** vitest.config.ts
- **Commit:** 9f75a35

**2. [Rule 3 - Blocking] Parallel plan 09-04 moved sidekiq files**
- **Found during:** Task 1 and Task 2
- **Issue:** Running in parallel with 09-04 (sidekiqs feature slice), the original `@sidekiq/lib/validations/sidekiq` and `@sidekiq/components/sidekiq/*` paths no longer existed
- **Fix:** Updated all chat component imports referencing sidekiq types/components to use `@sidekiq/sidekiqs/*` paths
- **Files modified:** chat-header.tsx, chat-input.tsx, chat-interface.tsx, message-item.tsx, message-list.tsx, thread-item.tsx
- **Commit:** 9f75a35

## Verification

- `tsc --noEmit` passes (only errors from parallel plans 09-04/09-05, none from 09-03)
- `vitest run` passes all 204 chats-related tests across 14 test files
- All chat domain code resides in `src/features/chats/`
- No imports reference old `components/chat/`, `components/thread/`, `hooks/use-thread-*`, `hooks/use-auto-scroll`, `hooks/use-scroll-position`, `hooks/use-keyboard-shortcuts`, `lib/validations/chat`, `lib/validations/thread`, or `server/api/routers/thread` paths

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| CHAT-SLICE-01 | Merged chat + thread validations into single file | Single domain; reduces duplication, establishes feature-owns-validations pattern |
| CHAT-SLICE-02 | Added wildcard vitest aliases for all features | Required for subpath imports in test files to resolve correctly |
| CHAT-SLICE-03 | Used @sidekiq/sidekiqs/* imports | Parallel 09-04 already moved sidekiq files; must reference new locations |

## Next Phase Readiness

The chats feature slice is complete. The pattern established here (components/, hooks/, api/router.ts, validations.ts) serves as the template for remaining feature slices. Plan 09-06 (barrel exports and cleanup) can proceed.
