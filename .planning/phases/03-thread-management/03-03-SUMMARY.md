---
phase: 03-thread-management
plan: 03
subsystem: thread-ui
tags: [ui, components, context-menu, dialog, optimistic-updates, trpc]

dependency-graph:
  requires:
    - 03-01 (thread router with CRUD operations)
  provides:
    - useThreadActions hook for thread mutations
    - ThreadItem component with hover actions and context menu
    - DeleteThreadDialog for confirmation
    - RenameThreadInput for inline editing
    - ThreadContextMenu for right-click actions
  affects:
    - Phase 5 (sidebar integration)

tech-stack:
  added:
    - "@radix-ui/react-context-menu"
    - "@radix-ui/react-alert-dialog"
  patterns:
    - Optimistic updates with cache rollback
    - Toast notifications with undo actions
    - Context menu + hover actions combination

key-files:
  created:
    - sidekiq-webapp/src/components/ui/context-menu.tsx
    - sidekiq-webapp/src/components/ui/alert-dialog.tsx
    - sidekiq-webapp/src/hooks/use-thread-actions.ts
    - sidekiq-webapp/src/components/thread/delete-thread-dialog.tsx
    - sidekiq-webapp/src/components/thread/rename-thread-input.tsx
    - sidekiq-webapp/src/components/thread/thread-context-menu.tsx
    - sidekiq-webapp/src/components/thread/thread-item.tsx
    - sidekiq-webapp/src/components/thread/index.ts
  modified:
    - sidekiq-webapp/src/app/api/chat/route.ts (null check fix)

decisions:
  - decision: "Optimistic updates for all mutations"
    rationale: "Provides instant feedback, better UX"
  - decision: "Toast with undo for archive action"
    rationale: "Archive is quick action, but reversible - per CONTEXT.md"
  - decision: "5 second undo window for archive"
    rationale: "Standard duration, enough time to react"

metrics:
  duration: "4 min 30 sec"
  completed: "2026-01-23"
---

# Phase 03 Plan 03: Thread Action UI Summary

Thread action UI components with context menu, hover actions, delete confirmation, and inline rename.

## What Was Built

### 1. shadcn/ui Components (Task 1)
Installed Radix-based UI primitives:
- **context-menu.tsx**: Right-click menu with keyboard navigation
- **alert-dialog.tsx**: Modal confirmation dialog

### 2. useThreadActions Hook (Task 2)
Custom hook wrapping all thread tRPC mutations:

```typescript
const {
  deleteThread, archiveThread, unarchiveThread,
  togglePin, renameThread, isDeleting
} = useThreadActions({ activeThreadId });
```

Features:
- Optimistic cache updates for instant UI feedback
- Error rollback on mutation failure
- Toast notifications with undo action (archive)
- Navigation to /chat after deleting/archiving active thread

### 3. Thread Components (Task 3)
Four specialized components:

**DeleteThreadDialog**
- Confirmation dialog for permanent deletion
- Shows thread title and suggests archive alternative
- Loading state during deletion

**RenameThreadInput**
- Inline input with auto-focus and text selection
- Enter to confirm, Escape to cancel
- Blur handling for save/cancel

**ThreadContextMenu**
- Right-click menu with all thread actions
- Pin/Unpin, Rename, Archive/Restore, Delete
- Destructive styling for delete action

**ThreadItem**
- Main list item component
- Pin/archive visual indicators
- Hover reveals quick action buttons
- Wraps content in context menu trigger

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed null check in route.ts**
- **Found during:** Task 2
- **Issue:** TypeScript error - `thread` possibly undefined after insert
- **Fix:** Added null check with 500 error response
- **Files modified:** sidekiq-webapp/src/app/api/chat/route.ts
- **Commit:** 3005915

## Key Implementation Notes

### Optimistic Update Pattern
```typescript
onMutate: async ({ threadId }) => {
  await utils.thread.list.cancel();
  const previousThreads = utils.thread.list.getData();

  utils.thread.list.setData(undefined, (old) =>
    old?.map((t) => (t.id === threadId ? { ...t, isPinned: !t.isPinned } : t))
  );

  return { previousThreads };
},
onError: (error, _variables, context) => {
  if (context?.previousThreads) {
    utils.thread.list.setData(undefined, context.previousThreads);
  }
  toast.error("Failed to update pin status");
}
```

### Component Hierarchy
```
ThreadItem
├── ThreadContextMenu (wraps content)
│   └── div (clickable item)
│       ├── Pin indicator
│       ├── Title / RenameThreadInput
│       ├── Archive indicator
│       └── Hover actions (Pin, MoreMenu)
└── DeleteThreadDialog (portal)
```

## Verification Results

- [x] shadcn/ui context-menu and alert-dialog installed
- [x] useThreadActions hook provides all mutations with optimistic updates
- [x] ThreadItem renders with hover action buttons
- [x] Right-click opens context menu with all thread actions
- [x] Delete shows confirmation dialog before execution
- [x] Archive shows toast with undo action
- [x] Pin toggle updates immediately (optimistic)
- [x] Rename shows inline input on click
- [x] TypeScript compiles without errors
- [x] Lint passes

## Next Phase Readiness

Components are ready for sidebar integration in Phase 5:
- Export barrel at `@sidekiq/components/thread`
- ThreadItem accepts thread object matching tRPC output
- useThreadActions can be used standalone or within ThreadItem
