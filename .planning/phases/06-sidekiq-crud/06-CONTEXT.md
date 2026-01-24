# Phase 6: Sidekiq CRUD - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Create, edit, and delete custom AI assistants (Sidekiqs) with name, description, instructions, conversation starters, and optional default model. Includes list/grid views, sidebar integration, avatar system, and user-defined tags. Chat integration (using Sidekiqs in conversations) is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Create/Edit Form
- Full page routes: `/sidekiqs/new` and `/sidekiqs/[id]/edit`
- Split layout like OpenAI GPTs: form on left, live preview + test chat on right
- Rich markdown editor for instructions with toggle preview mode
- Conversation starters: drag-and-drop reorderable, 200 chars each
- Default model selector for each Sidekiq (auto-selected when starting chat)
- 6-8 starter templates (Writing, Coding, Research, Creative, etc.)
- Inline validation errors as user types
- Help text below fields + tooltip icons for advanced tips
- Breadcrumb navigation: Sidekiqs > Create New / Sidekiqs > [Name] > Edit
- Keyboard shortcuts: Cmd+S to save, Esc to cancel (with unsaved changes confirmation)
- Confirm discard dialog if navigating away with unsaved changes
- Duplicate Sidekiq action available

### List & Navigation
- Dual access: sidebar section + dedicated `/sidekiqs` page
- Hybrid view: toggle between card grid and table list
- Remember last selected view preference (localStorage)
- Sorting: name (A-Z), created date, last used, most used
- Search + filters: name search with user-defined tag filtering
- User-defined tags: tag selector on form (select existing, create new inline)
- Sidebar shows: recent + favorited Sidekiqs with "See all" link
- Pin/favorite action: star to favorite, appears at top of sidebar
- Quick actions: Chat, Edit, Duplicate, Share, Delete (hover icons + context menu)
- Clicking Sidekiq in sidebar starts new chat immediately
- Cards show: avatar, name, description, thread count, last used date
- URL reflects filter/sort state for bookmarking

### Avatar System
- Auto-generate color from name hash, user can override
- Support both initials and emoji picker
- Defer image upload to future phase

### Deletion Flow
- Type-to-confirm: type exact Sidekiq name to delete
- Prompt user: "Keep conversations or delete them?" for associated threads
- Stay in place after delete (if from list, stay on list; if from edit, go to list)
- Defer: bulk delete, team Sidekiq delete behavior (Phase 9)

### Limits & Validation
- Name: max 100 characters, unique per user (case-insensitive)
- Description: max 500 characters
- Instructions: max 8000 characters
- Conversation starters: 200 characters each
- Rate limiting: 20-30 creations per hour (anti-spam)
- Rate limit UX: disable create button with tooltip showing remaining time
- Defer: max Sidekiqs per account (subscription-based limits in future)

### Claude's Discretion
- Draft/autosave behavior
- Character count display (always, near limit, or on focus)
- Number of conversation starters (suggest 4-6)
- Duplicate naming convention ("Copy of [Name]" vs "[Name] (2)")
- Test chat persistence (ephemeral vs persist until save)
- Save button placement (header vs bottom vs both)
- Loading state during save
- Post-create redirect destination
- Pagination vs infinite scroll vs load all
- Create CTA appearance (button vs icon)
- Templates display (separate section vs mixed)
- Sidebar section collapsibility
- Color palette (preset 8-12 colors recommended)
- Initial generation algorithm (first letter vs two letters)
- Emoji background color handling
- Avatar size breakpoints
- Tag limits
- Minimum name length
- Whether instructions are required

</decisions>

<specifics>
## Specific Ideas

- "Like OpenAI GPTs editor" — form on left, preview + test chat on right (see screenshot reference)
- Cards should show usage stats: "12 chats • Used 2 days ago"
- Type exact name to confirm delete (like GitHub repo deletion)

</specifics>

<deferred>
## Deferred Ideas

- Import from JSON for power users — future phase
- Bulk delete functionality — future phase
- Team Sidekiq delete behavior — Phase 9 (Team Sharing)
- Image upload for avatars — future phase
- Max Sidekiqs per account — subscription-based limits in future milestone

</deferred>

---

*Phase: 06-sidekiq-crud*
*Context gathered: 2026-01-24*
