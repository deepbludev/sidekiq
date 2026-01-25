---
plan: 008
status: complete
duration: 2 min
---

# Quick Task 008: Fix Duplicate Threads on Sidekiq Chat

## Summary

Fixed a critical bug where every message sent in a Sidekiq chat created a new thread instead of continuing in the existing thread.

## Root Cause

In `chat-interface.tsx`, the `DefaultChatTransport` body was using `threadId` (the prop, always `null` for new chats) instead of `activeThreadId` (the state that gets updated after thread creation via the `X-Thread-Id` header).

The flow was:
1. First message: `threadId` is `null`, transport sends `{ sidekiqId }` → backend creates thread, returns `X-Thread-Id`
2. `customFetch` captures header, sets `activeThreadId` via `setActiveThreadId(newThreadId)`
3. Second message: transport body still checks `threadId` (prop, still `null`), sends `{ sidekiqId }` → backend creates **another** thread

## Fix

Changed transport creation to:
1. Use `activeThreadId` (state) instead of `threadId` (prop)
2. Wrap in `useMemo` with dependencies `[activeThreadId, sidekiq, customFetch]` so transport is recreated when `activeThreadId` changes

Now the flow is:
1. First message: `activeThreadId` is `null`, transport sends `{ sidekiqId }` → backend creates thread
2. `customFetch` updates `activeThreadId` state
3. `useMemo` recreates transport with `{ threadId: activeThreadId }`
4. Second message: transport sends `{ threadId }` → backend uses existing thread ✓

## Changes

| File | Change |
|------|--------|
| `sidekiq-webapp/src/components/chat/chat-interface.tsx` | Added `useMemo` import, wrapped transport in useMemo, changed body to use `activeThreadId` |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | (pending) | Fix transport body to use activeThreadId |

## Verification

- [x] TypeScript compiles without errors
- [ ] Manual test: Sidekiq chat sends multiple messages to same thread
