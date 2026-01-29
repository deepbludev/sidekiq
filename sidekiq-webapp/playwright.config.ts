import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.ts",
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Setup project for authentication
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Tests that don't require authentication
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore:
        /(chat|thread|model-selection|sidebar|sidekiq|workspace)\.spec\.ts/,
    },
    // Tests that require authentication
    {
      name: "chromium-authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/user.json",
      },
      testMatch:
        /(chat|thread|model-selection|sidebar|sidekiq|workspace)\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
