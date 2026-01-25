---
created: 2026-01-24T20:57
title: E2E tests with isolated test database
area: testing
files:
  - sidekiq-webapp/src/server/db/seed.ts
  - sidekiq-webapp/playwright.config.ts
  - sidekiq-webapp/e2e/*
---

## Problem

Currently E2E tests may run against a shared development database, which creates several issues:
1. Tests can interfere with each other if run in parallel
2. Test data state is unpredictable between runs
3. Tests may fail due to leftover data from previous runs or manual testing
4. No guarantee of a clean, consistent starting state

Need a separate test database that:
- Starts fresh with seeded data before each test run
- Is isolated from development database
- Provides consistent, predictable data for all tests

## Solution

TBD - Possible approaches:
1. Use a separate DATABASE_URL for test environment (e.g., `sidekiq_test` db)
2. Add Playwright globalSetup that:
   - Drops/recreates test database
   - Runs migrations
   - Runs seed script (using new quick-007 seed.ts)
3. Consider Docker Compose test profile for isolated Postgres instance
4. May need to update CI/CD to provision test database
