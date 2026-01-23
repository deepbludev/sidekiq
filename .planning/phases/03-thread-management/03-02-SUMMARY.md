# Phase 3 Plan 2: Thread Creation and Auto-Title Summary

Thread creation on first message with X-Thread-Id header response, auto-title generation using gpt-4o-mini, and ChatInterface redirect handling.

## Frontmatter

```yaml
phase: 03-thread-management
plan: 02
subsystem: api/chat
tags: [thread-creation, auto-title, streaming, ai-sdk, nanoid]

dependency-graph:
  requires:
    - phase: 03-01
      provides: Thread router, routing structure, ChatInterface with nullable threadId
  provides:
    - generateThreadTitle function with budget model
    - Thread creation on first message in /api/chat
    - X-Thread-Id header for new thread response
    - Auto-unarchive on message to archived thread
    - ChatInterface redirect after thread creation
  affects: [03-03, 05-sidebar]  # Sidebar will display auto-generated titles

tech-stack:
  added: []
  patterns:
    - Fire-and-forget async title generation (non-blocking)
    - Custom fetch in DefaultChatTransport for header capture
    - X-Thread-Id header for thread creation notification

key-files:
  created:
    - sidekiq-webapp/src/lib/ai/title.ts
  modified:
    - sidekiq-webapp/src/app/api/chat/route.ts
    - sidekiq-webapp/src/lib/validations/chat.ts
    - sidekiq-webapp/src/components/chat/chat-interface.tsx

decisions:
  - key: title-model
    choice: openai/gpt-4o-mini for all title generation
    rationale: Budget model regardless of thread's active model - fast and cheap
  - key: title-timing
    choice: Fire-and-forget after onFinish callback
    rationale: Non-blocking - user sees response immediately, title appears async
  - key: redirect-method
    choice: router.replace instead of router.push
    rationale: /chat should not appear in back button history after thread creation

patterns-established:
  - "X-Thread-Id header pattern: Server returns new thread ID in response header"
  - "Fire-and-forget title generation: Don't await, catch errors separately"
  - "hasRedirectedRef pattern: Prevent duplicate navigation with useRef flag"

metrics:
  duration: 4min
  completed: 2026-01-23
```

## Summary

Built the complete thread creation flow: threads are now created atomically when sending the first message from /chat, the frontend redirects to /chat/[threadId], and titles are auto-generated asynchronously after the first AI response completes.

### What Was Built

**Title Generation Function (`lib/ai/title.ts`):**
- `generateThreadTitle(userMessage, assistantMessage)` function
- Uses `openai/gpt-4o-mini` (budget model) for all title generation
- Prompt extracts 3-6 word topic summary
- Fallback to "New conversation" on generation failure
- Clean-up: removes quotes, trailing punctuation, limits to 100 chars

**Chat Route Updates (`app/api/chat/route.ts`):**
- Thread creation when `threadId` not provided in request
- `X-Thread-Id` header returned for new threads
- Auto-unarchive: archived threads unarchive on new message
- Fire-and-forget title generation in `onFinish` callback
- Type-safe thread handling with explicit `ThreadRecord` type

**ChatInterface Updates (`components/chat/chat-interface.tsx`):**
- Custom fetch function captures `X-Thread-Id` header
- `router.replace` redirects to `/chat/[threadId]` after creation
- `hasRedirectedRef` prevents duplicate navigation
- Conditional body: only includes `threadId` when not null

**Validation Schema Update (`lib/validations/chat.ts`):**
- `threadId` now optional (`z.string().optional()`)
- Enables new chat state to send messages without pre-existing thread

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T13:02:32Z
- **Completed:** 2026-01-23T13:06:26Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Thread creation happens atomically with first message send
- Auto-title generation uses budget model, non-blocking
- Frontend redirects seamlessly to thread URL after creation
- Archived threads auto-unarchive when receiving new messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create title generation function** - `db7cc3a` (feat)
2. **Task 2: Update chat route for thread creation and auto-title** - `4eef6d6` (feat)
   - Note: route.ts changes also appear in `3005915` due to concurrent git operations
3. **Task 3: Update ChatInterface to handle new chat state and redirect** - `a5aa117` (feat)

## Files Created/Modified

- `sidekiq-webapp/src/lib/ai/title.ts` - Title generation with budget model
- `sidekiq-webapp/src/app/api/chat/route.ts` - Thread creation, X-Thread-Id header, auto-title
- `sidekiq-webapp/src/lib/validations/chat.ts` - Optional threadId
- `sidekiq-webapp/src/components/chat/chat-interface.tsx` - Redirect handling

## Decisions Made

1. **Budget model for titles:** Using `openai/gpt-4o-mini` regardless of thread's active model - fast, cheap, and titles don't need advanced reasoning.

2. **Fire-and-forget pattern:** Title generation happens after `onFinish` but is not awaited - the `.then().catch()` pattern lets it complete asynchronously without blocking the response.

3. **router.replace for redirect:** Using `replace` instead of `push` ensures the `/chat` (new chat state) doesn't appear in browser history when user presses back button.

4. **hasRedirectedRef pattern:** Using a ref to track redirect state prevents React's StrictMode double-render or multiple fetch calls from causing duplicate navigation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed maxTokens parameter name**
- **Found during:** Task 1 (title generation function)
- **Issue:** Plan used `maxTokens` but AI SDK v6 uses `maxOutputTokens`
- **Fix:** Changed parameter name to `maxOutputTokens`
- **Files modified:** sidekiq-webapp/src/lib/ai/title.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** db7cc3a (Task 1 commit)

**2. [Rule 3 - Blocking] Added null check for thread creation result**
- **Found during:** Task 2 (chat route thread creation)
- **Issue:** TypeScript error - `db.insert().returning()` could return undefined
- **Fix:** Added explicit null check with 500 error response
- **Files modified:** sidekiq-webapp/src/app/api/chat/route.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 3005915 (auto-saved by lint-staged)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for type safety and correct operation. No scope creep.

## Issues Encountered

None - plan executed smoothly after auto-fixes.

## User Setup Required

None - no external service configuration required. The title generation uses the same AI_GATEWAY_API_KEY already configured in Phase 1.

## Next Phase Readiness

### Immediate Next Steps (03-03)

- Thread actions UI (delete, archive, pin, rename)
- Context menu and action buttons integration
- Optimistic updates with tRPC mutations

### Dependencies for Future Plans

- Sidebar (Phase 5) can display auto-generated titles
- Thread list query will show titles populated by this plan's auto-title feature
- `X-Thread-Id` pattern can be reused for other server-to-client thread notifications

### Blockers/Concerns

None - all must-haves from plan verified:
- Thread created atomically on first message
- Redirect to /chat/[threadId] working
- Auto-title uses budget model (gpt-4o-mini)
- Fallback title on failure
- Archived threads auto-unarchive

---
*Phase: 03-thread-management*
*Completed: 2026-01-23*
