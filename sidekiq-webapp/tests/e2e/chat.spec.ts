import { test, expect } from "@playwright/test";

/**
 * Chat E2E tests
 *
 * These tests require authentication and use the storage state from auth.setup.ts.
 * The tests verify the chat UI flow including sending messages and receiving responses.
 */

test.describe("Chat Navigation", () => {
  test("should redirect unauthenticated users to /sign-in", async ({
    browser,
  }) => {
    // Create a new context without auth state (explicitly no storage state)
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/chat");

    // Should redirect to sign-in with callbackUrl
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fchat/, {
      timeout: 10000,
    });

    await context.close();
  });

  test("should navigate to /chat when authenticated", async ({ page }) => {
    await page.goto("/chat");

    // Should stay on chat page when authenticated
    await expect(page).toHaveURL(/\/chat/);
  });
});

test.describe("Chat UI Elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("should display chat input placeholder", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    await expect(textarea).toBeVisible();
  });

  test("should display send button", async ({ page }) => {
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeVisible();
  });

  test("should have send button disabled when input is empty", async ({
    page,
  }) => {
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeDisabled();
  });

  test("should display empty state message", async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for empty state (may not show if there are existing messages)
    const emptyState = page.getByText("Start a conversation");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either empty state is shown, or messages exist
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      await expect(
        page.getByText(/type a message below to begin/i),
      ).toBeVisible();
    }
  });
});

test.describe("Chat Message Sending", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should enable send button when input has text", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    const sendButton = page.getByRole("button", { name: /send message/i });

    // Initially disabled
    await expect(sendButton).toBeDisabled();

    // Type text
    await textarea.fill("Hello");

    // Should now be enabled
    await expect(sendButton).toBeEnabled();
  });

  test("should send message on button click", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    const sendButton = page.getByRole("button", { name: /send message/i });

    await textarea.fill("Hello from E2E test");
    await sendButton.click();

    // Input should be cleared after sending
    await expect(textarea).toHaveValue("");

    // User message should appear in chat
    await expect(page.getByText("Hello from E2E test")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should send message on Enter key", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Testing Enter key");
    await textarea.press("Enter");

    // Input should be cleared
    await expect(textarea).toHaveValue("");

    // Message should appear
    await expect(page.getByText("Testing Enter key")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should insert newline on Shift+Enter", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Line 1");
    await textarea.press("Shift+Enter");
    await textarea.type("Line 2");

    // Input should contain both lines
    const value = await textarea.inputValue();
    expect(value).toContain("Line 1");
    expect(value).toContain("Line 2");

    // Message should NOT be sent yet
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeEnabled();
  });

  test("should clear input after sending", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Message to send");
    await textarea.press("Enter");

    // Should be empty after sending
    await expect(textarea).toHaveValue("");
  });

  test("should display user message in chat", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");
    const testMessage = `E2E test message ${Date.now()}`;

    await textarea.fill(testMessage);
    await textarea.press("Enter");

    // Wait for message to appear in chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Chat Streaming", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
  });

  test("should show typing indicator during streaming", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("What is 2+2?");
    await textarea.press("Enter");

    // Should show typing indicator while waiting for AI
    const typingIndicator = page.getByText(/ai is thinking/i);
    await expect(typingIndicator).toBeVisible({ timeout: 5000 });
  });

  test("should show stop button during streaming", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Write a long story");
    await textarea.press("Enter");

    // Stop button should appear
    const stopButton = page.getByRole("button", { name: /stop generating/i });
    await expect(stopButton).toBeVisible({ timeout: 5000 });
  });

  test("should stop streaming on button click", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Write a very long story about dragons");
    await textarea.press("Enter");

    // Wait for stop button to appear
    const stopButton = page.getByRole("button", { name: /stop generating/i });
    await stopButton.waitFor({ state: "visible", timeout: 5000 });

    // Click stop
    await stopButton.click();

    // Send button should reappear (streaming stopped)
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeVisible({ timeout: 5000 });
  });

  test("should display AI response after completion", async ({ page }) => {
    const textarea = page.getByPlaceholder("Type a message...");

    await textarea.fill("Say hello");
    await textarea.press("Enter");

    // Wait for typing indicator to disappear (response complete)
    const typingIndicator = page.getByText(/ai is thinking/i);
    await typingIndicator.waitFor({ state: "visible", timeout: 5000 });

    // Wait for response to complete (typing indicator should disappear)
    await typingIndicator.waitFor({ state: "hidden", timeout: 30000 });

    // Send button should be back
    const sendButton = page.getByRole("button", { name: /send message/i });
    await expect(sendButton).toBeVisible();
  });
});
