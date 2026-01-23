---
phase: 02-basic-chat-interface
plan: 02
subsystem: ui
tags: [streamdown, shiki, markdown, syntax-highlighting, tailwind-typography]

# Dependency graph
requires:
  - phase: 01-ai-streaming-infrastructure
    provides: Chat interface foundation with useChat hook
provides:
  - MessageContent component with Streamdown markdown rendering
  - MessageActions component with copy/edit/regenerate actions
  - ScrollToBottom floating button for long conversations
  - Minimal lines message style (no bubbles/avatars)
affects: [02-03, 03-thread-management, ui-polish]

# Tech tracking
tech-stack:
  added: [streamdown, @streamdown/code, @tailwindcss/typography]
  patterns:
    - Streaming markdown rendering with Streamdown
    - Dual-theme code highlighting (github-light/github-dark)
    - Hover-visible message actions
    - Minimal lines message layout

key-files:
  created:
    - sidekiq-webapp/src/components/chat/message-content.tsx
    - sidekiq-webapp/src/components/chat/message-actions.tsx
    - sidekiq-webapp/src/components/chat/scroll-to-bottom.tsx
  modified:
    - sidekiq-webapp/src/components/chat/message-item.tsx
    - sidekiq-webapp/src/styles/globals.css
    - sidekiq-webapp/package.json

key-decisions:
  - "Streamdown for streaming markdown - handles incomplete markdown gracefully"
  - "Dual Shiki themes (github-light/github-dark) for code blocks"
  - "Minimal lines style with subtle background tint instead of bubbles"
  - "Timestamps stored in message metadata, shown on hover when available"

patterns-established:
  - "Message actions pattern: hover-visible with tooltips"
  - "Scroll button pattern: fixed position with visibility threshold"
  - "Typography plugin import via @plugin directive in Tailwind v4"

# Metrics
duration: 5min
completed: 2026-01-23
---

# Phase 02 Plan 02: Markdown & Message Actions Summary

**Streamdown-based markdown rendering with Shiki syntax highlighting and hover-visible copy/edit/regenerate message actions**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-01-23T10:21:03Z
- **Completed:** 2026-01-23T10:25:33Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments

- AI messages render markdown with full syntax highlighting via Streamdown + Shiki
- Message actions (copy/edit/regenerate) appear on hover with tooltip labels
- Copy button uses clipboard API with success/error toast feedback
- ScrollToBottom floating button tracks scroll position and appears when needed
- MessageItem converted to minimal lines style per CONTEXT.md (no bubbles/avatars)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Streamdown for markdown rendering** - `35d163b` (chore)
2. **Task 2: Create MessageContent component with Streamdown** - `73ecd85` (feat)
3. **Task 3: Create MessageActions component** - `74d0e22` (feat)
4. **Task 4: Create ScrollToBottom floating button** - `47db1ea` (feat)
5. **Task 5: Update MessageItem with minimal lines style** - `53db1ce` (feat)

## Files Created/Modified

- `sidekiq-webapp/src/components/chat/message-content.tsx` - Streamdown markdown renderer with dual-theme code highlighting
- `sidekiq-webapp/src/components/chat/message-actions.tsx` - Hover-visible copy/edit/regenerate buttons with tooltips
- `sidekiq-webapp/src/components/chat/scroll-to-bottom.tsx` - Floating scroll button with visibility threshold tracking
- `sidekiq-webapp/src/components/chat/message-item.tsx` - Updated to minimal lines style with new components
- `sidekiq-webapp/src/styles/globals.css` - Added @tailwindcss/typography plugin import
- `sidekiq-webapp/package.json` - Added streamdown, @streamdown/code, @tailwindcss/typography

## Decisions Made

- **Streamdown over react-markdown:** Handles incomplete markdown during streaming gracefully, designed for AI chat
- **Shiki dual themes:** github-light and github-dark automatically switch with app theme
- **Typography via @plugin:** Tailwind v4 uses @plugin directive instead of require() in config
- **Timestamp in metadata:** UIMessage.metadata.createdAt for optional timestamp display (type-safe extraction helper)
- **Minimal lines style:** No bubbles/cards - just subtle background tint for AI messages, plain background for user

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @tailwindcss/typography for prose classes**
- **Found during:** Task 2 (MessageContent component)
- **Issue:** prose-* Tailwind classes require typography plugin
- **Fix:** Installed @tailwindcss/typography and added @plugin import in globals.css
- **Files modified:** package.json, src/styles/globals.css
- **Verification:** pnpm typecheck passes, prose classes applied correctly
- **Committed in:** 73ecd85 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed createdAt type access from UIMessage**
- **Found during:** Task 5 (MessageItem update)
- **Issue:** Plan assumed UIMessage has createdAt property, but it's in optional metadata
- **Fix:** Created type-safe getCreatedAt() helper that safely extracts from unknown metadata
- **Files modified:** src/components/chat/message-item.tsx
- **Verification:** pnpm typecheck passes, timestamp shown when metadata.createdAt present
- **Committed in:** 53db1ce (Task 5 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for TypeScript compliance and Tailwind styling. No scope creep.

## Issues Encountered

None - all tasks completed as expected after the two auto-fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Markdown rendering and message actions complete
- Ready for 02-03 (empty state + final integration)
- ScrollToBottom needs integration into ChatInterface (planned for 02-03)
- Theme toggle implementation expected in 02-01 (parallel wave 1 plan)

---
*Phase: 02-basic-chat-interface*
*Completed: 2026-01-23*
