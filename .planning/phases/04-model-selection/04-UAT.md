---
status: diagnosed
phase: 04-model-selection
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md
started: 2026-01-23T21:00:00Z
updated: 2026-01-23T21:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Model picker visible in chat
expected: Model picker dropdown/button is visible near the chat input area. Shows the currently selected model name.
result: pass

### 2. Model picker opens and shows available models
expected: Clicking the model picker opens a dropdown showing available models (GPT-4o, Claude, Gemini, etc.) grouped by provider.
result: issue
reported: "doesnt work, when i click on the button, nothing happens"
severity: major

### 3. Fuzzy search finds models with typos
expected: Typing "clade" or "gpt4" in the search box finds matching models despite typos.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 4. Model selection changes active model
expected: Selecting a different model from the picker updates the display to show the new model name.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 5. Selected model used for AI responses
expected: Sending a message uses the selected model. The AI response should come from the chosen model (visible in response style or by checking network/logs).
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 6. Model persists for thread
expected: Closing and reopening the same thread shows the previously selected model still active (sticky per thread).
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 7. Different threads can use different models
expected: Thread A can use GPT-4o while Thread B uses Claude. Switching between threads shows each thread's own model.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 8. Hover card shows model details
expected: Hovering over a model in the picker shows a card with description, features (e.g., "vision", "code"), and knowledge cutoff date.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 9. Favorite toggle works
expected: Clicking the star/favorite icon on a model marks it as favorite. The star fills in or changes color.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 10. Favorites appear at top of picker
expected: Models marked as favorite appear in a "Favorites" section at the top of the model picker.
result: skipped
reason: blocked by test 2 - model picker doesn't open

### 11. Model picker disabled during streaming
expected: While an AI response is streaming, the model picker is disabled (greyed out or unclickable).
result: skipped
reason: blocked by test 2 - model picker doesn't open

## Summary

total: 11
passed: 1
issues: 1
pending: 0
skipped: 9

## Gaps

- truth: "Clicking the model picker opens a dropdown showing available models grouped by provider"
  status: failed
  reason: "User reported: doesnt work, when i click on the button, nothing happens"
  severity: major
  test: 2
  root_cause: "ModelPickerTrigger component does not forward rest props to Button - PopoverTrigger's onClick is discarded"
  artifacts:
    - path: "sidekiq-webapp/src/components/model-picker/model-picker-trigger.tsx"
      issue: "Missing rest props spread - lines 11-15, 24"
  missing:
    - "Extend props interface with React.ComponentPropsWithoutRef<'button'>"
    - "Destructure with rest: ({ selectedModel, disabled, className, ...props }, ref)"
    - "Spread {...props} on Button component"
  debug_session: ".planning/debug/model-picker-dropdown-not-opening.md"
