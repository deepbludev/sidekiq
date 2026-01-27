---
created: 2026-01-26T09:26
title: Fix new thread not appearing in sidebar without refresh
area: ui
files:
  - src/components/sidebar/sidebar-thread-list.tsx
  - src/server/routers/thread.ts
---

## Problem

When a user creates a new thread by sending a message, the title is correctly generated and updated in:
- The browser window title (via `window.history.replaceState` and `generateMetadata`)
- The top bar / chat header of the thread

However, the new thread does **not** appear in the sidebar thread list until the page is manually refreshed. The sidebar's thread list query is not being invalidated or updated when a new thread is created during chat.

This likely relates to the thread creation flow where the thread is created server-side on first message send (via `X-Thread-Id` header notification), but the sidebar's `thread.list` tRPC query cache is not being invalidated to pick up the new thread.

## Solution

TBD — likely needs tRPC query invalidation (`utils.thread.list.invalidate()`) when a new thread is detected (e.g., when `X-Thread-Id` header is received after first message send). May also need to check if optimistic thread insertion into the sidebar cache would provide a smoother UX.
