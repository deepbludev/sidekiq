---
created: 2026-01-26T10:11
title: Refactor Architecture to Vertical Slicing by Feature
area: architecture
files:
  - src/components/*
  - src/hooks/*
  - src/server/*
  - src/lib/*
---

## Problem

The codebase is currently organized by horizontal technical layers (components/, hooks/, server/, lib/). As the project grows with features like chat, sidekiq, team, settings, etc., this horizontal organization makes it harder to:

- Understand the full scope of a feature (files scattered across directories)
- Add or modify features without touching many unrelated directories
- Maintain clear boundaries between feature domains
- Onboard new contributors who need to trace a feature across layers

Phase 12 in the roadmap already targets this reorganization.

## Solution

Reorganize to vertical feature slices where each domain (chat, sidekiq, team, auth, settings) contains its own components, hooks, API routes, and types. Cross-cutting concerns (auth middleware, database client, UI primitives like shadcn components) remain in shared locations.

**Success Criteria:**
1. Code is organized by feature domain (chat, sidekiq, team, etc.) rather than technical layer
2. Each feature slice contains its own components, hooks, API routes, and types
3. Cross-cutting concerns (auth, db, ui primitives) remain in shared locations
4. All existing functionality continues to work after reorganization
