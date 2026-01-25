---
phase: quick
plan: 007
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/server/db/seed.ts
  - sidekiq-webapp/package.json
autonomous: true

must_haves:
  truths:
    - "Running pnpm db:seed creates a test user with sample data"
    - "Seed script is idempotent (safe to run multiple times)"
    - "Seed data includes user, sidekiqs, threads, and messages"
  artifacts:
    - path: "sidekiq-webapp/src/server/db/seed.ts"
      provides: "Database seeding script"
      min_lines: 80
  key_links:
    - from: "sidekiq-webapp/package.json"
      to: "sidekiq-webapp/src/server/db/seed.ts"
      via: "db:seed script"
      pattern: "db:seed.*tsx.*seed\\.ts"
---

<objective>
Implement database seeding for local development.

Purpose: Enable developers to quickly populate the local database with realistic test data for development and debugging. This removes the need to manually create users, sidekiqs, threads, and messages.

Output: A `db:seed` npm script that creates sample data including a test user, sidekiqs with various configurations, threads with messages, and team structure.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@sidekiq-webapp/src/server/db/schema.ts
@sidekiq-webapp/src/server/db/index.ts
@sidekiq-webapp/drizzle.config.ts
@sidekiq-webapp/package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create database seed script</name>
  <files>sidekiq-webapp/src/server/db/seed.ts</files>
  <action>
Create a seed script that:

1. **Uses direct postgres connection** (not the cached db from index.ts):
   - Import postgres and drizzle directly
   - Use dotenv to load env vars: `import 'dotenv/config'`
   - Create standalone connection for seeding

2. **Implements upsert-based seeding** (idempotent):
   - Use `INSERT ... ON CONFLICT DO NOTHING` pattern via drizzle's onConflictDoNothing()
   - Check if seed user exists before creating
   - Use fixed IDs for predictable seeding (e.g., `seed-user-1`, `seed-sidekiq-1`)

3. **Creates comprehensive seed data**:
   - **User**: Test user with email `dev@sidekiq.local`, name "Dev User"
   - **Account**: GitHub OAuth account linked to test user
   - **Session**: Active session for the test user (expires in 30 days)
   - **Sidekiqs** (3-4): Various configurations:
     - "Writing Assistant" - with instructions, emoji avatar, conversation starters
     - "Code Reviewer" - with initials avatar, different color
     - "Research Helper" - favorited, with default model set
   - **Threads** (3-4): With varying message counts:
     - Thread with 4 messages (2 exchanges)
     - Thread with 2 messages (1 exchange)
     - Archived thread
     - Pinned thread
   - **Messages**: Realistic user/assistant exchanges

4. **Data shape matches schema**:
   - Use nanoid for non-fixed IDs where needed
   - Proper timestamps (createdAt, updatedAt, lastActivityAt)
   - Valid JSONB for preferences, avatar, conversationStarters
   - Correct enum values (message_role, team_role)

5. **Graceful execution**:
   - Wrap in async main() function
   - console.log progress: "Seeding user...", "Seeding sidekiqs...", etc.
   - console.log summary at end: "Seeded: 1 user, 3 sidekiqs, 4 threads, 12 messages"
   - Process.exit(0) on success, process.exit(1) on error
   - Close database connection after seeding

Example structure:
```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import * as schema from './schema';

const SEED_USER_ID = 'seed-user-dev';
const SEED_USER_EMAIL = 'dev@sidekiq.local';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    console.log('Seeding database...');
    // ... seeding logic
    console.log('Seeding complete!');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
```
  </action>
  <verify>
File exists and has proper structure:
- `cat sidekiq-webapp/src/server/db/seed.ts | head -100`
- Verify imports, main function, seed data objects
  </verify>
  <done>Seed script with idempotent seeding for user, sidekiqs, threads, and messages</done>
</task>

<task type="auto">
  <name>Task 2: Add db:seed npm script and test seeding</name>
  <files>sidekiq-webapp/package.json</files>
  <action>
1. Add the db:seed script to package.json scripts section:
   ```json
   "db:seed": "tsx src/server/db/seed.ts"
   ```

   Place it after db:studio to keep db:* scripts grouped.

2. Verify tsx is available (it's a dependency of drizzle-kit, so should work)

3. Test the seed script:
   - Run `pnpm db:seed` from sidekiq-webapp directory
   - Verify console output shows seeding progress
   - Verify no errors

4. Run seed a second time to verify idempotency:
   - Should complete without errors
   - Should not create duplicate data
  </action>
  <verify>
Run from sidekiq-webapp directory:
- `pnpm db:seed` - should complete with "Seeding complete!" message
- `pnpm db:seed` - second run should also succeed (idempotent)
- Check db:seed script exists in package.json: `grep "db:seed" package.json`
  </verify>
  <done>db:seed script added to package.json and verified working</done>
</task>

</tasks>

<verification>
1. `cd sidekiq-webapp && pnpm db:seed` completes successfully
2. Second run of `pnpm db:seed` also succeeds (idempotent)
3. Script creates: 1 user, 3+ sidekiqs, 3+ threads, 10+ messages
4. No TypeScript errors in seed.ts
</verification>

<success_criteria>
- [ ] `sidekiq-webapp/src/server/db/seed.ts` exists with comprehensive seed logic
- [ ] `pnpm db:seed` script works from sidekiq-webapp directory
- [ ] Seed is idempotent (multiple runs don't create duplicates)
- [ ] Seed data covers user, sidekiqs, threads, messages
- [ ] Console output shows seeding progress and summary
</success_criteria>

<output>
After completion, create `.planning/quick/007-implement-database-seeding-for-local-dev/007-SUMMARY.md`
</output>
