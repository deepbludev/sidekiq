---
phase: quick-011
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/server/db/seed.ts
  - sidekiq-webapp/src/server/db/reset-and-seed.ts
  - sidekiq-webapp/package.json
  - sidekiq-webapp/playwright.config.ts
  - README.md
autonomous: true

must_haves:
  truths:
    - "Running db:reset clears app data but preserves user/auth tables"
    - "E2E tests start with fresh seeded data"
    - "README.md documents full local dev workflow"
  artifacts:
    - path: "sidekiq-webapp/src/server/db/reset-and-seed.ts"
      provides: "Script to flush and reseed non-auth tables"
    - path: "README.md"
      provides: "Project documentation with setup guide"
  key_links:
    - from: "playwright.config.ts"
      to: "db:reset-and-seed"
      via: "globalSetup script"
---

<objective>
Improve database seed process to flush and reseed app data (threads, messages, sidekiqs) while preserving better-auth tables (user, session, account, verification). Integrate this reset mechanism into E2E test setup for clean test runs, and create comprehensive README.md documentation.

Purpose: Enable reliable E2E testing with consistent data state and provide clear project onboarding documentation.
Output: Enhanced seed scripts, E2E integration, and professional README.md.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@sidekiq-webapp/src/server/db/seed.ts (current seed script)
@sidekiq-webapp/src/server/db/schema.ts (all table definitions)
@sidekiq-webapp/playwright.config.ts (current E2E config)
@sidekiq-webapp/package.json (current scripts)
@sidekiq-webapp/.env.example (environment variables)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create reset-and-seed script with E2E integration</name>
  <files>
    sidekiq-webapp/src/server/db/reset-and-seed.ts
    sidekiq-webapp/package.json
    sidekiq-webapp/tests/e2e/global-setup.ts
    sidekiq-webapp/playwright.config.ts
  </files>
  <action>
    1. Create `reset-and-seed.ts` script that:
       - Deletes all data from tables: messages, threads, sidekiqs, teams, teamMembers, teamInvites
       - Does NOT touch: user, session, account, verification (better-auth tables)
       - Delete in correct order to respect foreign key constraints (messages -> threads -> sidekiqs -> teams)
       - After flush, call the existing seed data insertion logic from seed.ts
       - Export a `resetAndSeed()` function for programmatic use

    2. Add npm scripts to package.json:
       - `"db:reset": "tsx src/server/db/reset-and-seed.ts"` - for manual use
       - Keep existing `"db:seed"` for additive seeding

    3. Create `tests/e2e/global-setup.ts`:
       ```typescript
       import { resetAndSeed } from "../../src/server/db/reset-and-seed";

       async function globalSetup() {
         console.log("Resetting and seeding database for E2E tests...");
         await resetAndSeed();
         console.log("Database ready for E2E tests.");
       }

       export default globalSetup;
       ```

    4. Update playwright.config.ts:
       - Add `globalSetup: "./tests/e2e/global-setup.ts"` to config
       - This runs ONCE before all tests, providing fresh seeded data

    Note: The existing auth.setup.ts handles E2E_TEST_EMAIL/PASSWORD login and remains unchanged. The global setup ensures the seeded data (sidekiqs, threads, messages) is fresh before tests run.
  </action>
  <verify>
    - `pnpm db:reset` runs successfully (flush + seed)
    - Database contains fresh seed data after reset
    - `pnpm test:e2e` triggers global setup before running tests
  </verify>
  <done>
    - reset-and-seed.ts script flushes app tables and reseeds
    - E2E tests automatically start with fresh seeded database
    - Manual db:reset command available for developers
  </done>
</task>

<task type="auto">
  <name>Task 2: Create comprehensive project README.md</name>
  <files>
    README.md
  </files>
  <action>
    Create a professional README.md at the repo root with these sections:

    1. **Header with logo placeholder and badges**
       - Project name: Sidekiq
       - Tagline from CLAUDE.md: "Premium AI chat application for model-agnostic conversations with custom assistants"

    2. **Overview**
       - What Sidekiq is (similar to t3.chat)
       - Key features: Multi-model support, Sidekiqs (custom assistants), Team collaboration

    3. **Tech Stack**
       - Next.js 15, TypeScript, Tailwind CSS
       - PostgreSQL + Drizzle ORM
       - tRPC for API
       - Better Auth for authentication
       - Vercel AI SDK + AI Gateway

    4. **Getting Started**
       - Prerequisites: Node.js 20+, pnpm, Docker (for PostgreSQL)
       - Clone repo
       - `cp sidekiq-webapp/.env.example sidekiq-webapp/.env`
       - Configure environment variables (link to .env.example comments)
       - `docker compose up -d` (PostgreSQL)
       - `cd sidekiq-webapp && pnpm install`
       - `pnpm db:push` (apply schema)
       - `pnpm db:seed` (optional: seed dev data)
       - `pnpm dev` (start development server)

    5. **Development Workflow**
       - Available scripts table (dev, build, check, db:*, test:*)
       - Database commands explanation
       - Running tests (unit: `pnpm test`, e2e: `pnpm test:e2e`)

    6. **Project Structure**
       - Brief explanation of key directories:
         - `src/app/` - Next.js app router pages
         - `src/components/` - React components
         - `src/server/` - tRPC routers, database, auth
         - `tests/` - Unit and E2E tests

    7. **Testing**
       - Unit tests with Vitest
       - E2E tests with Playwright
       - E2E test credentials setup
       - Database reset for clean tests

    8. **Contributing** (brief)
       - Fork, branch, PR flow
       - Run `pnpm check` before committing

    9. **License**
       - Reference to LICENSE file

    Keep it concise but informative. No emojis. Professional tone matching the product's premium positioning.
  </action>
  <verify>
    - README.md exists at repo root
    - All sections are present and properly formatted
    - Links to .env.example are accurate
    - Commands are correct and tested
  </verify>
  <done>
    - Comprehensive README.md provides clear onboarding for new developers
    - All essential setup and development commands documented
    - Testing workflow clearly explained
  </done>
</task>

</tasks>

<verification>
- `pnpm db:reset` flushes app data and reseeds successfully
- Database shows fresh seed data (3 sidekiqs, 4 threads, messages)
- User/auth tables remain intact after reset
- `pnpm test:e2e` runs with global setup executing first
- README.md renders correctly on GitHub
- All documented commands work as described
</verification>

<success_criteria>
- Database reset script preserves auth tables, flushes app data
- E2E tests run against consistent seeded database state
- README.md provides complete local development guide
- All scripts tested and functional
</success_criteria>

<output>
After completion, create `.planning/quick/011-improved-database-seed-process-and-readm/011-SUMMARY.md`
</output>
