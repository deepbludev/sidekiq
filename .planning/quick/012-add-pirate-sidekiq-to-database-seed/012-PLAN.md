---
phase: quick-012
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/server/db/reset-and-seed.ts
autonomous: true

must_haves:
  truths:
    - "Running pnpm db:seed creates a pirate-themed Sidekiq in the database"
    - "The pirate Sidekiq has a Jack Sparrow-esque personality with appropriate instructions"
    - "The pirate Sidekiq has conversation starters that fit the pirate theme"
  artifacts:
    - path: "sidekiq-webapp/src/server/db/reset-and-seed.ts"
      provides: "Pirate Sidekiq seed entry"
      contains: "seed-sidekiq-pirate"
  key_links:
    - from: "createSeedSidekiqs"
      to: "schema.sidekiqs"
      via: "db.insert"
      pattern: "seed-sidekiq-pirate"
---

<objective>
Add a pirate-themed Sidekiq (Jack Sparrow-esque personality) to the database seed process so it is always available after reseeding.

Purpose: Provide a fun, personality-driven Sidekiq that showcases the custom assistant feature with a distinctive voice.
Output: Updated reset-and-seed.ts with a 5th Sidekiq entry.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/server/db/reset-and-seed.ts
@sidekiq-webapp/src/server/db/schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add pirate Sidekiq to database seed</name>
  <files>sidekiq-webapp/src/server/db/reset-and-seed.ts</files>
  <action>
Add a 5th seed Sidekiq with a Jack Sparrow-esque pirate personality. Make these changes:

1. Add a new seed ID constant after the existing ones:
   ```typescript
   const SEED_SIDEKIQ_5_ID = "seed-sidekiq-pirate";
   ```

2. Add a new entry to the array returned by `createSeedSidekiqs(userId)` with these values:
   - `id`: `SEED_SIDEKIQ_5_ID`
   - `ownerId`: `userId`
   - `teamId`: `null`
   - `name`: `"Captain Jack"`
   - `description`: `"A witty, eccentric pirate captain who dispenses wisdom and advice in the style of Captain Jack Sparrow. Savvy?"`
   - `instructions`: A system prompt that tells the AI to roleplay as a charming, slightly unpredictable pirate captain. Key traits:
     - Speaks in pirate vernacular (ye, savvy, mate, rum references, nautical metaphors)
     - Gives genuinely helpful answers but wrapped in pirate personality
     - Occasionally goes on tangents about the sea, rum, or past adventures
     - Uses "Captain" as a self-reference
     - Ends responses with "Savvy?" when appropriate
     - Balances humor with actually being helpful - the pirate flavor should enhance, not obstruct the answer
   - `conversationStarters`: 4 fun pirate-themed starters, e.g.:
     - "What be the best course of action for me project, Captain?"
     - "I need help navigating these treacherous code waters"
     - "Tell me about the time you solved an impossible problem"
     - "Captain, how should I negotiate this deal?"
   - `defaultModel`: `null`
   - `avatar`: `{ type: "emoji" as const, color: "#1e293b", emoji: "pirate-flag" }`
   - `isFavorite`: `true` (so it shows up prominently for discovery)
   - `lastUsedAt`: `new Date(now.getTime() - 45 * 60 * 1000)` (45 minutes ago)
   - `threadCount`: `0`
   - `isPublic`: `false`
   - `canTeamEdit`: `false`
   - `createdAt`: `new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)` (5 days ago)
   - `updatedAt`: `now`

3. Update the hardcoded console output at the bottom of `resetAndSeed()` from:
   ```typescript
   console.log(`  Sidekiqs: 4`);
   ```
   to:
   ```typescript
   console.log(`  Sidekiqs: 5`);
   ```

Note: The `seedData` function already iterates over the full array returned by `createSeedSidekiqs`, so no changes needed there. The count at the end is just a summary log.
  </action>
  <verify>
Run `npx tsx sidekiq-webapp/src/server/db/reset-and-seed.ts --help` or check that TypeScript compiles:
```bash
cd sidekiq-webapp && npx tsc --noEmit src/server/db/reset-and-seed.ts 2>&1 | head -20
```
If tsc has issues with isolated file checking, alternatively verify with:
```bash
cd sidekiq-webapp && pnpm exec tsc --noEmit 2>&1 | grep -i "reset-and-seed" | head -5
```
If no type errors related to reset-and-seed.ts, the task is complete.
  </verify>
  <done>
The reset-and-seed.ts file contains a 5th Sidekiq entry with id "seed-sidekiq-pirate", name "Captain Jack", pirate-themed instructions and conversation starters, and the summary log shows 5 Sidekiqs. The file compiles without type errors.
  </done>
</task>

</tasks>

<verification>
- The `createSeedSidekiqs` function returns an array of 5 Sidekiq objects
- The pirate Sidekiq follows the exact same shape as existing entries (all required fields present)
- The `SEED_SIDEKIQ_5_ID` constant is defined and used consistently
- TypeScript compiles without errors
- The console log summary reflects the new count (5 sidekiqs)
</verification>

<success_criteria>
- reset-and-seed.ts contains the pirate Sidekiq entry with Jack Sparrow-esque personality
- File compiles without TypeScript errors
- Running `pnpm db:seed` would create the pirate Sidekiq alongside the existing 4
</success_criteria>

<output>
After completion, create `.planning/quick/012-add-pirate-sidekiq-to-database-seed/012-SUMMARY.md`
</output>
