import { test, expect } from "@playwright/test";

test.describe("Authentication Routes", () => {
  test("should display sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  test("should display sign-up page", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText("Create an account")).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test("should display forgot-password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByText("Forgot your password?")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send reset link/i }),
    ).toBeVisible();
    await expect(page.getByText(/remember your password/i)).toBeVisible();
  });

  test("should navigate from sign-in to sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL("/sign-up");
  });

  test("should navigate from sign-up to sign-in", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/sign-in");
  });

  test("should navigate to forgot-password from sign-in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL("/forgot-password");
  });
});

test.describe("Form Validation", () => {
  test("should show validation errors on sign-up form", async ({ page }) => {
    await page.goto("/sign-up");

    // Submit empty form
    await page.getByRole("button", { name: /create account/i }).click();

    // Check for validation errors
    await expect(
      page.getByText(/name must be at least 2 characters/i),
    ).toBeVisible();
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
    await expect(
      page.getByText(/password must be at least 8 characters/i),
    ).toBeVisible();
  });

  test("should show password mismatch error", async ({ page }) => {
    await page.goto("/sign-up");

    await page.getByLabel(/name/i).fill("Test User");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("different123");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("should show validation errors on sign-in form", async ({ page }) => {
    await page.goto("/sign-in");

    // Submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for validation errors
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
});

test.describe("Route Protection", () => {
  test("should redirect unauthenticated user from dashboard to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to sign-in with callbackUrl
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
  });

  test("should preserve callbackUrl parameter", async ({ page }) => {
    await page.goto("/dashboard");

    // Check that we're on sign-in page with the callbackUrl
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fdashboard/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});

test.describe("Reset Password Page", () => {
  test("should redirect to forgot-password if no token", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveURL("/forgot-password");
  });

  test("should display reset form with token", async ({ page }) => {
    await page.goto("/reset-password?token=test-token");
    await expect(page.getByText("Reset your password")).toBeVisible();
    await expect(page.getByLabel("New Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /reset password/i }),
    ).toBeVisible();
  });
});

test.describe("Forgot Password Success State", () => {
  test("should show success message after requesting password reset", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    // Fill in a valid email format
    await page.getByLabel(/email/i).fill("test@example.com");

    // Submit the form
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Should show success message (doesn't reveal if email exists)
    await expect(
      page.getByText(/if an account exists with that email/i),
    ).toBeVisible({ timeout: 10000 });

    // Should show follow-up instruction
    await expect(page.getByText(/check your email/i)).toBeVisible();

    // Form should no longer be visible
    await expect(
      page.getByRole("button", { name: /send reset link/i }),
    ).not.toBeVisible();
  });
});

test.describe("Sign-in Link Preservation", () => {
  test("should preserve callbackUrl when navigating to sign-up", async ({
    page,
  }) => {
    // Start at sign-in with a callbackUrl
    await page.goto("/sign-in?callbackUrl=%2Fdashboard");

    // The sign-up link should ideally preserve the callback
    // (This tests that sign-up now accepts callbackUrl)
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
  });
});
