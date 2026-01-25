---
phase: quick
plan: 005
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/tests/e2e/sidekiq.spec.ts
autonomous: true

must_haves:
  truths:
    - "Create Sidekiq flow is E2E tested (template selection, form fill, submit)"
    - "Edit Sidekiq flow is E2E tested (navigate, modify, save)"
    - "Delete Sidekiq flow is E2E tested (type-to-confirm dialog)"
    - "Sidekiq list page is E2E tested (grid/list view, search)"
    - "Sidebar Sidekiqs section is E2E tested (display, navigation)"
  artifacts:
    - path: "sidekiq-webapp/tests/e2e/sidekiq.spec.ts"
      provides: "E2E tests for Phase 6 Sidekiq CRUD flows"
      min_lines: 200
---

<objective>
Implement E2E tests for Phase 6 Sidekiq CRUD functionality.

Purpose: Verify all user-facing Sidekiq flows work correctly end-to-end in a browser environment.

Output: `sidekiq-webapp/tests/e2e/sidekiq.spec.ts` with comprehensive test coverage for create, edit, delete, list, and sidebar flows.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/06-sidekiq-crud/06-VERIFICATION.md

# Existing E2E test patterns
@sidekiq-webapp/tests/e2e/sidebar.spec.ts

# Components under test
@sidekiq-webapp/src/app/(dashboard)/sidekiqs/page.tsx
@sidekiq-webapp/src/app/(dashboard)/sidekiqs/new/page.tsx
@sidekiq-webapp/src/components/sidekiq/sidekiq-list.tsx
@sidekiq-webapp/src/components/sidekiq/delete-sidekiq-dialog.tsx
@sidekiq-webapp/src/components/sidekiq/starter-templates.tsx
@sidekiq-webapp/src/components/sidebar/sidebar-sidekiqs.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create E2E test file with Sidekiq CRUD tests</name>
  <files>sidekiq-webapp/tests/e2e/sidekiq.spec.ts</files>
  <action>
Create comprehensive E2E tests for Sidekiq CRUD following existing patterns from sidebar.spec.ts.

**Test Structure:**

```typescript
import { expect, test } from "@playwright/test";

/**
 * Sidekiq CRUD E2E tests
 *
 * Tests the complete Sidekiq lifecycle:
 * - Create flow (template selection -> form -> submit)
 * - Edit flow (navigate -> modify -> save)
 * - Delete flow (type-to-confirm dialog)
 * - List page (grid/list view, search)
 * - Sidebar section (display, navigation)
 */
```

**Test Describes to implement:**

1. **"Sidekiq List Page"**
   - `should display list page heading`
   - `should show empty state when no Sidekiqs`
   - `should display "New Sidekiq" button`
   - `should toggle between grid and list view`
   - `should filter Sidekiqs by search`

2. **"Create Sidekiq Flow"**
   - `should display template selection on /sidekiqs/new`
   - `should show form after selecting template`
   - `should display "Start from scratch" option`
   - `should create Sidekiq and redirect to list`
   - `should show validation errors for empty name`

3. **"Edit Sidekiq Flow"**
   - `should navigate to edit page from list`
   - `should display existing Sidekiq data in form`
   - `should save changes and show success toast`
   - `should show unsaved changes warning` (beforeunload - note: hard to test, optional)

4. **"Delete Sidekiq Flow"**
   - `should open delete dialog from list actions`
   - `should require exact name to confirm deletion`
   - `should disable delete button until name matches`
   - `should delete Sidekiq and remove from list`

5. **"Sidebar Sidekiqs Section"**
   - `should display Sidekiqs section in sidebar`
   - `should show empty state with "Create first" CTA`
   - `should display created Sidekiq in sidebar`
   - `should navigate to edit when clicking Sidekiq`
   - `should show favorites with star icon`

**Key Patterns from sidebar.spec.ts:**

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/sidekiqs");
  await page.waitForLoadState("domcontentloaded");
});

// Use role-based selectors
const button = page.getByRole("button", { name: /new sidekiq/i });
const heading = page.getByRole("heading", { name: /sidekiqs/i });
const input = page.getByPlaceholder("Search Sidekiqs...");

// Use force: true for clicks when needed (dev overlay)
await button.click({ force: true });

// Wait for transitions
await page.waitForTimeout(300);

// Check visibility
await expect(element).toBeVisible();
await expect(page).toHaveURL("/sidekiqs");
```

**Specific selectors needed:**

- List page heading: `page.getByRole("heading", { name: "Sidekiqs" })`
- New Sidekiq button: `page.getByRole("link", { name: /new sidekiq/i })`
- Search input: `page.getByPlaceholder("Search Sidekiqs...")`
- Grid/List toggle: `page.getByRole("button", { name: /grid view|list view/i })`
- Template cards: `page.getByRole("button", { name: /writing assistant|start from scratch/i })`
- Form fields: `page.getByLabel(/name/i)`, `page.getByLabel(/description/i)`
- Save button: `page.getByRole("button", { name: /create sidekiq|save/i })`
- Delete dialog: `page.getByRole("alertdialog")`
- Confirm input: `page.getByLabel(/type .* to confirm/i)`
- Sidebar section: `page.locator("aside").getByText("SIDEKIQS")`

**Helper for CRUD cycle:**
Create a helper to create a Sidekiq for tests that need existing data:

```typescript
async function createTestSidekiq(page: Page, name: string) {
  await page.goto("/sidekiqs/new");
  await page.waitForLoadState("domcontentloaded");

  // Select "Start from scratch"
  await page.getByRole("button", { name: /start from scratch/i }).click();

  // Fill form
  await page.getByLabel(/^name$/i).fill(name);
  await page.getByLabel(/description/i).fill("Test description");

  // Submit
  await page.getByRole("button", { name: /create sidekiq/i }).click();

  // Wait for redirect
  await page.waitForURL("/sidekiqs", { timeout: 10000 });
}
```

**Important notes:**
- Tests require authentication (use storage state from auth.setup.ts)
- Use unique names with timestamps to avoid conflicts: `Test Sidekiq ${Date.now()}`
- Clean up created Sidekiqs in afterEach or use unique test data
- Wait for DOM ready before interacting: `await page.waitForLoadState("domcontentloaded")`
- Use timeouts for async operations (create, delete)
  </action>
  <verify>
Run E2E tests:
```bash
cd sidekiq-webapp && npx playwright test sidekiq.spec.ts --project=chromium
```
All tests pass.
  </verify>
  <done>
E2E test file exists at `sidekiq-webapp/tests/e2e/sidekiq.spec.ts` with:
- 5 test.describe blocks covering all CRUD flows
- At least 15 individual tests
- All tests pass in CI
  </done>
</task>

</tasks>

<verification>
```bash
# Run Sidekiq E2E tests
cd sidekiq-webapp && npx playwright test sidekiq.spec.ts --project=chromium

# Verify test count
grep -c "test(" tests/e2e/sidekiq.spec.ts
# Expected: 15+
```
</verification>

<success_criteria>
- E2E test file created at `sidekiq-webapp/tests/e2e/sidekiq.spec.ts`
- Tests cover: list page, create flow, edit flow, delete flow, sidebar section
- All tests pass locally
- Tests follow existing patterns from sidebar.spec.ts
</success_criteria>

<output>
After completion, create `.planning/quick/005-implement-e2e-tests-for-phase-6-sidekiq-/005-SUMMARY.md`
</output>
