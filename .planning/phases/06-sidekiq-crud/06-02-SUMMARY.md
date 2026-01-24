---
phase: "06"
plan: "02"
subsystem: sidekiq-crud
tags: [avatar, hooks, utilities, optimistic-updates, localStorage]

dependency-graph:
  requires: []
  provides: [avatar-utilities, sidekiq-actions-hook, view-preference-hook]
  affects: [06-03, 06-04, 06-05, 06-06]

tech-stack:
  added:
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - "@dnd-kit/utilities@3.2.2"
    - "@uiw/react-md-editor@4.0.11"
  patterns:
    - "djb2 hash algorithm for deterministic color generation"
    - "Optimistic updates with tRPC cache manipulation"
    - "SSR-safe localStorage with useEffect hydration"

files:
  created:
    - sidekiq-webapp/src/lib/utils/avatar.ts
    - sidekiq-webapp/src/hooks/use-sidekiq-actions.ts
    - sidekiq-webapp/src/hooks/use-view-preference.ts
    - sidekiq-webapp/src/components/ui/breadcrumb.tsx
  modified:
    - sidekiq-webapp/package.json
    - sidekiq-webapp/pnpm-lock.yaml

decisions:
  - id: avatar-color-algorithm
    choice: "djb2 hash with 12-color palette"
    reason: "Deterministic, consistent across sessions, good distribution"
  - id: initials-extraction
    choice: "2 chars from single word, first letters of first 2 words"
    reason: "Matches common avatar patterns (Slack, GitHub)"
  - id: view-preference-storage
    choice: "localStorage with SSR-safe hydration"
    reason: "No server round-trip needed, respects user preference"

metrics:
  duration: "28min"
  completed: "2026-01-24"
---

# Phase 06 Plan 02: Utilities and Hooks Summary

**One-liner:** Avatar utilities with djb2 hash coloring, sidekiq mutation hooks with optimistic delete/favorite, and SSR-safe view preference persistence.

## Execution Results

### Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Install Phase 6 dependencies | Done | fc8fe71 |
| 2 | Create avatar utility functions | Done | 9206bbb |
| 3 | Create sidekiq actions hook with optimistic updates | Done | cf37345 |

### Key Artifacts

**Avatar utilities (`src/lib/utils/avatar.ts`):**
- `AVATAR_COLORS`: 12-color palette (red through pink)
- `generateColorFromName(name)`: djb2 hash -> palette index
- `getInitials(name)`: Smart extraction (MA from "My Assistant", CO from "Code")
- `createDefaultAvatar(name)`: Creates `{ type: "initials", color }` config

**Sidekiq actions hook (`src/hooks/use-sidekiq-actions.ts`):**
- `createSidekiq`: With rate limit and duplicate name error handling
- `updateSidekiq`: With duplicate name error handling
- `deleteSidekiq`: With optimistic removal from list, rollback on error
- `toggleFavorite`: With optimistic toggle, rollback on error
- `duplicateSidekiq`: Creates copy with success toast

**View preference hook (`src/hooks/use-view-preference.ts`):**
- Persists "grid" | "list" to localStorage
- SSR-safe: initializes with default, hydrates on mount
- Exposes `isHydrated` for UI transition handling

### Dependencies Added

- `@dnd-kit/core@6.3.1` - Drag-drop foundation
- `@dnd-kit/sortable@10.0.0` - Sortable list preset
- `@dnd-kit/utilities@3.2.2` - CSS transform utilities
- `@uiw/react-md-editor@4.0.11` - Markdown editor with preview

### Components Added

- `breadcrumb.tsx` via shadcn CLI

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Avatar color algorithm | djb2 hash mod 12 | Deterministic, fast, good distribution across palette |
| Initials logic | 2 chars or first letters | Matches Slack/GitHub patterns, handles single-word names |
| View preference storage | localStorage with useEffect | No server dependency, instant preference application |
| Optimistic updates | Delete and toggleFavorite only | Create/update need form validation, duplicating needs new ID |

## Deviations from Plan

None - plan executed exactly as written.

## Must-Haves Verification

| Truth | Verified |
|-------|----------|
| Avatar color is deterministically generated from name | Yes - djb2 hash ensures same name -> same color |
| Initials correctly extracted | Yes - "My Assistant"->MA, "Code"->CO, ""->? |
| Sidekiq mutations have optimistic update hooks | Yes - delete and toggleFavorite optimistic |
| View preference persists across page refreshes | Yes - localStorage with SSR-safe hydration |

## Next Phase Readiness

**Ready for 06-03:** The avatar utilities and hooks are ready for use by:
- `SidekiqAvatar` component (will use `generateColorFromName`, `getInitials`)
- `SidekiqCard` and `SidekiqRow` components (will use `useSidekiqActions`)
- `/sidekiqs` page (will use `useViewPreference`)

**Dependencies for subsequent plans:**
- dnd-kit installed for conversation starters (06-04)
- md-editor installed for instructions field (06-04)
- breadcrumb component ready for form navigation (06-04)
