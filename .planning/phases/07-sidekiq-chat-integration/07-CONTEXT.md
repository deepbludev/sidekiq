# Phase 7: Sidekiq Chat Integration - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can start a chat with a Sidekiq and see its personality in responses. The Sidekiq's instructions are injected as system message, and the UI clearly indicates which Sidekiq is active. Sidebar shows visual indicators for Sidekiq threads.

**Not in scope:** Sidekiq analytics/dashboard page, usage statistics, team sharing (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Chat Entry Points
- Chat available from BOTH Sidekiq list page AND Sidekiq detail/edit page
- Clicking Sidekiq in sidebar starts a new chat (not edit page)
- Edit page accessible via context menu "Edit Sidekiq" option
- Navigation: Go to /chat with Sidekiq pre-selected, thread created on first message
- Sidekiq's conversation starters replace default empty state prompts
- Keyboard shortcut: Cmd+Shift+S opens Sidekiq picker to select and start chat
- Empty sidebar Sidekiqs section shows "Create Sidekiq" CTA button
- Favorites shown first in sidebar Sidekiq list

### Active Sidekiq Indicator
- Sidekiq displayed in BOTH chat header AND near input area
- AI messages show Sidekiq's avatar instead of generic AI icon
- Clicking header indicator opens popover with Sidekiq details (description, link to edit)
- Regular (non-Sidekiq) chats show thread title only in header (no assistant info)

### Sidebar Visual Treatment
- Combination indicators: Sidekiq avatar as icon + subtitle "with [Sidekiq name]"
- Thread filtering: Filter dropdown near search input (All / Regular / specific Sidekiq)
- Hover shows rich HoverCard with Sidekiq avatar, name, and description
- Context menu: No additional options (same as regular threads)
- Deleted Sidekiq: Thread shows "[Sidekiq deleted]" indicator, remains accessible

### Switching & Continuity
- Sidekiq is LOCKED to thread once assigned (cannot switch mid-conversation)
- Cannot remove Sidekiq from thread (permanent association, except if Sidekiq deleted)
- Cannot add Sidekiq to existing regular thread (Sidekiq must be chosen at thread creation)
- Conversation starters only show for empty threads (not when returning to existing thread)

### Model Selection
- Sidekiq has a default model preference (new `defaultModelId` field in schema)
- User can override model in individual threads (model picker still available)
- Model affects response style, Sidekiq controls personality via instructions

### Claude's Discretion
- Resume behavior: Whether sidebar click resumes recent thread or always creates new
- Route design: /chat?sidekiq=id vs dedicated route pattern
- Header info density: Avatar + name, or include description
- Color theming: Whether Sidekiq color influences chat UI accents
- Input area indicator: Chip, placeholder text, or border accent
- Thread grouping: Mixed with regular threads by date vs separate section
- Thread creation timing: On first message vs on navigation
- Instruction updates: Whether existing threads use updated or original instructions

</decisions>

<specifics>
## Specific Ideas

- Sidebar Sidekiq click behavior changed from Phase 6 (was edit page, now starts chat)
- Rich HoverCard pattern already established in model picker (Phase 4) — reuse for Sidekiq preview
- Conversation starters drag-drop already built (Phase 6) — starters replace default prompts
- Thread title generation already works (Phase 3) — Sidekiq threads get auto-titles too

</specifics>

<deferred>
## Deferred Ideas

- **Sidekiq dashboard/homepage** — View with latest conversations, usage stats, create new chat. This is a new capability belonging in its own phase.

</deferred>

---

*Phase: 07-sidekiq-chat-integration*
*Context gathered: 2026-01-24*
