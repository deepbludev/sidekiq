# Sidekiq Switching Feature: Market Research

**Date:** 2026-01-25
**Feature:** Mid-Conversation Sidekiq Switching for Manual Workflows
**Status:** Research Phase

---

## Executive Summary

The ability to switch Sidekiqs (custom AI assistants) mid-conversation represents a **high-value, underexploited feature** in the AI chat market. While ChatGPT has introduced "@mentions" for GPTs and multi-model platforms allow model switching, **no competitor effectively combines custom assistant switching with context preservation for workflow chaining**.

**Key Findings:**
- ChatGPT's @mention feature for GPTs is described as "probably one of the most underrated and underused features" because most users haven't built multiple custom GPTs
- Multi-model platforms (T3.chat, Poe, TypingMind) focus on model switching, not persona/assistant switching
- The content creation workflow use case (brainstorm → write → edit) is a proven pattern that users actively seek
- AI agent market reached $7.6B in 2025, growing at 49.6% CAGR through 2033

**Recommendation:** Implement this feature as a **differentiator** that leverages Sidekiq's existing custom assistant infrastructure while competitors focus on model aggregation.

---

## 1. Feature Overview

### Core Concept

Enable users to switch between different Sidekiqs within the same conversation thread, preserving full context. This creates **manual workflow chaining** where specialized AI personas collaborate in sequence.

### Example Workflow

```
User starts conversation with: "Blog Post Idea Generator" Sidekiq
├── Generates 5 blog post ideas about AI productivity
├── User selects best idea
│
User switches to: "Blog Post Writer" Sidekiq (same thread)
├── Writer Sidekiq has full context of brainstorm
├── Drafts complete blog post based on selected idea
│
User switches to: "Editor & Polish" Sidekiq (same thread)
├── Editor sees full draft + original brainstorm
└── Provides polished, publication-ready version
```

### Key Differentiators from Competitors

| Feature                      | ChatGPT       | Poe      | T3.chat | TypingMind | **Sidekiq**  |
| ---------------------------- | ------------- | -------- | ------- | ---------- | ------------ |
| Model switching              | ✓             | ✓        | ✓       | ✓          | ✓            |
| Custom assistants            | ✓ (GPTs)      | ✓ (Bots) | ✗       | ✗          | ✓ (Sidekiqs) |
| Assistant switching mid-chat | ✓ (@mentions) | Limited  | ✗       | ✗          | **Proposed** |
| Context preservation         | ✓             | Varies   | ✓       | ✓          | **Full**     |
| Team-shared assistants       | ✗             | ✗        | ✗       | Limited    | ✓            |
| **Workflow chaining focus**  | ✗             | ✗        | ✗       | ✗          | **Proposed** |

---

## 2. Competitive Landscape

### ChatGPT's @ Mentions Feature

OpenAI introduced the ability to "@mention" different GPTs within a single conversation. Key characteristics:

- **How it works:** Type `@` to see available GPTs, select one, and that GPT responds with full conversation context
- **Availability:** Plus, Teams, and Enterprise users only
- **Limitation:** Requires users to have built or saved multiple custom GPTs
- **Market perception:** "Probably one of the most underrated and underused features" due to low GPT creation rates

**Opportunity:** Most users don't create multiple GPTs. Sidekiq can differentiate by providing **pre-built workflow templates** with complementary Sidekiqs.

### Multi-Model AI Aggregators

| Platform       | Mid-Chat Switching | Context Preservation | Custom Personas |
| -------------- | ------------------ | -------------------- | --------------- |
| **ChatGot**    | ✓ (@system)        | Full context         | Limited         |
| **TypingMind** | ✓ (model only)     | Full context         | Via prompts     |
| **Poe**        | ✓ (model/bot)      | Varies               | Custom bots     |
| **T3.chat**    | ✓ (model only)     | Full context         | ✗               |

**Key Insight:** These platforms focus on **model comparison** (ask GPT-4 vs Claude the same question), not **workflow chaining** (use different specialized personas in sequence).

### Enterprise/Workflow Platforms

More sophisticated workflow tools exist but target different markets:

- **Adobe Project Moonlight:** Orchestrates multiple Adobe AI assistants (Photoshop, Premiere, etc.)
- **LangChain/LangGraph:** Developer framework for multi-agent workflows
- **AutoGen/CrewAI:** Open-source multi-agent orchestration frameworks
- **n8n/Flowise:** Low-code visual workflow builders

**Gap:** Consumer/prosumer tools don't offer the sophisticated workflow chaining that enterprise tools provide. Sidekiq can bridge this gap with a user-friendly implementation.

### Sources
- [TeamAI - Switching Between Multiple AI Agents](https://help.teamai.com/en/articles/9596973-switching-between-multiple-ai-agents-gpts-in-same-chat)
- [GrowthPath - Chain Custom GPTs](https://www.growthpath.net/chain-custom-gpts-transform-your-ai-workflow/)
- [TypingMind - Multi-Model Responses](https://docs.typingmind.com/manage-and-connect-ai-models/activate-multi-model-responses)
- [n8n - AI Agent Orchestration](https://blog.n8n.io/ai-agent-orchestration-frameworks/)
- [Adobe - Project Moonlight](https://blog.adobe.com/en/publish/2025/10/28/our-view-agentic-ai-assistants-that-work-you-in-your-favorite-apps)

---

## 3. User Needs & Use Cases

### Primary Use Cases

#### 1. Content Creation Pipeline (High Demand)
```
Ideation Sidekiq → Writer Sidekiq → Editor Sidekiq → SEO Optimizer Sidekiq
```
- **User pain point:** Currently requires copy-pasting between different tools/chats
- **Market validation:** 90%+ of marketers increasing content investment in 2025 (HubSpot)
- **Value proposition:** Single thread, full context, specialized expertise at each stage

#### 2. Development Workflow
```
Architect Sidekiq → Coder Sidekiq → Code Reviewer Sidekiq → Documentation Sidekiq
```
- **User pain point:** Different AI personas excel at different coding tasks
- **Market validation:** Developer tools market growing rapidly
- **Value proposition:** Leverage specialized prompts without context loss

#### 3. Research & Analysis
```
Research Sidekiq → Analyst Sidekiq → Report Writer Sidekiq → Executive Summary Sidekiq
```
- **User pain point:** Research requires different thinking modes
- **Value proposition:** Build comprehensive reports with specialized expertise

#### 4. Creative Projects
```
Brainstorm Sidekiq → Storyteller Sidekiq → Dialogue Writer Sidekiq → Editor Sidekiq
```
- **User feedback:** "Custom GPTs help me brainstorm and refine content, making my writing more impactful"
- **Value proposition:** Different creative perspectives in one thread

### User Feedback & Pain Points

From community research:

| Pain Point                                                | Evidence                    | Sidekiq Solution             |
| --------------------------------------------------------- | --------------------------- | ---------------------------- |
| "Switching models mid chat creates a new chat instead"    | OpenAI Community bug report | Seamless in-thread switching |
| "Need GPT-4 for complex tasks, GPT-3.5 for quick queries" | GitHub feature request      | Model + persona flexibility  |
| "Copy-pasting context between assistants is tedious"      | Multiple forum discussions  | Full context preservation    |
| "I need different AI personalities for different tasks"   | Reddit discussions          | Sidekiq specialization       |

### User Workflow Pattern

Research shows the most effective AI writing workflows are iterative:

> "The creator-AI relationship is rarely a simple handoff. The most effective workflows tend to be iterative: the creator provides direction, the AI generates options, the human refines the direction, and so on."
> — Alitu (AI Content Creation Research)

**Implication:** Sidekiq switching enables this iterative loop with different specialized assistants, matching how users naturally work.

### Sources
- [OpenAI Community - Model Switching Bug](https://community.openai.com/t/chat-gpt-plus-switching-model-mid-chat-creates-a-new-chat-instead/931963)
- [OpenAI Community - Model Switching Feature Request](https://community.openai.com/t/unable-to-change-model-mid-conversation-for-chats-in-folders/1078153)
- [Medium - Creative Workflow with Custom GPTs](https://greenzeta.medium.com/optimizing-my-creative-workflow-with-custom-gpt-assistants-cd90efa503a6)
- [Alitu - AI Content Creation](https://alitu.com/creator/workflow/ai-content-creation/)
- [Sintra - AI Writing Workflows](https://sintra.ai/blog/how-to-use-ai-for-writing)

---

## 4. Technical Considerations

### Context Preservation Challenges

Mid-conversation switching requires careful handling of:

#### 1. Context Window Management
- LLMs have token limits; long conversations may exceed capacity
- **Solution:** Anthropic's approach uses "hierarchical summarization" — compress older segments while preserving recent exchanges verbatim
- **Implementation note:** Each Sidekiq may need to see a summarized context + recent messages

#### 2. System Prompt Switching
- Each Sidekiq has different system prompts/instructions
- **Challenge:** New Sidekiq needs to understand it's entering mid-conversation
- **Solution:** Inject transition context: "You are now assisting in an ongoing conversation. Previous assistant was [X], user has switched to you for [Y]"

#### 3. State Management
> "The conversation state should be managed by a central component separate from the models themselves. This way, when you switch models, you can pass the full conversation history to the new model."
> — Arsturn (AI Chatbot Best Practices)

#### 4. Token Cost Implications
- Switching Sidekiqs means potentially re-sending full context
- **Consideration:** May need to summarize for cost efficiency
- **User impact:** Should be transparent about token usage when switching

### Implementation Patterns

Based on industry research:

| Pattern               | Description                                    | Pros             | Cons                 |
| --------------------- | ---------------------------------------------- | ---------------- | -------------------- |
| **Full Context Pass** | Send entire chat history to new Sidekiq        | Complete context | High token cost      |
| **Summary + Recent**  | Send summary + last N messages                 | Cost efficient   | Some context loss    |
| **Sliding Window**    | Rolling window of recent messages              | Predictable cost | Loses early context  |
| **Hybrid**            | Full context with auto-summarization at limits | Best of both     | Complex to implement |

**Recommendation:** Start with **Full Context Pass** for MVP, implement **Hybrid** for production.

### UX Patterns from Competitors

#### The "@" Mention System (ChatGPT)
- User types `@` to see available GPTs
- Inline switching, no page reload
- Clear visual indicator of which GPT is responding
- **Pros:** Fast, intuitive, keyboard-driven
- **Cons:** Requires knowing which GPT you want

#### Dropdown Selector (TypingMind)
- Persistent dropdown in chat header
- Switch models without interrupting flow
- **Pros:** Always visible, discoverable
- **Cons:** Takes UI space

#### Chat Header Indicator (T3.chat)
- Shows current model at top of chat
- Click to open model picker
- **Pros:** Clean, minimal
- **Cons:** Less discoverable for switching

### Sources
- [DEV.to - AI Context Switching Challenges](https://dev.to/pullflow/ai-context-switching-the-technical-challenge-reshaping-artificial-intelligence-14g6)
- [GetMaxim - Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
- [Arsturn - Fix AI Chatbots That Switch Models](https://www.arsturn.com/blog/how-to-fix-an-ai-chatbot-that-switches-models-mid-conversation)
- [JetBrains - Persist Chat Context](https://youtrack.jetbrains.com/projects/LLM/issues/LLM-23633/Persist-chat-context-when-switching-btw-AI-Assistant-Chat-Mode-and-Junie-Agent)

---

## 5. Market Opportunity

### Size of Opportunity

| Segment              | Relevance   | Estimated Users   | Willingness to Pay |
| -------------------- | ----------- | ----------------- | ------------------ |
| Content Creators     | High        | 5-10M globally    | $15-30/mo          |
| Marketing Teams      | High        | 2M+ teams         | $10-25/user/mo     |
| Developers           | Medium-High | 10M+              | $15-30/mo          |
| Agencies             | High        | 500K+             | $25-50/user/mo     |
| Students/Researchers | Medium      | Large but low WTP | Free tier          |

### Competitive Timing

**Window of Opportunity:**
- ChatGPT's @mentions feature is underutilized due to low GPT creation rates
- No competitor has marketed "workflow chaining" as a core feature
- Multi-agent workflows are trending in enterprise; consumer market is lagging
- AI agent market growing at 49.6% CAGR

**First-Mover Advantage:**
- Sidekiq can own the "AI workflow" positioning
- Pre-built workflow templates create immediate value
- Team sharing of workflows compounds the advantage

### Differentiation Potential

| Strategy                    | Description                                   | Difficulty | Impact    |
| --------------------------- | --------------------------------------------- | ---------- | --------- |
| **Workflow Templates**      | Pre-built Sidekiq chains for common workflows | Low        | High      |
| **Visual Pipeline Builder** | Drag-drop workflow designer                   | High       | Very High |
| **One-Click Workflows**     | "Start Blog Post Workflow" button             | Medium     | High      |
| **Team Workflow Sharing**   | Share workflow templates with team            | Medium     | High      |

**Recommendation:** Start with **Workflow Templates** for quick wins, plan **Visual Pipeline Builder** for v2.

---

## 6. Implementation Recommendations

### MVP Scope (Phase 1)

**Core Features:**
1. **@ Mention System** — Type `@` to see available Sidekiqs, select to switch
2. **Context Preservation** — Full conversation history passed to new Sidekiq
3. **Visual Indicator** — Clear UI showing which Sidekiq is currently active
4. **Transition Message** — Optional system message: "Switched to [Sidekiq Name]"

**UX Requirements:**
- Switch should take < 500ms
- No page reload or scroll position loss
- Clear visual differentiation between Sidekiq responses (avatar/color)
- Keyboard shortcut support (`@` then arrow keys + Enter)

### Enhanced Features (Phase 2)

1. **Workflow Templates**
   - Pre-built chains: "Content Creation", "Code Review", "Research Report"
   - Users can create and save custom workflows
   - Team sharing of workflow templates

2. **Smart Suggestions**
   - AI suggests next Sidekiq based on conversation context
   - "You've brainstormed ideas. Switch to Writer to draft?"

3. **Workflow Analytics**
   - Track which Sidekiq combinations are most effective
   - Measure productivity improvements

### Technical Architecture Considerations

```
┌─────────────────────────────────────────────────────┐
│                   Conversation                       │
├─────────────────────────────────────────────────────┤
│  Message 1: User → Brainstorm Sidekiq              │
│  Message 2: Brainstorm Sidekiq → User              │
│  Message 3: User → Brainstorm Sidekiq              │
│  ─────────── [Switch to Writer Sidekiq] ─────────── │
│  Message 4: User → Writer Sidekiq                   │
│  Message 5: Writer Sidekiq → User                   │
│             (has full context of Messages 1-3)      │
└─────────────────────────────────────────────────────┘
```

**Data Model Changes:**
- Messages need `sidekiq_id` field to track which Sidekiq responded
- Conversation needs `sidekiq_switches` metadata for analytics
- Consider `active_sidekiq_id` on conversation for current state

---

## 7. Risks & Challenges

### Technical Risks

| Risk                              | Likelihood | Impact | Mitigation               |
| --------------------------------- | ---------- | ------ | ------------------------ |
| Context window overflow           | Medium     | High   | Implement summarization  |
| Increased API costs               | High       | Medium | Smart context management |
| Latency on switch                 | Medium     | Medium | Optimize prompt assembly |
| Sidekiq confusion (wrong context) | Low        | High   | Clear transition prompts |

### Product Risks

| Risk                                                | Likelihood | Impact | Mitigation                                |
| --------------------------------------------------- | ---------- | ------ | ----------------------------------------- |
| Feature complexity confuses users                   | Medium     | High   | Progressive disclosure, good defaults     |
| Low adoption (users don't create multiple Sidekiqs) | Medium     | High   | Pre-built templates, workflow suggestions |
| ChatGPT improves @mentions                          | High       | Medium | Focus on team workflows, templates        |
| Token costs make feature expensive                  | Medium     | Medium | Smart summarization, usage limits         |

### User Experience Risks

- **Cognitive load:** Users may be confused about which Sidekiq is active
- **Context mismatch:** New Sidekiq may not perfectly understand context from previous Sidekiq
- **Expectation mismatch:** Users may expect Sidekiqs to "remember" things they can't

**Mitigation:** Clear visual indicators, smooth transitions, educational onboarding.

---

## 8. Success Metrics

### Primary Metrics

| Metric                       | Target                | Why It Matters                  |
| ---------------------------- | --------------------- | ------------------------------- |
| Sidekiq switch adoption rate | 30%+ of Pro users     | Feature usage validation        |
| Switches per conversation    | 2+ average            | Users finding value in chaining |
| Workflow template usage      | 50%+ of switches      | Templates drive adoption        |
| Retention impact             | +10% 30-day retention | Feature creates stickiness      |

### Secondary Metrics

| Metric                      | Target               | Why It Matters          |
| --------------------------- | -------------------- | ----------------------- |
| Time to first switch        | < 7 days             | Feature discoverability |
| Multi-Sidekiq creation rate | 3+ Sidekiqs per user | Ecosystem health        |
| Team workflow sharing rate  | 40% of teams         | Network effects         |
| NPS impact                  | +5 points            | User satisfaction       |

---

## 9. Conclusion & Next Steps

### Strategic Recommendation

**Implement Sidekiq switching as a priority feature** because:

1. **Market Gap:** No competitor effectively combines custom assistants + workflow chaining + team sharing
2. **Leverages Existing Infrastructure:** Builds on Sidekiq's custom assistant foundation
3. **Creates Differentiation:** Moves beyond "just another AI aggregator" positioning
4. **Enables Network Effects:** Team workflow sharing creates switching costs
5. **Proven User Demand:** Community feedback shows clear pain points around context loss and workflow fragmentation

### Recommended Timeline

| Phase                  | Scope                                               | Timeline  |
| ---------------------- | --------------------------------------------------- | --------- |
| **Phase 1: MVP**       | @ mentions, context preservation, visual indicators | 2-3 weeks |
| **Phase 2: Templates** | Pre-built workflow templates, suggestions           | 2-3 weeks |
| **Phase 3: Team**      | Team workflow sharing, analytics                    | 3-4 weeks |
| **Phase 4: Advanced**  | Visual workflow builder, smart suggestions          | Future    |

### Immediate Actions

1. **Technical Spike:** Validate context preservation approach with long conversations
2. **Design:** Create UX mockups for @ mention system and switch indicators
3. **User Research:** Interview 5-10 power users about workflow pain points
4. **Competitive Analysis:** Deep-dive on ChatGPT @mentions usage patterns

---

## Appendix: Key Sources

### Competitive Intelligence
- [TeamAI - Switching Between AI Agents](https://help.teamai.com/en/articles/9596973-switching-between-multiple-ai-agents-gpts-in-same-chat)
- [GrowthPath - Chain Custom GPTs](https://www.growthpath.net/chain-custom-gpts-transform-your-ai-workflow/)
- [TypingMind - Multi-Model Responses](https://docs.typingmind.com/manage-and-connect-ai-models/activate-multi-model-responses)
- [GrayGrids - AI Aggregators 2026](https://graygrids.com/blog/ai-aggregators-multiple-models-platform)
- [Peerlist - All-in-One AI Platforms](https://peerlist.io/vinishbhaskar/articles/top-all-in-one-ai-platforms)

### Technical Research
- [DEV.to - AI Context Switching](https://dev.to/pullflow/ai-context-switching-the-technical-challenge-reshaping-artificial-intelligence-14g6)
- [GetMaxim - Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)
- [n8n - AI Agent Orchestration](https://blog.n8n.io/ai-agent-orchestration-frameworks/)
- [Intuz - Multi-Agent Workflows with LangChain](https://www.intuz.com/blog/building-multi-ai-agent-workflows-with-langchain)

### User Research & Workflows
- [Medium - Creative Workflow with Custom GPTs](https://greenzeta.medium.com/optimizing-my-creative-workflow-with-custom-gpt-assistants-cd90efa503a6)
- [Synthwave - Workflows with Custom GPTs](https://www.synthwave.solutions/en/ai-nieuws/set-up-workflows-with-ai-save-time-and-increase-productivity-with-custom-gpts)
- [OpenAI Community - Model Switching Requests](https://community.openai.com/t/changing-the-model-mid-conversation/718935)
- [Substack - ChatGPT Workflow for Creators](https://aiblewmymind.substack.com/p/the-chatgpt-workflow-every-content)
- [Alitu - AI Content Creation Paradox](https://alitu.com/creator/workflow/ai-content-creation/)

### Market Data
- [DataCamp - Best AI Agents 2026](https://www.datacamp.com/blog/best-ai-agents)
- [Shakudo - AI Agent Frameworks](https://www.shakudo.io/blog/top-9-ai-agent-frameworks)
- [Svitla - Agentic AI Trends 2025](https://svitla.com/blog/agentic-ai-trends-2025/)
- [Adobe - Agentic AI Vision](https://blog.adobe.com/en/publish/2025/10/28/our-view-agentic-ai-assistants-that-work-you-in-your-favorite-apps)
