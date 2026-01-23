---
created: 2026-01-23T00:00
title: Implement database seeding for local development
area: database
files: []
---

## Problem

Local development setup requires manual creation of test data. Need a proper database seeding mechanism to easily set up a dev environment with dummy data (users, threads, messages, sidekiqs, teams, etc.).

## Solution

TBD - Consider:
- Drizzle seed scripts or custom seeding utility
- Faker.js for generating realistic dummy data
- npm script for easy execution (`npm run db:seed`)
- Idempotent seeding (can re-run without duplicates)
