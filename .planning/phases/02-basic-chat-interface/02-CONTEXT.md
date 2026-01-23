# Phase 2: Basic Chat Interface - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

User can send and view messages with optimistic UI and proper error handling. Includes glassmorphism aesthetic, theme toggle (Dark/Light/System), and empty state for new users. Thread management, model selection, and sidebar are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Message Layout
- Minimal lines style, not bubbles or cards — no containers, just text with separating lines
- Subtle background tint to distinguish user vs AI messages (no alignment-based distinction)
- Timestamps shown on hover only, not always visible
- Narrow centered content area (~700px max) for focused reading experience
- Equal visual weight for user and AI messages

### Message Actions
- Full action set: copy, regenerate (AI), edit (user) — no rating
- Actions appear as hover icons inline at end of message
- Editing a user message auto-regenerates the AI response
- Regenerate replaces in-place (no branching/versioning)
- Subtle stop button appears during streaming

### Code & Markdown
- Full markdown rendering: headers, bold, italic, lists, tables, links, images
- Syntax highlighted code blocks with language label and copy button
- Code theme matches app theme (light code in light mode, dark in dark mode)

### Scroll & Navigation
- Floating "scroll to bottom" button when user scrolls away from bottom

### Claude's Discretion
- Input area styling (simple vs rich)
- Typing/streaming indicator style (dots, cursor, or skeleton)

### Glassmorphism Styling
- Figma/Linear style reference — modern SaaS, subtle but present
- Subtle 1px semi-transparent border to define glass panel edges
- Auto-hiding scrollbars that only appear when scrolling

### Claude's Discretion (Glassmorphism)
- Blur intensity (balance with readability)
- Which elements get glass treatment (sidebar, header, input, modals)
- Background style (gradient mesh, solid with accent, or simple solid)
- Accent color palette
- Shadow style (soft diffuse, sharp subtle, or none)
- Interactive element glass treatment (balance aesthetics with usability)
- Hover state interactions with glass effects
- Background motion (static vs subtle movement)
- Performance vs aesthetics balance

### Empty State
- Show suggestion prompts organized into categories (e.g., Creative, Coding, Research)
- Categorized prompts give users variety while maintaining organization

### Error States
- Error toasts positioned at bottom center (near input where action occurred)

### Claude's Discretion (States)
- Toast auto-dismiss behavior and timing

### Theme Implementation
- Three options: Light / Dark / System (auto-detect from OS)
- Theme toggle in header/nav bar
- Segmented control UI showing all three options at once

### Claude's Discretion (Theme)
- Theme transition animation (smooth vs instant)
- Persistence approach (local storage, account sync, or both)
- Flash prevention implementation
- Glass effect adaptation per theme
- Accent color variation per theme

</decisions>

<specifics>
## Specific Ideas

- "Figma/Linear style" glassmorphism — modern SaaS aesthetic, subtle but present
- Categorized suggestion prompts like Claude's interface
- Segmented control for theme toggle showing all options visually

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-basic-chat-interface*
*Context gathered: 2026-01-22*
