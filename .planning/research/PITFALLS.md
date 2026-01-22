# Domain Pitfalls: AI Chat Application

**Domain:** Premium AI chat application with multi-provider LLM integration
**Researched:** 2026-01-22
**Confidence:** HIGH (verified with 2026 sources)

## Executive Summary

AI chat applications have matured significantly, but certain pitfalls remain pervasive across implementations. Research from production systems in 2025-2026 reveals that the most critical failures occur in streaming reliability, token management, multi-provider compatibility, and security. Unlike generic web applications, AI chat systems face unique challenges: ephemeral streaming data that cannot be recovered once lost, token-based pricing that can explode without proper controls, and prompt injection attacks that remain fundamentally unsolvable.

**The brutal truth:** Prevention is often impossible. Modern AI chat architecture focuses on containment, graceful degradation, and recovery rather than perfect execution.

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or catastrophic cost overruns.

### Pitfall 1: Streaming Disconnection Without Recovery

**What goes wrong:**
Connection losses during LLM streaming result in permanently lost message chunks. WebSocket/SSE connections drop mid-stream, but applications fail to detect the loss or provide recovery mechanisms. Users see partial responses with no indication of failure, corrupting conversation state.

**Why it happens:**
- Developers treat streaming as reliable when it's inherently fragile
- Missing `onAbort` callbacks mean disconnections go unhandled
- Network issues (mobile, spotty WiFi) are treated as edge cases rather than expected behavior
- Failed assumption that "if there's no error callback, the stream completed successfully"

**Consequences:**
- Users lose 20-80% of a response without knowing it
- UI state diverges from reality (shows "complete" when truncated)
- Conversation history persists corrupted, incomplete messages
- Users blame the AI model rather than the implementation
- No way to recover lost content (it was never persisted)

**Prevention:**

1. **Implement comprehensive abort detection:**
```typescript
// BAD: No abort handling
useChat({ onFinish: (message) => saveMessage(message) });

// GOOD: Handle all completion scenarios
useChat({
  onFinish: (message) => {
    // Normal completion
    saveMessage(message, { status: 'complete' });
  },
  onAbort: (message) => {
    // Connection lost mid-stream
    saveMessage(message, { status: 'incomplete', recoverable: true });
    showRecoveryPrompt();
  },
  onError: (error) => {
    // Request failed
    logError(error);
    showRetryOption();
  }
});
```

2. **Server-side consumption for critical flows:**
Use `consumeStream()` to ensure backend processes the entire stream even if the client disconnects, preventing "lost work" scenarios.

3. **Visual indicators for stream health:**
Show connection status, not just "thinking" indicators. Use signals like "Receiving response..." that change to "Connection lost - attempting recovery" on abort.

4. **Implement exponential backoff with jitter:**
Retry failed streams with increasing delays to avoid thundering herd problems.

**Detection:**
- Users report "AI stopped responding mid-sentence"
- Analytics show high rate of messages with status "streaming" never transitioning to "complete"
- Monitoring alerts on high `onAbort` callback frequency
- Message length distribution shows unexpected spike at certain character counts (indicating truncation points)

**Phase mapping:**
- Phase 1 (Core Chat): Must implement basic abort handling
- Phase 2 (Production Hardening): Comprehensive recovery, server-side consumption, health monitoring

**Sources:**
- [AnyCable, Rails, and the pitfalls of LLM-streaming](https://evilmartians.com/chronicles/anycable-rails-and-the-pitfalls-of-llm-streaming)
- [Serverless strategies for streaming LLM responses](https://aws.amazon.com/blogs/compute/serverless-strategies-for-streaming-llm-responses/)

---

### Pitfall 2: Token Counting Inconsistency Across Providers

**What goes wrong:**
Applications calculate token usage using OpenAI's tiktoken for all providers, resulting in 20-40% billing discrepancies. Cost estimation shows "$50/month" but actual spend hits "$500/month" because Claude, Gemini, and other providers tokenize differently. Hidden tokens from reasoning traces (GPT-o1, Claude Thinking) aren't accounted for.

**Why it happens:**
- Assumption that tokenization is standardized (it's not)
- Using a single tokenizer library for multi-provider apps
- Documentation claims "approximately 750 words per 1000 tokens" but actual ratios vary by provider
- Providers don't expose reasoning token counts in standard API responses
- Tool use and function calling add hidden system tokens

**Consequences:**
- Budget planning is fiction (off by 2-5x in production)
- Cannot accurately show users their usage
- Cost alerts fire only after overages occur
- Comparative model selection is based on wrong data
- Executive leadership loses trust in AI cost projections
- In one case study: teams discovered inference bills were 5x the allocated cloud budget

**Prevention:**

1. **Use provider-specific tokenizers:**
```typescript
// BAD: Universal tokenizer
import { encode } from 'tiktoken';
const tokens = encode(text).length; // Wrong for Claude/Gemini

// GOOD: Provider-aware counting
const tokenizers = {
  openai: () => import('tiktoken'),
  anthropic: () => import('@anthropic-ai/tokenizer'),
  google: () => import('@google/generative-ai/tokenizer'),
};

async function countTokens(text: string, provider: string) {
  const tokenizer = await tokenizers[provider]();
  return tokenizer.encode(text).length;
}
```

2. **Track actual vs. estimated:**
Log provider-reported token usage from API responses and compare against your estimates. Alert when variance exceeds 15%.

3. **Account for hidden tokens:**
- System prompts are tokens (often 500-2000)
- Tool definitions are tokens (100-300 per tool)
- Reasoning traces can 10x the expected count
- Response format instructions add tokens

4. **Implement token-aware rate limiting:**
Don't just limit requests per minute; limit tokens per minute per user/team.

**Detection:**
- Monthly invoice doesn't match usage dashboard
- Users report "still had quota" but received rate limit errors
- Comparison tests show Provider A costs 2x Provider B despite similar token estimates
- Finance team asks "why are we spending so much on AI?"

**Phase mapping:**
- Phase 1 (Core Chat): Basic token estimation (can be OpenAI-centric initially)
- Phase 2 (Multi-provider): Provider-specific tokenizers mandatory
- Phase 3 (Production): Actual vs. estimated tracking, alerting, cost attribution

**Sources:**
- [Tracking LLM token usage across providers, teams and workloads](https://portkey.ai/blog/tracking-llm-token-usage-across-providers-teams-and-workloads/)
- [Understanding LLM Billing: From Characters to Tokens](https://www.edenai.co/post/understanding-llm-billing-from-characters-to-tokens)

---

### Pitfall 3: Prompt Injection Is Unfixable (So Design for Containment)

**What goes wrong:**
Teams build elaborate input filtering to "prevent prompt injection," investing weeks in keyword blocklists, content filters, and prompt guards. Then a researcher bypasses it in 42 seconds using ASCII art or Base64 encoding. The UK National Cyber Security Centre and OpenAI both publicly acknowledge: **prompt injection may never be fully mitigated**.

**Why it happens:**
- Belief that input validation can solve the problem
- Security mindset from SQL injection (which IS solvable) applied to LLMs (which aren't)
- Underestimating attacker creativity (obfuscation, indirect injection, social engineering)
- Treating AI as a trusted component rather than a potentially compromised one

**Consequences:**
- In 2025 assessments: 20% of jailbreaks succeed in 42 seconds average
- 90% of successful attacks leak sensitive data
- Researcher Johann Rehberger's "Month of AI Bugs" demonstrated virtually every production AI system is vulnerable
- False sense of security leads to inadequate containment measures
- One bypass method (ArtPrompt using ASCII art) achieved 76.2% success across GPT-4, Gemini, Claude, and Llama2

**Prevention (Reality: Containment, not Prevention):**

1. **Assume breach architecture:**
Design as if the AI is actively malicious. Limit what damage it can do.

2. **Input validation is layer 1 of 5, not a solution:**
```typescript
// Necessary but insufficient
function sanitizeInput(userInput: string) {
  // Block obvious attacks
  if (containsSuspiciousPatterns(userInput)) {
    return { allowed: false, reason: 'suspicious_content' };
  }
  return { allowed: true };
}

// Critical: Limit AI privileges regardless of input
const aiContext = {
  canAccessDatabase: false,  // Never give direct DB access
  canExecuteCode: false,      // No arbitrary code execution
  canAccessSecrets: false,    // No env vars, API keys
  outputMustBeFiltered: true, // Check outputs, not just inputs
};
```

3. **Output filtering > Input detection:**
Research strongly supports transitioning from malicious input detection to malicious output prevention. Check what the AI generates before showing users or executing actions.

4. **Human-in-the-loop for privileged operations:**
Any action that modifies data, sends emails, makes purchases, etc. requires human approval.

5. **Implement guardrails at the orchestration layer:**
```typescript
// BAD: Trust AI to follow instructions
const result = await llm.generate(userPrompt);
await database.execute(result); // AI can inject SQL

// GOOD: Validate AI outputs before execution
const result = await llm.generate(userPrompt);
const validated = validateStructure(result);
if (validated.isQuerySafe && validated.meetsConstraints) {
  await database.execute(validated.query);
}
```

6. **Continuous adversarial testing:**
OpenAI trains a bot using reinforcement learning to probe AI agents for weaknesses. You should too (or use third-party services).

7. **Monitor for anomalous behavior:**
- Unusually long outputs (data exfiltration)
- Requests to unusual endpoints
- Attempts to access system information
- Pattern breaks in user conversation flow

**Detection:**
- Penetration testing reveals exploits you thought were fixed
- Security research papers demonstrate new bypass techniques
- User complaints about "AI behaving strangely"
- Logs show AI generating content that violates policies
- Audit trails reveal unauthorized actions

**Phase mapping:**
- Phase 1 (Core Chat): Basic input sanitization (naive but necessary)
- Phase 2 (Custom Assistants/Sidekiqs): Output filtering, privilege boundaries
- Phase 3 (Teams/Multi-tenant): Isolation guarantees, human-in-the-loop for shared resources
- Ongoing: Continuous adversarial testing, monitoring

**Sources:**
- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [LLM Security Risks in 2026: Prompt Injection, RAG, and Shadow AI](https://sombrainc.com/blog/llm-security-risks-2026)
- [The 11 runtime attacks breaking AI security](https://venturebeat.com/security/ciso-inference-security-platforms-11-runtime-attacks-2026)
- [Jailbreaking Every LLM With One Simple Click](https://www.cyberark.com/resources/threat-research-blog/jailbreaking-every-llm-with-one-simple-click)

---

### Pitfall 4: Optimistic UI Without Robust Rollback

**What goes wrong:**
Chat apps show user messages and AI responses instantly (optimistic updates) for snappy UX. Then the request fails—network error, rate limit, model timeout. The UI shows a complete conversation, but the backend has no record. User refreshes the page and their last 3 messages vanish. Rollback logic is absent or buggy, leaving ghost messages in state.

**Why it happens:**
- Focus on happy-path UX (instant feedback)
- Assumption that requests "usually succeed" so edge cases are deferred
- React's `useOptimistic` hook makes it easy to add optimistic updates but doesn't enforce rollback discipline
- Persisting messages "on response" instead of transactionally with request status

**Consequences:**
- User loses messages they thought were sent
- Conversation history corruption (UI shows messages that never reached the server)
- Duplicate messages on retry (message exists in UI state, retry adds it again)
- Loss of user trust ("my conversations keep disappearing")
- Support tickets: "I had a great response from the AI but it's gone now"

**Prevention:**

1. **Rollback is mandatory, not optional:**
```typescript
// BAD: Optimistic update without rollback
function sendMessage(message: string) {
  const optimisticMessage = { id: tempId(), text: message, status: 'sending' };
  setMessages(prev => [...prev, optimisticMessage]);

  api.sendMessage(message); // What if this fails?
}

// GOOD: Explicit rollback on failure
function sendMessage(message: string) {
  const optimisticMessage = { id: tempId(), text: message, status: 'sending' };
  setMessages(prev => [...prev, optimisticMessage]);

  api.sendMessage(message)
    .then(response => {
      // Replace temp ID with real ID
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id
          ? { ...m, id: response.id, status: 'sent' }
          : m
      ));
    })
    .catch(error => {
      // ROLLBACK: Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Failed to send message. Please retry.');
    });
}
```

2. **React 19's useOptimistic hook automates rollback:**
Use it if on React 19+. The hook automatically reverts state on failure.

3. **Persist messages with status, not completion:**
```typescript
// BAD: Save on completion only
onFinish: (message) => saveMessage(message);

// GOOD: Save on send with status tracking
onStart: (messageId) => saveMessage({ id: messageId, status: 'streaming' });
onFinish: (message) => updateMessage(message.id, { status: 'complete' });
onError: (messageId) => updateMessage(messageId, { status: 'failed' });
```

4. **Idempotency keys prevent duplicates:**
On retry, use the same idempotency key so the backend recognizes it's the same message.

**Detection:**
- User reports: "My messages disappear when I refresh"
- Database shows fewer messages than UI displays
- Duplicate message IDs in error logs (retries creating new entries)
- State management logs show messages added but never removed on failure

**Phase mapping:**
- Phase 1 (Core Chat): Optimistic UI with rollback mandatory from day one
- Phase 2 (Production Hardening): Idempotency keys, status-based persistence

**Sources:**
- [React 19 useOptimistic Deep Dive](https://dev.to/a1guy/react-19-useoptimistic-deep-dive-building-instant-resilient-and-user-friendly-uis-49fp)
- [Guidance on persisting messages - Vercel AI Discussion](https://github.com/vercel/ai/discussions/4845)
- [How to Use the Optimistic UI Pattern](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/)

---

### Pitfall 5: Cost Explosion Without Real-Time Monitoring

**What goes wrong:**
AI spend jumps from $5k/month to $50k/month overnight. Finance discovers it 28 days later when the invoice arrives. No alerts, no attribution, no idea which users, models, or features drove the spike. In documented cases, inference bills were 5x the allocated budget. Teams retrospectively realize a single user's agent loop consumed $10k in one weekend.

**Why it happens:**
- Traditional cloud budgeting tools don't handle token-based pricing
- Assumption that "normal usage" remains constant (AI usage is spiky and unpredictable)
- Missing per-user, per-model, per-team cost attribution
- Alerts configured for monthly spend, not daily rate changes
- Agent loops and retry logic can 10x costs without human intervention

**Consequences:**
- Leadership loses confidence in AI ROI projections
- Emergency cost-cutting measures kill legitimate use cases
- Inability to identify wasteful patterns (which features, users, or models are expensive)
- Competitive analysis is impossible (can't tell if Provider A is actually cheaper than Provider B)
- Engineering argues with finance over "unpredictable" costs

**Prevention:**

1. **Real-time cost tracking, not monthly summaries:**
```typescript
// Track every request
async function callLLM(prompt: string, model: string, userId: string) {
  const startTime = Date.now();
  const response = await provider.generate(prompt, model);

  const cost = calculateCost({
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    model: model,
    duration: Date.now() - startTime,
  });

  await analytics.trackCost({
    userId,
    teamId: user.teamId,
    model,
    cost,
    timestamp: new Date(),
  });

  return response;
}
```

2. **Predictive alerting, not reactive:**
- Alert when daily spend exceeds 3x the 7-day moving average
- Alert when a single user's cost exceeds their tier limit
- Alert when token usage suggests a runaway loop (>100k tokens in <1 minute)

3. **Multi-dimensional cost attribution:**
Track spending by:
- User (who is expensive?)
- Model (which model is costly?)
- Feature (chat vs. Sidekiqs vs. image generation)
- Team (in multi-tenant setups)
- Time (when do spikes occur?)

4. **Granular rate limiting:**
```typescript
// BAD: Global rate limit only
if (requestsPerMinute > 100) throw new RateLimitError();

// GOOD: Multi-dimensional limits
const limits = {
  requestsPerMinute: 60,
  tokensPerMinute: 100_000,
  costPerHour: 5.00, // dollars
  costPerDay: 50.00,
};

if (user.tokensThisMinute > limits.tokensPerMinute) {
  throw new TokenQuotaExceeded();
}
if (user.costToday > limits.costPerDay) {
  throw new DailyCostLimitReached();
}
```

5. **Gateway/orchestration layer for unified tracking:**
Use tools like Portkey, LiteLLM Gateway, or build custom middleware to track all provider calls in one place.

**Detection:**
- Sudden invoice spike with no explanation
- Users complain about rate limits despite "not using it much"
- Analytics show a single model accounts for 80% of spend but 20% of requests
- Weekend/overnight spending anomalies (agent loops, testing gone wrong)

**Phase mapping:**
- Phase 1 (Core Chat): Basic per-request cost logging
- Phase 2 (Multi-provider): Provider-normalized cost tracking, predictive alerts
- Phase 3 (Teams/Production): Per-team attribution, budget allocation, real-time dashboards

**Sources:**
- [AI Cost Crisis: AI Cost Sprawl Is Crashing Your Innovation](https://www.cloudzero.com/blog/ai-cost-crisis/)
- [AI Cost Control: Your Ultimate 2026 Guide](https://www.cake.ai/blog/ai-cost-management)
- [How are engineering leaders approaching 2026 AI tooling budgets?](https://getdx.com/blog/how-are-engineering-leaders-approaching-2026-ai-tooling-budget/)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or suboptimal UX but are fixable without rewrites.

### Pitfall 6: Using WebSockets for Unidirectional Streaming

**What goes wrong:**
Teams implement WebSockets for AI chat streaming because "real-time communication = WebSockets." They discover memory consumption scales linearly with concurrent users (70 KiB per connection), hitting 6.68 GiB at 100k users. WebSocket connections sit idle 99% of the time (waiting for user input), yet consume resources continuously. Debugging is harder, caching doesn't work, and infrastructure costs balloon.

**Why it happens:**
- WebSockets are the "default" for real-time features in many developers' mental models
- Assumption that bidirectional is always better than unidirectional
- Lack of awareness that AI streaming (server-to-client) is fundamentally unidirectional
- Framework/library defaults (e.g., Socket.io examples) bias toward WebSockets

**Prevention:**

1. **Use Server-Sent Events (SSE) for AI streaming:**
- Unidirectional (server-to-client) matches AI chat pattern perfectly
- Built on HTTP (easier to cache, debug, secure, scale)
- Automatic reconnection
- Lower memory footprint (stateless HTTP connections)
- HTTP/2 multiplexing allows many SSE streams over one connection

2. **Reserve WebSockets for truly bidirectional cases:**
Use WebSockets only if:
- You need client-to-server push beyond initial request (e.g., interrupting mid-response, live cursor tracking)
- Binary data transfer is critical
- Sub-10ms latency requirements

3. **Implementation comparison:**
```typescript
// SSE: Simple and efficient for AI streaming
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
  appendChunk(JSON.parse(event.data));
};

// WebSocket: Unnecessary complexity for unidirectional
const socket = new WebSocket('wss://api.example.com/chat');
socket.onmessage = (event) => {
  appendChunk(JSON.parse(event.data));
};
// Now you need heartbeat pings, manual reconnection, etc.
```

**Detection:**
- High memory usage correlating with concurrent user count
- Infrastructure costs scale unexpectedly with user growth
- Difficulty adding caching layers (WebSockets bypass HTTP caches)
- Debugging requires specialized tools (Wireshark) vs. browser DevTools

**Phase mapping:**
- Phase 1 (Core Chat): Choose SSE from the start
- Phase 2 (Production Hardening): If WebSockets already implemented, evaluate migration cost vs. scaling cost

**Sources:**
- [Go with SSE for Your AI Chat App](https://www.sniki.dev/posts/sse-vs-websockets-for-ai-chat/)
- [WebSockets vs Server-Sent Events](https://ably.com/blog/websockets-vs-sse)

---

### Pitfall 7: Naive Context Window Management

**What goes wrong:**
Applications send the entire conversation history on every request. At 20 messages (10 turns), context exceeds 100k tokens. Model latency degrades from 2s to 15s. Costs balloon (paying for the same message 50 times as it's included in every subsequent request). Eventually, conversations hit context limits and crash with "maximum context length exceeded" errors.

**Why it happens:**
- Assumption that "more context = better responses"
- Lack of awareness that providers charge for all input tokens, including repeated history
- Not monitoring cumulative token usage per conversation
- Treating context windows as infinite (Gemini 2.5M tokens!) without considering cost/latency tradeoffs

**Prevention:**

1. **Implement conversation summarization:**
```typescript
async function prepareContext(messages: Message[]) {
  const recentMessages = messages.slice(-10); // Last 5 turns
  const olderMessages = messages.slice(0, -10);

  let context = [];

  if (olderMessages.length > 5) {
    // Summarize older messages
    const summary = await summarizeConversation(olderMessages);
    context.push({ role: 'system', content: `Previous conversation summary: ${summary}` });
  } else {
    context.push(...olderMessages);
  }

  context.push(...recentMessages);

  return context;
}
```

2. **Sliding window with semantic importance:**
Keep full recent history (last 5-10 turns) + summaries of older content + high-importance messages (user-pinned, contains key decisions).

3. **Monitor token usage per conversation:**
Alert when a conversation exceeds 80% of model's context window.

4. **Provide "Start new conversation" prompts:**
When conversations grow long, suggest starting fresh with context from the old thread.

**Detection:**
- Latency increases proportionally to conversation length
- Cost per message grows over time within a single conversation
- "Context length exceeded" errors in production
- Users complain "AI responses get slower over time"

**Phase mapping:**
- Phase 1 (Core Chat): Simple message limits (e.g., last 20 messages only)
- Phase 2 (Production): Summarization, sliding window
- Phase 3 (Advanced): Semantic importance ranking, vector-based memory

**Sources:**
- [Context Window Management: Strategies for Long-Context AI Agents and Chatbots](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
- [Best LLMs for Extended Context Windows in 2026](https://research.aimultiple.com/ai-context-window/)

---

### Pitfall 8: Inconsistent Multi-Provider Prompt Compatibility

**What goes wrong:**
Prompts optimized for GPT-4 perform poorly on Claude or Gemini. System prompts that work beautifully in one model fail in another. Applications hard-code prompt formats, then adding a new provider requires rewriting prompts. Users complain "Model X gives terrible responses" when the real issue is prompt incompatibility.

**Why it happens:**
- Models interpret instructions differently (OpenAI likes explicit, Claude prefers context, Gemini needs structured formats)
- Assuming prompts are model-agnostic
- Not testing prompts across all supported providers
- Hard-coding provider-specific quirks into application logic

**Prevention:**

1. **Provider-specific prompt templates:**
```typescript
const promptTemplates = {
  openai: {
    system: 'You are a helpful assistant. {instructions}',
    format: 'explicit',
  },
  anthropic: {
    system: '{instructions}\n\nProvide thoughtful, detailed responses.',
    format: 'conversational',
  },
  google: {
    system: 'Instructions: {instructions}\nOutput format: {format}',
    format: 'structured',
  },
};

function buildPrompt(provider: string, instructions: string) {
  const template = promptTemplates[provider];
  return template.system.replace('{instructions}', instructions);
}
```

2. **Test prompts across providers during development:**
Use tools like Latitude or prompt management platforms to compare outputs.

3. **Standardize on common capabilities:**
Avoid using provider-specific features (e.g., OpenAI's function calling syntax) directly. Use abstraction layers (LangChain, LiteLLM).

4. **Allow per-provider tuning in custom assistants:**
For "Sidekiqs," let power users specify provider-specific instructions if needed.

**Detection:**
- User feedback: "Model A is way better than Model B" (may be prompt issue, not model quality)
- Inconsistent response quality across providers
- High "regenerate" usage on specific providers
- A/B testing shows provider performance differs more than benchmarks suggest

**Phase mapping:**
- Phase 1 (Core Chat): Single provider, no compatibility concerns
- Phase 2 (Multi-provider): Provider-specific templates, testing across providers
- Phase 3 (Custom Assistants): Per-provider tuning options

**Sources:**
- [Guide to Multi-Model Prompt Design Best Practices](https://latitude-blog.ghost.io/blog/guide-to-multi-model-prompt-design-best-practices/)
- [Why 2026 Is the Year of Multi-Model Routing](https://medium.com/@MateCloud/why-2026-is-the-year-of-multi-model-routing-technical-challenges-and-system-design-2457dcdd2209)

---

### Pitfall 9: Missing or Inadequate Abort/Cancellation Handling

**What goes wrong:**
Users click "Stop generating" mid-response. The UI button disables and shows "Stopping..." but the backend continues processing for 30 more seconds, consuming tokens and API quota. The stream isn't properly closed, leading to memory leaks. Orphaned requests pile up, degrading server performance.

**Why it happens:**
- AbortController API is added to UI but not wired to backend
- Backend doesn't check for abort signals during processing
- Lack of cleanup logic for cancelled streams
- Assumption that "client disconnect = automatic cleanup" (not always true)

**Prevention:**

1. **Wire AbortController through the stack:**
```typescript
// Frontend
const abortController = new AbortController();

function stopGeneration() {
  abortController.abort();
}

fetch('/api/chat', {
  signal: abortController.signal,
  // ...
});

// Backend (Node.js example)
app.post('/api/chat', async (req, res) => {
  req.on('close', () => {
    // Client disconnected, stop processing
    abortController.abort();
  });

  const stream = await llm.generateStream(prompt, {
    signal: abortController.signal,
  });

  // Stream with abort checks
  for await (const chunk of stream) {
    if (abortController.signal.aborted) {
      stream.close();
      break;
    }
    res.write(chunk);
  }
});
```

2. **Implement cleanup in onAbort:**
```typescript
useChat({
  onAbort: async (message) => {
    await consumeStream(message.streamId); // Ensure stream is fully consumed
    cleanupResources(message.id);
  }
});
```

3. **Backend timeout policies:**
Even if the client doesn't abort, implement server-side timeouts (e.g., 60s max per request).

**Detection:**
- Memory leaks correlating with "Stop generating" usage
- High orphaned process count in server metrics
- Users report "Stop doesn't work" or "still charged for stopped messages"
- API provider shows higher request volume than app metrics indicate (orphaned requests)

**Phase mapping:**
- Phase 1 (Core Chat): Basic abort support
- Phase 2 (Production Hardening): Comprehensive cleanup, server-side consumption

**Sources:**
- [Advanced: Stopping Streams - AI SDK](https://ai-sdk.dev/docs/advanced/stopping-streams)
- [How to abort create chat completion streaming - OpenAI Community](https://community.openai.com/t/how-to-abort-create-chat-completion-streaming-i-use-nodejs-typescript/377319)

---

### Pitfall 10: Multi-Tenant Data Isolation Failures

**What goes wrong:**
Custom assistants (Sidekiqs) created by Team A appear in Team B's assistant list. Shared conversation threads leak between tenants. Fine-tuned models trained on Tenant A's data are accessible to Tenant B. Authorization checks are added at the API layer but not in the database queries, allowing SQL injection or query manipulation to bypass them.

**Why it happens:**
- Insufficient tenant ID propagation through the stack
- Trusting AI to maintain tenant boundaries (it won't)
- Shared Azure OpenAI resources without deployment-level isolation
- Missing row-level security (RLS) in database
- Assumption that application-layer auth is sufficient

**Prevention:**

1. **Tenant ID in every query:**
```typescript
// BAD: Global query
const assistants = await db.assistant.findMany({
  where: { isPublic: false }
});

// GOOD: Tenant-scoped query
const assistants = await db.assistant.findMany({
  where: {
    OR: [
      { teamId: user.teamId },
      { isPublic: true }
    ]
  }
});
```

2. **Row-level security in PostgreSQL:**
```sql
-- Enable RLS
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their team's assistants
CREATE POLICY tenant_isolation ON assistants
  USING (team_id = current_setting('app.current_team_id')::uuid);
```

3. **Separate Azure OpenAI deployments per tenant for fine-tuned models:**
Sharing a deployment doesn't provide security segmentation. Tenant A could access Tenant B's fine-tuned model.

4. **Make function calls tenant-aware:**
```typescript
// BAD: AI generates query, system executes blindly
const query = aiGeneratedSQL;
await db.execute(query); // Can access any tenant's data

// GOOD: Validate tenant ID in AI-generated queries
const query = aiGeneratedSQL;
if (!query.includes(`team_id = '${user.teamId}'`)) {
  throw new SecurityError('Query must be tenant-scoped');
}
await db.execute(query);
```

5. **Audit logging:**
Log all cross-tenant access attempts (even blocked ones) for security review.

**Detection:**
- Security audit reveals cross-tenant data access
- Users report seeing data they shouldn't have access to
- Penetration testing reveals tenant boundary bypass
- Logs show queries without tenant ID filters

**Phase mapping:**
- Phase 2 (Custom Assistants): Tenant isolation critical from first implementation
- Phase 3 (Teams): Row-level security, audit logging, separate model deployments

**Sources:**
- [Multi-tenant Architecture | AI in Production Guide](https://azure.github.io/AI-in-Production-Guide/chapters/chapter_13_building_for_everyone_multitenant_architecture)
- [Multitenancy and Azure OpenAI](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/service/openai)
- [Build a multi-tenant generative AI environment](https://aws.amazon.com/blogs/machine-learning/build-a-multi-tenant-generative-ai-environment-for-your-enterprise-on-aws/)

---

## Minor Pitfalls

Mistakes that cause annoyance or suboptimal UX but are quickly fixable.

### Pitfall 11: Poor Loading State Communication

**What goes wrong:**
Users see generic spinners or "Loading..." text for 10-60 seconds. They don't know if the AI is thinking, the request failed, or the app froze. Users refresh the page, cancelling their request. Support tickets: "Is the app broken?"

**Prevention:**
- Use progressive loading states: "Sending request..." → "Thinking..." → "Generating response..." → "Streaming response..."
- Show connection status indicators
- For long operations, add informative hints: "Planning steps...", "Analyzing context...", "Generating response (this may take a minute)..."
- Provide "Stop generating" button so users feel in control

**Sources:**
- [AI Loading States Pattern | UX Patterns for Developers](https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states)
- [UX for AI Chatbots: Complete Guide (2025)](https://www.parallelhq.com/blog/ux-ai-chatbots)

---

### Pitfall 12: No Partial Response Handling

**What goes wrong:**
AI response is truncated due to token limit (`finish_reason: "length"`) but the UI shows it as complete. Users don't know they're missing content. No "Continue" or "Regenerate with more tokens" option.

**Prevention:**
- Check `finish_reason` in API responses
- When `finish_reason === "length"`, show "Response truncated. [Continue generating]" button
- Implement automatic continuation for long responses

```typescript
const response = await provider.generate(prompt);

if (response.finish_reason === 'length') {
  // Response was cut off
  showContinueButton();
}
```

**Sources:**
- [How to continue the incomplete response of OpenAI API](https://www.educative.io/answers/how-to-continue-the-incomplete-response-of-openai-api)
- [Azure Open AI Chat Completion — Data Truncate/Incomplete Response](https://medium.com/@arpit1345/azure-open-ai-chat-completion-data-truncate-incomplete-partial-response-due-to-output-max-token-04813de3e796)

---

### Pitfall 13: Inefficient Message Persistence Timing

**What goes wrong:**
Every streaming chunk triggers a database write, causing 100-500 writes per message. Database gets hammered, latency increases, costs spike. Alternatively, messages are only persisted after completion, so browser refresh loses the entire conversation.

**Prevention:**
- Persist message on stream start with status "streaming"
- Update status to "complete" on finish (single write)
- For very long messages, batch intermediate updates (every 5 seconds or 1000 characters)
- Use optimistic local state with eventual consistency

```typescript
onStart: (messageId) => {
  saveMessage({ id: messageId, content: '', status: 'streaming' });
},
onChunk: (chunk) => {
  // Update local state only, no DB write
  appendToLocalState(chunk);
},
onFinish: (message) => {
  // Single DB write with full content
  updateMessage(message.id, { content: message.content, status: 'complete' });
}
```

**Sources:**
- [Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [Guidance on persisting messages - Vercel AI](https://github.com/vercel/ai/discussions/4845)

---

### Pitfall 14: No Message Editing/Regeneration UX

**What goes wrong:**
Users can't edit their prompts after sending. Can't regenerate AI responses they dislike. Dead-end conversations require starting over. UX feels rigid compared to ChatGPT/Claude.

**Prevention:**
- Add "Edit message" button to user messages
- Add "Regenerate" button to AI messages
- When editing, truncate conversation at that point and resend
- Show edited message indicator for transparency

```typescript
function editMessage(messageId: string, newContent: string) {
  const messageIndex = messages.findIndex(m => m.id === messageId);

  // Truncate conversation at edited message
  const truncatedMessages = messages.slice(0, messageIndex + 1);

  // Update message content
  truncatedMessages[messageIndex].content = newContent;

  // Regenerate response
  sendMessage(truncatedMessages);
}
```

**Sources:**
- [Editing a chat message | Cassidy AI](https://docs.cassidyai.com/en/articles/9171570-editing-a-chat-message)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Core Chat | Streaming disconnection without recovery | Implement `onAbort` from day one; test on mobile networks |
| Phase 1: Core Chat | Missing rollback in optimistic UI | Use React 19's `useOptimistic` or manual rollback logic |
| Phase 2: Multi-Provider | Token counting inconsistencies | Provider-specific tokenizers; track actual vs. estimated |
| Phase 2: Multi-Provider | Prompt incompatibility across models | Provider-specific templates; test all providers |
| Phase 2: Custom Assistants | Prompt injection (unfixable) | Design for containment; output filtering > input detection |
| Phase 3: Teams/Multi-Tenant | Data isolation failures | Row-level security; tenant ID in every query |
| Phase 3: Teams/Multi-Tenant | Cost explosion without attribution | Per-team cost tracking; real-time alerts |
| Ongoing: Production | Rate limit 429 errors | Multi-dimensional rate limiting (requests, tokens, cost) |
| Ongoing: Production | Context window exhaustion | Conversation summarization; sliding window |
| Ongoing: Security | New jailbreak techniques | Continuous adversarial testing; "assume breach" architecture |

---

## Validation Checklist

Before moving to production, validate:

- [ ] **Streaming reliability:** Tested streaming on poor network conditions (throttled connection, packet loss)
- [ ] **Abort handling:** "Stop generating" button actually stops processing and cleans up resources
- [ ] **Optimistic UI:** Network failures correctly rollback UI state and show errors
- [ ] **Token tracking:** Actual provider-reported tokens match your estimates within 15%
- [ ] **Cost monitoring:** Real-time alerts configured; daily spend tracked per user/team/model
- [ ] **Prompt injection:** Output filtering implemented; privileged operations require human approval
- [ ] **Multi-tenant isolation:** Penetration test confirmed tenant boundaries are enforced
- [ ] **Context window:** Conversations exceeding 80% of context limit trigger summarization
- [ ] **Rate limiting:** Token-based limits (not just request-based) implemented
- [ ] **Partial responses:** `finish_reason === "length"` detected and handled

---

## Research Methodology & Confidence

**Sources used:**
- 40+ articles from 2025-2026 (production systems, research papers, vendor documentation)
- Official documentation (OpenAI, Anthropic, AWS, Microsoft, Vercel AI SDK)
- Security research (OWASP, CyberArk, VentureBeat)
- Post-mortems and practitioner blogs (Evil Martians, Simon Willison)

**Confidence levels:**
- **Streaming pitfalls:** HIGH (widespread documented failures in production)
- **Token management:** HIGH (billing data and orchestration platform reports)
- **Security (prompt injection):** HIGH (OWASP guidelines, OpenAI/NCSC acknowledgments)
- **Multi-tenant:** MEDIUM-HIGH (Azure/AWS best practices, less public post-mortem data)
- **UX patterns:** MEDIUM (evolving best practices, some sources are recent)

**Known gaps:**
- Limited public data on custom assistant (GPTs/Gems/Sidekiqs) specific failures
- Stripe payment integration pitfalls not researched (out of scope for this doc)
- Team-specific pitfalls assumed from multi-tenant patterns (may need validation)

---

## Conclusion: The Containment Mindset

The most important meta-lesson from 2026 AI chat research: **Perfect prevention is impossible. Design for graceful failure.**

- Streams will disconnect → Implement recovery, not just happy-path handling
- Prompts will be injected → Limit damage, don't trust input filters alone
- Costs will spike → Alert in real-time, not monthly
- State will diverge → Rollback must be as robust as optimistic updates
- Context will overflow → Summarize proactively, don't wait for errors

Teams that succeed treat AI chat as a hostile, unreliable, expensive component that needs constant supervision—and design accordingly.
