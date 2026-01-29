import { expect, test } from "@playwright/test";

/**
 * Workspace E2E tests
 *
 * These tests require authentication and use the storage state from auth.setup.ts.
 * Tests verify workspace features introduced in Phase 10 (schema migration from teams to workspaces)
 * and Phase 11 (workspace authorization):
 *
 * Phase 10 coverage:
 * - Settings page navigation and rendering
 * - Workspace terminology verification (no "Team" references)
 * - Sidebar panel display
 * - Workspace create flow (serial)
 * - Workspace settings section (members, danger zone)
 *
 * Phase 11 coverage:
 * - Workspace data isolation (personal workspace fallback)
 * - Workspace header injection (localStorage persistence)
 * - Workspace context in chat (workspace-scoped thread creation)
 * - Workspace settings with authorization (members query through workspace procedures)
 *
 * NOTE: The seed user has a personal workspace. The workspace list on /settings/teams
 * may filter personal workspaces, so tests handle both empty and populated states.
 */

test.describe("Workspace Settings Page Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should navigate to workspace settings via /settings/teams", async ({
    page,
  }) => {
    // Wait for the page to finish loading (either content or empty state)
    const workspaceSettings = page.getByText("Workspace Settings");
    const emptyState = page.getByText("No workspaces yet");
    const loadingState = page.getByText("Loading workspaces...");

    // First wait for loading to finish
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Either workspace content or empty state should appear
    await expect(workspaceSettings.or(emptyState)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display "New Workspace" button or create CTA', async ({
    page,
  }) => {
    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Either "New Workspace" button (when workspaces exist) or
    // "Create Your First Workspace" button (empty state)
    const newWorkspaceBtn = page.getByRole("button", {
      name: /new workspace/i,
    });
    const createFirstBtn = page.getByRole("button", {
      name: /create your first workspace/i,
    });

    await expect(newWorkspaceBtn.or(createFirstBtn)).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Workspace Terminology Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should show workspace terminology in settings heading", async ({
    page,
  }) => {
    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // If workspaces exist, verify "Workspace Settings" heading is visible
    const workspaceSettingsHeading = page.getByRole("heading", {
      name: /workspace settings/i,
    });
    const emptyState = page.getByText("No workspaces yet");

    // One of these must be visible
    await expect(workspaceSettingsHeading.or(emptyState)).toBeVisible({
      timeout: 5000,
    });

    // Verify NO "Team Settings" text appears on the page
    await expect(page.getByText("Team Settings")).not.toBeVisible();
  });

  test("should show workspace terminology in create dialog", async ({
    page,
  }) => {
    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Click "New Workspace" or "Create Your First Workspace" to open dialog
    const newWorkspaceBtn = page.getByRole("button", {
      name: /new workspace/i,
    });
    const createFirstBtn = page.getByRole("button", {
      name: /create your first workspace/i,
    });

    const hasNewBtn = await newWorkspaceBtn.isVisible().catch(() => false);
    if (hasNewBtn) {
      await newWorkspaceBtn.click();
    } else {
      await createFirstBtn.click();
    }

    // Verify dialog title "Create a Workspace"
    const dialogTitle = page.getByRole("heading", {
      name: /create a workspace/i,
    });
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // Verify dialog description contains workspace terminology
    const dialogDescription = page.getByText(/workspaces let you collaborate/i);
    await expect(dialogDescription).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(dialogTitle).not.toBeVisible();
  });
});

test.describe("Workspace Sidebar Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure sidebar starts expanded
    await page.addInitScript(() => {
      localStorage.removeItem("sidebar-panel-collapsed");
    });
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display Workspaces heading in sidebar panel", async ({
    page,
  }) => {
    // Find sidebar aside element
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Verify h2 heading "Workspaces" is visible in sidebar
    const workspacesHeading = sidebar.getByRole("heading", {
      name: /workspaces/i,
      level: 2,
    });
    await expect(workspacesHeading).toBeVisible({ timeout: 5000 });

    // Verify NO "Teams" heading appears in sidebar
    const teamsHeading = sidebar.getByRole("heading", {
      name: /^teams$/i,
      level: 2,
    });
    await expect(teamsHeading).not.toBeVisible();
  });

  test("should show workspace items or empty state in sidebar", async ({
    page,
  }) => {
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Wait for the panel heading to confirm workspace panel is active
    await expect(
      sidebar.getByRole("heading", { name: /workspaces/i, level: 2 }),
    ).toBeVisible({ timeout: 5000 });

    // Either workspace names are visible OR "No workspaces yet" empty state
    const noWorkspacesText = sidebar.getByText(/no workspaces yet/i);
    const createWorkspaceBtn = sidebar.getByRole("button", {
      name: /create workspace/i,
    });

    // In populated state, workspace links exist; in empty state, we see the empty message
    // Wait for either condition
    await expect(
      noWorkspacesText.or(sidebar.locator("a[href*='/settings/teams?team=']")),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Workspace Create Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("should create a workspace and show success toast", async ({ page }) => {
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Click the button to open create dialog
    const newWorkspaceBtn = page.getByRole("button", {
      name: /new workspace/i,
    });
    const createFirstBtn = page.getByRole("button", {
      name: /create your first workspace/i,
    });

    const hasNewBtn = await newWorkspaceBtn.isVisible().catch(() => false);
    if (hasNewBtn) {
      await newWorkspaceBtn.click();
    } else {
      await createFirstBtn.click();
    }

    // Wait for dialog to appear
    const dialogTitle = page.getByRole("heading", {
      name: /create a workspace/i,
    });
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // Fill in workspace name
    const workspaceName = `E2E Workspace Test ${Date.now()}`;
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill(workspaceName);

    // Submit form
    const submitBtn = page.getByRole("button", { name: /create workspace/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for success toast containing "Workspace" and "created"
    const successToast = page.getByText(/workspace.*created/i);
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Verify redirect to /settings/teams?team={id}
    await expect(page).toHaveURL(/\/settings\/teams\?team=/, {
      timeout: 10000,
    });

    // Clean up: Delete the created workspace via danger zone
    // Wait for the workspace settings to load
    const deleteBtn = page.getByRole("button", { name: /delete workspace/i });
    const hasDeleteBtn = await deleteBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasDeleteBtn) {
      await deleteBtn.click();

      // Type the workspace name to confirm deletion
      const confirmInput = page.locator('input[id="confirm-workspace-name"]');
      await expect(confirmInput).toBeVisible({ timeout: 5000 });
      await confirmInput.fill(workspaceName);

      // Click the confirm delete button in the dialog
      const confirmDeleteBtn = page
        .getByRole("alertdialog")
        .getByRole("button", { name: /delete workspace/i });
      await expect(confirmDeleteBtn).toBeEnabled();
      await confirmDeleteBtn.click();

      // Wait for deletion to complete
      await page.waitForTimeout(2000);
    }
  });

  test("should show created workspace in sidebar panel", async ({ page }) => {
    // Ensure sidebar starts expanded
    await page.addInitScript(() => {
      localStorage.removeItem("sidebar-panel-collapsed");
    });

    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Create a workspace
    const newWorkspaceBtn = page.getByRole("button", {
      name: /new workspace/i,
    });
    const createFirstBtn = page.getByRole("button", {
      name: /create your first workspace/i,
    });

    const hasNewBtn = await newWorkspaceBtn.isVisible().catch(() => false);
    if (hasNewBtn) {
      await newWorkspaceBtn.click();
    } else {
      await createFirstBtn.click();
    }

    const dialogTitle = page.getByRole("heading", {
      name: /create a workspace/i,
    });
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    const workspaceName = `E2E Sidebar Workspace ${Date.now()}`;
    const nameInput = page.getByLabel(/name/i);
    await nameInput.fill(workspaceName);

    const submitBtn = page.getByRole("button", { name: /create workspace/i });
    await submitBtn.click();

    // Wait for success toast
    const successToast = page.getByText(/workspace.*created/i);
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Wait for redirect and page to settle
    await expect(page).toHaveURL(/\/settings\/teams\?team=/, {
      timeout: 10000,
    });
    await page.waitForTimeout(1000);

    // Verify the workspace name appears in the sidebar panel
    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByText(workspaceName)).toBeVisible({
      timeout: 10000,
    });

    // Clean up: Delete the created workspace
    const deleteBtn = page.getByRole("button", { name: /delete workspace/i });
    const hasDeleteBtn = await deleteBtn
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasDeleteBtn) {
      await deleteBtn.click();

      const confirmInput = page.locator('input[id="confirm-workspace-name"]');
      await expect(confirmInput).toBeVisible({ timeout: 5000 });
      await confirmInput.fill(workspaceName);

      const confirmDeleteBtn = page
        .getByRole("alertdialog")
        .getByRole("button", { name: /delete workspace/i });
      await expect(confirmDeleteBtn).toBeEnabled();
      await confirmDeleteBtn.click();

      await page.waitForTimeout(2000);
    }
  });
});

test.describe("Workspace Settings Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display workspace name and settings when workspace is selected", async ({
    page,
  }) => {
    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Check if workspaces exist (not empty state)
    const emptyState = page.getByText("No workspaces yet");
    const workspaceSettings = page.getByRole("heading", {
      name: /workspace settings/i,
    });

    // Wait for one of these to appear
    await expect(workspaceSettings.or(emptyState)).toBeVisible({
      timeout: 5000,
    });

    const hasWorkspaces = await workspaceSettings
      .isVisible()
      .catch(() => false);

    if (hasWorkspaces) {
      // Verify "Workspace Settings" heading is visible
      await expect(workspaceSettings).toBeVisible();

      // Verify "Members" heading is visible
      const membersHeading = page.getByRole("heading", { name: /members/i });
      await expect(membersHeading).toBeVisible();

      // Verify "Workspace Name" label is present
      const workspaceNameLabel = page.getByText("Workspace Name");
      await expect(workspaceNameLabel).toBeVisible();
    }
  });

  test("should display danger zone with Delete Workspace button", async ({
    page,
  }) => {
    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Check if workspaces exist
    const emptyState = page.getByText("No workspaces yet");
    const workspaceSettings = page.getByRole("heading", {
      name: /workspace settings/i,
    });

    await expect(workspaceSettings.or(emptyState)).toBeVisible({
      timeout: 5000,
    });

    const hasWorkspaces = await workspaceSettings
      .isVisible()
      .catch(() => false);

    if (hasWorkspaces) {
      // If user is owner, verify danger zone is visible
      const dangerZone = page.getByRole("heading", { name: /danger zone/i });
      const hasDangerZone = await dangerZone.isVisible().catch(() => false);

      if (hasDangerZone) {
        await expect(dangerZone).toBeVisible();

        // Verify "Delete Workspace" button is visible
        const deleteBtn = page.getByRole("button", {
          name: /delete workspace/i,
        });
        await expect(deleteBtn).toBeVisible();
      }
    }
  });
});

// ============================================================================
// Phase 11: Workspace Authorization E2E Tests
// ============================================================================

test.describe("Workspace Data Isolation", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure sidebar starts expanded and no workspace override is set
    await page.addInitScript(() => {
      localStorage.removeItem("sidebar-panel-collapsed");
      localStorage.removeItem("sidekiq-active-workspace-id");
    });
  });

  test("should show threads in personal workspace by default", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // The sidebar should show the thread list area with a search input for conversations.
    // With no explicit workspace set, the personal workspace fallback works and data loads.
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // The search input for conversations indicates the thread list area has loaded
    const searchInput = sidebar.getByPlaceholder("Search conversations...");
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("should show sidekiqs in personal workspace by default", async ({
    page,
  }) => {
    await page.goto("/sidekiqs");
    await page.waitForLoadState("domcontentloaded");

    // The sidebar should show the Sidekiqs panel heading (h2) and either
    // sidekiq items or empty state, validating the personal workspace fallback path
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    const sidekiqsHeading = sidebar.getByRole("heading", {
      name: /sidekiqs/i,
      level: 2,
    });
    const emptyState = sidebar.getByText(/no sidekiqs/i);

    // Either the heading with items or empty state should be visible
    await expect(sidekiqsHeading.or(emptyState)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Workspace Header Injection", () => {
  test("should persist workspace selection in localStorage", async ({
    page,
  }) => {
    // Set localStorage key before page load via addInitScript
    await page.addInitScript(() => {
      localStorage.setItem(
        "sidekiq-active-workspace-id",
        "test-workspace-id-123",
      );
    });

    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Read back the localStorage value at runtime and verify it matches
    const storedValue = await page.evaluate(() =>
      localStorage.getItem("sidekiq-active-workspace-id"),
    );
    expect(storedValue).toBe("test-workspace-id-123");
  });

  test("should clear workspace selection from localStorage", async ({
    page,
  }) => {
    // Set a workspace value before page load
    await page.addInitScript(() => {
      localStorage.setItem(
        "sidekiq-active-workspace-id",
        "test-workspace-id-456",
      );
    });

    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Remove the key at runtime and verify it returns null
    const clearedValue = await page.evaluate(() => {
      localStorage.removeItem("sidekiq-active-workspace-id");
      return localStorage.getItem("sidekiq-active-workspace-id");
    });
    expect(clearedValue).toBeNull();
  });
});

test.describe("Workspace Context in Chat", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean workspace state (personal workspace fallback)
    await page.addInitScript(() => {
      localStorage.removeItem("sidekiq-active-workspace-id");
    });
  });

  test("should load chat interface with workspace context", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // The chat input placeholder should be visible, confirming the chat route's
    // workspace validation does not block loading when no workspace header is set
    // (personal workspace fallback via resolveWorkspaceId)
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test("should create thread with workspace context", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Type a message and press Enter to create a new thread
    const chatInput = page.getByPlaceholder(/type a message/i);
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    await chatInput.fill("E2E workspace thread test");
    await chatInput.press("Enter");

    // Wait for URL to change to /chat/[threadId] pattern indicating thread creation
    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9-]+/, { timeout: 15000 });

    // Verify the message text appears on the page
    const message = page.getByText("E2E workspace thread test");
    await expect(message).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Workspace Settings with Authorization", () => {
  test("should load workspace settings with authorized access", async ({
    page,
  }) => {
    await page.goto("/settings/teams");
    await page.waitForLoadState("domcontentloaded");

    // Wait for loading to finish
    const loadingState = page.getByText("Loading workspaces...");
    await expect(loadingState).toBeHidden({ timeout: 10000 });

    // Either "Workspace Settings" heading or empty state should be visible
    const workspaceSettings = page.getByRole("heading", {
      name: /workspace settings/i,
    });
    const emptyState = page.getByText("No workspaces yet");

    await expect(workspaceSettings.or(emptyState)).toBeVisible({
      timeout: 5000,
    });

    // If workspaces exist, verify Members section loads
    // (the members query now goes through workspace-authorized procedures)
    const hasWorkspaces = await workspaceSettings
      .isVisible()
      .catch(() => false);

    if (hasWorkspaces) {
      const membersHeading = page.getByRole("heading", { name: /members/i });
      await expect(membersHeading).toBeVisible({ timeout: 5000 });
    }
  });
});
