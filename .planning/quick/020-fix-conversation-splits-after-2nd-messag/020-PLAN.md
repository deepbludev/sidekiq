---
phase: quick-020
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/components/chat/chat-interface.tsx
autonomous: true
must_haves:
  truths:
    - "Sending a 2nd message in a Sidekiq chat continues in the same thread (no split)"
    - "After reload, all messages appear in a single thread with one title"
    - "New non-Sidekiq chats still create threads correctly on first message"
    - "Existing thread chats (navigated from sidebar) still work correctly"
  artifacts:
    - path: "sidekiq-webapp/src/components/chat/chat-interface.tsx"
      provides: "Fixed transport body using ref-based function for dynamic threadId resolution"
  key_links:
    - from: "chat-interface.tsx transport body function"
      to: "/api/chat route.ts threadId check"
      via: "body.threadId sent in every request after thread creation"
      pattern: "threadId.*activeThreadId"
---

<objective>
Fix conversation splitting into two separate threads after sending a 2nd message in a Sidekiq chat.

Purpose: When starting a chat with a Sidekiq and sending a 2nd message, the thread splits into 2 separate threads each with its own generated title. This is a regression from the quick-008 fix which was incomplete.

Output: A single fix in `chat-interface.tsx` that ensures the transport body always reflects the current `activeThreadId`.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/components/chat/chat-interface.tsx
@sidekiq-webapp/src/app/api/chat/route.ts
@sidekiq-webapp/src/app/(dashboard)/chat/page.tsx
@sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
</context>

<root_cause>
## Root Cause Analysis

The AI SDK v6 `useChat` hook creates a `Chat` instance via `useRef` (in `@ai-sdk/react/src/use-chat.ts`, line 98-101). This `Chat` instance stores the `transport` as a `private readonly` field (in `ai/src/ui/chat.ts`, line 204) that is set once in the constructor and NEVER updated.

The current code in `chat-interface.tsx` creates the transport via `useMemo`:

```typescript
const transport = useMemo(
  () => new DefaultChatTransport({
    api: "/api/chat",
    body: activeThreadId
      ? { threadId: activeThreadId }
      : sidekiq ? { sidekiqId: sidekiq.id } : {},
    fetch: customFetch,
  }),
  [activeThreadId, sidekiq, customFetch],
);
```

When `activeThreadId` changes (after first message creates a thread), `useMemo` creates a NEW `DefaultChatTransport` instance. However, the `Chat` instance inside `useChat` still holds the ORIGINAL transport from initialization. The new transport object is completely ignored.

**Bug flow:**
1. First message: transport body = `{ sidekiqId: "..." }` (no threadId). API creates thread, returns `X-Thread-Id`. `customFetch` captures it, sets `activeThreadId`.
2. `useMemo` creates new transport with `{ threadId: activeThreadId }` -- but `Chat` ignores it.
3. Second message: `Chat` uses ORIGINAL transport, body = `{ sidekiqId: "..." }` (no threadId). API sees no threadId, creates ANOTHER thread.

**Fix:** The `DefaultChatTransport` `body` option accepts `Resolvable<object>`, which can be a function `() => object`. By using a **ref** to track `activeThreadId` and passing a **function** as `body`, the frozen transport instance will call the function on every request, always getting the latest `activeThreadId`.

This also means we can simplify the code -- the transport only needs to be created once (no `useMemo` needed for `activeThreadId` changes), and the `customFetch` dependency array only needs `threadId` (the prop).
</root_cause>

<tasks>

<task type="auto">
  <name>Task 1: Fix transport body to use ref-based function for dynamic threadId</name>
  <files>sidekiq-webapp/src/components/chat/chat-interface.tsx</files>
  <action>
    In `chat-interface.tsx`, apply the following changes:

    1. **Add a ref to track activeThreadId** (alongside the existing `activeThreadId` state):
       ```typescript
       const activeThreadIdRef = useRef<string | null>(threadId);
       ```
       This ref will be read by the transport body function on every request.

    2. **Keep `activeThreadIdRef` in sync with `activeThreadId` state.** Add a `useEffect` or update the ref whenever `setActiveThreadId` is called. The simplest approach: update the ref in `customFetch` right when `setActiveThreadId` is called (before React re-renders), and also sync it via useEffect:
       ```typescript
       useEffect(() => {
         activeThreadIdRef.current = activeThreadId;
       }, [activeThreadId]);
       ```

    3. **In `customFetch`, update the ref immediately** when capturing the new thread ID (before `setActiveThreadId`):
       ```typescript
       if (newThreadId) {
         hasRedirectedRef.current = true;
         activeThreadIdRef.current = newThreadId;  // Update ref immediately
         setActiveThreadId(newThreadId);
         // ... rest of the code
       }
       ```
       This ensures the ref is up-to-date synchronously, before React batches the state update.

    4. **Change the transport `body` from a static object to a function** that reads from the ref:
       ```typescript
       const transport = useMemo(
         () =>
           new DefaultChatTransport({
             api: "/api/chat",
             body: () => {
               const currentThreadId = activeThreadIdRef.current;
               if (currentThreadId) {
                 return { threadId: currentThreadId };
               }
               return sidekiq ? { sidekiqId: sidekiq.id } : {};
             },
             fetch: customFetch,
           }),
         [sidekiq, customFetch],
       );
       ```

       Key changes:
       - `body` is now a **function** (the `Resolvable<object>` type supports this). The `HttpChatTransport.sendMessages` calls `await resolve(this.body)` which calls the function on each request.
       - Removed `activeThreadId` from `useMemo` dependencies -- the function reads from the ref, so the transport instance does NOT need to be recreated when `activeThreadId` changes.
       - The frozen `Chat` instance now correctly resolves the latest `activeThreadId` on every request.

    5. **The `sendMessage` call in `handleSubmit` already passes `{ body: { model: selectedModel } }`**. This `options.body` gets MERGED with the transport body (line 173 in `http-chat-transport.ts`: `{ ...resolvedBody, ...options.body }`). So the model continues to work correctly alongside the threadId/sidekiqId.

    **What NOT to change:**
    - Keep the `activeThreadId` STATE as-is (it's still needed for title polling and other UI logic).
    - Keep `customFetch` as-is except for adding the ref update.
    - Keep `hasRedirectedRef` logic as-is.
    - Do NOT remove `useMemo` -- it's still useful to avoid creating transport on every render (just fewer deps now).
  </action>
  <verify>
    1. Run `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && npx tsc --noEmit` -- should compile without errors.
    2. Run existing unit tests: `cd /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp && npx vitest run src/components/chat` -- should pass.
    3. Verify the transport body is a function by inspecting the code: the `body:` property in `DefaultChatTransport` constructor should be `() => { ... }`.
    4. Verify `activeThreadIdRef` is updated in both `customFetch` (synchronously) and via `useEffect` (as backup).
  </verify>
  <done>
    - Transport body is a function that reads `activeThreadIdRef.current` on every request
    - `activeThreadIdRef` is updated synchronously in `customFetch` when `X-Thread-Id` is received
    - `useMemo` no longer depends on `activeThreadId` (only `sidekiq` and `customFetch`)
    - TypeScript compiles without errors
    - Existing tests pass
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Fixed the thread splitting bug by making the transport body a function that dynamically reads the current activeThreadId from a ref, instead of a static object that gets frozen in the Chat instance.</what-built>
  <how-to-verify>
    1. Start the dev server: `cd sidekiq-webapp && pnpm dev`
    2. Navigate to a Sidekiq (e.g., Oracle) and click "Chat with Oracle"
    3. Send a first message (e.g., "Will I be successful?") -- wait for AI response
    4. Send a second message (e.g., "why?") -- wait for AI response
    5. Send a third message (e.g., "how do you know?") -- wait for AI response
    6. **Reload the page** (Cmd+R / F5)
    7. **Verify**: All messages appear in a SINGLE thread, with one title
    8. **Check sidebar**: Only ONE thread should exist for this conversation, not two
    9. Also test: Start a new chat WITHOUT a Sidekiq (just /chat), send 2+ messages, reload -- should still be one thread
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- Unit tests pass: `npx vitest run src/components/chat`
- Manual: Sidekiq chat with 3+ messages stays as single thread after reload
- Manual: Non-Sidekiq chat with 3+ messages stays as single thread after reload
</verification>

<success_criteria>
- Sending multiple messages in a Sidekiq chat results in a single thread (not split)
- After page reload, all messages appear in one thread with one generated title
- Non-Sidekiq chats continue to work correctly
- Existing thread navigation from sidebar works correctly
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/020-fix-conversation-splits-after-2nd-messag/020-SUMMARY.md`
</output>
