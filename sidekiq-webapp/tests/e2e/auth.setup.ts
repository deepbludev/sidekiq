import { test as setup, expect } from "@playwright/test";

const authFile = "tests/.auth/user.json";

/**
 * Auth setup for E2E tests that require authentication.
 *
 * This setup runs once before authenticated tests and saves the auth state
 * to tests/.auth/user.json for reuse by other tests.
 *
 * Required environment variables:
 * - E2E_TEST_EMAIL: Email for test account
 * - E2E_TEST_PASSWORD: Password for test account
 *
 * Create a test user in your dev database before running E2E tests.
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables are required for authenticated tests. " +
        "Create a test user in your dev database and set these variables.",
    );
  }

  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Fill in credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel("Password").fill(password);

  // Submit form
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard/chat (indicates successful login)
  await expect(page).toHaveURL(/\/(dashboard|chat)/, { timeout: 10000 });

  // Save auth state for reuse
  await page.context().storageState({ path: authFile });
});
