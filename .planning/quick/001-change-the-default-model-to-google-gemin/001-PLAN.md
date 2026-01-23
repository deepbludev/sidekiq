# Quick Task 001: Change Default Model

## Task
Change the default model from `anthropic/claude-sonnet-4-20250514` to `google/gemini-2.0-flash` in `sidekiq-webapp/src/lib/ai/models-metadata.ts`.

## Tasks

### Task 1: Update DEFAULT_MODEL constant
- **File:** `sidekiq-webapp/src/lib/ai/models-metadata.ts`
- **Change:** Line 152 - update `DEFAULT_MODEL` from `"anthropic/claude-sonnet-4-20250514"` to `"google/gemini-2.0-flash"`

## Verification
- [ ] DEFAULT_MODEL constant equals `"google/gemini-2.0-flash"`
- [ ] TypeScript compiles without errors
