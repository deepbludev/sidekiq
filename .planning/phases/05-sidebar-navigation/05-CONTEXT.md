# Phase 5: Sidebar & Navigation - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Sidebar UI that displays conversation history with organization features: collapsible layout, date grouping, pinned threads, thread actions, search, and Sidekiq visual indicators. Thread CRUD operations already exist from Phase 3 — this phase builds the UI to display and navigate them.

</domain>

<decisions>
## Implementation Decisions

### Sidebar layout & behavior
- Collapsible sidebar with toggle button
- When collapsed: icon rail with New Chat, Sidekiqs, and Settings icons
- Fixed width (no resize handle)
- Logo only at top (no app name)
- New Chat button below logo, prominent placement
- User avatar + dropdown menu at bottom (settings/logout/theme toggle)
- Persist collapsed/expanded state across sessions (localStorage or user preferences)
- Smooth animations for collapse/expand transitions
- Solid background (no glassmorphism blur)
- Subtle vertical border separating sidebar from main content
- Keyboard shortcuts: Cmd+N new chat, Cmd+B toggle sidebar, Cmd+K search

### Mobile behavior
- Drawer overlay that slides in from left
- Hamburger menu icon triggers drawer (no swipe gesture)
- Tap outside drawer to close
- Selecting a thread auto-closes drawer

### Thread list presentation
- Each thread shows: title + relative timestamp (2h ago, Yesterday)
- Long titles truncated with ellipsis (~25-30 chars)
- Active/selected thread: background highlight
- On hover: Pin, Archive, More (three-dot menu for delete/rename) icons appear
- Right-click context menu available with all actions
- Pinned threads show small pin icon next to title
- Sidekiq threads show: Sidekiq initial avatar + subtitle "with [Sidekiq name]"

### Date grouping & sorting
- Groups: Pinned / Today / Yesterday / This Week / This Month / Older
- Pinned section has its own header (separate from date groups)
- Pinned section hidden when empty (no pinned threads)
- Pinned threads appear ONLY in Pinned section (not duplicated in date groups)
- Groups always expanded (not collapsible)
- Empty groups hidden entirely
- Group headers: small, subtle, muted text
- Within groups: sorted by most recent activity first
- No pagination — virtualized list shows all threads
- Archived threads NOT shown in sidebar (accessible via Settings > Archived)
- New threads animate in (subtle fade/slide)

### Search experience
- Search input at top of sidebar, always visible (below New Chat)
- Searches thread titles only (not message content)
- Fuzzy matching with typo tolerance (like model picker)
- Filters existing list (no separate results panel)
- Flat results during search (no date grouping)
- Highlight matching text in results
- Empty state: "No threads found" message
- Instant search with ~200ms debounce

### Claude's Discretion
- Exact animation timing and easing curves
- Icon rail icon sizes and spacing
- Exact sidebar width (expanded and collapsed)
- Fuzzy search threshold configuration
- Virtualization library choice

</decisions>

<specifics>
## Specific Ideas

- Icon rail like Linear/Notion when sidebar collapsed
- Thread actions (components from Phase 3) integrate into sidebar hover/context menu
- Sidekiq threads distinguished by avatar + subtitle pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-sidebar-navigation*
*Context gathered: 2026-01-23*
