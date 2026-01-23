# Phase 4: Model Selection & Persistence - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

User can select which LLM model powers their conversation via a rich picker component. Selection persists per thread, with model stored on each message. Users can set a global default model and favorite models for quick access.

</domain>

<decisions>
## Implementation Decisions

### Picker placement & style
- Position: Below input field, bottom-right side
- Trigger: Compact button showing current model name
- Popover style: Solid dark panel (not glassmorphism), like t3.chat
- Full-featured picker with:
  - Search input with fuzzy matching (typo-tolerant)
  - Favorites section pinned at top (separate section, not just starred in list)
  - Models grouped by provider below favorites
- Favorites stored server-side (database), syncs across devices

### Model display info
- Each model in list shows:
  - Provider icon (small logo, no text)
  - Model name
  - Short description below name
  - Feature icons (fast, thinking, coding) with tooltip for details
- Hover card on model (like t3.chat):
  - Full description
  - Feature badges
  - Provider info
  - Knowledge cutoff date
  - **Skip benchmarks for v1** (no Intelligence/Speed/Cost meters)

### Thread stickiness behavior
- Model can be changed mid-conversation (with warning)
- Warning style: Inline hint in chat (divider or subtle system message — Claude decides style)
- Model info on AI messages: Visible on hover only (Claude decides placement)
- Model stored per message (not just per thread)
- When returning to a thread: Picker shows thread's last used model
- Regenerate uses current selected model (not original message's model)

### Default model logic
- New threads use user's saved default model
- Default can be set in two places:
  - "Set as default" action in model picker
  - Formal setting in user settings page
- System fallback (no user default): Claude decides sensible choice
- Default model shows indicator in picker (badge or checkmark)
- No onboarding prompt for first-time users — use system default, discover picker naturally
- Schema prepared for per-Sidekiq defaults (Phase 6/7), but only global default exposed in Phase 4

### Claude's Discretion
- Exact hover card placement for AI message model info
- Inline hint visual treatment for model switch
- Whether to show "last used in thread" indicator in picker
- System-wide fallback model choice
- Confirmation UX for "Set as default" action

</decisions>

<specifics>
## Specific Ideas

- "Rich select menu with favorites, groups, etc like t3.chat"
- Reference screenshots provided showing t3.chat's model picker and model detail card
- Model detail card should include: description, feature badges, provider, knowledge cutoff, added date (skip benchmarks for v1)
- Favorites as dedicated section at top, not just starred items in groups

</specifics>

<deferred>
## Deferred Ideas

- Per-Sidekiq default models — Phase 6/7 (Sidekiq CRUD/Integration)
- Benchmark performance meters in model card — future enhancement
- Model availability/pricing tiers — future enhancement

</deferred>

---

*Phase: 04-model-selection*
*Context gathered: 2026-01-23*
