---
status: resolved
trigger: "Model state lingers when switching Sidekiqs - model picker shows previous Sidekiq's default model instead of new Sidekiq's default model"
created: 2026-01-25T12:00:00Z
updated: 2026-01-25T12:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - useModelSelection hook lacks useEffect to reset model when sidekiqDefaultModel prop changes
test: Code review of useModelSelection hook
expecting: Missing dependency on sidekiqDefaultModel in useEffect
next_action: Document root cause

## Symptoms

expected: When navigating to /chat?sidekiq={id}, the model picker should show that Sidekiq's defaultModel
actual: Model picker shows the previous Sidekiq's default model until page refresh
errors: None (silent state bug)
reproduction: 1) Start chat with Sidekiq A (has defaultModel X), 2) Navigate to /chat?sidekiq={B} (has defaultModel Y), 3) Model picker still shows X
started: Design flaw - the useEffect only handles threadModel changes, not sidekiqDefaultModel changes

## Eliminated

(none - root cause found on first hypothesis)

## Evidence

- timestamp: 2026-01-25T12:02:00Z
  checked: use-model-selection.ts lines 127-132
  found: useEffect exists for threadModel changes but NOT for sidekiqDefaultModel changes
  implication: When sidekiq prop changes (client-side navigation), selectedModel state is never updated

- timestamp: 2026-01-25T12:03:00Z
  checked: chat/page.tsx (new chat page)
  found: sidekiq data fetched server-side, passed to ChatInterface as prop
  implication: Server component correctly fetches new Sidekiq data, but client component doesn't react to prop change

- timestamp: 2026-01-25T12:04:00Z
  checked: ChatInterface component
  found: useModelSelection called with sidekiqDefaultModel from sidekiq prop
  implication: The prop IS passed correctly, but the hook doesn't reset state when it changes

## Resolution

root_cause: The useModelSelection hook has a useEffect for threadModel changes (lines 128-132) but no equivalent useEffect for sidekiqDefaultModel changes. When user navigates between Sidekiqs via client-side navigation, the sidekiqDefaultModel prop changes but the selectedModel state is never updated.

fix: Add useEffect to reset selectedModel when sidekiqDefaultModel changes (when no threadModel is present)

verification: N/A - diagnosis only mode

files_changed:
- /Users/carlocasorzo/Documents/Github/sidekiq/sidekiq-webapp/src/hooks/use-model-selection.ts (needs fix)
