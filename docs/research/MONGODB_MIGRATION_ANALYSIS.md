# MongoDB Migration Analysis for Sidekiq

**Analysis Date:** 2026-01-25
**Current Stack:** PostgreSQL + Drizzle ORM
**Proposed Stack:** MongoDB + Mongoose/Prisma

---

## Executive Summary

This report analyzes how Sidekiq's data model would translate from PostgreSQL to MongoDB and evaluates the potential benefits and trade-offs of a NoSQL architecture. Based on the analysis, **MongoDB would be a viable alternative but not necessarily superior** for Sidekiq's current use case. The application's relational nature (users → teams → sidekiqs → threads → messages) and strong transactional requirements around team membership make PostgreSQL a solid choice. However, MongoDB could offer advantages in specific areas like message storage and user preferences.

---

## Current PostgreSQL Data Model

### Entity Relationship Overview

```
User (1) ─────┬──→ (N) Sessions
              ├──→ (N) Accounts
              ├──→ (N) Teams (as owner)
              ├──→ (N) TeamMembers (as member)
              ├──→ (N) Sidekiqs
              └──→ (N) Threads

Team (1) ─────┬──→ (N) TeamMembers
              ├──→ (N) TeamInvites
              └──→ (N) Sidekiqs

Sidekiq (1) ──→ (N) Threads

Thread (1) ───→ (N) Messages

Message (1) ──→ (N) Messages (self-referential branching)
```

### Current Tables (10 total)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user` | Core user entity | id, name, email, preferences (JSONB) |
| `session` | Auth sessions | token, expiresAt, userId |
| `account` | OAuth/credential accounts | providerId, userId, tokens |
| `verification` | Email verification tokens | identifier, token, expiresAt |
| `team` | Team entities | name, ownerId |
| `team_member` | Team membership junction | teamId, userId, role |
| `team_invite` | Pending invitations | teamId, email, token, expiresAt |
| `sidekiq` | Custom AI assistants | name, instructions, avatar (JSONB), conversationStarters (JSONB) |
| `thread` | Conversation containers | userId, sidekiqId, title, activeModel |
| `message` | Chat messages | threadId, parentMessageId, role, content, tokens |

---

## Proposed MongoDB Data Model

### Design Philosophy

MongoDB excels when you can **embed related data** within a single document, reducing joins. The key decisions revolve around:

1. **Embedding vs. Referencing** - Embed frequently-accessed together data; reference truly independent entities
2. **Document Size** - MongoDB 16MB document limit constrains embedding strategies
3. **Query Patterns** - Optimize for read-heavy vs. write-heavy operations
4. **Denormalization** - Accept some data duplication for query performance

### Collection Design

#### 1. `users` Collection

```typescript
interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;

  // EMBEDDED: User preferences (frequently accessed with user)
  preferences: {
    defaultModel?: string;
    favoriteModels?: string[];
  };

  // EMBEDDED: OAuth accounts (always fetched with user during auth)
  accounts: Array<{
    providerId: string;
    accountId: string;
    accessToken?: string;
    refreshToken?: string;
    // ... other token fields
  }>;

  // REFERENCE: Team memberships (separate for scalability)
  teamIds: ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}
```

**Rationale:**
- Accounts embedded because they're always fetched during authentication
- Team memberships as references to avoid updating user docs when teams change
- Preferences embedded for instant access without joins

#### 2. `sessions` Collection (Unchanged)

```typescript
interface SessionDocument {
  _id: ObjectId;
  token: string;
  userId: ObjectId;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

**Rationale:** Sessions are independent, short-lived, and require TTL indexes for auto-expiration.

#### 3. `verifications` Collection (Unchanged)

```typescript
interface VerificationDocument {
  _id: ObjectId;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
}
```

#### 4. `teams` Collection

```typescript
interface TeamDocument {
  _id: ObjectId;
  name: string;
  ownerId: ObjectId;

  // EMBEDDED: Members list (typically <100 members per team)
  members: Array<{
    userId: ObjectId;
    role: 'owner' | 'member';
    joinedAt: Date;
    // Denormalized for display
    name: string;
    email: string;
  }>;

  // EMBEDDED: Pending invites (typically <50 at any time)
  invites: Array<{
    email: string;
    token: string;
    role: 'owner' | 'member';
    expiresAt: Date;
    createdAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}
```

**Rationale:**
- Team members embedded because:
  - List is typically small (<100)
  - Always displayed together in team management UI
  - Reduces N+1 queries when listing members
- Denormalized user name/email avoids joins for display
- Invites embedded (short-lived, small count)

#### 5. `sidekiqs` Collection

```typescript
interface SidekiqDocument {
  _id: ObjectId;
  ownerId: ObjectId;
  teamId?: ObjectId;

  name: string;
  description?: string;
  instructions: string;
  conversationStarters: string[];
  defaultModel?: string;

  avatar: {
    type: 'initials' | 'emoji';
    color: string;
    emoji?: string;
  };

  // Denormalized owner info for listing
  ownerName: string;

  // Stats
  isFavorite: boolean;
  isPublic: boolean;
  canTeamEdit: boolean;
  lastUsedAt?: Date;
  threadCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

**Rationale:**
- Standalone collection (sidekiqs are independent entities)
- Denormalized owner name for listing without joins
- Avatar and conversation starters naturally fit as embedded objects

#### 6. `threads` Collection

```typescript
interface ThreadDocument {
  _id: ObjectId;
  userId: ObjectId;
  sidekiqId?: ObjectId;

  title?: string;
  activeModel?: string;
  isPinned: boolean;
  isArchived: boolean;
  lastActivityAt: Date;
  messageCount: number;

  // Denormalized for sidebar display
  sidekiqSnapshot?: {
    name: string;
    avatar: { type: string; color: string; emoji?: string };
  };

  // OPTION A: Embed messages (for threads < 100 messages)
  // messages: MessageSubdocument[];

  // OPTION B: Reference messages (current recommendation)
  // Messages stored in separate collection

  createdAt: Date;
  updatedAt: Date;
}
```

#### 7. `messages` Collection

```typescript
interface MessageDocument {
  _id: ObjectId;
  threadId: ObjectId;
  parentMessageId?: ObjectId;

  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  metadata?: Record<string, unknown>;

  createdAt: Date;
}
```

**Rationale for Separate Messages Collection:**
- Messages can grow unboundedly (16MB document limit risk)
- Enables efficient pagination
- Supports future branching feature (parentMessageId queries)
- Allows for message-level indexing and search

### Alternative: Embedded Messages Pattern

For applications prioritizing read performance over flexibility:

```typescript
interface ThreadWithMessagesDocument {
  _id: ObjectId;
  userId: ObjectId;
  // ... other fields

  messages: Array<{
    _id: ObjectId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    tokens?: { input: number; output: number };
    createdAt: Date;
  }>;

  // For branching: use array indexes or separate branches array
  branches?: Array<{
    parentIndex: number;
    messages: MessageSubdocument[];
  }>;
}
```

**Trade-offs:**
- ✅ Single read fetches entire conversation
- ✅ Atomic updates to thread + messages
- ❌ Document size limit (16MB ≈ ~50K messages max)
- ❌ Harder to paginate historical messages
- ❌ Complex branching implementation

---

## Benefits of MongoDB for Sidekiq

### 1. Schema Flexibility

**Current Pain Point:** Adding new fields requires migrations.

**MongoDB Advantage:**
```typescript
// Add new fields without migration
await sidekiqs.updateMany(
  {},
  { $set: { newFeatureFlag: false } }
);

// Documents can have different shapes during rollout
```

**Practical Applications:**
- A/B testing Sidekiq features per user
- Adding v2 fields (tools, knowledge bases) incrementally
- User-specific preferences without schema changes

### 2. Natural JSON/Document Structure

**Current:** JSONB columns for `preferences`, `avatar`, `conversationStarters`, `metadata`.

**MongoDB Advantage:** These are native document structures, not serialized JSON.

```typescript
// PostgreSQL (current)
const avatar = JSON.parse(row.avatar); // Parsing overhead

// MongoDB
const avatar = doc.avatar; // Direct access, typed
```

### 3. Embedded Documents Reduce Joins

**Scenario:** Fetching user profile with accounts.

```typescript
// PostgreSQL (current)
const user = await db.query.user.findFirst({
  where: eq(user.id, userId),
  with: { accounts: true }, // JOIN
});

// MongoDB
const user = await users.findOne({ _id: userId });
// accounts already embedded
```

### 4. Horizontal Scalability

**MongoDB Advantage:** Native sharding for high-volume scenarios.

```typescript
// Shard threads by userId (user's conversations stay together)
sh.shardCollection("sidekiq.threads", { userId: "hashed" });

// Shard messages by threadId (conversation stays together)
sh.shardCollection("sidekiq.messages", { threadId: 1 });
```

### 5. Better Fit for Chat/Message Patterns

**Time-Series Optimization:**
```typescript
// Capped collection for real-time chat logs (auto-expiring)
db.createCollection("chatLogs", {
  capped: true,
  size: 1000000, // 1MB
  max: 5000      // 5000 documents
});

// Time-series collection for analytics
db.createCollection("usageMetrics", {
  timeseries: {
    timeField: "timestamp",
    metaField: "userId",
    granularity: "minutes"
  }
});
```

### 6. Aggregation Pipeline

**Powerful analytics without separate tools:**
```typescript
// Get conversation stats per Sidekiq
db.threads.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $lookup: { from: "messages", localField: "_id", foreignField: "threadId", as: "messages" } },
  { $group: {
    _id: "$sidekiqId",
    totalConversations: { $sum: 1 },
    totalMessages: { $sum: { $size: "$messages" } },
    avgMessagesPerThread: { $avg: { $size: "$messages" } }
  }}
]);
```

---

## Trade-offs and Challenges

### 1. Loss of ACID Transactions (Partial)

**Challenge:** Multi-document transactions are slower than PostgreSQL.

**Impact Areas:**
- Team member invite acceptance (update team + create membership)
- Sidekiq deletion (update threads with `deletedSidekiqName`)

**Mitigation:**
```typescript
// MongoDB transactions (available since 4.0, but slower)
const session = client.startSession();
await session.withTransaction(async () => {
  await teams.updateOne({ _id: teamId }, { $push: { members: newMember } });
  await users.updateOne({ _id: userId }, { $push: { teamIds: teamId } });
});
```

### 2. No Foreign Key Constraints

**Challenge:** Referential integrity must be maintained in application code.

**Impact:**
- Deleting a user doesn't auto-cascade to threads
- Orphaned references possible

**Mitigation:**
```typescript
// Application-level cascade
async function deleteUser(userId: ObjectId) {
  await sessions.deleteMany({ userId });
  await threads.deleteMany({ userId });
  await sidekiqs.deleteMany({ ownerId: userId });
  await users.deleteOne({ _id: userId });
}
```

### 3. Denormalization Maintenance

**Challenge:** Duplicated data must be kept in sync.

**Impact:**
- User renames require updating `ownerName` in sidekiqs
- Team member name changes require updating embedded member docs

**Mitigation:**
```typescript
// Use change streams for sync (or accept eventual consistency)
users.watch().on('change', async (change) => {
  if (change.operationType === 'update' && change.updateDescription?.updatedFields?.name) {
    await sidekiqs.updateMany(
      { ownerId: change.documentKey._id },
      { $set: { ownerName: change.updateDescription.updatedFields.name } }
    );
  }
});
```

### 4. Complex Queries Across Collections

**Challenge:** No native JOINs for complex relational queries.

**Example:** "Find all threads where the Sidekiq belongs to a team I'm a member of"

```typescript
// PostgreSQL (clean)
SELECT t.* FROM threads t
JOIN sidekiqs s ON t.sidekiq_id = s.id
JOIN team_members tm ON s.team_id = tm.team_id
WHERE tm.user_id = $1;

// MongoDB (requires aggregation or multiple queries)
const teams = await teams.find({ "members.userId": userId }).toArray();
const teamIds = teams.map(t => t._id);
const sidekiqs = await sidekiqs.find({ teamId: { $in: teamIds } }).toArray();
const sidekiqIds = sidekiqs.map(s => s._id);
const threads = await threads.find({ sidekiqId: { $in: sidekiqIds } }).toArray();
```

### 5. ORM/Type Safety

**Challenge:** Mongoose is less type-safe than Drizzle.

**Current (Drizzle):**
```typescript
// Fully typed, autocomplete for all fields
const thread = await db.query.threads.findFirst({
  where: eq(threads.id, threadId),
  with: { messages: true }
});
// thread.messages is typed as Message[]
```

**MongoDB (Mongoose):**
```typescript
// Requires manual type definitions and casting
const thread = await Thread.findById(threadId).populate('messages').lean<ThreadWithMessages>();
```

**Mitigation:** Use Prisma with MongoDB for better type safety:
```typescript
// prisma/schema.prisma
model Thread {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  messages  Message[]
  // Prisma generates types automatically
}
```

---

## Feature-Specific Analysis

### Chat/Messaging (High MongoDB Affinity)

| Aspect | PostgreSQL | MongoDB | Winner |
|--------|------------|---------|--------|
| Message storage | Table with indexes | Collection with indexes | Tie |
| Pagination | OFFSET/LIMIT | Skip/Limit or cursor | MongoDB (cursor) |
| Embedded metadata | JSONB column | Native document field | MongoDB |
| Full-text search | pg_trgm extension | Text indexes | Tie |
| Real-time sync | Triggers + LISTEN/NOTIFY | Change Streams | MongoDB |
| Branching (parentMessageId) | Self-join | $graphLookup | PostgreSQL |

### Team Management (High PostgreSQL Affinity)

| Aspect | PostgreSQL | MongoDB | Winner |
|--------|------------|---------|--------|
| Member list with roles | JOIN on junction table | Embedded array | MongoDB (read) |
| Add/remove member | Single INSERT/DELETE | Array update | PostgreSQL (atomic) |
| Invite acceptance | Transaction | Transaction (slower) | PostgreSQL |
| Cross-team queries | JOINs | Aggregation | PostgreSQL |

### Sidekiqs (Neutral)

| Aspect | PostgreSQL | MongoDB | Winner |
|--------|------------|---------|--------|
| CRUD operations | Standard | Standard | Tie |
| Avatar/settings storage | JSONB | Native document | MongoDB |
| Owner lookup | JOIN or denormalize | Denormalized | Tie |
| Team sharing | FK + JOIN | Reference + lookup | PostgreSQL |

### Authentication (Better Auth) (PostgreSQL Required)

**Critical Note:** Better Auth's Drizzle adapter requires PostgreSQL. Switching to MongoDB would require:
- Using MongoDB adapter (if available)
- Or managing auth tables separately in PostgreSQL (hybrid approach)

---

## Hybrid Approach Recommendation

Instead of full migration, consider a **polyglot persistence** strategy:

### Keep in PostgreSQL:
- **Users, Sessions, Accounts, Verifications** (Better Auth requirement)
- **Teams, TeamMembers, TeamInvites** (strong relational, transactional needs)

### Move to MongoDB:
- **Threads** (high volume, per-user isolation, suitable for sharding)
- **Messages** (append-heavy, time-ordered, benefits from capped collections)
- **Sidekiqs** (document-oriented, flexible schema for future features)

### Architecture:
```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
├─────────────────────────────────────────────────────────┤
│  Better Auth (PostgreSQL)  │  Chat Service (MongoDB)    │
│  - user                    │  - threads                 │
│  - session                 │  - messages                │
│  - account                 │  - sidekiqs               │
│  - verification            │                            │
│  - team                    │                            │
│  - team_member             │                            │
│  - team_invite             │                            │
└────────────────────────────┴────────────────────────────┘
```

**Complexity Cost:** Two databases to maintain, but optimizes for each data pattern's strengths.

---

## Migration Effort Estimate

### Full Migration to MongoDB

| Component | Effort | Risk |
|-----------|--------|------|
| Schema redesign | Medium | Low |
| Data migration scripts | High | Medium |
| Better Auth adapter switch | High | High |
| tRPC router updates | Medium | Low |
| Type definitions | Medium | Low |
| Testing | High | Medium |
| **Total** | **~3-4 weeks** | **Medium-High** |

### Hybrid Approach (Messages + Sidekiqs only)

| Component | Effort | Risk |
|-----------|--------|------|
| MongoDB setup | Low | Low |
| Message/Thread migration | Medium | Low |
| Sidekiq migration | Medium | Low |
| Cross-DB queries | Medium | Medium |
| Testing | Medium | Low |
| **Total** | **~1-2 weeks** | **Low-Medium** |

---

## Recommendations

### For Sidekiq v1 (Current Milestone)

**Recommendation: Stay with PostgreSQL**

- Better Auth integration works out-of-the-box
- Team features (Phase 8-9) benefit from relational model
- Current data volume doesn't require sharding
- Drizzle ORM provides excellent type safety

### For Sidekiq v2+ (Future Consideration)

**Consider MongoDB for:**
- Message archival (high-volume, time-series)
- Usage analytics (aggregation pipeline)
- Sidekiq extensions (tools, knowledge bases)

**Trigger Points for Reconsideration:**
- Message volume > 10M rows
- Need for horizontal scaling
- Adding unstructured Sidekiq features (RAG, tools, plugins)

### If Starting Fresh

**Use MongoDB if:**
- No Better Auth requirement (use custom or Auth.js with MongoDB)
- Primary use case is chat (embedded messages pattern)
- Schema flexibility is more valuable than referential integrity

**Use PostgreSQL if:**
- Team collaboration is core (strong relations)
- Using Drizzle ORM and enjoying type safety
- Transactional integrity matters (invites, permissions)

---

## Appendix: MongoDB Schema Implementation

### Complete Mongoose Schema Example

```typescript
// schemas/user.schema.ts
import { Schema, model } from 'mongoose';

const accountSchema = new Schema({
  providerId: { type: String, required: true },
  accountId: { type: String, required: true },
  accessToken: String,
  refreshToken: String,
  accessTokenExpiresAt: Date,
});

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  image: String,
  preferences: {
    defaultModel: String,
    favoriteModels: [String],
  },
  accounts: [accountSchema],
  teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
}, { timestamps: true });

export const User = model('User', userSchema);

// schemas/thread.schema.ts
const threadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sidekiqId: { type: Schema.Types.ObjectId, ref: 'Sidekiq', index: true },
  title: String,
  activeModel: String,
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  messageCount: { type: Number, default: 0 },
  sidekiqSnapshot: {
    name: String,
    avatar: {
      type: { type: String, enum: ['initials', 'emoji'] },
      color: String,
      emoji: String,
    },
  },
}, { timestamps: true });

// Compound index for sidebar queries
threadSchema.index({ userId: 1, isPinned: -1, lastActivityAt: -1 });

export const Thread = model('Thread', threadSchema);

// schemas/message.schema.ts
const messageSchema = new Schema({
  threadId: { type: Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
  parentMessageId: { type: Schema.Types.ObjectId, ref: 'Message', index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  model: String,
  inputTokens: Number,
  outputTokens: Number,
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

messageSchema.index({ threadId: 1, createdAt: 1 });

export const Message = model('Message', messageSchema);
```

---

## Conclusion

MongoDB offers compelling benefits for Sidekiq's chat-centric features but introduces complexity in areas where PostgreSQL excels (team management, auth integration). The **current PostgreSQL architecture is well-suited** for Sidekiq's v1 requirements. A future **hybrid approach**—keeping relational data in PostgreSQL while moving high-volume chat data to MongoDB—would provide the best of both worlds if scalability becomes a concern.

---

*Report generated: 2026-01-25*
*Analysis based on: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, schema.ts*
