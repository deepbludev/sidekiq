# Phase 3: Thread Management - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

User can organize conversations with create, delete, archive, pin, and rename functionality. Thread title is auto-generated after first exchange. This phase focuses on thread lifecycle and organization — sidebar UI and navigation are separate (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Thread Creation Flow
- Thread created on first message send (not on 'New Chat' click)
- 'New Chat' button lives in sidebar header
- Clicking 'New Chat' navigates to fresh state (clears chat, URL changes to /chat)
- Thread only appears in sidebar after first message (no empty thread placeholder)
- URL structure: /chat/[threadId] for threads, /chat for new chat state
- If user navigates away from empty new chat state, nothing to discard

### Auto-title Generation
- Title generated after first AI response completes (not during streaming)
- Short summary style: 3-6 words (e.g., "React Hook Performance Issue")
- Title is set once — no auto-update on topic drift
- Fast/cheap model always used for title generation (regardless of thread model)
- 'Regenerate title' option available in thread actions menu

### Thread Actions UX
- Actions accessible via: hover to reveal icons AND right-click context menu (combination)
- Delete always requires confirmation dialog
- Archive happens immediately (no confirmation), show toast with undo
- Pin icon toggles, pinned threads appear in 'Pinned' section at top of sidebar
- Rename via clicking title to edit in place (inline editing)
- After deleting active thread, navigate to new chat state
- Toast feedback minimal — only show on errors
- All thread actions through sidebar only (not in chat header)
- Single thread actions only — no bulk/multi-select for v1

### Archive vs Delete Semantics
- Archived threads can be continued — auto-unarchive on new message
- Delete option available on archived threads for permanent removal
- Delete confirmation dialog explains archive as recoverable alternative

### Claude's Discretion
- Keyboard shortcut for 'New Chat' (if any)
- Clicking 'New Chat' while already in new chat state behavior
- Title visibility feedback during generation (loading state)
- Title generation failure fallback strategy
- Where thread title displays (chat header, sidebar, or both)
- Where archived threads are accessible (separate section, modal, or filter)

</decisions>

<specifics>
## Specific Ideas

No specific product references mentioned — open to standard patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-thread-management*
*Context gathered: 2026-01-23*
