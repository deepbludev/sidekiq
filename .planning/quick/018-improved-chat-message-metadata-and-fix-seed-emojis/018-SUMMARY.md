---
phase: quick-018
plan: 01
subsystem: chat-ui
tags: [seed-data, emoji, metadata, hover, message-item]
dependency-graph:
  requires: []
  provides:
    - "Seed sidekiqs with visible Unicode emoji glyphs"
    - "Rich assistant message metadata display on hover"
  affects:
    - "Any future changes to message-item.tsx rendering"
    - "Any future changes to seed data"
tech-stack:
  added: []
  patterns:
    - "UIMessage.metadata as carrier for model/token/latency data from server to client"
    - "getModelConfig for resolving model IDs to friendly names in UI"
file-tracking:
  key-files:
    created: []
    modified:
      - "sidekiq-webapp/src/server/db/reset-and-seed.ts"
      - "sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx"
      - "sidekiq-webapp/src/components/chat/message-item.tsx"
decisions: []
metrics:
  duration: "3m"
  completed: "2026-01-27"
---

# Quick Task 018: Improved Chat Message Metadata and Fix Seed Emojis

**One-liner:** Fixed seed emoji rendering with Unicode glyphs and added rich assistant message metadata (model, tokens, latency, time) on hover.

## What Was Done

### Task 1: Fix seed emoji data
- Replaced text-name emoji values (`"pen"`, `"magnifying-glass"`, `"crystal-ball"`, `"pirate-flag"`) with actual Unicode emoji characters (`"✏️"`, `"🔍"`, `"🔮"`, `"🏴‍☠️"`)
- Added realistic `latencyMs` metadata to all six assistant seed messages (range: 2100ms-6200ms)
- `SidekiqAvatar` renders `avatar.emoji` directly as text content, so Unicode glyphs display immediately

### Task 2: Rich metadata display on hover
- Expanded the DB query in `page.tsx` to select `model`, `inputTokens`, `outputTokens`, and `metadata` columns
- Attached all metadata fields to `UIMessage.metadata` during the DB-to-UIMessage conversion, spreading the jsonb `metadata` column to surface `latencyMs`, `finishReason`, and `aborted`
- Added `MessageMetadata` interface and `formatMessageMetadata` helper in `message-item.tsx`
- Imported `getModelConfig` from `models-metadata.ts` to resolve model IDs (e.g., `google/gemini-2.0-flash`) to friendly display names (e.g., `Gemini 2.0 Flash`)
- Updated hover behavior: assistant messages show `"Gemini 2.0 Flash · 157 tokens · 2.1s · 10:30 AM"`, user messages show only timestamp
- Streaming messages show no metadata (metadata is not yet persisted during stream)

## Verification

- `pnpm tsc --noEmit` passes with zero errors
- `pnpm build` succeeds (only pre-existing warnings, no errors)
- Seed file contains Unicode emoji characters, not text names
- All six assistant seed messages have metadata with latencyMs values
- `page.tsx` query selects model, inputTokens, outputTokens, metadata
- `message-item.tsx` imports getModelConfig and formats metadata string
- Assistant hover format: "Model Name · N tokens · X.Xs · H:MM AM/PM"
- User hover format: "H:MM AM/PM" (unchanged)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `97aa941` | fix(quick-018): replace seed emoji text names with Unicode glyphs and add latencyMs metadata |
| 2 | `efae19b` | feat(quick-018): add rich metadata display on assistant message hover |
