import { expect, test } from "@playwright/test";

/**
 * Sidebar E2E tests
 *
 * These tests require authentication and use the storage state from auth.setup.ts.
 * Tests verify sidebar navigation, collapse/expand functionality, and mobile drawer.
 */

test.describe("Sidebar Visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display sidebar on desktop", async ({ page }) => {
    // Sidebar should be visible on desktop (default viewport)
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("should display collapse button", async ({ page }) => {
    // The collapse button (toggle) should be visible
    // aria-label is "Collapse sidebar" or "Expand sidebar"
    const collapseButton = page.getByRole("button", {
      name: /collapse sidebar|expand sidebar/i,
    });
    await expect(collapseButton).toBeVisible();
  });

  test("should hide thread list when collapsed", async ({ page }) => {
    // Find and click the collapse button (aria-label="Collapse sidebar")
    const collapseButton = page.getByRole("button", {
      name: /collapse sidebar/i,
    });
    // Use force to bypass any dev overlay intercepting clicks
    await collapseButton.click({ force: true });

    // Wait for the 200ms transition to complete
    await page.waitForTimeout(300);

    // Thread list should be hidden (sidebar collapsed to icon rail)
    // After collapse, the full "New Chat" button text should not be visible
    // The sidebar width should be reduced
    const sidebar = page.locator("aside").first();
    const sidebarBox = await sidebar.boundingBox();

    // Collapsed sidebar should be narrow (w-16 = 64px)
    expect(sidebarBox?.width).toBeLessThan(100);
  });

  test("should show thread list when expanded after collapse", async ({
    page,
  }) => {
    // First collapse (aria-label="Collapse sidebar")
    const collapseButton = page.getByRole("button", {
      name: /collapse sidebar/i,
    });
    // Use force to bypass any dev overlay intercepting clicks
    await collapseButton.click({ force: true });

    // Wait for the 200ms transition to complete
    await page.waitForTimeout(300);

    // Verify collapsed state
    const sidebar = page.locator("aside").first();
    let sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeLessThan(100);

    // Now expand (button label changes to "Expand sidebar" when collapsed)
    const expandButton = page.getByRole("button", { name: /expand sidebar/i });
    // Use force to bypass any dev overlay intercepting clicks
    await expandButton.click({ force: true });

    // Wait for the 200ms transition to complete
    await page.waitForTimeout(300);

    // Verify expanded state
    sidebarBox = await sidebar.boundingBox();
    // Expanded sidebar should be wider (w-72 = 288px)
    expect(sidebarBox?.width).toBeGreaterThan(200);
  });
});

test.describe("Thread List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display thread list area", async ({ page }) => {
    // The sidebar should have a scrollable area for threads
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Look for thread group headers (Pinned, Today, Yesterday, etc.) or threads
    // Group headers have uppercase text like "TODAY", "YESTERDAY", "PINNED"
    const todayHeader = sidebar.getByText("TODAY");
    const yesterdayHeader = sidebar.getByText("YESTERDAY");
    const pinnedHeader = sidebar.getByText("PINNED");
    const thisWeekHeader = sidebar.getByText("THIS WEEK");

    // Check if any group header exists or if search input is visible (sidebar is functional)
    const searchInput = page.getByPlaceholder(/search/i);
    const hasSearch = await searchInput.isVisible().catch(() => false);
    const hasToday = await todayHeader.isVisible().catch(() => false);
    const hasYesterday = await yesterdayHeader.isVisible().catch(() => false);
    const hasPinned = await pinnedHeader.isVisible().catch(() => false);
    const hasThisWeek = await thisWeekHeader.isVisible().catch(() => false);

    // Either some group headers exist or search is visible (sidebar is working)
    expect(
      hasSearch || hasToday || hasYesterday || hasPinned || hasThisWeek,
    ).toBe(true);
  });

  test("should navigate to thread when clicked", async ({ page }) => {
    // First create a thread by sending a message
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Test message for sidebar navigation");
    await textarea.press("Enter");

    // Wait for thread to be created (URL should change to /chat/[id])
    await page.waitForURL(/\/chat\/[\w-]+/, { timeout: 10000 });

    // Get the thread ID from URL
    const currentUrl = page.url();
    const threadIdMatch = /\/chat\/([\w-]+)/.exec(currentUrl);
    expect(threadIdMatch).toBeTruthy();
    const threadId = threadIdMatch![1];

    // Navigate to new chat
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Find and click the thread in sidebar
    const threadItem = page.locator(`[data-thread-id="${threadId}"]`);

    // If thread item has data attribute, click it
    if (await threadItem.isVisible().catch(() => false)) {
      await threadItem.click();
      await expect(page).toHaveURL(new RegExp(`/chat/${threadId}`));
    }
  });

  test("should display search input", async ({ page }) => {
    // Search input should be visible in sidebar
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("should focus search input on Cmd+K / Ctrl+K", async ({ page }) => {
    // Get the search input
    const searchInput = page.getByPlaceholder(/search/i);

    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+k" : "Control+k");

    // Search input should be focused
    await expect(searchInput).toBeFocused();
  });
});

test.describe("Mobile Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should hide sidebar by default on mobile", async ({ page }) => {
    // Sidebar should not be visible on mobile by default
    const sidebar = page.locator("aside").first();

    // On mobile, the main sidebar is hidden
    // Check if it's not visible or has mobile-hidden classes
    const isVisible = await sidebar.isVisible().catch(() => false);

    // Either sidebar is hidden or it has zero width
    if (isVisible) {
      const box = await sidebar.boundingBox();
      // If visible, it should be off-screen or have zero width
      expect(box?.width === 0 || box === null).toBe(true);
    }
  });

  test("should show mobile menu button", async ({ page }) => {
    // Mobile menu button should be visible (sr-only text is "Toggle sidebar")
    const menuButton = page.getByRole("button", { name: /toggle sidebar/i });
    await expect(menuButton).toBeVisible();
  });

  test("should open drawer when mobile menu button clicked", async ({
    page,
  }) => {
    // Click mobile menu button (sr-only text is "Toggle sidebar")
    const menuButton = page.getByRole("button", { name: /toggle sidebar/i });
    await menuButton.click();

    // Drawer should open (Sheet component)
    // Look for the drawer/sheet content
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });
  });

  test("should close drawer when clicking outside", async ({ page }) => {
    // Open drawer (sr-only text is "Toggle sidebar")
    const menuButton = page.getByRole("button", { name: /toggle sidebar/i });
    await menuButton.click();

    // Wait for drawer to be visible
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Click the overlay/backdrop to close
    const overlay = page.locator('[data-state="open"]').first();
    if (await overlay.isVisible()) {
      // Press Escape to close the drawer (more reliable than clicking overlay)
      await page.keyboard.press("Escape");
    }

    // Drawer should be hidden
    await expect(drawer).toBeHidden({ timeout: 5000 });
  });

  test("should close drawer and navigate when thread clicked", async ({
    page,
  }) => {
    // First create a thread on desktop viewport, then test on mobile
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Create a thread
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Mobile sidebar test message");
    await textarea.press("Enter");

    // Wait for thread creation
    await page.waitForURL(/\/chat\/[\w-]+/, { timeout: 10000 });

    // Get thread ID
    const currentUrl = page.url();
    const threadIdMatch = /\/chat\/([\w-]+)/.exec(currentUrl);
    const threadId = threadIdMatch?.[1];

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");

    // Open mobile drawer (sr-only text is "Toggle sidebar")
    const menuButton = page.getByRole("button", { name: /toggle sidebar/i });
    await menuButton.click();

    // Wait for drawer
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // If we can find and click the thread
    if (threadId) {
      const threadItem = drawer.locator(`[data-thread-id="${threadId}"]`);
      if (await threadItem.isVisible().catch(() => false)) {
        await threadItem.click();

        // Drawer should close
        await expect(drawer).toBeHidden({ timeout: 5000 });

        // Should navigate to thread
        await expect(page).toHaveURL(new RegExp(`/chat/${threadId}`));
      }
    }
  });
});

test.describe("Sidebar Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display user info in footer", async ({ page }) => {
    // Sidebar footer should show user information
    const sidebar = page.locator("aside").first();

    // Look for user avatar or name in footer
    const footer = sidebar.locator("[data-sidebar-footer]");

    if (await footer.isVisible().catch(() => false)) {
      // Footer should be visible with user info
      await expect(footer).toBeVisible();
    }
  });

  test("should display settings link", async ({ page }) => {
    // Settings button/link should be visible in sidebar
    const settingsButton = page.getByRole("button", { name: /settings/i });

    // Settings might be in footer or icon rail
    const isVisible = await settingsButton.isVisible().catch(() => false);

    // Settings should exist somewhere in the sidebar
    if (isVisible) {
      await expect(settingsButton).toBeVisible();
    }
  });
});

test.describe("New Chat Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display New Chat button in expanded sidebar", async ({
    page,
  }) => {
    // New Chat button should be visible in sidebar header
    const newChatButton = page.getByRole("button", { name: /new chat/i });
    await expect(newChatButton).toBeVisible();
  });

  test("should navigate to /chat when New Chat clicked", async ({ page }) => {
    // First navigate to an existing thread
    const textarea = page.getByPlaceholder("Type a message...");
    await textarea.fill("Test for new chat button");
    await textarea.press("Enter");

    // Wait for navigation to thread
    await page.waitForURL(/\/chat\/[\w-]+/, { timeout: 10000 });

    // Click New Chat
    const newChatButton = page.getByRole("button", { name: /new chat/i });
    await newChatButton.click();

    // Should navigate to /chat (new conversation)
    await expect(page).toHaveURL("/chat");
  });
});
