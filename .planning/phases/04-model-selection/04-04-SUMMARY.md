---
phase: 04-model-selection
plan: 04
subsystem: ui
tags: [react, popover, radix-ui, forwardRef]

# Dependency graph
requires:
  - phase: 04-02
    provides: ModelPickerTrigger component with forwardRef
provides:
  - Working model picker that opens on click
  - Props forwarding pattern for Radix UI asChild components
affects: [05-sidebar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ComponentPropsWithoutRef for rest prop typing"
    - "Props spread for Radix asChild compatibility"

key-files:
  created: []
  modified:
    - sidekiq-webapp/src/components/model-picker/model-picker-trigger.tsx

key-decisions:
  - "Extend interface from ComponentPropsWithoutRef<button> for full prop forwarding"

patterns-established:
  - "Radix asChild pattern: child components must spread ...props to forward event handlers"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 04 Plan 04: Model Picker Fix Summary

**Fixed model picker dropdown by forwarding rest props (including onClick) from PopoverTrigger to the Button element**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T (session start)
- **Completed:** 2026-01-23T (session end)
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed model picker dropdown not opening when clicked
- ModelPickerTrigger now properly extends ComponentPropsWithoutRef<"button">
- All props from PopoverTrigger (including onClick) flow through to Button element
- Unblocked 9 previously skipped UAT tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Forward rest props in ModelPickerTrigger** - `a08d3f8` (fix)

Task 2 was verification only (no code changes).

## Files Created/Modified
- `sidekiq-webapp/src/components/model-picker/model-picker-trigger.tsx` - Extended interface from ComponentPropsWithoutRef and spread rest props on Button

## Decisions Made
- Used `React.ComponentPropsWithoutRef<"button">` to properly type rest props while avoiding ref conflicts with forwardRef

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None - the fix was straightforward once the issue was diagnosed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Model picker fully functional and ready for use
- Phase 4 gap closure complete
- Ready for Phase 5 (Sidebar & Navigation)

---
*Phase: 04-model-selection*
*Completed: 2026-01-23*
