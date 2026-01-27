---
phase: 09-vertical-slice-architecture
plan: 04
subsystem: sidekiqs-ai
tags: [feature-slice, sidekiqs, ai, model-picker, components, hooks, router, validations, constants]
dependency-graph:
  requires: [09-01, 09-02]
  provides: [sidekiqs-feature-slice, ai-feature-slice, sidekiqs-components, sidekiqs-hooks, sidekiqs-router, sidekiqs-validations, ai-components, ai-hooks, ai-api]
  affects: [09-06]
tech-stack:
  added: []
  patterns: [feature-slice-components, feature-slice-hooks, feature-slice-api, feature-slice-validations, feature-slice-constants]
key-files:
  created:
    - sidekiq-webapp/src/features/sidekiqs/index.ts
    - sidekiq-webapp/src/features/ai/index.ts
  modified:
    - sidekiq-webapp/src/features/sidekiqs/components/ (16 files moved)
    - sidekiq-webapp/src/features/sidekiqs/hooks/use-sidekiq-actions.ts (moved)
    - sidekiq-webapp/src/features/sidekiqs/api/router.ts (moved)
    - sidekiq-webapp/src/features/sidekiqs/validations.ts (moved)
    - sidekiq-webapp/src/features/sidekiqs/constants/emoji-data.ts (moved)
    - sidekiq-webapp/src/features/ai/components/ (6 files moved)
    - sidekiq-webapp/src/features/ai/hooks/use-model-selection.ts (moved)
    - sidekiq-webapp/src/features/ai/api/ (4 files moved)
    - sidekiq-webapp/src/shared/trpc/root.ts
    - sidekiq-webapp/src/shared/layout/sidebar-layout.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-panel.tsx
    - sidekiq-webapp/src/shared/layout/sidebar-mobile-overlay.tsx
    - sidekiq-webapp/src/shared/icons/provider-icons.tsx
    - sidekiq-webapp/src/components/sidebar/index.ts
    - sidekiq-webapp/src/lib/validations/team.ts
    - sidekiq-webapp/src/app/(dashboard)/sidekiqs/ (3 pages updated)
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/features/chats/components/ (6 chat files updated)
    - sidekiq-webapp/src/components/team/ (2 team files updated)
    - sidekiq-webapp/tests/ (7 test files updated)
decisions:
  - id: D-09-04-01
    title: Sidekiqs feature completed as part of Plan 09-03
    context: The parallel Plan 09-03 agent moved both chats AND sidekiqs in one commit (8696bdc), including all 16 components, hook, router, validations, constants, barrel export, and all external importer updates.
    decision: Verified the sidekiqs feature slice from 09-03 and proceeded to Task 2 (AI feature) as the primary deliverable of this plan.
  - id: D-09-04-02
    title: emoji-data constants moved from shared to sidekiqs
    context: emoji-data.ts was in shared/constants/ but is only used by the emoji-picker-popover in the sidekiqs feature.
    decision: Moved to features/sidekiqs/constants/ as planned. This is feature-specific data, not shared infrastructure.
  - id: D-09-04-03
    title: AI barrel export separates client-safe and server-only exports
    context: The AI feature has client-safe metadata (models-metadata.ts) and server-only code (gateway.ts, models.ts, title.ts).
    decision: The barrel index.ts exports only client-safe items. Server-only modules must be imported via deep paths (@sidekiq/ai/api/models, @sidekiq/ai/api/gateway).
metrics:
  duration: ~14 minutes
  completed: 2026-01-27
---

# Phase 9 Plan 4: Sidekiqs and AI Feature Slices Summary

Moved the Sidekiqs feature (16 components + sidebar panel + router + validations + constants + hook) and AI feature (6 components + 1 hook + 4 API files) into their respective vertical feature slices with all imports updated.

## What Changed

### Task 1: Sidekiqs Feature Slice (verified from 09-03 commit)

The sidekiqs feature was moved as part of the Plan 09-03 commit (8696bdc). This plan verified the complete migration:

**Files moved to `src/features/sidekiqs/`:**
- `components/`: 16 files (14 from `components/sidekiq/` + `sidebar-panel-sidekiqs` from `components/sidebar/` + `starter-templates.tsx`)
- `hooks/use-sidekiq-actions.ts`: from `hooks/`
- `api/router.ts`: from `server/api/routers/sidekiq.ts`
- `validations.ts`: from `lib/validations/sidekiq.ts`
- `constants/emoji-data.ts`: from `shared/constants/`
- `index.ts`: barrel export

**External importers updated:**
- Root tRPC router (`shared/trpc/root.ts`)
- Sidebar layout (`shared/layout/sidebar-layout.tsx`, `sidebar-panel.tsx`, `sidebar-mobile-overlay.tsx`)
- Sidebar barrel (`components/sidebar/index.ts`)
- App pages (sidekiqs list, new, edit)
- Chat components (chat-header, chat-input, chat-interface, message-item, message-list, thread-item)
- Team components (team-settings-section, team-form)
- Validation cross-reference (`lib/validations/team.ts`)
- Test files (3 updated)

### Task 2: AI Feature Slice

**Files moved to `src/features/ai/`:**
- `api/gateway.ts`: from `lib/ai/gateway.ts`
- `api/models.ts`: from `lib/ai/models.ts`
- `api/models-metadata.ts`: from `lib/ai/models-metadata.ts`
- `api/title.ts`: from `lib/ai/title.ts`
- `components/model-picker.tsx`: from `components/model-picker/`
- `components/model-picker-content.tsx`
- `components/model-picker-trigger.tsx`
- `components/model-item.tsx`
- `components/model-hover-card.tsx`
- `components/index.ts` (barrel)
- `hooks/use-model-selection.ts`: from `hooks/`
- `index.ts`: barrel export

**External importers updated:**
- Chat API route (`app/api/chat/route.ts`)
- Chat components (chat-interface, message-item, model-switch-hint)
- Chat validations (`features/chats/validations.ts`)
- Provider icons (`shared/icons/provider-icons.tsx`)
- Sidekiq form (already pointed to `@sidekiq/ai/*` from 09-03)
- Test files (6 updated: models, models-metadata, model-picker-trigger, use-model-selection, chat.test, chat validation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] lib/validations/team.ts import broken**
- **Found during:** Task 1 import verification
- **Issue:** `team.ts` had `import { sidekiqAvatarSchema } from "./sidekiq"` which broke when `sidekiq.ts` was deleted
- **Fix:** Updated to `import { sidekiqAvatarSchema } from "@sidekiq/sidekiqs/validations"`
- **Files modified:** `src/lib/validations/team.ts`

**2. [Rule 3 - Blocking] sidebar-mobile-overlay and sidebar-panel imports broken**
- **Found during:** Task 1 tsc verification
- **Issue:** Both files imported `SidebarPanelSidekiqs` from deleted `@sidekiq/components/sidebar/sidebar-panel-sidekiqs`
- **Fix:** Updated to `@sidekiq/sidekiqs/components/sidebar-panel-sidekiqs`
- **Files modified:** `src/shared/layout/sidebar-mobile-overlay.tsx`, `src/shared/layout/sidebar-panel.tsx`

**3. [Rule 1 - Bug] Duplicate SidekiqAvatar identifier in barrel export**
- **Found during:** Task 1 tsc verification
- **Issue:** `SidekiqAvatar` component and `type SidekiqAvatar` validation type both exported from index.ts caused duplicate identifier error
- **Fix:** Renamed type export to `SidekiqAvatarType` in barrel; consumers already use deep imports for specific items
- **Files modified:** `src/features/sidekiqs/index.ts`

## Verification Results

- **tsc --noEmit:** 0 errors from this plan (5 errors from parallel Plan 09-05 workspace feature)
- **vitest run:** 7/7 related test files pass (179 tests), 30/34 overall pass (4 failures from parallel Plan 09-05 auth feature)
- **Sidekiqs slice:** 16 components, 1 hook, 1 router, 1 validations file, 1 constants file in `src/features/sidekiqs/`
- **AI slice:** 6 components, 1 hook, 4 API files in `src/features/ai/`
- **No old imports:** Zero references to old paths in src/ or tests/

## Commits

| Hash | Message |
|------|---------|
| 8696bdc | feat(09-03): move chat components, thread components, sidebar panels, and hooks to features/chats/ (included sidekiqs) |
| 7f6ef1c | feat(09-04): move AI feature to vertical slice |

## Next Phase Readiness

- Sidekiqs and AI feature slices are complete and self-contained
- External consumers import via `@sidekiq/sidekiqs/*` and `@sidekiq/ai/*` path aliases
- Ready for Plan 09-06 (cleanup and barrel exports) to finalize the migration
- Note: `lib/validations/team.ts` still cross-imports from sidekiqs; this can be addressed when workspace feature is moved
