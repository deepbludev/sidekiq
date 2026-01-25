---
phase: quick
plan: 008
type: execute
wave: 1
autonomous: true
---

<objective>
Fix duplicate thread creation when chatting with a Sidekiq

**Problem:** Every message in a Sidekiq chat creates a new thread instead of continuing in the existing thread.

**Root Cause:** In `chat-interface.tsx`, the `transport` body uses `threadId` (the prop, always null for new chats) instead of `activeThreadId` (the state that gets updated after thread creation via X-Thread-Id header).

**Solution:** Change transport body to use `activeThreadId` and wrap in `useMemo` so it reactively updates when thread is created.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Fix transport body to use activeThreadId</name>
  <files>sidekiq-webapp/src/components/chat/chat-interface.tsx</files>
  <action>
1. Add `useMemo` to imports
2. Change transport creation to use `activeThreadId` instead of `threadId`
3. Wrap transport in `useMemo` with dependencies `[activeThreadId, sidekiq, customFetch]`

This ensures subsequent messages include the correct threadId after thread creation.
  </action>
  <verify>
1. TypeScript compiles: `pnpm typecheck`
2. Manual test: Start chat with Sidekiq, send multiple messages, verify only one thread appears in sidebar
  </verify>
  <done>Transport now reactively includes threadId after thread creation</done>
</task>

</tasks>

<verification>
1. Send first message with Sidekiq - thread created with X-Thread-Id
2. Send second message - same thread used (no duplicate)
3. Send third message - same thread used (no duplicate)
4. Sidebar shows only one thread for the conversation
</verification>
