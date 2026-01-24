---
phase: "06"
plan: "05"
subsystem: sidekiq-crud
tags: [conversation-starters, instructions-editor, markdown, drag-drop, dnd-kit]

dependency-graph:
  requires:
    - phase: "06-04"
      provides: "SidekiqForm component with basic fields"
  provides:
    - ConversationStarters component with drag-and-drop
    - InstructionsEditor component with markdown preview
    - Form integration with new field components
  affects: [06-07, 07-sidekiq-integration]

tech-stack:
  added:
    - "@dnd-kit/core"
    - "@dnd-kit/sortable"
    - "@dnd-kit/utilities"
    - "@uiw/react-md-editor"
  patterns:
    - "Sortable context for drag-drop reordering"
    - "Dynamic import for SSR-incompatible components"
    - "Keyboard sensor for accessible drag-drop"

key-files:
  created:
    - sidekiq-webapp/src/components/sidekiq/conversation-starters.tsx
    - sidekiq-webapp/src/components/sidekiq/instructions-editor.tsx
  modified:
    - sidekiq-webapp/src/components/sidekiq/sidekiq-form.tsx

key-decisions:
  - "Curated starter approach - max 6 items, 200 chars each"
  - "Textarea for editing, MDEditor.Markdown for preview-only (simpler)"
  - "Dynamic import to avoid SSR hydration issues"
  - "8px activation distance to prevent accidental drags"

patterns-established:
  - "@dnd-kit useSortable pattern for reorderable lists"
  - "Dynamic import with loading skeleton for heavy components"
  - "Character counter with color thresholds (90% amber, 100% red)"

metrics:
  duration: "3min"
  completed: "2026-01-24"
---

# Phase 06 Plan 05: Conversation Starters & Instructions Editor Summary

**Drag-and-drop conversation starters and markdown instructions editor with preview toggle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T17:34:00Z
- **Completed:** 2026-01-24T17:37:31Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- ConversationStarters component with @dnd-kit drag-and-drop
- InstructionsEditor with markdown preview toggle
- Form integration with both new components
- Keyboard accessibility via KeyboardSensor

## Task Commits

Each task was committed atomically:

1. **Task 1: Create drag-and-drop conversation starters** - `a9d35fc` (feat)
2. **Task 2: Create markdown instructions editor** - `486a393` (feat)
3. **Task 3: Integrate components into form** - `07e3588` (feat)

## Files Created/Modified

- `src/components/sidekiq/conversation-starters.tsx` - Sortable starters with add/remove/reorder
- `src/components/sidekiq/instructions-editor.tsx` - Markdown editor with preview toggle
- `src/components/sidekiq/sidekiq-form.tsx` - Added new field integrations

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drag-drop library | @dnd-kit | Modern, accessible, lightweight vs react-beautiful-dnd |
| Markdown preview | MDEditor.Markdown only | Simpler than full editor, avoids styling conflicts |
| SSR handling | Dynamic import | Prevents hydration mismatch for client-only components |
| Activation distance | 8px | Prevents accidental drags when clicking input |

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - dependencies installed via pnpm.

## Must-Haves Verification

| Truth | Verified |
|-------|----------|
| User can add and reorder conversation starters via drag-and-drop | Yes - @dnd-kit sortable context |
| Conversation starters limited to 6 items, 200 chars each | Yes - maxItems/maxLength props |
| Instructions field has markdown support with preview toggle | Yes - InstructionsEditor with toggle |
| Drag handle is visible and keyboard accessible | Yes - KeyboardSensor + visible handle |

## Next Phase Readiness

**Ready for 06-06:** Form now supports:
- Drag-drop reorderable conversation starters (max 6)
- Markdown instructions with preview toggle
- Character limits with visual feedback

**Ready for 06-07:** All form fields complete, ready for edit page integration.

---

*Phase: 06-sidekiq-crud*
*Completed: 2026-01-24*
