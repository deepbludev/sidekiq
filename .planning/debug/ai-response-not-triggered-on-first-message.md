---
status: diagnosed
trigger: "AI message wasn't triggered after 1st message and creation of thread. Had to send 2nd message to trigger it. The title doesn't change."
created: 2026-01-23T00:00:00.000Z
updated: 2026-01-23T00:00:00.000Z
---

## Current Focus

hypothesis: CONFIRMED - router.replace() causes React component unmount, which aborts the streaming response before useChat can process it
test: Analyzed component lifecycle and fetch/redirect timing
expecting: Evidence that component unmounts during stream processing
next_action: Document root cause and provide fix recommendation

## Symptoms

expected: After sending first message from /chat, thread is created, AI responds immediately, and title auto-generates
actual: Thread is created, URL changes to /chat/[threadId], but AI does NOT respond. Second message triggers AI response. Title never updates.
errors: None reported - silent failure
reproduction:
1. Go to /chat (threadId is null)
2. Send first message
3. Observe: URL changes to /chat/[threadId]
4. Observe: No AI response appears
5. Send second message ("so?")
6. Observe: AI responds to second message only
started: Current behavior in UAT Test 2

## Eliminated

## Evidence

- timestamp: 2026-01-23T00:00:01.000Z
  checked: chat-interface.tsx customFetch function (lines 51-68)
  found: customFetch intercepts response, reads X-Thread-Id header, then calls router.replace() BEFORE returning response
  implication: The redirect happens while response is being returned, potentially before useChat hook can process the streaming body

- timestamp: 2026-01-23T00:00:02.000Z
  checked: API route POST handler (route.ts lines 157-245)
  found: Server-side streaming setup looks correct - calls consumeStream(), returns streaming response with X-Thread-Id header
  implication: Server-side is not the issue - it's correctly initiating the stream

- timestamp: 2026-01-23T00:00:03.000Z
  checked: useChat hook integration in chat-interface.tsx
  found: useChat is configured with custom transport that includes customFetch
  implication: customFetch is in the request/response pipeline and can affect stream processing

- timestamp: 2026-01-23T00:00:04.000Z
  checked: Component lifecycle and Next.js router behavior
  found: router.replace() triggers immediate navigation from /chat to /chat/[threadId], causing ChatInterface component to unmount and remount with different props
  implication: When component unmounts, React cleanup aborts ongoing fetch requests and closes streaming connections

- timestamp: 2026-01-23T00:00:05.000Z
  checked: Timing sequence of events
  found:
    1. User sends message from /chat (threadId=null)
    2. customFetch initiates POST to /api/chat
    3. Server creates thread, starts streaming, returns response with X-Thread-Id header
    4. customFetch reads X-Thread-Id header
    5. customFetch calls router.replace('/chat/[threadId]') - IMMEDIATE REDIRECT
    6. ChatInterface component unmounts (threadId changed from null to string)
    7. Stream connection is aborted during unmount
    8. New ChatInterface mounts with threadId=[threadId], but stream is already dead
    9. useChat never receives the streaming response
  implication: The redirect happens too early - it needs to happen AFTER the stream completes, not during fetch

- timestamp: 2026-01-23T00:00:06.000Z
  checked: Why second message works
  found: On second message, threadId is already set (not null), so no redirect occurs. Stream completes normally because component doesn't unmount
  implication: Confirms that the redirect/unmount is the culprit

- timestamp: 2026-01-23T00:00:07.000Z
  checked: Title generation issue
  found: Title generation only happens in onFinish callback (route.ts lines 213-228), which only fires after stream completes. Since first stream is aborted, onFinish never runs, so title is never generated
  implication: Title not updating is a symptom of the same root cause - stream abortion

## Resolution

root_cause: |
  The router.replace() call in customFetch (chat-interface.tsx:61) happens immediately after receiving the response headers, BEFORE the streaming body is processed by useChat. This causes the ChatInterface component to unmount (as it navigates from /chat to /chat/[threadId]), which aborts the streaming connection. The useChat hook never receives the AI response because the fetch is aborted during component cleanup.

  Sequence of events:
  1. User sends first message from /chat (threadId=null)
  2. API creates thread, starts streaming response
  3. customFetch receives response with X-Thread-Id header
  4. customFetch immediately calls router.replace() -> navigation starts
  5. ChatInterface unmounts (props change from threadId=null to threadId=[id])
  6. React cleanup aborts the fetch stream
  7. useChat never processes the streaming body
  8. onFinish callback never fires -> title never generates

  Second message works because threadId is already set, so no redirect occurs and component doesn't unmount.

fix: |
  The redirect must be deferred until AFTER the stream completes. Three possible approaches:

  **Option 1 (Recommended): Update URL without navigation using window.history**
  - Use window.history.replaceState() instead of router.replace()
  - Updates URL without causing component unmount/remount
  - Maintains streaming connection
  - Most performant solution

  **Option 2: Defer redirect to onFinish callback in useChat**
  - Move redirect logic out of customFetch
  - Trigger redirect in useChat's onFinish callback (after stream completes)
  - Requires access to transport response metadata
  - More complex, but preserves current architecture

  **Option 3: Use server-side redirect after thread creation**
  - API returns redirect instruction in response body after stream
  - Client reads final chunk and redirects
  - Most complex, requires protocol changes

verification:
files_changed:
  - sidekiq-webapp/src/components/chat/chat-interface.tsx (customFetch function)
