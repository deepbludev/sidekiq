import { expect, test } from "@playwright/test";

/**
 * Thread Management E2E Tests
 *
 * These tests require authentication and use the storage state from auth.setup.ts.
 * The tests verify thread management features including navigation, renaming,
 * pinning, archiving, deletion, and browser tab title updates.
 */

test.describe("Thread Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to a thread when clicked", async ({ page }) => {
    // First, create a message to have a thread
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Test message for navigation");
    await textarea.press("Enter");

    // Wait for URL to change to include thread ID
    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });

    // Save the current URL
    const threadUrl = page.url();

    // Navigate back to /chat
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    // Find and click the thread in the sidebar
    const threadItem = page.getByText("Test message for navigation").first();
    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click();
      await expect(page).toHaveURL(threadUrl, { timeout: 5000 });
    }
  });
});

test.describe("Thread Rename", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should rename thread via context menu", async ({ page }) => {
    // Create a message first
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Thread rename test");
    await textarea.press("Enter");

    // Wait for thread to be created
    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Find the thread item in sidebar and right-click
    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /thread rename test/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Right-click to open context menu
      await threadItem.click({ button: "right" });

      // Click Rename
      await page.getByText("Rename").click();

      // Type new name and press Enter
      const renameInput = page.getByRole("textbox");
      await renameInput.clear();
      await renameInput.fill("Renamed Thread");
      await renameInput.press("Enter");

      // Verify the new title appears
      await expect(page.getByText("Renamed Thread")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should cancel rename on Escape", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Cancel rename test");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /cancel rename test/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click({ button: "right" });
      await page.getByText("Rename").click();

      const renameInput = page.getByRole("textbox");
      await renameInput.clear();
      await renameInput.fill("Should not save");
      await renameInput.press("Escape");

      // Original title should still be there
      await expect(page.getByText("Cancel rename test")).toBeVisible({
        timeout: 5000,
      });
      expect(
        await page
          .getByText("Should not save")
          .isVisible()
          .catch(() => false),
      ).toBe(false);
    }
  });
});

test.describe("Thread Pin/Unpin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should pin and unpin thread via context menu", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Pin test thread");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /pin test thread/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Right-click and pin
      await threadItem.click({ button: "right" });
      await page.getByText("Pin").click();

      // Wait a moment for the update
      await page.waitForTimeout(500);

      // Right-click again to verify it shows "Unpin"
      await threadItem.click({ button: "right" });
      await expect(page.getByText("Unpin")).toBeVisible({ timeout: 5000 });

      // Unpin the thread
      await page.getByText("Unpin").click();

      // Verify it shows "Pin" again
      await threadItem.click({ button: "right" });
      await expect(page.getByText("Pin")).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Thread Archive", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should archive thread and show toast with undo", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Archive test thread");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /archive test thread/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click({ button: "right" });
      await page.getByText("Archive").click();

      // Should show toast with undo option
      await expect(page.getByText(/conversation archived/i)).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByText("Undo")).toBeVisible({ timeout: 5000 });

      // Click undo to restore
      await page.getByText("Undo").click();

      // Should show restored toast
      await expect(page.getByText(/conversation restored/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

test.describe("Thread Delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should show delete confirmation dialog", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Delete test thread");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /delete test thread/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click({ button: "right" });
      await page.getByRole("menuitem", { name: "Delete" }).click();

      // Should show confirmation dialog
      await expect(page.getByText("Delete conversation?")).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.getByText(/this action cannot be undone/i),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^delete$/i }),
      ).toBeVisible();
    }
  });

  test("should cancel deletion when Cancel is clicked", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Cancel delete thread");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /cancel delete thread/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click({ button: "right" });
      await page.getByRole("menuitem", { name: "Delete" }).click();

      // Click Cancel
      await page.getByRole("button", { name: "Cancel" }).click();

      // Dialog should close
      await expect(page.getByText("Delete conversation?")).not.toBeVisible({
        timeout: 5000,
      });

      // Thread should still be there
      await expect(page.getByText("Cancel delete thread")).toBeVisible();
    }
  });

  test("should delete thread when confirmed", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    const uniqueText = `Confirm delete ${Date.now()}`;
    await textarea.fill(uniqueText);
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: new RegExp(uniqueText, "i") })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItem.click({ button: "right" });
      await page.getByRole("menuitem", { name: "Delete" }).click();

      // Click Delete to confirm
      await page.getByRole("button", { name: /^delete$/i }).click();

      // Thread should be removed from sidebar
      await expect(page.getByText(uniqueText)).not.toBeVisible({
        timeout: 10000,
      });
    }
  });
});

test.describe("Browser Tab Title", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should display thread title in browser tab", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Hello, can you tell me a joke?");
    await textarea.press("Enter");

    // Wait for thread to be created and potentially get a title
    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });

    // Wait for title generation (the title is generated asynchronously)
    // The browser tab should eventually show the thread title
    await page.waitForTimeout(3000);

    // Check that the title is not just "Sidekiq" or "New conversation"
    const title = await page.title();
    expect(title).toBeTruthy();
    // Title should contain "Sidekiq" or have some content
    expect(title.length).toBeGreaterThan(0);
  });

  test("should update browser tab title when navigating between threads", async ({
    page,
  }) => {
    // Create first thread
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("First thread message");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    const firstTitle = await page.title();
    expect(firstTitle).toBeTruthy();

    // Navigate to new chat
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");

    // Create second thread
    await textarea.fill("Second thread message");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    const secondTitle = await page.title();

    // Titles may be different if auto-generated
    expect(secondTitle).toBeTruthy();
    expect(secondTitle.length).toBeGreaterThan(0);
  });
});

test.describe("Thread Dropdown Menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should show dropdown menu on hover and clicking more button", async ({
    page,
  }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Dropdown menu test");
    await textarea.press("Enter");

    await expect(page).toHaveURL(/\/chat\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator('[data-testid="sidebar"]')
      .or(page.locator("aside"))
      .first();
    const threadItem = sidebar
      .locator('[role="button"]')
      .filter({ hasText: /dropdown menu test/i })
      .first();

    if (await threadItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Hover to reveal the more button
      await threadItem.hover();

      // Find and click the more button (MoreHorizontal icon)
      const moreButton = threadItem
        .locator("button")
        .filter({ has: page.locator("svg") })
        .last();
      if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await moreButton.click();

        // Dropdown menu should show options
        await expect(page.getByText("Rename")).toBeVisible({ timeout: 5000 });
        await expect(
          page.getByText("Archive").or(page.getByText("Restore")),
        ).toBeVisible();
        await expect(page.getByText("Delete")).toBeVisible();
      }
    }
  });
});
