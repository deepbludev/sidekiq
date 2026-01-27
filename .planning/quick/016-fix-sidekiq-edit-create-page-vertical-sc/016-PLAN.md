---
phase: quick-016
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx
  - sidekiq-webapp/src/app/(dashboard)/sidekiqs/[id]/edit/page.tsx
  - sidekiq-webapp/src/app/(dashboard)/sidekiqs/page.tsx
autonomous: false

must_haves:
  truths:
    - "User can vertically scroll the Sidekiq create page when form content exceeds viewport height"
    - "User can vertically scroll the Sidekiq edit page when form content exceeds viewport height"
    - "User can vertically scroll the Sidekiqs list page when content exceeds viewport height"
    - "Chat page scroll behavior is unaffected (no double scrollbars)"
  artifacts:
    - path: "sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx"
      provides: "Scrollable create page wrapper"
      contains: "overflow-y-auto"
    - path: "sidekiq-webapp/src/app/(dashboard)/sidekiqs/[id]/edit/page.tsx"
      provides: "Scrollable edit page wrapper"
      contains: "overflow-y-auto"
    - path: "sidekiq-webapp/src/app/(dashboard)/sidekiqs/page.tsx"
      provides: "Scrollable list page wrapper"
      contains: "overflow-y-auto"
  key_links:
    - from: "sidekiq-webapp/src/app/(dashboard)/layout.tsx"
      to: "sidekiq page wrappers"
      via: "overflow-hidden on main prevents scrolling; pages must handle their own scroll"
      pattern: "overflow-hidden"
---

<objective>
Fix vertical scroll overflow on Sidekiq edit/create/list pages. The form content overflows
below the viewport bottom and users cannot scroll to see or interact with lower form fields
(conversation starters, submit button).

Purpose: Users currently cannot access the bottom portion of Sidekiq forms, making
create/edit unusable when the form exceeds viewport height.

Output: All three Sidekiq pages scroll vertically when content exceeds viewport height.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Root cause analysis:
- Dashboard layout (`(dashboard)/layout.tsx` line 42) sets `overflow-hidden` on `<main>`:
  `<main className="flex-1 overflow-hidden pb-14 md:pb-0">{children}</main>`
- This is intentional -- ChatInterface manages its own scroll internally via `overflow-y-auto`
  on its message container and uses `h-full` to fill the viewport.
- Non-chat pages (sidekiqs) use a simple `<div className="mx-auto max-w-4xl px-6 py-8">`
  wrapper that can grow beyond the viewport but has no scroll handling.
- The settings layout already solved this: it uses `overflow-auto` on its wrapper div.
- Fix: Add `h-full overflow-y-auto` to each Sidekiq page's outermost wrapper div so it
  becomes a scroll container within the `overflow-hidden` main area.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add scroll handling to Sidekiq page wrappers</name>
  <files>
    sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx
    sidekiq-webapp/src/app/(dashboard)/sidekiqs/[id]/edit/page.tsx
    sidekiq-webapp/src/app/(dashboard)/sidekiqs/page.tsx
  </files>
  <action>
    Add `h-full overflow-y-auto` to the outermost wrapper div on each of the three Sidekiq pages.
    This makes the page content scrollable within the `overflow-hidden` main container.

    Specific changes:

    1. **`sidekiqs/new/page.tsx`** (line 42):
       Change: `<div className="mx-auto max-w-4xl px-6 py-8">`
       To: `<div className="h-full overflow-y-auto mx-auto max-w-4xl px-6 py-8">`
       Note: This is a single outer wrapper -- the entire create page (template selection
       and form) lives inside it. The class order should follow project convention.

    2. **`sidekiqs/[id]/edit/page.tsx`** -- There are THREE wrapper divs with the same
       `mx-auto max-w-4xl px-6 py-8` class (loading state line 45, error state line 56,
       main content line 81). Add `h-full overflow-y-auto` to ALL THREE so every state
       is scrollable.

    3. **`sidekiqs/page.tsx`** (line 49):
       Change: `<div className="mx-auto max-w-4xl px-6 py-8">`
       To: `<div className="h-full overflow-y-auto mx-auto max-w-4xl px-6 py-8">`

    DO NOT modify `(dashboard)/layout.tsx` -- the `overflow-hidden` on `<main>` is correct
    and needed for the chat interface. Each page manages its own scroll, matching the pattern
    already used by the settings layout.
  </action>
  <verify>
    1. Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && npx next build` to
       ensure no build errors.
    2. Grep all modified files to confirm `overflow-y-auto` is present:
       `grep -n "overflow-y-auto" src/app/\(dashboard\)/sidekiqs/new/page.tsx src/app/\(dashboard\)/sidekiqs/\[id\]/edit/page.tsx src/app/\(dashboard\)/sidekiqs/page.tsx`
    3. Confirm chat interface is NOT modified:
       `grep -n "overflow" src/app/\(dashboard\)/layout.tsx` should still show `overflow-hidden`.
  </verify>
  <done>
    All three Sidekiq pages (list, create, edit) have `h-full overflow-y-auto` on their
    outermost wrapper divs. Content that exceeds viewport height is scrollable.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Added vertical scroll handling to all three Sidekiq pages (list, create, edit).
    The form content that previously overflowed past the viewport bottom is now scrollable.
  </what-built>
  <how-to-verify>
    1. Start the dev server: `cd sidekiq-webapp && npm run dev`
    2. Navigate to http://localhost:3000/sidekiqs -- verify the list page scrolls if content
       overflows (may not overflow with few sidekiqs, that's OK)
    3. Click "Create New" or navigate to http://localhost:3000/sidekiqs/new
    4. Select any template to show the form
    5. Verify you can scroll down to see ALL form fields including:
       - Conversation Starters section
       - Cancel / Create Sidekiq buttons at the bottom
    6. Navigate to edit an existing Sidekiq (click edit on any card)
    7. Verify the edit page also scrolls and all form fields are accessible
    8. Navigate to the chat page -- verify chat still works normally with no
       double scrollbars or layout issues
    9. Test on a smaller browser window (resize to ~700px height) to ensure
       scroll works even on constrained viewports
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- All three Sidekiq pages scroll vertically when content exceeds viewport
- Chat page scroll behavior unchanged (ChatInterface manages its own scroll)
- No double scrollbars on any page
- Build passes without errors
</verification>

<success_criteria>
- Users can scroll to see and interact with all form fields on Sidekiq create/edit pages
- The submit button is always reachable via scrolling
- No regression on chat or settings pages
</success_criteria>

<output>
After completion, create `.planning/quick/016-fix-sidekiq-edit-create-page-vertical-sc/016-SUMMARY.md`
</output>
