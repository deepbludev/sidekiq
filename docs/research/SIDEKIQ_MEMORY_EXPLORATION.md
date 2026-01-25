# Sidekiq Memory: Deep Exploration

**Date:** 2026-01-23
**Status:** Exploration / RFC

---

## The Core Idea

**Each Sidekiq learns and remembers independently.**

Unlike ChatGPT/Claude where memory is global to the user, Sidekiq Memory is scoped to each custom assistant. Your "Sales Coach" Sidekiq remembers your product, objections you've faced, and deals you've won. Your "Code Reviewer" Sidekiq learns your team's conventions and past decisions.

This creates:
1. **Switching costs** - Months of accumulated knowledge can't be exported
2. **Increasing value** - The more you use a Sidekiq, the smarter it gets
3. **Differentiation** - No competitor offers per-assistant memory

---

## Competitive Landscape

### How Competitors Handle Memory

| Product         | Memory Scope   | Implementation                    | Limitations                                  |
| --------------- | -------------- | --------------------------------- | -------------------------------------------- |
| **ChatGPT**     | Global to user | Saved memories + chat history RAG | One memory for everything, no separation     |
| **Claude**      | Project-based  | Markdown files (CLAUDE.md)        | Projects are manual, no per-assistant memory |
| **Custom GPTs** | None           | Only uploaded files, no learning  | Static knowledge, doesn't improve            |
| **Poe Bots**    | None           | System prompt only                | No memory at all                             |
| **T3.chat**     | None           | Local-first storage               | Chat history only, no extracted knowledge    |

### The Gap

**No one offers memory that:**
- Is scoped to individual custom assistants
- Learns automatically from conversations
- Can be shared with team members
- Persists knowledge separately from raw chat history

---

## Sidekiq Memory Architecture

### Memory Types

```
┌─────────────────────────────────────────────────────────────┐
│                     SIDEKIQ MEMORY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  EXPLICIT FACTS │  │  LEARNED FACTS  │  │  KNOWLEDGE  │ │
│  │                 │  │                 │  │    BASE     │ │
│  │ User tells:     │  │ Extracted from  │  │             │ │
│  │ "Remember I     │  │ conversations:  │  │ Uploaded    │ │
│  │ prefer Python"  │  │ "User works at  │  │ documents,  │ │
│  │                 │  │ Acme Corp"      │  │ URLs, files │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                   │                   │         │
│           └───────────────────┼───────────────────┘         │
│                               ▼                             │
│                    ┌─────────────────────┐                  │
│                    │   CONTEXT BUILDER   │                  │
│                    │                     │                  │
│                    │ Retrieves relevant  │                  │
│                    │ memories for each   │                  │
│                    │ conversation turn   │                  │
│                    └─────────────────────┘                  │
│                               │                             │
│                               ▼                             │
│                    ┌─────────────────────┐                  │
│                    │    LLM + CONTEXT    │                  │
│                    └─────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Three Memory Layers

#### Layer 1: Explicit Facts (User-Controlled)
- User explicitly tells Sidekiq to remember something
- "Remember that our API uses snake_case"
- "Remember I'm allergic to peanuts" (for a recipe Sidekiq)
- Stored as structured key-value pairs
- User can view, edit, delete anytime

#### Layer 2: Learned Facts (Auto-Extracted)
- Sidekiq automatically extracts facts from conversations
- Uses LLM to identify memorable information
- Examples:
  - "User prefers TypeScript over JavaScript"
  - "User works at Acme Corp on B2B SaaS product"
  - "User's tech stack: Next.js, PostgreSQL, tRPC"
- Requires user approval before persisting (optional setting)

#### Layer 3: Knowledge Base (Documents)
- Uploaded files (PDF, MD, TXT, code files)
- URLs that are scraped and indexed
- Team wikis, documentation, specs
- Chunked and embedded in vector database

---

## Technical Implementation Options

### Option A: Simple Structured Memory (MVP Recommended)

**How it works:**
- Store memories as JSON objects in PostgreSQL (JSONB column)
- No vector database needed initially
- Retrieve ALL memories for a Sidekiq (they're small)
- Inject into system prompt

**Schema:**
```sql
CREATE TABLE sidekiq_memories (
  id TEXT PRIMARY KEY,
  sidekiq_id TEXT REFERENCES sidekiqs(id),
  type TEXT CHECK (type IN ('explicit', 'learned')),
  content TEXT NOT NULL,           -- The fact itself
  source_message_id TEXT,          -- Where it came from
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Example records:
-- { type: 'explicit', content: 'User prefers Python over JavaScript' }
-- { type: 'learned', content: 'User works at Acme Corp, building B2B SaaS' }
```

**Pros:**
- Simple to implement (1-2 days)
- No additional infrastructure
- Easy to debug and inspect
- Users can see exactly what's stored

**Cons:**
- Doesn't scale to thousands of memories
- No semantic search (exact match only)
- Limited to ~50-100 memories per Sidekiq

**Best for:** MVP, validating the concept

---

### Option B: Vector Database + RAG

**How it works:**
- Embed memories using OpenAI/Voyage embeddings
- Store in vector database (pgvector, Pinecone, Qdrant)
- On each query, retrieve top-K relevant memories
- Inject retrieved context into prompt

**Schema (with pgvector):**
```sql
CREATE EXTENSION vector;

CREATE TABLE sidekiq_memories (
  id TEXT PRIMARY KEY,
  sidekiq_id TEXT REFERENCES sidekiqs(id),
  type TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI ada-002 dimension
  metadata JSONB,
  created_at TIMESTAMP
);

CREATE INDEX ON sidekiq_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Retrieval flow:**
```
User query: "How should I handle authentication?"
    │
    ▼
Embed query → [0.12, -0.34, 0.56, ...]
    │
    ▼
Vector search: SELECT * FROM sidekiq_memories
               WHERE sidekiq_id = ?
               ORDER BY embedding <=> query_embedding
               LIMIT 10
    │
    ▼
Inject into system prompt:
"Relevant context from previous conversations:
 - User's app uses Better Auth with GitHub OAuth
 - User prefers session-based auth over JWT
 - User's stack: Next.js, tRPC, PostgreSQL"
```

**Pros:**
- Scales to thousands of memories
- Semantic search (finds conceptually related memories)
- Only injects relevant context (saves tokens)

**Cons:**
- More complex infrastructure
- Embedding costs (~$0.0001 per memory)
- Harder to debug

**Best for:** Production, scaling beyond MVP

---

### Option C: Hybrid (Claude's Approach)

**How it works:**
- Store memories as Markdown files (per Sidekiq)
- Simple append-only log with sections
- Use LLM to summarize/compress periodically
- Full-text search + optional embeddings

**File structure:**
```
sidekiqs/
  {sidekiq_id}/
    MEMORY.md          # Main memory file
    knowledge/
      uploaded-doc.pdf
      api-spec.md
```

**MEMORY.md format:**
```markdown
# Sales Coach Memory

## User Context
- Works at Acme Corp (B2B SaaS)
- Sells to mid-market companies (50-500 employees)
- Main competitors: Competitor A, Competitor B

## Product Knowledge
- Main product: Widget Pro ($99/mo)
- Key differentiators: Speed, integrations, support
- Common objections: Price, switching costs

## Past Interactions
- 2026-01-15: Discussed handling "too expensive" objection
- 2026-01-18: Practiced demo for Enterprise prospect
- 2026-01-22: Reviewed lost deal - needed SSO

## Learned Preferences
- Prefers concise bullet points
- Likes role-play practice scenarios
- Responds well to sports analogies
```

**Pros:**
- Human-readable and editable
- Easy to export/backup
- No vector DB needed
- Transparent (users see exactly what's stored)

**Cons:**
- Manual structure management
- Full-text search less powerful than semantic
- Needs LLM for compression/organization

**Best for:** Privacy-focused users, simpler implementation

---

## Recommendation: Phased Approach

### Phase 1: Explicit Memory Only (MVP)
**Scope:** 1-2 weeks

Users can explicitly tell a Sidekiq to remember things:
- "Remember that I prefer TypeScript"
- "Remember our API endpoint is api.acme.com"
- "Forget that I work at Acme" (deletion)

**Implementation:**
- Add `sidekiq_memories` table (simple JSONB, no vectors)
- Add memory to system prompt
- UI: Memory panel in Sidekiq settings
- Limit: 50 memories per Sidekiq

**Why start here:**
- Validates demand for the feature
- Simple to build and debug
- No ML/embedding complexity
- Users have full control

---

### Phase 2: Auto-Learned Facts
**Scope:** 2-3 weeks

After each conversation, extract potential memories:
- Use cheap model (GPT-4o-mini) to identify facts
- Present to user: "Should I remember these?"
- User approves/rejects each fact

**Implementation:**
```typescript
// After conversation ends
const facts = await extractFacts(conversation);
// Returns: ["User works at Acme Corp", "Prefers async/await over .then()"]

// Show approval UI
<MemoryApprovalDialog facts={facts} onApprove={saveFacts} />
```

**Prompt for extraction:**
```
Analyze this conversation and extract facts worth remembering
about the user for future conversations. Focus on:
- Preferences (coding style, tools, approaches)
- Context (company, role, project details)
- Decisions made
- Corrections given

Return as JSON array of strings. Only include clear, useful facts.
Exclude: sensitive info, temporary details, obvious things.

Conversation:
{messages}
```

**Why this phase:**
- Automates memory creation
- Still gives user control (approval)
- Uses cheap models (low cost)

---

### Phase 3: Semantic Retrieval (Vector DB)
**Scope:** 2-3 weeks

Move to vector-based retrieval:
- Embed all memories with OpenAI embeddings
- Use pgvector (already using PostgreSQL)
- Retrieve top-10 relevant memories per query
- Scale to 1000+ memories per Sidekiq

**Why this phase:**
- Enables knowledge base (uploaded docs)
- Handles scale
- Better relevance

---

### Phase 4: Team Memory
**Scope:** 2-3 weeks

Memory sharing across team:
- Sidekiq memories visible to team
- Team members can add/edit memories
- Audit log of memory changes
- Permission levels (view/edit)

**Why this matters for MOAT:**
- Team shared knowledge = high switching costs
- Onboarding new team members faster
- Institutional knowledge persists

---

## UX Design

### Memory Panel (Sidekiq Settings)

```
┌─────────────────────────────────────────────────────────────┐
│  Sales Coach                                    [Settings]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Memory                                        [+ Add]      │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📌 User Context                                     │   │
│  │    • Works at Acme Corp (B2B SaaS)                  │   │
│  │    • Sells to mid-market (50-500 employees)     [×] │   │
│  │    • Main competitors: Competitor A, B          [×] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧠 Learned (auto-extracted)                         │   │
│  │    • Prefers bullet points over paragraphs     [×]  │   │
│  │    • Responds well to sports analogies         [×]  │   │
│  │    • Likes role-play scenarios                 [×]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📄 Knowledge Base                          [Upload] │   │
│  │    • product-spec.pdf (2.3 MB)                 [×]  │   │
│  │    • competitor-analysis.md                    [×]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Memory Usage: 23/50 facts • 2 documents                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### In-Chat Memory Commands

```
User: Remember that our pricing is $99/mo for Pro, $299/mo for Enterprise

Sidekiq: Got it! I'll remember:
         📌 "Pricing: Pro $99/mo, Enterprise $299/mo"

         [Undo]
```

```
User: What do you know about me?

Sidekiq: Here's what I remember about you:

         📌 User Context
         • Works at Acme Corp (B2B SaaS)
         • Role: Sales Lead

         🧠 Learned Preferences
         • Prefers concise bullet points
         • Likes sports analogies

         📄 Knowledge Base
         • product-spec.pdf
         • competitor-analysis.md

         Want me to forget anything? Just say "forget [fact]"
```

### Memory Approval Dialog (Phase 2)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🧠 I noticed some things worth remembering                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ User's company uses Next.js 15 with App Router   │   │
│  │ ☑ Prefers tRPC over REST for internal APIs         │   │
│  │ ☐ Currently working on authentication feature      │   │
│  │ ☑ Team uses conventional commits                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Save Selected]              [Don't Save]    [Always Ask]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Privacy & Security Considerations

### User Control Principles

1. **Transparency** - Users see all memories, no hidden data
2. **Consent** - Learned memories require approval (configurable)
3. **Deletion** - "Forget" command works immediately
4. **Export** - Users can export all memories as JSON/Markdown
5. **Incognito** - Chat without memory option

### Team Privacy

- Personal Sidekiqs: Only creator sees memories
- Team Sidekiqs: All team members see memories
- Memory audit log: Who added/edited what
- Sensitive data warning: Flag potential PII

### Data Storage

- Memories stored in same PostgreSQL as other data
- No third-party access (unlike some RAG services)
- Encryption at rest (standard PostgreSQL)
- Per-Sidekiq isolation (no cross-contamination)

---

## Cost Analysis

### Phase 1 (Explicit Memory)
- **Infrastructure:** $0 (uses existing PostgreSQL)
- **Per-user cost:** $0

### Phase 2 (Auto-Learned)
- **Extraction:** ~$0.001 per conversation (GPT-4o-mini)
- **Per-user cost:** ~$0.03/month (30 conversations)

### Phase 3 (Vector DB)
- **Embeddings:** $0.0001 per memory (ada-002)
- **pgvector:** $0 (PostgreSQL extension)
- **Per-user cost:** ~$0.01/month (100 memories)

### Total estimated cost: $0.05/user/month
Negligible compared to LLM inference costs.

---

## Success Metrics

### Adoption Metrics
| Metric                          | Target (3 months) |
| ------------------------------- | ----------------- |
| % Sidekiqs with memories        | > 40%             |
| Avg memories per active Sidekiq | > 10              |
| Memory approval rate (Phase 2)  | > 60%             |

### Retention Impact
| Metric                         | Target            |
| ------------------------------ | ----------------- |
| 30-day retention (with memory) | > 50%             |
| 30-day retention (without)     | baseline          |
| Delta                          | > 15% improvement |

### Engagement
| Metric                               | Target                  |
| ------------------------------------ | ----------------------- |
| Messages per session (with memory)   | > 20% increase          |
| "What do you know about me?" queries | > 10% of users          |
| Memory deletion rate                 | < 20% (trust indicator) |

---

## Risks & Mitigations

| Risk                   | Likelihood | Impact | Mitigation                                      |
| ---------------------- | ---------- | ------ | ----------------------------------------------- |
| Users don't use memory | Medium     | High   | Make it automatic (Phase 2), show value upfront |
| Memory becomes stale   | Medium     | Medium | Periodic review prompts, decay old memories     |
| Privacy concerns       | Medium     | High   | Transparent UI, easy deletion, incognito mode   |
| Wrong facts extracted  | Medium     | Medium | Approval flow, easy correction                  |
| Performance impact     | Low        | Medium | Limit memories, optimize retrieval              |
| Storage costs scale    | Low        | Low    | Summarize old memories, set limits              |

---

## Open Questions

1. **Should memories sync across models?**
   - If user switches from Claude to GPT-4, should memories transfer?
   - Recommendation: Yes, memories are model-agnostic

2. **Memory limits?**
   - Free tier: 20 memories per Sidekiq, 3 Sidekiqs max
   - Pro: 100 memories per Sidekiq, unlimited Sidekiqs
   - Team: 500 memories per Sidekiq (shared pool)

3. **Memory conflicts in teams?**
   - What if two users add contradictory facts?
   - Option: Latest wins with audit log
   - Option: Flag conflicts for resolution

4. **Memory decay?**
   - Should old memories expire?
   - Recommendation: No auto-expiry, but show "last used" date
   - Prompt user to review stale memories periodically

5. **Cross-Sidekiq memory?**
   - Should user preferences apply globally?
   - Recommendation: Have both Sidekiq-specific AND user-global preferences
   - Global: "I prefer bullet points"
   - Sidekiq: "Our product costs $99/mo"

---

## Next Steps

1. **Validate demand** - Add a "coming soon: memory" badge, measure clicks
2. **User interviews** - Ask 5-10 beta users about memory needs
3. **Build Phase 1** - Explicit memory MVP (1-2 weeks)
4. **Measure adoption** - Track memory creation and usage
5. **Iterate** - Based on feedback, decide Phase 2 priority

---

## Sources

- [OpenAI - Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)
- [ChatGPT Memory Deep Dive](https://medium.com/aimonks/inside-chatgpts-memory-how-the-most-sophisticated-memory-system-in-ai-really-works-f2b3f32d86b3)
- [Claude Memory Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- [Anthropic Memory Announcement](https://www.macrumors.com/2025/10/23/anthropic-automatic-memory-claude/)
- [RAG vs Fine-Tuning Guide](https://www.datacamp.com/tutorial/rag-vs-fine-tuning)
- [Vector Stores in LLM Memory](https://www.freecodecamp.org/news/how-ai-agents-remember-things-vector-stores-in-llm-memory/)
- [IBM - AI Agent Memory](https://www.ibm.com/think/topics/ai-agent-memory)
