---
status: diagnosed
trigger: "Auto-generated thread title not appearing in browser tab"
created: 2026-01-23T00:00:00Z
updated: 2026-01-23T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - No client-side mechanism exists to update document.title
test: Searched entire codebase for document.title usage or dynamic metadata
expecting: No results - confirmed
next_action: Return diagnosis

## Symptoms

expected: Browser tab shows auto-generated title (3-6 words) after AI response completes
actual: Browser tab shows "Sidekiq" (app name) instead of thread title
errors: None reported
reproduction: Start new chat, send message, wait for AI response to complete, observe tab title
started: Unknown - possibly never worked

## Eliminated

## Evidence

- timestamp: 2026-01-23T00:01:00Z
  checked: /sidekiq-webapp/src/lib/ai/title.ts
  found: Title generation function exists and is properly implemented
  implication: Title generation capability exists

- timestamp: 2026-01-23T00:02:00Z
  checked: /sidekiq-webapp/src/app/api/chat/route.ts (lines 212-228)
  found: Title IS generated and saved to database for new threads in onFinish callback (fire-and-forget async)
  implication: Backend title generation and persistence works correctly

- timestamp: 2026-01-23T00:03:00Z
  checked: /sidekiq-webapp/src/app/layout.tsx (lines 10-14)
  found: Static metadata export `{ title: "Sidekiq", ... }` - never changes
  implication: Root layout sets static title, no dynamic override exists

- timestamp: 2026-01-23T00:04:00Z
  checked: /sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
  found: Server component loads thread with title column but ONLY passes threadId and initialMessages to ChatInterface - title is NOT used
  implication: Thread title is fetched but discarded, never passed to client

- timestamp: 2026-01-23T00:05:00Z
  checked: /sidekiq-webapp/src/components/chat/chat-interface.tsx
  found: No document.title manipulation, no useEffect for title, no title prop accepted
  implication: Client component has no mechanism to update browser tab title

- timestamp: 2026-01-23T00:06:00Z
  checked: Grep for "document.title" and "generateMetadata" across entire src/
  found: No matches for document.title usage; only static metadata export exists
  implication: CONFIRMED - no dynamic title update mechanism exists anywhere

## Resolution

root_cause: The page component fetches the thread title from the database (line 39 in page.tsx) but discards it - the title is not passed to the client component (ChatInterface), and no mechanism exists to update document.title dynamically. The static metadata in layout.tsx always wins.
fix:
verification:
files_changed: []
