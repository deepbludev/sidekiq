---
created: 2026-01-24T10:00
title: Implement Projects feature
area: ui
files: []
---

## Problem

Users need a way to organize work around larger goals that span multiple conversations. Currently, threads exist in a flat list with no grouping beyond date/pinned. For complex work (coding projects, research, creative work), users need:

- An isolated workspace grouping related chats
- Reference documents (knowledge base) attached to a project
- Ability to share projects with team members
- Custom instructions or associated Sidekiqs scoped to the project

This is similar to Claude's Projects feature (see attached screenshot reference), but Sidekiq can differentiate by leveraging existing Sidekiqs infrastructure and offering more interesting integrations.

## Solution

TBD — needs design phase. Key considerations:

**Core entities:**
- `Project` — workspace container (name, description, owner, settings)
- `ProjectDocument` — uploaded files/knowledge base items
- `ProjectMember` — sharing/collaboration model
- Project ↔ Thread relationship (threads belong to a project)
- Project ↔ Sidekiq relationship (default Sidekiq per project)

**Potential differentiators from Claude:**
- Sidekiq integration: each project can have a default Sidekiq or multiple associated Sidekiqs
- Custom instructions that apply across all chats in the project
- Knowledge base that's automatically included in context
- Team sharing with granular permissions
- Project templates (pre-configured with Sidekiq + instructions + starter docs)

**UI considerations:**
- Project switcher in sidebar header
- Project-scoped thread list
- Project settings panel
- Document upload/management UI

**Phase candidates:**
- Database schema & migrations
- Project CRUD operations
- Document upload & storage
- Knowledge base context injection
- Team sharing & permissions
- UI components & navigation
