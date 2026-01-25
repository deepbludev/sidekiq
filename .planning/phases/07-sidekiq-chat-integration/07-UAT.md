---
status: complete
phase: 07-sidekiq-chat-integration
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md, 07-05-SUMMARY.md, 07-06-SUMMARY.md
started: 2026-01-25T15:10:00Z
updated: 2026-01-25T16:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Start Chat with Sidekiq from Sidebar
expected: Click Sidekiq in sidebar navigates to /chat?sidekiq={id} and shows Sidekiq's conversation starters
result: pass

### 2. Sidekiq Indicator in Chat Header
expected: When chatting with Sidekiq, header shows Sidekiq avatar and name. Clicking opens popover with description and edit link.
result: pass

### 3. Sidekiq Badge in Chat Input
expected: When chatting with Sidekiq, input area shows "Chatting with [name]" badge above the textarea
result: pass

### 4. System Message Injection
expected: Send a message to a Sidekiq. AI response reflects the Sidekiq's personality/instructions (not just generic response).
result: issue
reported: "I'm not quite sure this actually works"
severity: major

### 5. Sidebar Thread Shows Sidekiq Avatar
expected: Thread created with Sidekiq shows Sidekiq avatar on left instead of pin icon
result: pass

### 6. Sidebar Thread Shows Sidekiq Subtitle
expected: Thread with Sidekiq shows "with [Sidekiq name]" subtitle under thread title
result: pass

### 7. Start Chat Button on Sidekiq Cards
expected: Sidekiq card (grid or list view) has "Start Chat" button that navigates to /chat?sidekiq={id}
result: pass

### 8. Cmd+Shift+S Opens Sidekiq Picker
expected: Press Cmd+Shift+S (or Ctrl+Shift+S on Windows). Sidekiq picker dialog opens with search and favorites.
result: pass

### 9. Sidekiq Avatar on AI Messages
expected: When chatting with Sidekiq, AI messages show Sidekiq avatar inline at the start of the message
result: pass

### 10. Thread Resume Restores Sidekiq Context
expected: Open an existing thread that was created with a Sidekiq. Header shows Sidekiq indicator, input shows badge, avatar appears on AI messages.
result: pass

### 11. Deleted Sidekiq Graceful Handling
expected: If a Sidekiq is deleted but threads still reference it, thread shows "?" avatar and "[Sidekiq deleted]" subtitle (not a crash)
result: issue
reported: "when deleting it, the chat behaves like a normal chat, without any hint of a deleted sidekiq"
severity: major

### 12. Model Selection Priority
expected: Start chat with Sidekiq that has a default model set. Model picker shows Sidekiq's model pre-selected (not user's default).
result: skipped
reason: No UI to set default model on Sidekiq - field exists in backend but form doesn't expose it

## Summary

total: 12
passed: 9
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "AI response reflects the Sidekiq's personality/instructions"
  status: failed
  reason: "User reported: I'm not quite sure this actually works"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Deleted Sidekiq shows '?' avatar and '[Sidekiq deleted]' subtitle"
  status: failed
  reason: "User reported: when deleting it, the chat behaves like a normal chat, without any hint of a deleted sidekiq"
  severity: major
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sidekiq default model can be set in create/edit form"
  status: missing
  reason: "Backend schema has defaultModel field but UI form doesn't expose it"
  severity: minor
  test: 12
  root_cause: "Form fields in Phase 6 didn't include defaultModel selector"
  artifacts: []
  missing:
    - "Add model picker/selector to Sidekiq create/edit form"
  debug_session: ""
