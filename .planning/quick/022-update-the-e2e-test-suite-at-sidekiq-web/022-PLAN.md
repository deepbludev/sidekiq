---
phase: quick-022
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/e2e/workspace.spec.ts
  - sidekiq-webapp/playwright.config.ts
autonomous: true

must_haves:
  truths:
    - "E2E tests verify workspace terminology appears in the UI (not team terminology)"
    - "E2E tests verify workspace CRUD operations work (list, create, settings, delete)"
    - "E2E tests verify the sidebar workspace panel displays correctly"
    - "All E2E tests pass via pnpm test:e2e"
  artifacts:
    - path: "sidekiq-webapp/tests/e2e/workspace.spec.ts"
      provides: "Workspace E2E test suite covering Phase 10 features"
      min_lines: 100
  key_links:
    - from: "sidekiq-webapp/playwright.config.ts"
      to: "workspace.spec.ts"
      via: "testMatch pattern for authenticated tests"
      pattern: "workspace"
---

<objective>
Add a new `workspace.spec.ts` E2E test file covering the Phase 10 workspace schema migration features, and update `playwright.config.ts` to include it in the authenticated test project.

Purpose: Phase 10 renamed all "Team" UI terminology to "Workspace" and introduced workspace CRUD operations. No E2E tests currently cover workspace features (settings page, sidebar panel, create/delete flows). This fills that gap.

Output: A working `workspace.spec.ts` with passing tests, and an updated Playwright config.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

## Phase 10 Key Context

Phase 10 renamed teams -> workspaces throughout the app. Key UI changes:

### Sidebar Icon Rail
- Icon labeled "Workspaces" (href="/settings/teams") in `src/shared/layout/sidebar-icon-rail.tsx`
- Clicking it navigates to /settings/teams (URL unchanged for backwards compat)

### Sidebar Panel (Workspaces)
- Component: `src/features/workspace/components/sidebar-panel-workspaces.tsx`
- Heading: "Workspaces" (h2)
- Empty state: "No workspaces yet" + "Create Workspace" button
- Workspace list items link to `/settings/teams?team={id}`

### Settings Page (/settings/teams)
- Component: `src/app/(dashboard)/settings/teams/page.tsx`
- Loading text: "Loading workspaces..."
- Empty state: "No workspaces yet" + "Create Your First Workspace" button
- Has "New Workspace" button
- Workspace selector dropdown
- WorkspaceSettingsSection with heading "Workspace Settings"
- Members section heading "Members"
- Danger Zone with "Delete Workspace" button

### Create Dialog
- Component: `src/features/workspace/components/workspace-create-dialog.tsx`
- Title: "Create a Workspace"
- Description: "Workspaces let you collaborate with others and share Sidekiqs."
- Success toast: `Workspace "{name}" created!`

### Invite Accept Page (/invite/[token])
- Component: `src/features/workspace/components/invite-accept-card.tsx`
- Title: "Join {workspaceName}"
- Uses workspace terminology throughout

### Playwright Config
- Authenticated tests matched by: `/(chat|thread|model-selection|sidebar|sidekiq)\.spec\.ts/`
- Must add `workspace` to this regex
- Auth setup saves state to `tests/.auth/user.json`
- Global setup runs db reset-and-seed (creates personal workspace for seed user)

### Existing E2E Patterns
- Tests use `test.describe` blocks grouped by feature area
- Authenticated tests use storage state from auth.setup.ts
- Tests use Playwright locators: `page.getByRole`, `page.getByText`, `page.locator`
- Tests handle conditional UI states gracefully (empty states vs. populated states)
- Serial mode used for tests that create resources (to avoid rate limiting)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create workspace.spec.ts and update Playwright config</name>
  <files>
    sidekiq-webapp/tests/e2e/workspace.spec.ts
    sidekiq-webapp/playwright.config.ts
  </files>
  <action>
1. **Update `playwright.config.ts`**: Add `workspace` to the authenticated test match regex.
   - Change `/(chat|thread|model-selection|sidebar|sidekiq)\.spec\.ts/` to `/(chat|thread|model-selection|sidebar|sidekiq|workspace)\.spec\.ts/`

2. **Create `workspace.spec.ts`** with the following test groups:

**Workspace Settings Page Navigation** (describe block):
- Test: should navigate to workspace settings via /settings/teams
  - `page.goto("/settings/teams")`
  - Verify either workspace content loads (workspace name visible, "Workspace Settings" heading) OR empty state ("No workspaces yet") appears
  - This validates the settings page renders with workspace terminology

- Test: should display "New Workspace" button
  - Navigate to /settings/teams
  - Verify button with text "New Workspace" OR "Create Your First Workspace" is visible

**Workspace Terminology Verification** (describe block):
- Test: should show workspace terminology in settings heading
  - Navigate to /settings/teams
  - Wait for loading to finish
  - If workspaces exist: Verify "Workspace Settings" heading (h2) is visible
  - Verify NO "Team Settings" text appears on the page

- Test: should show workspace terminology in create dialog
  - Navigate to /settings/teams
  - Click "New Workspace" button (or "Create Your First Workspace" if empty state)
  - Verify dialog title "Create a Workspace" is visible
  - Verify dialog description contains "Workspaces let you collaborate"
  - Close dialog with Escape

**Workspace Sidebar Panel** (describe block):
- Test: should display Workspaces heading in sidebar panel
  - Navigate to /settings/teams (this activates the workspace panel)
  - Find sidebar `aside` element
  - Verify h2 heading "Workspaces" is visible in sidebar
  - Verify NO "Teams" heading appears in sidebar

- Test: should show workspace items or empty state in sidebar
  - Navigate to /settings/teams
  - In sidebar: either workspace names are visible OR "No workspaces yet" empty state appears

**Workspace Create Flow** (describe block, serial mode):
- Test: should create a workspace and show success toast
  - Navigate to /settings/teams
  - Click the button to open create dialog ("New Workspace" or "Create Your First Workspace")
  - Fill in workspace name: `E2E Workspace Test {Date.now()}`
  - Submit form
  - Wait for success toast containing "Workspace" and "created"
  - Verify redirect to /settings/teams?team={id}
  - Clean up: use the danger zone "Delete Workspace" flow if the workspace was created

- Test: should show created workspace in sidebar panel
  - After creating a workspace, navigate to /settings/teams
  - Verify the workspace name appears in the sidebar panel

**Workspace Settings Section** (describe block):
- Test: should display workspace name and settings when workspace is selected
  - Navigate to /settings/teams
  - If workspaces exist: verify "Workspace Settings" heading, "Members" heading, and workspace name are all visible
  - Verify "Workspace Name" label is present

- Test: should display danger zone with Delete Workspace button
  - Navigate to /settings/teams
  - If user is owner: verify "Danger Zone" heading and "Delete Workspace" button are visible

Important implementation notes:
- Use `beforeEach` with `page.goto("/settings/teams")` and `page.waitForLoadState("domcontentloaded")` for settings tests
- Handle both "has workspaces" and "empty state" cases gracefully (the seed user has a personal workspace, which may or may not appear depending on whether the workspace list filters personal workspaces)
- Use `test.describe.configure({ mode: "serial" })` for the create flow tests
- Follow the existing E2E test patterns (JSDoc, beforeEach, locator patterns)
- Keep tests focused on UI terminology verification (workspace not team) and basic CRUD flow
- Do NOT test workspace member management (invite, remove) -- that requires a second user account
  </action>
  <verify>
Run `pnpm test:e2e` from the sidekiq-webapp directory. All workspace tests should pass. Also verify existing tests still pass (the config change should not break them).
  </verify>
  <done>
- workspace.spec.ts exists with test groups covering: settings navigation, terminology verification, sidebar panel, create flow, settings section
- playwright.config.ts includes workspace in authenticated test match pattern
- All E2E tests pass (both new workspace tests and existing tests)
  </done>
</task>

</tasks>

<verification>
1. `pnpm test:e2e` passes all tests (existing + new workspace tests)
2. `workspace.spec.ts` contains tests that verify "Workspace" terminology appears (not "Team")
3. `workspace.spec.ts` covers: settings page, sidebar panel, create dialog, settings section
4. `playwright.config.ts` updated to include workspace spec in authenticated project
</verification>

<success_criteria>
- New workspace.spec.ts E2E tests pass covering Phase 10 workspace features
- Existing E2E tests continue passing
- Workspace terminology verified in settings, sidebar, and create dialog
- Playwright config updated to include workspace tests in authenticated project
</success_criteria>

<output>
After completion, create `.planning/quick/022-update-the-e2e-test-suite-at-sidekiq-web/022-SUMMARY.md`
</output>
