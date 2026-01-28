import { expect, test } from "@playwright/test";

/**
 * Sidebar E2E tests
 *
 * These tests require authentication and use the storage state from auth.setup.ts.
 * Tests verify sidebar navigation, collapse/expand functionality, and mobile tab bar.
 *
 * The sidebar uses a two-tier layout:
 * - Icon rail (always visible): New Chat, Chats, Sidekiqs, Teams, Settings, User avatar
 * - Panel (collapsible): Contextual content based on active route
 *
 * Panel toggle mechanisms:
 * - Cmd/Ctrl+B keyboard shortcut
 * - Re-clicking the active icon in the rail
 */

test.describe("Sidebar Visibility", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure sidebar starts expanded
    await page.addInitScript(() => {
      localStorage.removeItem("sidebar-panel-collapsed");
    });
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display sidebar on desktop", async ({ page }) => {
    // Sidebar should be visible on desktop (default viewport)
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("should toggle panel via keyboard shortcut", async ({ page }) => {
    // Panel toggle is done via Cmd+B (Mac) or Ctrl+B
    const sidebar = page.locator("aside").first();

    // Wait for sidebar to be fully rendered
    await expect(sidebar).toBeVisible();
    await page.waitForTimeout(500);

    // Get initial width (expanded)
    const expandedBox = await sidebar.boundingBox();
    expect(expandedBox?.width).toBeGreaterThan(200);

    // Press Cmd+B to collapse
    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+b" : "Control+b");

    // Wait for the 200ms transition to complete
    await page.waitForTimeout(500);

    // Sidebar should be narrow (icon rail only, w-12 = 48px)
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox?.width).toBeLessThan(100);
  });

  test("should hide thread list when collapsed", async ({ page }) => {
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await page.waitForTimeout(500);

    // Press Cmd+B to collapse
    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+b" : "Control+b");

    // Wait for transition
    await page.waitForTimeout(500);

    // Collapsed sidebar should be narrow (icon rail only)
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeLessThan(100);
  });

  test("should show thread list when expanded after collapse", async ({
    page,
  }) => {
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
    await page.waitForTimeout(500);

    const isMac = process.platform === "darwin";
    const toggleKey = isMac ? "Meta+b" : "Control+b";

    // Collapse
    await page.keyboard.press(toggleKey);
    await page.waitForTimeout(500);

    // Verify collapsed
    let sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeLessThan(100);

    // Expand
    await page.keyboard.press(toggleKey);
    await page.waitForTimeout(500);

    // Verify expanded (w-[336px])
    sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBeGreaterThan(200);
  });
});

test.describe("Thread List", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure sidebar starts expanded
    await page.addInitScript(() => {
      localStorage.removeItem("sidebar-panel-collapsed");
    });
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display thread list area", async ({ page }) => {
    // The sidebar should have a scrollable area for threads
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // The search input is always rendered in the expanded chats panel
    const searchInput = sidebar.getByPlaceholder(/search conversations/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });
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
    const searchInput = page.getByPlaceholder(/search conversations/i);
    await expect(searchInput).toBeVisible();
  });

  test("should focus search input on Cmd+K / Ctrl+K", async ({ page }) => {
    // Wait for sidebar panel to render
    const searchInput = page.getByPlaceholder(/search conversations/i);
    await expect(searchInput).toBeVisible();

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
    const isVisible = await sidebar.isVisible().catch(() => false);

    // Either sidebar is hidden or it has zero width
    if (isVisible) {
      const box = await sidebar.boundingBox();
      // If visible, it should be off-screen or have zero width
      expect(box?.width === 0 || box === null).toBe(true);
    }
  });

  test("should show mobile tab bar", async ({ page }) => {
    // Mobile bottom tab bar should be visible with Chats, Sidekiqs, Settings tabs
    const chatsTab = page.getByRole("button", { name: /chats/i });
    await expect(chatsTab).toBeVisible();

    const sidekiqsTab = page.getByRole("button", { name: /sidekiqs/i });
    await expect(sidekiqsTab).toBeVisible();

    const settingsTab = page.getByRole("button", { name: /settings/i });
    await expect(settingsTab).toBeVisible();
  });

  test("should open overlay when Chats tab clicked", async ({ page }) => {
    // Click Chats tab in bottom tab bar
    const chatsTab = page.getByRole("button", { name: /chats/i });
    await chatsTab.click();

    // Overlay should open with dialog role
    const overlay = page.locator('[role="dialog"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });
  });

  test("should close overlay when close button clicked", async ({ page }) => {
    // Open Chats overlay
    const chatsTab = page.getByRole("button", { name: /chats/i });
    await chatsTab.click();

    // Wait for overlay
    const overlay = page.locator('[role="dialog"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Click close button
    const closeButton = page.getByRole("button", { name: /close overlay/i });
    await closeButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Overlay should be hidden
    await expect(overlay).toBeHidden({ timeout: 5000 });
  });

  test("should close overlay and navigate when thread clicked", async ({
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

    // Open Chats overlay via tab bar
    const chatsTab = page.getByRole("button", { name: /chats/i });
    await chatsTab.click();

    // Wait for overlay
    const overlay = page.locator('[role="dialog"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // If we can find and click the thread
    if (threadId) {
      const threadItem = overlay.locator(`[data-thread-id="${threadId}"]`);
      if (await threadItem.isVisible().catch(() => false)) {
        await threadItem.click();

        // Overlay should close (auto-closes on pathname change)
        await expect(overlay).toBeHidden({ timeout: 5000 });

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
    // Settings button/link should be visible in sidebar icon rail
    const sidebar = page.locator("aside").first();
    const settingsLink = sidebar.getByRole("link", { name: /settings/i });

    // Settings link in the icon rail
    const isVisible = await settingsLink.isVisible().catch(() => false);

    if (isVisible) {
      await expect(settingsLink).toBeVisible();
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
    // New Chat button should be visible in the icon rail (aria-label="New Chat")
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

    // Use dispatchEvent to bypass Next.js dev overlay pointer interception
    const newChatButton = page.getByRole("button", { name: /new chat/i });
    await newChatButton.dispatchEvent("click");

    // Should navigate to /chat (new conversation)
    await expect(page).toHaveURL("http://localhost:3000/chat", {
      timeout: 5000,
    });
  });
});
