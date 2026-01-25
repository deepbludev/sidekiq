---
type: quick
task: 009
title: Update Unit Tests for Phase 7 - Sidekiq Chat Integration
---

<objective>
Add unit tests covering Phase 7 Sidekiq Chat Integration features.

Purpose: Verify that Phase 7 functionality (sidekiqId in chat requests, Sidekiq ownership verification, system message injection logic, and new components) works correctly.

Output: Extended test coverage for Phase 7 features with passing tests.
</objective>

<context>
@.planning/STATE.md
@sidekiq-webapp/tests/unit/validations/chat.test.ts
@sidekiq-webapp/tests/unit/api/chat.test.ts
@sidekiq-webapp/src/lib/validations/chat.ts
@sidekiq-webapp/src/app/api/chat/route.ts
@sidekiq-webapp/src/components/sidekiq/sidekiq-indicator.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add sidekiqId validation tests to chat.test.ts</name>
  <files>sidekiq-webapp/tests/unit/validations/chat.test.ts</files>
  <action>
Add new test cases to `chatRequestSchema` tests for the `sidekiqId` field (added in Phase 7):

1. `should accept valid sidekiqId string`
2. `should accept request without sidekiqId (optional field)`
3. `should accept empty string sidekiqId` (edge case)

Follow the existing test pattern in the file with `safeParse` and `expect(result.success).toBe(true/false)`.
  </action>
  <verify>Run `pnpm test:run tests/unit/validations/chat.test.ts` - all tests pass including new ones</verify>
  <done>Chat validation tests cover sidekiqId field with 3+ new test cases</done>
</task>

<task type="auto">
  <name>Task 2: Add Sidekiq ownership and system message tests to api/chat.test.ts</name>
  <files>sidekiq-webapp/tests/unit/api/chat.test.ts</files>
  <action>
Add new test suites and test cases for Phase 7 Sidekiq integration:

**1. Add sidekiqs mock to the db mock** (extend existing vi.mock):
```typescript
// Add to existing db mock:
sidekiqs: {
  findFirst: vi.fn(),
},
```

**2. Add new describe block "sidekiq authorization"** with tests:
- `should return 404 when sidekiqId not found`
- `should return 403 when sidekiq belongs to different user`
- `should proceed when valid sidekiqId owned by user`

**3. Add new describe block "sidekiq system message injection"** with tests:
- `should call streamText with system message when sidekiq has instructions`
- `should call streamText without system message when sidekiq has no instructions`
- `should use thread.sidekiqId for existing threads (effectiveSidekiqId pattern)`

**4. Update helper function `validChatBody`** to support sidekiqId:
```typescript
function validChatBody(overrides = {}) {
  return {
    messages: [...],
    threadId: "thread-123",
    model: "anthropic/claude-sonnet-4-20250514",
    sidekiqId: undefined, // Optional field
    ...overrides,
  };
}
```

Follow the existing mock pattern - mock db.query.sidekiqs.findFirst to return sidekiq with ownerId. Use `beforeEach` to set up default mocks.
  </action>
  <verify>Run `pnpm test:run tests/unit/api/chat.test.ts` - all tests pass including new Sidekiq tests</verify>
  <done>API chat tests cover Sidekiq ownership verification and system message injection with 6+ new test cases</done>
</task>

<task type="auto">
  <name>Task 3: Add SidekiqIndicator component tests</name>
  <files>sidekiq-webapp/tests/unit/components/sidekiq/sidekiq-indicator.test.tsx</files>
  <action>
Create new test file for SidekiqIndicator component. Follow existing patterns from `delete-sidekiq-dialog.test.tsx`.

**Test cases to implement:**

1. **Rendering tests:**
   - `should render sidekiq name`
   - `should render sidekiq avatar with correct props`
   - `should render description when showDescription is true`
   - `should not render description when showDescription is false (default)`

2. **Wrapper behavior tests:**
   - `should render as div when no onClick provided`
   - `should render as button when onClick provided`
   - `should call onClick handler when clicked (button mode)`

3. **Styling tests:**
   - `should apply custom className`
   - `should apply hover styles when onClick is provided`

**Mock setup:**
- No complex mocks needed - this is a pure presentational component
- Use `@testing-library/react` for render and screen queries
- Use `userEvent` for click interactions

**Sample test structure:**
```typescript
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidekiqIndicator } from "@sidekiq/components/sidekiq/sidekiq-indicator";

const mockSidekiq = {
  id: "sidekiq-1",
  name: "Code Helper",
  avatar: { type: "initials" as const, color: "#6366f1" },
  description: "A helpful coding assistant",
};

describe("SidekiqIndicator", () => {
  // ... tests
});
```
  </action>
  <verify>Run `pnpm test:run tests/unit/components/sidekiq/sidekiq-indicator.test.tsx` - all tests pass</verify>
  <done>SidekiqIndicator component has 8+ test cases covering rendering, wrapper behavior, and styling</done>
</task>

</tasks>

<verification>
Run full test suite:
```bash
pnpm test:run
```

All tests pass, including:
- 3+ new sidekiqId validation tests
- 6+ new Sidekiq API integration tests
- 8+ new SidekiqIndicator component tests
</verification>

<success_criteria>
- Chat validation tests include sidekiqId field coverage
- API chat tests cover Sidekiq ownership verification and system message injection
- SidekiqIndicator component has comprehensive test coverage
- All existing tests continue to pass
- `pnpm test:run` exits with 0
</success_criteria>

<output>
After completion, create `.planning/quick/009-update-unit-tests-for-phase-7/009-SUMMARY.md`
</output>
