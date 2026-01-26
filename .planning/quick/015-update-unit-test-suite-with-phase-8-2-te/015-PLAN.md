---
phase: quick-015
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/unit/lib/sidebar-utils.test.ts
  - sidekiq-webapp/tests/unit/components/sidebar/sidebar-panel.test.tsx
  - sidekiq-webapp/tests/unit/components/sidebar/sidebar-mobile-overlay.test.tsx
autonomous: true

must_haves:
  truths:
    - "getActiveFeature() correctly maps all route patterns to sidebar features"
    - "SidebarPanel applies hidden class to inactive panels based on pathname"
    - "SidebarMobileOverlay renders correct title and conditional New Chat button"
    - "All new tests pass alongside existing test suite with zero regressions"
  artifacts:
    - path: "sidekiq-webapp/tests/unit/lib/sidebar-utils.test.ts"
      provides: "getActiveFeature pure function tests"
      min_lines: 50
    - path: "sidekiq-webapp/tests/unit/components/sidebar/sidebar-panel.test.tsx"
      provides: "SidebarPanel hidden/block switching tests"
      min_lines: 40
    - path: "sidekiq-webapp/tests/unit/components/sidebar/sidebar-mobile-overlay.test.tsx"
      provides: "SidebarMobileOverlay rendering tests"
      min_lines: 40
  key_links:
    - from: "sidekiq-webapp/tests/unit/lib/sidebar-utils.test.ts"
      to: "src/lib/sidebar-utils.ts"
      via: "direct import"
      pattern: "import.*sidebar-utils"
    - from: "sidekiq-webapp/tests/unit/components/sidebar/sidebar-panel.test.tsx"
      to: "src/components/sidebar/sidebar-panel.tsx"
      via: "direct import"
      pattern: "import.*sidebar-panel"
    - from: "sidekiq-webapp/tests/unit/components/sidebar/sidebar-mobile-overlay.test.tsx"
      to: "src/components/sidebar/sidebar-mobile-overlay.tsx"
      via: "direct import"
      pattern: "import.*sidebar-mobile-overlay"
---

<objective>
Add unit tests for Phase 8.2 (Two-Tier Sidebar Navigation Architecture) covering the getActiveFeature() pure function, SidebarPanel hidden/block switching, and SidebarMobileOverlay rendering.

Purpose: Verify the core sidebar routing logic and panel switching behavior introduced in Phase 8.2 has proper test coverage. Focus on the testable pure logic and simple component rendering -- skip heavily-wired panel content components (chats, sidekiqs, teams) that depend on tRPC/hooks and are better suited for E2E tests.

Output: Three new test files covering sidebar-utils, sidebar-panel, and sidebar-mobile-overlay.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/lib/sidebar-utils.ts
@sidekiq-webapp/src/components/sidebar/sidebar-panel.tsx
@sidekiq-webapp/src/components/sidebar/sidebar-mobile-overlay.tsx

# Existing test patterns to follow:
@sidekiq-webapp/tests/unit/lib/team-permissions.test.ts
@sidekiq-webapp/tests/unit/lib/avatar.test.ts
@sidekiq-webapp/tests/unit/components/team/team-avatar.test.tsx

# Vitest config:
@sidekiq-webapp/vitest.config.ts
@sidekiq-webapp/tests/setup.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: getActiveFeature pure function tests</name>
  <files>sidekiq-webapp/tests/unit/lib/sidebar-utils.test.ts</files>
  <action>
Create comprehensive unit tests for the `getActiveFeature()` pure function from `src/lib/sidebar-utils.ts`. Follow the pattern from `tests/unit/lib/team-permissions.test.ts` (import from vitest, describe/it blocks, no mocking needed since it's a pure function).

Test the following route-to-feature mappings:

**Chat routes -> "chats":**
- `"/chat"` -> "chats"
- `"/chat/abc123"` -> "chats" (thread ID)
- `"/chat/some-long-thread-id"` -> "chats"

**Sidekiq routes -> "sidekiqs":**
- `"/sidekiqs"` -> "sidekiqs"
- `"/sidekiqs/new"` -> "sidekiqs"
- `"/sidekiqs/abc123/edit"` -> "sidekiqs"

**Team routes -> "teams":**
- `"/settings/teams"` -> "teams"
- `"/settings/teams?team=abc123"` -> "teams" (with query param)

**Default fallback -> "chats":**
- `"/settings"` -> "chats" (general settings is NOT teams)
- `"/settings/profile"` -> "chats"
- `"/"` -> "chats" (root)
- `"/unknown"` -> "chats"

**Priority order (critical - /settings/teams MUST be checked before /settings):**
- `"/settings/teams"` must return "teams", NOT "chats"
- `"/settings"` must return "chats" (not matched by teams check)

Also verify the SidebarFeature type export exists by using it in the test.
  </action>
  <verify>Run `cd sidekiq-webapp && npx vitest run tests/unit/lib/sidebar-utils.test.ts` - all tests pass</verify>
  <done>getActiveFeature tested with all route patterns including priority ordering, default fallback, and edge cases. All tests green.</done>
</task>

<task type="auto">
  <name>Task 2: SidebarPanel and SidebarMobileOverlay component tests</name>
  <files>
    sidekiq-webapp/tests/unit/components/sidebar/sidebar-panel.test.tsx
    sidekiq-webapp/tests/unit/components/sidebar/sidebar-mobile-overlay.test.tsx
  </files>
  <action>
Create unit tests for two sidebar components. Both require mocking `next/navigation` (usePathname, useRouter). Follow the pattern from existing component tests (render, screen, describe/it).

**Mock setup for both files:**
Mock `next/navigation` with vi.mock at the top of each file:
```ts
const mockPathname = vi.fn<() => string>(() => "/chat");
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush }),
}));
```

Also mock the child panel components to avoid pulling in tRPC/hook dependencies. For SidebarPanel test, mock the three panel content components:
```ts
vi.mock("@sidekiq/components/sidebar/sidebar-panel-chats", () => ({
  SidebarPanelChats: () => <div data-testid="panel-chats">Chats Panel</div>,
}));
vi.mock("@sidekiq/components/sidebar/sidebar-panel-sidekiqs", () => ({
  SidebarPanelSidekiqs: () => <div data-testid="panel-sidekiqs">Sidekiqs Panel</div>,
}));
vi.mock("@sidekiq/components/sidebar/sidebar-panel-teams", () => ({
  SidebarPanelTeams: () => <div data-testid="panel-teams">Teams Panel</div>,
}));
```

For SidebarMobileOverlay test, mock the panel content components similarly.

**SidebarPanel tests (sidebar-panel.test.tsx):**

Test the hidden/block panel switching pattern. The component renders ALL three panels always (for state preservation), using `hidden` CSS class for inactive panels.

- When pathname is "/chat": chats panel container should NOT have "hidden" class, sidekiqs and teams panel containers SHOULD have "hidden" class
- When pathname is "/sidekiqs": sidekiqs panel visible, chats and teams hidden
- When pathname is "/settings/teams": teams panel visible, chats and sidekiqs hidden
- When pathname is "/settings": chats panel visible (default), sidekiqs and teams hidden
- All three panel testids should always be present in DOM (not conditionally rendered)

Use `container.querySelectorAll` or `screen.getByTestId` and check parent div classes for "hidden".

**SidebarMobileOverlay tests (sidebar-mobile-overlay.test.tsx):**

Test the rendering logic of the overlay component.

- When feature is "chats": renders title "Chats", shows New Chat button (sr-only text "New Chat"), renders chats panel content
- When feature is "sidekiqs": renders title "Sidekiqs", does NOT show New Chat button, renders sidekiqs panel content
- Close button always rendered (sr-only text "Close overlay")
- Calls onClose when close button clicked
- Calls onClose and navigates to "/chat" when New Chat button clicked (verify mockPush called with "/chat")

Use `fireEvent.click` for button interactions. Reset mocks in beforeEach.
  </action>
  <verify>Run `cd sidekiq-webapp && npx vitest run tests/unit/components/sidebar/` - all tests pass</verify>
  <done>SidebarPanel tested for hidden/block switching across all routes. SidebarMobileOverlay tested for conditional rendering, title, New Chat button, and close behavior. All tests green.</done>
</task>

</tasks>

<verification>
Run the full unit test suite to confirm no regressions:
```bash
cd sidekiq-webapp && npx vitest run tests/unit/
```
All existing tests plus 3 new test files pass.
</verification>

<success_criteria>
- 3 new test files created in correct directories
- sidebar-utils: ~15+ test cases covering all route patterns, priority order, default fallback
- sidebar-panel: ~5+ test cases covering hidden/block switching for each route
- sidebar-mobile-overlay: ~6+ test cases covering title, New Chat, close, feature-based rendering
- All tests pass with zero failures
- Existing test suite unaffected (no regressions)
</success_criteria>

<output>
After completion, create `.planning/quick/015-update-unit-test-suite-with-phase-8-2-te/015-SUMMARY.md`
</output>
