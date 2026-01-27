# Quick Task 020: Fix Conversation Splits After 2nd Message

## Result: COMPLETE

**Date:** 2026-01-27
**Commit:** 8b77503

## What Was Done

Fixed a bug where starting a chat with a Sidekiq and sending a 2nd message would cause the thread to split into two separate conversations, each with its own generated title.

### Root Cause

The AI SDK v6 `useChat` hook creates a `Chat` instance via `useRef` that stores the `transport` as a frozen `private readonly` field. When `activeThreadId` changed after the first message created a thread, `useMemo` created a new `DefaultChatTransport` — but the `Chat` instance continued using the original transport with the old body (`{ sidekiqId: "..." }` without `threadId`). This caused the API to create a second thread on the second message.

### Fix

Changed the transport `body` from a static object to a **function** that reads from an `activeThreadIdRef`:

1. Added `activeThreadIdRef` to track the current thread ID
2. Updated the ref synchronously in `customFetch` when `X-Thread-Id` is received (before React batches state updates)
3. Added `useEffect` to sync the ref with state as backup
4. Changed transport `body` to a function `() => { ... }` that reads `activeThreadIdRef.current` on every request
5. Removed `activeThreadId` from `useMemo` dependencies (the function reads from the ref)

### Files Changed

| File | Change |
|------|--------|
| `sidekiq-webapp/src/components/chat/chat-interface.tsx` | Transport body function + activeThreadIdRef |

## Verification

- TypeScript compiles without errors
- Existing unit tests pass
- Manual verification: checkpoint for human testing
