---
phase: quick-012
plan: 01
subsystem: database
tags: [seed, sidekiq, database, dev-tooling]
dependency-graph:
  requires: [quick-007, quick-011]
  provides: [pirate-sidekiq-seed]
  affects: []
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified:
    - sidekiq-webapp/src/server/db/reset-and-seed.ts
decisions: []
metrics:
  duration: ~1 min
  completed: 2026-01-26
---

# Quick Task 012: Add Pirate Sidekiq to Database Seed

Added a pirate-themed Sidekiq "Captain Jack" with Jack Sparrow-esque personality to the database seed process as the 5th seeded Sidekiq.

## What Was Done

### Task 1: Add pirate Sidekiq to database seed (af23b0c)

Added a new seed entry to `createSeedSidekiqs()` in `reset-and-seed.ts`:

- **ID:** `seed-sidekiq-pirate` (constant `SEED_SIDEKIQ_5_ID`)
- **Name:** "Captain Jack"
- **Description:** A witty, eccentric pirate captain who dispenses wisdom in Jack Sparrow style
- **Instructions:** Detailed system prompt with pirate vernacular, nautical metaphors, rum references, and guidelines to balance humor with genuinely helpful answers
- **Conversation Starters:** 4 pirate-themed prompts for project advice, code help, problem-solving stories, and negotiation tips
- **Avatar:** Pirate flag emoji on dark slate background (`#1e293b`)
- **Favorited:** Yes (prominent sidebar placement)
- **Last Used:** 45 minutes ago (appears active)
- **Created:** 5 days ago

Also updated the hardcoded summary log from "Sidekiqs: 4" to "Sidekiqs: 5".

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (`pnpm exec tsc --noEmit` clean)
- `SEED_SIDEKIQ_5_ID` constant defined and used in the seed array
- All required fields match the Sidekiq schema shape
- `createSeedSidekiqs` returns 5 entries
- Console summary log updated to reflect count of 5

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | af23b0c | feat(quick-012): add pirate Sidekiq "Captain Jack" to database seed |
