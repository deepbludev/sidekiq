# Convex Migration Analysis for Sidekiq

**Date:** 2026-01-24
**Author:** Claude (via GSD workflow)
**Status:** Complete

## Executive Summary

This analysis evaluates Convex as a potential replacement for PostgreSQL/Drizzle in Sidekiq. After comprehensive evaluation of feature parity, migration complexity, cost implications, and strategic fit, the recommendation is **DEFER** with specific conditions for reconsideration.

**Key Finding:** While Convex offers compelling real-time capabilities and reduced operational overhead, the migration cost (3-4 weeks) and disruption to the current Phase 4/13 roadmap outweigh immediate benefits. The current PostgreSQL/Drizzle stack is working well with no pain points.

---

## 1. Current State Analysis

### 1.1 Existing PostgreSQL Schema

The current schema consists of 10 tables with complex relationships:

| Table | Purpose | Complexity |
|-------|---------|------------|
| `user` | User accounts | JSONB preferences field |
| `session` | Auth sessions | FK to user |
| `account` | OAuth accounts | FK to user |
| `verification` | Email verification tokens | Standalone |
| `teams` | Team containers | FK to user (owner) |
| `team_member` | Junction table | Composite PK pattern |
| `team_invite` | Invite tokens | FK to team |
| `sidekiq` | Custom assistants | FK to user + team |
| `thread` | Conversation containers | FK to user + sidekiq |
| `message` | Chat messages | **Self-referential** (parentMessageId) |

**Schema Complexity Factors:**
- Self-referential relation on `messages` for branching (v2 feature prep)
- JSONB fields: `user.preferences`, `message.metadata`
- PostgreSQL enums: `team_role`, `message_role`
- 13 indexes for query optimization
- Cascade delete behaviors on foreign keys

### 1.2 Current tRPC Layer

- 3 routers: health, thread, user
- ~10 protected procedures
- Drizzle query builder with type-safe relations
- Optimistic updates with React Query cache manipulation

---

## 2. Convex Platform Capabilities

### 2.1 Data Modeling

| Feature | PostgreSQL/Drizzle | Convex | Notes |
|---------|-------------------|--------|-------|
| Schema definition | TypeScript with Drizzle | TypeScript with Convex | Both type-safe |
| Relations | Foreign keys + Drizzle relations | Document references | Convex: no FK constraints |
| Self-referential | Native support | Manual via document IDs | Branching would work |
| JSONB/nested objects | Native JSONB column | Native (documents are JSON) | Convex advantage |
| Enums | PostgreSQL enums | Union types + validators | Similar ergonomics |
| Migrations | Drizzle-kit push/generate | Automatic schema sync | Convex simpler |
| Indexes | Manual definition | Automatic + manual | Convex auto-indexes equality |

### 2.2 Query Capabilities

| Feature | PostgreSQL/Drizzle | Convex | Gap? |
|---------|-------------------|--------|------|
| Basic CRUD | Full SQL | Document operations | No |
| Filters | SQL WHERE | `.filter()` API | No |
| Sorting | ORDER BY | `.order()` | No |
| Pagination | LIMIT/OFFSET | Cursor-based | Different pattern |
| Joins | SQL JOIN + Drizzle with | Multiple queries | **Convex: N+1 pattern** |
| Aggregations | COUNT, SUM, AVG | Manual iteration | **Gap: No server aggregations** |
| Full-text search | PostgreSQL FTS | Convex search index | Similar capability |
| Complex queries | Raw SQL available | Limited to Convex API | **Gap: No raw queries** |

### 2.3 Real-time & Reactivity

| Feature | Current Stack | Convex | Advantage |
|---------|---------------|--------|-----------|
| Thread list sync | Manual refetch | Automatic subscription | Convex |
| Message updates | SSE streaming | Live queries | Similar |
| Team collaboration | Would need WebSockets | Built-in | Convex |
| Optimistic updates | React Query manual | Convex client built-in | Convex |

### 2.4 Serverless Functions

Convex provides three function types:

1. **Queries** - Read-only, automatically cached, reactive
2. **Mutations** - Write operations, transactional
3. **Actions** - External API calls, file uploads, non-deterministic ops

**Mapping to current tRPC:**
- `threadRouter.list` -> Convex query
- `threadRouter.delete` -> Convex mutation
- AI Gateway calls -> Convex action

### 2.5 Authentication Integration

| Concern | Assessment |
|---------|------------|
| Better Auth compatibility | **Not native** - Convex has Clerk/Auth0 integrations |
| Custom auth | Possible via HTTP actions + JWT validation |
| Session management | Would need to sync Convex identity with Better Auth |

**Risk:** Better Auth is deeply integrated. Convex auth would require either:
- Dual auth systems (complexity)
- Better Auth replacement with Clerk (additional migration)

### 2.6 Pricing Model (as of 2025)

| Tier | Function Calls | Bandwidth | Storage | Price |
|------|----------------|-----------|---------|-------|
| Free | 1M/month | 1GB | 512MB | $0 |
| Pro | 25M/month | 50GB | 50GB | $25/month |
| Team | 100M/month | 200GB | 200GB | $100/month |

**Sidekiq Estimate (1000 users, 100 messages/user/day):**
- Function calls: ~10M/month (queries + mutations + actions)
- Storage: ~2GB (messages + metadata)
- Bandwidth: ~5GB/month

**Estimated cost:** Pro tier ($25/month)

**Current cost:** PostgreSQL included in Vercel Pro ($20/month for Vercel)

**Delta:** ~$25/month additional for equivalent functionality

---

## 3. Migration Complexity Assessment

### 3.1 Schema Migration

| Table | Convex Mapping | Effort | Challenges |
|-------|----------------|--------|------------|
| user | Convex document | Low | JSONB -> native object |
| session | Convex document | Medium | Better Auth sync |
| account | Convex document | Medium | OAuth flow changes |
| verification | Convex document | Low | Direct mapping |
| teams | Convex document | Low | Direct mapping |
| team_member | Convex document | Low | Reference IDs |
| team_invite | Convex document | Low | Direct mapping |
| sidekiq | Convex document | Low | Direct mapping |
| thread | Convex document | Low | Reference IDs |
| message | Convex document | Medium | Self-ref via IDs |

**Total Schema Migration:** 2-3 days

### 3.2 tRPC Layer Rewrite

| Current | Convex Equivalent | Effort |
|---------|-------------------|--------|
| 3 routers | Convex function files | 1 day |
| 10 procedures | 10 Convex functions | 2-3 days |
| Drizzle queries | Convex query API | 2-3 days |
| Protected procedures | Convex auth ctx | 1 day |

**Total Backend Rewrite:** 6-8 days

### 3.3 Frontend Changes

| Area | Changes Required | Effort |
|------|------------------|--------|
| tRPC client | Replace with Convex React | 1 day |
| useQuery hooks | ConvexQuery hooks | 2-3 days |
| Optimistic updates | Convex client patterns | 1-2 days |
| Error handling | Convex error types | 1 day |

**Total Frontend Changes:** 5-7 days

### 3.4 Data Migration

- Export PostgreSQL data
- Transform to Convex document format
- Import via Convex mutations
- Verify referential integrity manually

**Data Migration:** 1-2 days

### 3.5 Total Migration Effort

| Phase | Duration |
|-------|----------|
| Schema design | 2-3 days |
| Backend rewrite | 6-8 days |
| Frontend changes | 5-7 days |
| Data migration | 1-2 days |
| Testing & fixes | 3-4 days |
| **Total** | **17-24 days (3-4 weeks)** |

---

## 4. Real-time Analysis for Sidekiq

### 4.1 Current Real-time Needs

| Feature | Current Approach | Works? |
|---------|------------------|--------|
| AI streaming | SSE via Vercel AI SDK | Yes, well |
| Thread list | Manual refetch on action | Acceptable |
| Message updates | Not needed (single user) | N/A |

### 4.2 Future Real-time Needs (Phase 8-9)

| Feature | Would Convex Help? |
|---------|-------------------|
| Team shared chats | Yes - live queries |
| Collaborative Sidekiq editing | Yes - live documents |
| Team member presence | Yes - built-in |

**Assessment:** Real-time is a "nice-to-have" now, becomes valuable in Phase 8-9 (teams).

### 4.3 Alternative for Phase 8-9

Without full migration, team features could use:
- Supabase Realtime (PostgreSQL compatible)
- Pusher/Ably for presence
- WebSocket layer for specific features

---

## 5. Risk Assessment

### 5.1 Vendor Lock-in

| Factor | PostgreSQL | Convex |
|--------|------------|--------|
| Data portability | Standard SQL exports | Convex-specific format |
| Query language | SQL (universal) | Convex API (proprietary) |
| Self-hosting | Yes (any cloud) | No (Convex only) |
| Alternative providers | Many | None |

**Risk Level:** HIGH - Convex is a single-vendor solution

### 5.2 Roadmap Disruption

Current position: Phase 4/13 complete
Migration would:
- Pause Phase 5-7 development for 3-4 weeks
- Delay MVP completion by ~1 month
- Introduce regression risk on shipped features

**Risk Level:** HIGH - Significant schedule impact

### 5.3 Learning Curve

| Area | Complexity |
|------|------------|
| Convex schema | Low (similar to current) |
| Convex functions | Medium (new paradigms) |
| Convex React | Medium (different from tRPC) |
| Debugging/tooling | Medium (less mature than PostgreSQL) |

**Risk Level:** MEDIUM - 1-2 weeks productivity loss

### 5.4 Rollback Complexity

If issues arise post-migration:
- No direct rollback (different data format)
- Would need reverse migration script
- Potential data loss during transition

**Risk Level:** HIGH - Difficult to undo

---

## 6. Cost-Benefit Summary

### 6.1 Benefits of Migration

| Benefit | Value | Timing |
|---------|-------|--------|
| Real-time subscriptions | High (for teams) | Phase 8-9 |
| Reduced ops overhead | Medium | Immediate |
| Optimistic updates built-in | Low (already have) | Immediate |
| Simplified architecture | Medium | Immediate |
| Auto-scaling | Medium | Post-launch |

### 6.2 Costs of Migration

| Cost | Impact | Timing |
|------|--------|--------|
| 3-4 weeks development | High | Immediate |
| Roadmap delay | High | Immediate |
| Regression risk | Medium | Immediate |
| Vendor lock-in | High | Permanent |
| Additional $25/month | Low | Ongoing |
| Better Auth replacement | High | If required |

### 6.3 Net Assessment

**Benefits:** Primarily future-focused (teams, scaling)
**Costs:** Immediate and significant (time, risk, lock-in)

Current stack has **no pain points**. Migration is solving problems that don't exist yet.

---

## 7. Recommendation

### DEFER

**Do not migrate to Convex now.**

### Rationale

1. **No current pain:** PostgreSQL/Drizzle is working well. No performance issues, no developer friction.

2. **Premature optimization:** Real-time benefits primarily matter for Phase 8-9 (teams). Currently at Phase 4.

3. **High disruption:** 3-4 weeks migration would delay MVP by ~1 month.

4. **Lock-in risk:** Convex is proprietary with no exit path. PostgreSQL is a safe long-term choice.

5. **Better alternatives exist:** For Phase 8-9 team features, can add targeted real-time (Supabase, Pusher) without full migration.

### Conditions for Reconsideration

Revisit Convex migration if:

1. **Phase 8-9 real-time requirements exceed targeted solutions** - If team collaboration needs are complex enough that adding WebSocket layers becomes messy.

2. **PostgreSQL performance issues emerge** - If query performance degrades with scale and Drizzle optimizations are insufficient.

3. **Operational overhead becomes burdensome** - If managing PostgreSQL connections, migrations, and scaling consumes significant time.

4. **Convex adds PostgreSQL export** - If Convex reduces lock-in with standard data export formats.

### Alternative Path

For Phase 8-9 team features, consider:

```
Current Stack + Targeted Additions
├── PostgreSQL/Drizzle (data layer) - keep
├── tRPC (API layer) - keep
├── SSE (AI streaming) - keep
└── ADD: Supabase Realtime OR Pusher
    ├── Team presence indicators
    ├── Live thread list updates
    └── Collaborative editing sync
```

This provides real-time benefits without full migration risk.

---

## 8. Impact on Roadmap

### If DEFER (Recommended)

| Phase | Impact |
|-------|--------|
| 5-7 | None - continue as planned |
| 8-9 | Add targeted real-time solution |
| 10-13 | None |

### If MIGRATE (Not Recommended)

| Phase | Impact |
|-------|--------|
| 5-7 | Delayed 3-4 weeks |
| 8-9 | Simplified (Convex native real-time) |
| 10-13 | Delayed 3-4 weeks |
| MVP launch | Delayed ~1 month |

---

## Appendix A: Convex Schema Example

For reference, here's how the current schema would map to Convex:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    preferences: v.optional(v.object({
      defaultModel: v.optional(v.string()),
      favoriteModels: v.optional(v.array(v.string())),
    })),
  }).index("by_email", ["email"]),

  threads: defineTable({
    userId: v.id("users"),
    sidekiqId: v.optional(v.id("sidekiqs")),
    title: v.optional(v.string()),
    activeModel: v.optional(v.string()),
    isPinned: v.boolean(),
    isArchived: v.boolean(),
    lastActivityAt: v.number(),
    messageCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_activity", ["userId", "lastActivityAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    parentMessageId: v.optional(v.id("messages")), // Self-ref works
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_thread", ["threadId"]),

  // ... other tables similar pattern
});
```

---

## Appendix B: Feature Comparison Matrix

| Feature | PostgreSQL/Drizzle | Convex | Winner |
|---------|-------------------|--------|--------|
| Type safety | Excellent | Excellent | Tie |
| Schema migrations | Manual (drizzle-kit) | Automatic | Convex |
| Query flexibility | Full SQL | Limited API | PostgreSQL |
| Real-time | Add-on required | Built-in | Convex |
| Aggregations | Native | Manual | PostgreSQL |
| Self-hosting | Yes | No | PostgreSQL |
| Vendor lock-in | None | High | PostgreSQL |
| Learning curve | Low (SQL) | Medium | PostgreSQL |
| Ecosystem maturity | Very high | Growing | PostgreSQL |
| Cost at scale | Predictable | Usage-based | Depends |
| Operational overhead | Medium | Low | Convex |
| Better Auth compat | Native | Requires work | PostgreSQL |

**Overall:** PostgreSQL leads in flexibility and portability. Convex leads in real-time and simplicity.

---

*Analysis complete. Recommendation: DEFER migration. Reconsider at Phase 8-9 if real-time requirements exceed targeted solutions.*
