---
phase: quick
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/validations/sidekiq.test.ts
  - sidekiq-webapp/tests/unit/lib/avatar.test.ts
  - sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx
autonomous: true
must_haves:
  truths:
    - "sidekiq.ts Zod schemas have comprehensive unit test coverage"
    - "avatar.ts utility functions have unit tests for initials extraction and color generation"
    - "DeleteSidekiqDialog component has unit tests for type-to-confirm flow"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/validations/sidekiq.test.ts"
      provides: "Unit tests for all 7 Zod schemas in sidekiq.ts"
    - path: "sidekiq-webapp/tests/unit/lib/avatar.test.ts"
      provides: "Unit tests for getInitials, generateColorFromName, createDefaultAvatar"
    - path: "sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx"
      provides: "Unit tests for DeleteSidekiqDialog component"
  key_links:
    - from: "sidekiq.test.ts"
      to: "src/lib/validations/sidekiq.ts"
      via: "import all schemas"
    - from: "avatar.test.ts"
      to: "src/lib/utils/avatar.ts"
      via: "import utility functions"
---

<objective>
Add unit tests for Phase 6 (Sidekiq CRUD) validation schemas, avatar utilities, and DeleteSidekiqDialog component.

Purpose: Ensure test coverage for the core Sidekiq functionality including Zod validation (7 schemas), avatar utility functions (deterministic color generation, initials extraction), and the type-to-confirm delete dialog.
Output: 3 test files covering the most critical testable units from Phase 6.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@sidekiq-webapp/src/lib/validations/sidekiq.ts
@sidekiq-webapp/src/lib/utils/avatar.ts
@sidekiq-webapp/src/components/sidekiq/delete-sidekiq-dialog.tsx
@sidekiq-webapp/tests/unit/validations/thread.test.ts
@sidekiq-webapp/tests/unit/components/thread/delete-thread-dialog.test.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Unit tests for sidekiq validation schemas</name>
  <files>sidekiq-webapp/tests/unit/validations/sidekiq.test.ts</files>
  <action>
Create comprehensive unit tests for all 7 Zod schemas in sidekiq.ts:

**sidekiqAvatarSchema tests:**
- Accepts valid initials type with hex color
- Accepts valid emoji type with hex color and emoji
- Rejects invalid hex color format (missing #, wrong length)
- Rejects invalid type enum value

**createSidekiqSchema tests:**
- Accepts valid complete input
- Rejects empty name (min 1 char)
- Rejects name exceeding 100 chars
- Rejects description exceeding 500 chars
- Rejects instructions exceeding 8000 chars
- Rejects more than 6 conversation starters
- Rejects conversation starter exceeding 200 chars
- Applies default values (empty conversationStarters, default avatar)

**sidekiqFormSchema tests:**
- Same validation as createSidekiqSchema but without defaults
- All fields required (no .default())

**updateSidekiqSchema tests:**
- Accepts valid partial update (just id + one field)
- Rejects missing id
- All fields except id are optional

**deleteSidekiqSchema tests:**
- Accepts valid id with deleteThreads=false (default)
- Accepts valid id with deleteThreads=true
- Rejects missing/empty id

**toggleFavoriteSchema / duplicateSidekiqSchema tests:**
- Accept valid id
- Reject empty id

**listSidekiqsSchema tests:**
- Accepts undefined
- Accepts empty object
- Applies default includeThreadCount=true

**getSidekiqByIdSchema tests:**
- Accepts valid id
- Rejects empty id

Follow patterns from tests/unit/validations/thread.test.ts for structure.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test tests/unit/validations/sidekiq.test.ts` - all tests pass</verify>
  <done>All 7 Zod schemas have comprehensive test coverage with 25+ test cases</done>
</task>

<task type="auto">
  <name>Task 2: Unit tests for avatar utilities</name>
  <files>sidekiq-webapp/tests/unit/lib/avatar.test.ts</files>
  <action>
Create unit tests for avatar utility functions in src/lib/utils/avatar.ts:

**getInitials tests:**
- Single word returns first 2 chars uppercase ("Assistant" -> "AS")
- Two words returns first letter of each ("Code Helper" -> "CH")
- Three+ words uses only first 2 words ("Very Long Name" -> "VL")
- Single letter returns that letter ("A" -> "A")
- Empty string returns "?"
- Whitespace only returns "?"
- Extra whitespace between words is handled

**generateColorFromName tests:**
- Returns a valid hex color from AVATAR_COLORS palette
- Same name always returns same color (deterministic)
- Case-insensitive (same color for "Test" and "TEST")
- Different names can return different colors
- Handles empty string without throwing
- Handles whitespace-only string

**createDefaultAvatar tests:**
- Returns object with type: "initials"
- Returns color from generateColorFromName
- Does not include emoji field

**AVATAR_COLORS constant:**
- Contains 12 colors
- All colors are valid hex format

Follow patterns from tests/unit/lib/ai/models.test.ts for structure.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test tests/unit/lib/avatar.test.ts` - all tests pass</verify>
  <done>Avatar utilities have full coverage including edge cases for empty/whitespace inputs</done>
</task>

<task type="auto">
  <name>Task 3: Unit tests for DeleteSidekiqDialog</name>
  <files>sidekiq-webapp/tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx</files>
  <action>
Create unit tests for DeleteSidekiqDialog component:

**Rendering tests:**
- Does not render when open=false
- Renders dialog title with sidekiq name when open
- Shows type-to-confirm input with label showing sidekiq name
- Shows delete button disabled initially (no confirmation text)

**Thread count display tests:**
- Shows thread count checkbox when threadCount > 0
- Hides thread count checkbox when threadCount = 0
- Checkbox label shows correct plural ("1 conversation" vs "2 conversations")

**Type-to-confirm tests:**
- Delete button remains disabled when typed text doesn't match
- Delete button becomes enabled when typed text matches exactly
- Case-sensitive match required ("MyBot" != "mybot")

**Interaction tests:**
- Typing in input updates internal state
- Clicking Cancel calls onOpenChange(false)
- Clicking Delete (when enabled) calls onConfirm with deleteThreads value
- Checkbox toggles deleteThreads state
- Pressing Escape calls onOpenChange(false)

**Loading state tests:**
- Shows "Deleting..." when isDeleting=true
- Disables Cancel button when isDeleting
- Disables input when isDeleting
- Disables checkbox when isDeleting

**Reset state tests:**
- Input clears when dialog closes and reopens
- Checkbox resets to unchecked when dialog closes and reopens

Use helper function pattern like delete-thread-dialog.test.tsx for rendering with default props.
Use userEvent from @testing-library/user-event for interactions.
  </action>
  <verify>Run `pnpm --filter sidekiq-webapp test tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx` - all tests pass</verify>
  <done>DeleteSidekiqDialog has full test coverage for type-to-confirm flow, thread count, and loading states</done>
</task>

</tasks>

<verification>
```bash
# Run all new Phase 6 tests
pnpm --filter sidekiq-webapp test tests/unit/validations/sidekiq.test.ts tests/unit/lib/avatar.test.ts tests/unit/components/sidekiq/delete-sidekiq-dialog.test.tsx

# Verify all existing tests still pass
pnpm --filter sidekiq-webapp test

# Check for type errors
pnpm --filter sidekiq-webapp tsc --noEmit
```
</verification>

<success_criteria>
- sidekiq.test.ts: 25+ test cases covering all 7 Zod schemas with validation edge cases
- avatar.test.ts: 15+ test cases covering getInitials, generateColorFromName, createDefaultAvatar
- delete-sidekiq-dialog.test.tsx: 15+ test cases covering rendering, type-to-confirm, interactions, loading states
- All existing tests continue to pass
- No type errors in test files
</success_criteria>

<output>
After completion, create `.planning/quick/004-update-test-suite-with-phase-6-verificat/004-SUMMARY.md`
</output>
