/**
 * Playwright global setup.
 *
 * Runs ONCE before all E2E tests to ensure the database
 * has fresh seeded data for consistent test runs.
 */
import { resetAndSeed } from "../../src/shared/db/reset-and-seed";

async function globalSetup(): Promise<void> {
  console.log(
    "\n[Global Setup] Resetting and seeding database for E2E tests...",
  );
  await resetAndSeed();
  console.log("[Global Setup] Database ready for E2E tests.\n");
}

export default globalSetup;
