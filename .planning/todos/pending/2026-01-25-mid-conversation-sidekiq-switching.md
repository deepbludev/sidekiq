---
created: 2026-01-25T15:58
title: Mid-conversation Sidekiq switching with @mentions
area: ui
files:
  - docs/research/SIDEKIQ_SWITCHING_FEATURE_RESEARCH.md
---

## Problem

Users cannot switch between Sidekiqs mid-conversation. Currently, a thread is locked to a single Sidekiq from creation. This prevents workflow chaining use cases where specialized Sidekiqs collaborate in sequence (e.g., Brainstorm → Writer → Editor pipeline).

Key pain points:
- Copy-pasting context between different chats is tedious
- Users need different AI personas for different stages of work
- No way to leverage specialized Sidekiqs within the same conversation context

Market research shows this is an underexploited feature - ChatGPT has @mentions for GPTs but adoption is low due to users not creating multiple GPTs. Sidekiq can differentiate by providing pre-built workflow templates with complementary Sidekiqs.

## Solution

**MVP (Phase 1):**
1. `@` mention system - Type `@` to see available Sidekiqs, select to switch
2. Context preservation - Full conversation history passed to new Sidekiq
3. Visual indicator - Clear UI showing which Sidekiq is currently active
4. Transition message - Optional system message: "Switched to [Sidekiq Name]"

**Technical considerations:**
- Messages need `sidekiqId` field to track which Sidekiq responded (already have this)
- Thread needs `activeSidekiqId` for current state
- Runtime system message injection changes on switch
- Full context pass for MVP, consider summarization for long threads

**Enhanced (Phase 2):**
- Pre-built workflow templates (Content Creation, Code Review, Research Report)
- Smart suggestions for next Sidekiq based on context
- Team workflow sharing

**UX requirements:**
- Switch should take < 500ms
- No page reload or scroll position loss
- Clear visual differentiation between Sidekiq responses
- Keyboard shortcut support (@ then arrow keys + Enter)

See full research: docs/research/SIDEKIQ_SWITCHING_FEATURE_RESEARCH.md
