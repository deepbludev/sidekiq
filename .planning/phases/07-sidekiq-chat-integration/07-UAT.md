---
status: diagnosed
phase: 07-sidekiq-chat-integration
source: 07-07-SUMMARY.md, 07-08-SUMMARY.md, 07-09-SUMMARY.md (gap closure retest)
started: 2026-01-25T17:30:00Z
updated: 2026-01-25T17:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Deleted Sidekiq Shows Indicator in Sidebar
expected: After deleting a Sidekiq, existing threads show "?" avatar and "[Sidekiq deleted]" subtitle instead of crashing or looking like normal threads
result: pass

### 2. Model Picker Visible in Sidekiq Form
expected: When creating or editing a Sidekiq, a "Default Model" picker is visible in the form (after avatar, before description)
result: pass

### 3. Sidekiq Default Model Applied to New Chat
expected: Create/edit a Sidekiq and set a specific model (e.g., GPT-4o). Start a new chat with that Sidekiq. The model picker in chat should show that model pre-selected.
result: pass

### 4. Model Picker Updates on Sidekiq Switch
expected: Open Sidekiq picker (Cmd+Shift+S), select a different Sidekiq. The model picker in chat updates to show the new Sidekiq's default model (if set).
result: issue
reported: "doesnt update, same issue"
severity: major

### 5. System Message Injection Works
expected: Create a Sidekiq with distinctive instructions (e.g., "Always respond in haiku format" or "Always start responses with 'Ahoy!'"). Chat with it - AI responses should follow those instructions.
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Model picker updates to show new Sidekiq's default model when switching via Cmd+Shift+S"
  status: diagnosed
  reason: "User reported: doesnt update, same issue"
  severity: major
  test: 4
  root_cause: "useEffect in use-model-selection.ts only updates when sidekiqDefaultModel is truthy. When switching to Sidekiq with null defaultModel, condition fails and state keeps old value. Also ChatInterface has no key prop, so component reuses instance and initial state doesn't re-compute."
  artifacts:
    - path: "sidekiq-webapp/src/hooks/use-model-selection.ts"
      issue: "Lines 134-144: useEffect only sets state when sidekiqDefaultModel && isValidModel(sidekiqDefaultModel). Null case not handled."
    - path: "sidekiq-webapp/src/app/(dashboard)/chat/page.tsx"
      issue: "Line 57: ChatInterface has no key prop - component reuses instance on sidekiq switch"
  missing:
    - "Add key={sidekiq?.id ?? 'no-sidekiq'} to ChatInterface to force remount on sidekiq change"
  debug_session: ""
