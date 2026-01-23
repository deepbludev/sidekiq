# Phase 3 Plan 1: Thread Router and Routing Summary

tRPC thread router with CRUD mutations (list, delete, archive, unarchive, togglePin, rename) and routing setup for /chat (new) and /chat/[threadId] (existing).

## Frontmatter

```yaml
phase: 03-thread-management
plan: 01
subsystem: api/routing
tags: [trpc, routing, crud, threads]

dependency-graph:
  requires: [01-01, 01-02]  # Core streaming, chat interface
  provides: [thread-router, thread-validations, chat-routing]
  affects: [03-02]  # Thread creation on first message

tech-stack:
  added: []
  patterns:
    - tRPC protectedProcedure for all mutations
    - Ownership verification via userId in WHERE clause
    - Next.js 15 async params for dynamic routes

key-files:
  created:
    - sidekiq-webapp/src/lib/validations/thread.ts
    - sidekiq-webapp/src/server/api/routers/thread.ts
    - sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
  modified:
    - sidekiq-webapp/src/server/api/root.ts
    - sidekiq-webapp/src/app/(dashboard)/chat/page.tsx
    - sidekiq-webapp/src/components/chat/chat-interface.tsx

decisions:
  - key: thread-routing-structure
    choice: /chat for new, /chat/[threadId] for existing
    rationale: Clear URL semantics, supports thread creation on first message

metrics:
  duration: 4min
  completed: 2026-01-23
```

## Summary

Built the foundation for thread management: a complete tRPC router with 6 procedures (1 query, 5 mutations) and routing structure separating new chat state from existing threads.

### What Was Built

**Thread Validation Schemas (`lib/validations/thread.ts`):**
- `threadIdSchema` - nanoid string validation
- `threadTitleSchema` - 1-255 character validation
- Input schemas for all mutations: delete, archive, unarchive, togglePin, rename
- `listThreadsInputSchema` with optional includeArchived filter

**Thread tRPC Router (`server/api/routers/thread.ts`):**
- `list` query - Returns user's threads sorted by isPinned DESC, lastActivityAt DESC
- `delete` mutation - Permanent deletion with ownership check
- `archive` mutation - Soft-delete (sets isArchived = true)
- `unarchive` mutation - Restores archived thread
- `togglePin` mutation - Read-then-update pattern for pin toggle
- `rename` mutation - Updates title with validation

All mutations use `protectedProcedure` and include `userId` in WHERE clause for security.

**Routing Structure:**
- `/chat` - New chat state, passes `threadId={null}` to ChatInterface
- `/chat/[threadId]` - Loads existing thread with messages, redirects to /chat if not found

### Key Implementation Details

1. **Ownership Security:** All mutations verify `threads.userId === ctx.session.user.id` before modifying
2. **Pin Toggle Pattern:** Reads current state first to determine new value (read-then-update)
3. **UIMessage Conversion:** Database messages converted to AI SDK format with parts array
4. **Archived Thread Viewing:** isArchived doesn't prevent viewing, only filters list query by default

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 3cac70e | feat | Add thread validation schemas |
| 5185d47 | feat | Add thread tRPC router with CRUD operations |
| 71d2338 | feat | Set up /chat and /chat/[threadId] routing |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Immediate Next Steps (03-02)
- Thread creation on first message send
- Auto-title generation after first AI response
- URL navigation after thread creation

### Dependencies for Future Plans
- Thread router ready for sidebar integration (Phase 5)
- Optimistic update patterns documented in RESEARCH.md for frontend

### Blockers/Concerns
- ChatInterface needs to handle `threadId: null` case for sending messages (next plan)
- API endpoint `/api/chat` needs to create thread if threadId not provided (next plan)
