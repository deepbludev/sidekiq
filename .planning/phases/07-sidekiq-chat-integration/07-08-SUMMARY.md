---
phase: 07-sidekiq-chat-integration
plan: 08
subsystem: ui
tags: [react, model-picker, form, sidekiq]

# Dependency graph
requires:
  - phase: 04-model-selection
    provides: ModelPicker component and DEFAULT_MODEL constant
  - phase: 06-sidekiq-management
    provides: SidekiqForm component with defaultModel schema field
provides:
  - Model picker UI in Sidekiq create/edit form
  - User ability to set default model per Sidekiq
affects: [07-chat-with-sidekiq, chat-interface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ModelPicker integration in React Hook Form via FormField
    - Null fallback to DEFAULT_MODEL for picker value

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/components/sidekiq/sidekiq-form.tsx

key-decisions:
  - "ModelPicker placed after Avatar picker, before Description"
  - "Null fallback to DEFAULT_MODEL ensures picker always has valid value"
  - "Full-width styling with justify-between for consistent form layout"

patterns-established:
  - "FormField wrapper pattern for ModelPicker in forms"

# Metrics
duration: 1min
completed: 2026-01-25
---

# Phase 7 Plan 8: Add Model Selector to Sidekiq Form Summary

**ModelPicker component integrated into SidekiqForm, allowing users to configure default AI model for their Sidekiqs**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-25T16:25:46Z
- **Completed:** 2026-01-25T16:26:43Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added ModelPicker import and DEFAULT_MODEL constant
- Created FormField wrapper for defaultModel with proper label and description
- Wired ModelPicker to existing form schema with null fallback handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ModelPicker to SidekiqForm** - `b87d29f` (feat)

## Files Created/Modified

- `sidekiq-webapp/src/components/sidekiq/sidekiq-form.tsx` - Added ModelPicker FormField after Avatar picker

## Decisions Made

- **Field placement:** Model picker positioned after Avatar picker, before Description - follows logical grouping of identity fields (name, avatar, model) before content fields (description, instructions)
- **Null handling:** Uses `field.value ?? DEFAULT_MODEL` to ensure picker always displays a valid model even when defaultModel is null
- **Styling:** Full-width container with `justify-between` class for consistent alignment with form layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Model picker is now exposed in Sidekiq UI
- Users can set default model when creating/editing Sidekiqs
- The defaultModel value flows through existing schema and is persisted to database
- Model selection priority (thread > sidekiq > user > default) continues to work as designed in 07-02

---
*Phase: 07-sidekiq-chat-integration*
*Plan: 08 (gap closure)*
*Completed: 2026-01-25*
