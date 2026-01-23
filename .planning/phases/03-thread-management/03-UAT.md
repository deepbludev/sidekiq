---
status: diagnosed
phase: 03-thread-management
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-01-23T15:00:00Z
updated: 2026-01-23T15:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. New chat creates thread on first message
expected: Go to /chat (new chat page), type a message and send. The URL should change to /chat/[threadId] after the AI starts responding. The AI response should stream completely without interruption.
result: pass

### 2. Auto-title generation
expected: After the first message exchange (user + AI response completes), the thread should receive an auto-generated title. Check the browser tab or refresh and look at the thread later - title should be 3-6 words summarizing the topic.
result: issue
reported: "Chrome tab title does not change - still shows 'Sidekiq' instead of auto-generated title after AI response completed"
severity: major

### 3. Existing thread loads messages
expected: Navigate directly to /chat/[threadId] for an existing thread. The previous messages should load and display correctly.
result: pass

### 4. Invalid thread redirects to /chat
expected: Navigate to /chat/invalid-thread-id-that-doesnt-exist. Should redirect back to /chat (new chat page).
result: pass

### 5. Thread context menu
expected: Right-click on a ThreadItem component. A context menu should appear with options: Pin/Unpin, Rename, Archive, Delete.
result: skipped
reason: Requires sidebar (Phase 5)

### 6. Delete thread confirmation
expected: Click Delete in context menu. A confirmation dialog appears warning about permanent deletion and suggesting archive as alternative.
result: skipped
reason: Requires sidebar (Phase 5)

## Summary

total: 6
passed: 3
issues: 1
pending: 0
skipped: 2

## Gaps

- truth: "After the first message exchange, the thread receives an auto-generated title visible in browser tab"
  status: failed
  reason: "User reported: Chrome tab title does not change - still shows 'Sidekiq' instead of auto-generated title after AI response completed"
  severity: major
  test: 2
  root_cause: "The page component fetches the thread title from database but discards it - title is not passed to ChatInterface, and no mechanism exists to update document.title dynamically. Static metadata in layout.tsx always wins."
  artifacts:
    - path: "sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx"
      issue: "Fetches title but discards it (line 39 fetches, line 70 doesn't use)"
    - path: "sidekiq-webapp/src/components/chat/chat-interface.tsx"
      issue: "No title prop, no document.title update logic"
    - path: "sidekiq-webapp/src/app/layout.tsx"
      issue: "Static metadata always shows 'Sidekiq'"
  missing:
    - "Add generateMetadata function to thread page for SSR title"
    - "Pass title prop to ChatInterface and add useEffect to update document.title"
  debug_session: ".planning/debug/tab-title-not-updating.md"
