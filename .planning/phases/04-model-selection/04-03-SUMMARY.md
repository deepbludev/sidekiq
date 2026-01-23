---
phase: 04-model-selection
plan: 03
subsystem: ui
tags: [react, trpc, model-picker, user-preferences, jsonb, optimistic-updates]

# Dependency graph
requires:
  - phase: 04-01
    provides: Schema with user.preferences JSONB, threads.activeModel column, model metadata types
  - phase: 04-02
    provides: ModelPicker component with fuzzy search, favorites, and provider grouping
provides:
  - User preferences tRPC router for favorites and default model
  - useModelSelection hook with optimistic updates
  - Model picker integrated into chat interface
  - Thread activeModel persistence on each message
  - Model switch inline hints in conversations
affects: [phase-05-sidebar, phase-06-sidekiqs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optimistic updates with tRPC mutation rollback
    - Client/server module split for server-only imports
    - Render prop pattern for model switch hints

key-files:
  created:
    - sidekiq-webapp/src/server/api/routers/user.ts
    - sidekiq-webapp/src/lib/validations/user.ts
    - sidekiq-webapp/src/hooks/use-model-selection.ts
    - sidekiq-webapp/src/components/chat/model-switch-hint.tsx
    - sidekiq-webapp/src/lib/ai/models-metadata.ts
  modified:
    - sidekiq-webapp/src/server/api/root.ts
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/components/chat/chat-interface.tsx
    - sidekiq-webapp/src/components/chat/chat-input.tsx
    - sidekiq-webapp/src/components/chat/message-list.tsx
    - sidekiq-webapp/src/lib/ai/models.ts

key-decisions:
  - "Split models.ts into client-safe models-metadata.ts and server-only models.ts to avoid server-only import in client components"
  - "Render prop pattern for ModelSwitchHint to avoid coupling MessageList to hint rendering"
  - "Optimistic updates with rollback for user preferences mutations"
  - "Model sent via sendMessage body option rather than transport body for per-message flexibility"

patterns-established:
  - "Client/server module split: separate metadata (client-safe) from server-only functionality"
  - "tRPC optimistic updates: cancel, snapshot, setData, rollback on error, invalidate on settle"
  - "Slot prop pattern: pass component as prop (modelPicker) for flexible composition"

# Metrics
duration: 7min
completed: 2026-01-23
---

# Phase 04 Plan 03: Persistence & Integration Summary

**Model picker integrated with user preferences persistence, optimistic updates, and thread activeModel tracking**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-23T19:55:43Z
- **Completed:** 2026-01-23T20:02:55Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments

- User preferences tRPC router with getPreferences and updateModelPreferences procedures
- useModelSelection hook managing model state with thread/user default/system default priority
- Model picker integrated into chat input with disabled state during streaming
- Thread activeModel persisted on both new thread creation and existing thread updates
- Model switch inline hints rendered between messages when user changes model mid-conversation
- Client/server module split to prevent server-only import errors in client components

## Task Commits

Each task was committed atomically:

1. **Task 1: Create user preferences tRPC router** - `7407bd6` (feat)
2. **Task 2: Create model selection hook and update chat route** - `4f82a1a` (feat)
3. **Task 3: Integrate model picker into chat interface** - `fca5ed5` (feat)

## Files Created/Modified

**Created:**
- `sidekiq-webapp/src/server/api/routers/user.ts` - User preferences tRPC router
- `sidekiq-webapp/src/lib/validations/user.ts` - Zod schema for model preferences update
- `sidekiq-webapp/src/hooks/use-model-selection.ts` - React hook for model selection with preferences
- `sidekiq-webapp/src/components/chat/model-switch-hint.tsx` - Inline hint for model switches
- `sidekiq-webapp/src/lib/ai/models-metadata.ts` - Client-safe model metadata (split from models.ts)

**Modified:**
- `sidekiq-webapp/src/server/api/root.ts` - Added userRouter to appRouter
- `sidekiq-webapp/src/app/api/chat/route.ts` - Persist activeModel on thread insert/update
- `sidekiq-webapp/src/components/chat/chat-interface.tsx` - Integrated model selection
- `sidekiq-webapp/src/components/chat/chat-input.tsx` - Added modelPicker slot prop
- `sidekiq-webapp/src/components/chat/message-list.tsx` - Added modelSwitches rendering
- `sidekiq-webapp/src/lib/ai/models.ts` - Re-exports from metadata, server-only getModel
- `sidekiq-webapp/src/components/model-picker/*.tsx` - Updated imports to models-metadata

## Decisions Made

1. **Split models.ts for client/server separation** - The models.ts file imported from gateway.ts which has "server-only" directive. Build failed when client components imported getModelConfig. Created models-metadata.ts with all client-safe exports, models.ts re-exports and adds server-only getModel.

2. **Render prop for model switch hints** - Instead of MessageList directly importing ModelSwitchHint, passed renderModelSwitchHint as prop. This decouples rendering and allows ChatInterface to control hint appearance.

3. **Model passed via sendMessage body option** - Using `sendMessage({ text }, { body: { model } })` rather than putting model in transport.body. This allows per-message model flexibility rather than per-component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Split models.ts to avoid server-only import in client components**
- **Found during:** Task 3 (Build verification)
- **Issue:** models.ts imports from gateway.ts which has "server-only" directive. Client components (ModelSwitchHint, model-picker components) importing getModelConfig caused build failure.
- **Fix:** Created models-metadata.ts with all client-safe exports (types, AVAILABLE_MODELS, DEFAULT_MODEL, getModelConfig, isValidModel, etc.). Updated models.ts to re-export from metadata and only add server-only getModel function. Updated all client component imports.
- **Files modified:** models-metadata.ts (new), models.ts, model-switch-hint.tsx, use-model-selection.ts, provider-icons.tsx, model-picker components
- **Verification:** Build passes, typecheck passes, lint passes
- **Committed in:** fca5ed5 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to resolve build failure. Clean separation improves codebase architecture.

## Issues Encountered

None beyond the blocking issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Model selection feature complete
- Ready for Phase 5 (Sidebar) which will show thread list with model indicators
- User preferences infrastructure ready for Phase 6/7 (Sidekiqs) sidekiqDefaults

**Phase 4 Complete:** All 3 plans executed successfully. Model selection with user preferences, persistence, and UI integration working.

---
*Phase: 04-model-selection*
*Completed: 2026-01-23*
