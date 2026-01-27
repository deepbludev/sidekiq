---
phase: quick-018
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - sidekiq-webapp/src/server/db/reset-and-seed.ts
  - sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
  - sidekiq-webapp/src/components/chat/message-item.tsx
  - sidekiq-webapp/src/components/chat/message-list.tsx
autonomous: true

must_haves:
  truths:
    - "Seed sidekiq avatars render as visible emoji glyphs, not text names"
    - "Hovering over an assistant message shows model name, token count, and latency"
    - "Hovering over a user message shows only a timestamp"
    - "Metadata is not shown for currently-streaming messages"
  artifacts:
    - path: "sidekiq-webapp/src/server/db/reset-and-seed.ts"
      provides: "Seed data with Unicode emoji characters"
      contains: "emoji: \"✏️\""
    - path: "sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx"
      provides: "Message query including model, tokens, metadata fields"
      contains: "model: true"
    - path: "sidekiq-webapp/src/components/chat/message-item.tsx"
      provides: "Rich metadata display below assistant messages on hover"
      contains: "getModelConfig"
    - path: "sidekiq-webapp/src/components/chat/message-list.tsx"
      provides: "Pass-through of message data to MessageItem"
  key_links:
    - from: "sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx"
      to: "sidekiq-webapp/src/components/chat/message-item.tsx"
      via: "UIMessage.metadata carrying model/tokens/latency from DB query to renderer"
      pattern: "metadata.*model"
---

<objective>
Fix seed emoji rendering and add rich metadata display on assistant message hover.

Purpose: Seed sidekiqs currently display text names ("pen", "magnifying-glass") instead of emoji glyphs. Assistant messages only show a timestamp on hover, but the DB already stores model, token counts, and latency. This plan fixes the seed data and surfaces that metadata in the UI.

Output: Seed emojis render correctly; hovering over assistant messages shows "Model Name · N tokens · X.Xs · 2:30 PM" in a single subtle line.
</objective>

<execution_context>
@/Users/carlocasorzo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/carlocasorzo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@sidekiq-webapp/src/server/db/reset-and-seed.ts
@sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
@sidekiq-webapp/src/components/chat/message-item.tsx
@sidekiq-webapp/src/components/chat/message-list.tsx
@sidekiq-webapp/src/components/chat/chat-interface.tsx
@sidekiq-webapp/src/lib/ai/models-metadata.ts
@sidekiq-webapp/src/components/sidekiq/sidekiq-avatar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix seed emoji data</name>
  <files>sidekiq-webapp/src/server/db/reset-and-seed.ts</files>
  <action>
Replace the text-name emoji values in `createSeedSidekiqs` with actual Unicode emoji characters:

- Line 76: `emoji: "pen"` -> `emoji: "✏️"` (Writing Assistant)
- Line 140-141: `emoji: "magnifying-glass"` -> `emoji: "🔍"` (Research Helper)
- Line 173: `emoji: "crystal-ball"` -> `emoji: "🔮"` (Oracle)
- Line 211: `emoji: "pirate-flag"` -> `emoji: "🏴‍☠️"` (Captain Jack)

The `SidekiqAvatar` component renders `avatar.emoji` directly as text content in an `AvatarFallback`. Any valid Unicode emoji character will display correctly. The `EMOJI_CATEGORIES` registry is only used by the picker UI, not by the renderer.

Also add `latencyMs` values to the seed message metadata for assistant messages so the metadata feature has data to display. Update each assistant seed message's `metadata` from `null` to include a realistic latencyMs value:
- seed-msg-1-2: `metadata: { finishReason: "stop", latencyMs: 2100, aborted: false }`
- seed-msg-1-4: `metadata: { finishReason: "stop", latencyMs: 3500, aborted: false }`
- seed-msg-2-2: `metadata: { finishReason: "stop", latencyMs: 4200, aborted: false }`
- seed-msg-3-2: `metadata: { finishReason: "stop", latencyMs: 3800, aborted: false }`
- seed-msg-3-4: `metadata: { finishReason: "stop", latencyMs: 6200, aborted: false }`
- seed-msg-4-2: `metadata: { finishReason: "stop", latencyMs: 5100, aborted: false }`
  </action>
  <verify>Run `pnpm tsc --noEmit` from sidekiq-webapp to confirm no type errors. Visually inspect the changed lines in the file.</verify>
  <done>All four emoji seed values are Unicode characters. All six assistant seed messages have realistic metadata with latencyMs values.</done>
</task>

<task type="auto">
  <name>Task 2: Pass metadata through UIMessage and render on hover</name>
  <files>
    sidekiq-webapp/src/app/(dashboard)/chat/[threadId]/page.tsx
    sidekiq-webapp/src/components/chat/message-item.tsx
    sidekiq-webapp/src/components/chat/message-list.tsx
  </files>
  <action>
**Step A: Expand the DB query in page.tsx (lines 94-103)**

Add `model`, `inputTokens`, `outputTokens`, and `metadata` to the `columns` selection in the `threadMessages` query:

```typescript
columns: {
  id: true,
  role: true,
  content: true,
  createdAt: true,
  model: true,
  inputTokens: true,
  outputTokens: true,
  metadata: true,
},
```

**Step B: Attach metadata to UIMessage (lines 106-111)**

Pass the extra fields through `UIMessage.metadata` so they reach client components. The `UIMessage` type has a generic `metadata` field. When converting DB messages to UIMessage format, attach the metadata:

```typescript
const initialMessages: UIMessage[] = threadMessages.map((msg) => ({
  id: msg.id,
  role: msg.role,
  parts: [{ type: "text", text: msg.content }],
  createdAt: msg.createdAt,
  metadata: {
    model: msg.model,
    inputTokens: msg.inputTokens,
    outputTokens: msg.outputTokens,
    ...(msg.metadata && typeof msg.metadata === "object" ? msg.metadata : {}),
  },
}));
```

This puts `model`, `inputTokens`, `outputTokens`, `finishReason`, `latencyMs`, and `aborted` all into `UIMessage.metadata`.

**Step C: Define a MessageMetadata type in message-item.tsx**

Add an interface near the top of the file (after imports):

```typescript
/**
 * Metadata attached to assistant messages from the database.
 * Passed through UIMessage.metadata for persisted messages.
 */
interface MessageMetadata {
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  finishReason?: string | null;
  createdAt?: string | Date | number;
}
```

**Step D: Add a helper function to format metadata in message-item.tsx**

```typescript
/**
 * Formats assistant message metadata into a display string.
 * Format: "Model Name · N tokens · X.Xs · 2:30 PM"
 *
 * @param metadata - The message metadata from UIMessage
 * @param createdAt - The message timestamp
 * @returns Formatted string or null if no metadata available
 */
function formatMessageMetadata(
  metadata: MessageMetadata | null,
  createdAt: Date | null,
): string | null {
  const parts: string[] = [];

  // Model display name
  if (metadata?.model) {
    const config = getModelConfig(metadata.model);
    parts.push(config?.name ?? metadata.model);
  }

  // Total token count (input + output)
  const input = metadata?.inputTokens ?? 0;
  const output = metadata?.outputTokens ?? 0;
  const totalTokens = input + output;
  if (totalTokens > 0) {
    parts.push(`${totalTokens} tokens`);
  }

  // Latency
  if (metadata?.latencyMs && metadata.latencyMs > 0) {
    const seconds = metadata.latencyMs / 1000;
    parts.push(`${seconds.toFixed(1)}s`);
  }

  // Timestamp
  if (createdAt) {
    parts.push(formatTime(createdAt));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
```

Add the `getModelConfig` import at the top:
```typescript
import { getModelConfig } from "@sidekiq/lib/ai/models-metadata";
```

**Step E: Update the MessageItem render to show rich metadata for assistant messages**

Replace the timestamp-only hover section (lines 168-178) with logic that:
- For **assistant messages**: shows the rich metadata line using `formatMessageMetadata`
- For **user messages**: shows just the timestamp (current behavior)

Replace the IIFE block:
```typescript
{/* Metadata / timestamp (visible on hover) */}
{showTimestamp && (() => {
  const createdAt = getCreatedAt(message);
  if (isUser) {
    // User messages: timestamp only
    if (createdAt) {
      return (
        <time className="text-muted-foreground mt-1.5 block text-xs">
          {formatTime(createdAt)}
        </time>
      );
    }
    return null;
  }

  // Assistant messages: rich metadata
  const metadata = (message.metadata ?? null) as MessageMetadata | null;
  const metadataStr = formatMessageMetadata(metadata, createdAt);
  if (metadataStr) {
    return (
      <p className="text-muted-foreground mt-1.5 text-xs">
        {metadataStr}
      </p>
    );
  }
  // Fallback: just timestamp if no metadata
  if (createdAt) {
    return (
      <time className="text-muted-foreground mt-1.5 block text-xs">
        {formatTime(createdAt)}
      </time>
    );
  }
  return null;
})()}
```

**Step F (message-list.tsx): No changes needed**

The `MessageList` component already passes the full `message` object (UIMessage) to `MessageItem`. Since metadata is part of UIMessage, it flows through automatically. No changes to `message-list.tsx` are needed.
  </action>
  <verify>
1. Run `pnpm tsc --noEmit` from sidekiq-webapp to confirm no type errors.
2. Run `pnpm build` from sidekiq-webapp to confirm the build succeeds.
3. If dev server is running: navigate to an existing thread with seeded messages. Hover over an assistant message and confirm "Model Name · N tokens · X.Xs · H:MM AM/PM" appears. Hover over a user message and confirm only the timestamp appears.
  </verify>
  <done>
- DB query in page.tsx includes model, inputTokens, outputTokens, metadata columns
- UIMessage.metadata carries model/tokens/latency data to client
- Assistant messages on hover show: "Gemini 2.0 Flash · 157 tokens · 2.1s · 10:30 AM"
- User messages on hover show only timestamp (unchanged behavior)
- Streaming messages show no metadata (metadata not yet persisted)
  </done>
</task>

</tasks>

<verification>
1. `pnpm tsc --noEmit` passes with zero errors
2. `pnpm build` succeeds
3. Seed file contains Unicode emoji characters, not text names
4. Seed assistant messages contain metadata with latencyMs values
5. page.tsx query selects model, inputTokens, outputTokens, metadata
6. message-item.tsx imports getModelConfig and formats metadata string
7. Assistant hover line format: "Model Name · N tokens · X.Xs · H:MM AM/PM"
8. User hover line format: "H:MM AM/PM" (unchanged)
</verification>

<success_criteria>
- All seed emojis render as visible glyphs (not "pen", "magnifying-glass", etc.)
- Hovering over persisted assistant messages shows model name, token count, latency, and time
- Hovering over user messages shows only a timestamp
- No type errors, build passes clean
</success_criteria>

<output>
After completion, create `.planning/quick/018-improved-chat-message-metadata-and-fix-seed-emojis/018-SUMMARY.md`
</output>
