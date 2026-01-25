---
status: diagnosed
phase: 07-sidekiq-chat-integration
source: 07-07-SUMMARY.md, 07-08-SUMMARY.md
started: 2026-01-25T17:00:00Z
updated: 2026-01-25T17:15:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Deleted Sidekiq Shows Indicator
expected: Delete a Sidekiq that has existing chat threads. The thread should show "?" avatar and "[Sidekiq deleted]" subtitle in the sidebar.
result: pass

### 2. Model Picker in Sidekiq Create Form
expected: Go to create new Sidekiq. Form shows model picker allowing you to select default AI model.
result: pass

### 3. Model Picker in Sidekiq Edit Form
expected: Edit an existing Sidekiq. Model picker shows current default model and allows changing it.
result: pass

### 4. Sidekiq Default Model Applied in Chat
expected: Set a Sidekiq's default model (e.g., Claude). Start chat with that Sidekiq. Model picker shows Sidekiq's model pre-selected.
result: issue
reported: "it works, but then when i switch to a different sidekiq, the default model of the previous sidekiq lingers, unless i refresh the page"
severity: minor

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Model picker shows Sidekiq's default model when switching between Sidekiqs"
  status: diagnosed
  reason: "User reported: it works, but then when i switch to a different sidekiq, the default model of the previous sidekiq lingers, unless i refresh the page"
  severity: minor
  test: 4
  root_cause: "useModelSelection hook has useEffect for threadModel changes but no equivalent effect for sidekiqDefaultModel prop changes during client-side navigation"
  artifacts:
    - path: "sidekiq-webapp/src/hooks/use-model-selection.ts"
      issue: "Lines 128-132 handle threadModel, but no equivalent for sidekiqDefaultModel"
  missing:
    - "Add useEffect to reset selectedModel when sidekiqDefaultModel changes (with !threadModel guard)"
  debug_session: ".planning/debug/model-state-lingers-sidekiq-switch.md"
