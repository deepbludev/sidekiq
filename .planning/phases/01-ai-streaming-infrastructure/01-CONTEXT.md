# Phase 1: AI Streaming Infrastructure - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the AI streaming pipeline using Vercel AI SDK and Route Handlers. User can send a message and receive a streaming AI response. Messages are persisted with model, tokens, and metadata. This phase builds the foundation that all subsequent chat features depend on.

</domain>

<decisions>
## Implementation Decisions

### Provider Configuration
- Support all major providers via Vercel AI Gateway: OpenAI, Anthropic, Google
- Include latest models from each family:
  - OpenAI: GPT-4o, GPT-4o-mini, GPT-5.2 family
  - Anthropic: Claude 3.5 Sonnet, Claude 4.5 family, Haiku
  - Google: Gemini 1.5 Pro, Flash, Gemini 3 family
- Architecture must make adding new models trivial (config-driven via AI Gateway)
- Default model: User's last used model (remember preference, sticky across conversations)
- Model picker info: Show model name + provider icon + speed/quality indicators + pricing tier hint ($/$$/$$$)

### Streaming Visual Behavior
- Claude's discretion: Typing indicator style (three dots, pulsing avatar, or skeleton)
- Claude's discretion: Token rendering approach (character-by-character, word-by-word, or natural chunks)
- Claude's discretion: Cursor at end of streaming (blinking cursor, no cursor, or subtle indicator)
- Claude's discretion: Auto-scroll behavior (always follow, smart follow, or manual)

### Message Persistence
- Claude's discretion: Save timing for AI response (after completion vs progressive)
- Claude's discretion: Save timing for user message (immediately vs with response)
- Token tracking: Best effort — use provider's reported usage, don't validate independently
- Metadata to store per message:
  - Model used (which specific model generated the response)
  - Response timing (latency in ms)
  - Provider info (request ID, finish reason, etc.)

### Partial Response Handling
- Claude's discretion: Whether to save partial responses on streaming failure
- User can stop streaming mid-generation with a stop button
- When user stops: Keep partial response and mark it as stopped (visual indicator)
- Claude's discretion: Retry button UX for failed requests

</decisions>

<specifics>
## Specific Ideas

- "It should be very easy to add new models since we are using the Vercel AI Gateway" — config-driven model registry
- Models should feel current — include the latest from each provider family, not just legacy models

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-ai-streaming-infrastructure*
*Context gathered: 2026-01-22*
