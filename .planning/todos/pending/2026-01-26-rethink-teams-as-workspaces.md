---
created: 2026-01-26T12:00
title: Rethink teams as workspaces
area: architecture
files: []
---

## Problem

The current "teams" feature is a basic team/member model but doesn't provide the full isolation needed for a production multi-tenant AI chat app. The architecture needs to be rethought as **workspaces** — fully isolated environments similar to ChatGPT workspaces.

Current gaps:
- Teams don't fully isolate chats, sidekiqs, billing, or usage
- No concept of a "personal workspace" — personal and team contexts aren't unified
- Switching teams doesn't switch the entire app context (chats, sidekiqs, billing)
- No per-workspace billing/usage tracking
- Data model treats "personal" differently from "team", adding complexity

## Solution

Reformulate "teams" as **workspaces** with full isolation:

**Core concept:** A workspace is a fully isolated environment containing its own chats, sidekiqs, members, permissions, settings, and usage/billing. Every user gets a personal workspace by default.

**Key requirements:**
- **Full isolation:** Each workspace has its own chats, sidekiqs, members, settings, billing
- **Personal workspace:** Every user gets one by default (free tier). This is a real workspace in the data model, not a special case
- **Context switching:** When users switch workspaces, the *entire* app switches — sidebar shows that workspace's chats, sidekiqs section shows that workspace's sidekiqs, billing reflects that workspace's plan
- **Multi-membership:** Users can belong to multiple workspaces (personal + N company/team workspaces)
- **Invitation system:** Users can create workspaces and invite others (reuse existing invite infrastructure)
- **Per-workspace billing:** Usage and billing tracked at workspace level per the workspace's subscription plan. A user might be on free tier personally but have full access in a company workspace
- **Unified data model:** Personal workspace is a workspace like any other, simplifying queries and permissions

**ChatGPT workspace reference behavior:**
- Workspace switcher in sidebar/header
- Complete data isolation between workspaces
- Different service levels per workspace based on subscription
- Members have roles/permissions within each workspace
- Workspace admin controls settings, billing, member management

**Impact on existing code:**
- Current `team` schema → refactor to `workspace`
- Current `activeTeam` → becomes `activeWorkspace`
- Thread, sidekiq, and all content tables need `workspaceId` foreign key
- Sidebar team section → workspace switcher
- All queries need workspace scoping
- New: workspace-level billing/usage tracking
- The existing "Projects" todo would become a feature *within* a workspace

**Migration considerations:**
- Existing teams become workspaces
- Existing personal data needs migration into personal workspaces
- URL structure may need workspace prefix
