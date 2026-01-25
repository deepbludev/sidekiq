---
created: 2026-01-25T16:52
title: Two-tier sidebar navigation architecture
area: ui
files: []
---

## Problem

Current sidebar architecture is tightly coupled to chat threads. As the app grows with more features (Sidekiqs, Teams, Settings, etc.), the navigation needs a more scalable structure.

Proposed architecture:
- **Primary sidebar (thin)**: Main feature icons (Chats, Sidekiqs, Teams, Settings, etc.) with room for future features
- **Secondary sidebar (contextual)**: Feature-specific content panel that appears next to the primary sidebar when needed

Examples:
- Chats: Primary icon + secondary sidebar with thread list (current global sidebar behavior)
- Sidekiqs: Primary icon + grid/table view in main content area (no secondary sidebar needed)
- Teams: Primary icon + secondary sidebar with team/member list

This follows patterns from apps like Discord, Slack, Linear, and Notion where the main navigation is icon-based and feature-specific content expands in a secondary panel.

## Solution

TBD — Will require:
1. Refactoring current sidebar into two-tier structure
2. Creating primary navigation component with icon rail
3. Making secondary sidebar conditional based on active feature
4. Routing architecture to support feature switching
5. Consider animations/transitions between feature contexts
