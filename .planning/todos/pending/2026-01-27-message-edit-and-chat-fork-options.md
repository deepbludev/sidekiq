---
created: 2026-01-27T07:24
title: Message edit and chat fork options
area: ui
files:
  - src/components/chat (chat message components)
---

## Problem

Users need the ability to edit a previously sent user message and fork the conversation from that point. This is a standard feature in AI chat applications (ChatGPT, Claude) that allows users to refine their prompts or explore alternative conversation paths without starting over. Related to but distinct from the "regenerate message" feature — editing changes the user's input, while regenerate re-runs the same input.

## Solution

TBD — Key design decisions:
- **Edit UX**: Inline editing of user messages (click to edit, confirm/cancel) vs modal/popover
- **Fork behavior**: Replace subsequent messages in-place vs create a new conversation branch
- **History**: Whether to keep old branches accessible or discard them
- Consider integration with the regenerate message feature for a unified message action toolbar
