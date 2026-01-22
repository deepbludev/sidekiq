# Product Requirements Document (PRD): Sidekiq

## 1. Executive Summary
**Sidekiq** is a premium AI chat application designed to replicate functionality of traditional AI chat apps, such as ChatGPT, Claude, Gemini, etc. in an agnostic way where the user can choose the underlying model provider (similar to [t3.chat](https://t3.chat)). It also includes a robust custom assistant feature similar to OpenAI's GPTs or Google's Gems. These custom assistants, called **"Sidekiq"**, allow users to configure specialized AI personas with specific instructions, names, and descriptions.

The goal is to provide a "wow" user experience with high-end, modern and clean aesthetics, a snappy UI and UX, while maintaining a solid, type-safe full-stack architecture.

## 2. Core Functional Requirements

### 2.1 Authentication
- **Provider**: Better-Auth.
- **Methods**: Email/Password, Social Login (Google).
- **Flows**: Sign up, Sign in, Sign out, Password Reset.
- **Protection**: All chat and Sidekiq creation features are protected behind auth.

### 2.2 Dashboard / Chat Interface
- **Layout**: Sidebar (History + Sidekiqs) + Main Chat Area.
- **Streaming**: Real-time token streaming for AI responses.
- **Markdown Support**: Rich text rendering for code blocks, tables, lists, etc.
- **Model Selection**: Ability to switch between underlying base models (e.g., GPT-4o, Claude 3.5 Sonnet) - *Implementation detail: Vercel AI Gateway provides unified access to all models with a single API key.*

### 2.3 Sidekiq (Custom Assistant) Management
Users can create, edit, and delete their own Sidekiqs.
- **Properties**:
  - `Name`: Display name of the assistant.
  - `Description`: Short summary of what it does.
  - `Instructions`: The system prompt/persona definition.
  - `Visibility`: Private (User only), Team (Shared with specific team), or Public (Global) - *MVP starts with Private & Team.*
- **Future Scope**:
  - Knowledge Base (RAG with documents).
  - Tool/Function calling capabilities.

### 2.4 Chatting with a Sidekiq
- Users can start a new chat session specifically with a selected Sidekiq.
- The Sidekiq's "Instructions" are prepended as the system message for the conversation context.
- UI indicates which Sidekiq is currently active.

### 2.5 Advanced Chat Features (Vanilla & Sidekiq)
- **Tools**:
  - **Web Search**: Real-time information retrieval.
  - **Image Generation**: Generating images on demand.
  - **Deep Research**: (Future Scope) Complex multi-step reasoning/research tasks.
- **Branching**:
  - Users can edit any user message to fork the conversation tree.
  - Users can navigate between branches (e.g., `< 2 / 5 >` navigation controls).
- **Model Picker**:
  - In-chat toggle to switch the active model (e.g., GPT-4o -> Sonnet 3.5) for subsequent messages.
  
### 2.6 Settings: Teams, chats & Sidekiqs
- **Creation**: Users can create multiple teams.
- **Invites**: Users can invite others to join a team via email.
- **Roles**: Owner, Member (simplified for MVP).
- **Sharing**: Sidekiqs can be shared with a specific team, making them accessible to all team members.
- **Favorite models**: Users can set their favorite models for quick access.

### 2.7 Settings: Payments & Credits
- **Model**: Pay-per-usage system using "Credits".
- **Base Plan**: Monthly fixed subscription (Stripe) including a set amount of credits.
- **Top-ups**:
  - **Manual**: User purchases credit blocks.
  - **Automatic**: Configurable threshold (e.g., "When below $5, add $20").
- **Usage Tracking**: Detailed logging of token usage per model, deducted from user/team balance.
- **Configuration**: Pricing per model and credit costs set via Environment Variables.

### 2.9 Settings: User Profile
- **Profile**: User can edit their profile information.
- **Avatar**: User can upload an avatar image.
- **Name**: User can edit their name.
- **Email**: User can edit their email.
- **Password**: User can edit their password.
- **Delete Account**: User can delete their account.
- **Theme**: User can choose their preferred theme (dark, light, system).
- **Language**: User can choose their preferred language.
- **Notifications**: User can enable/disable notifications.
- **Privacy**: User can enable/disable privacy settings.
- **Data Usage**: User can view their data usage by model, similar to Cursor.

## 3. Technical Architecture

### 3.1 Stack
- **Package Manager**: [pnpm](https://pnpm.io/) (Strict requirement).
- **Language**: TypeScript.
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React Server Components).
- **Styling**: Tailwind CSS + `clsx`/`tailwind-merge`.
- **UI Framework**: [Shadcn UI](https://ui.shadcn.com/).
- **API Layer**: [tRPC](https://trpc.io/) for end-to-end type safety.
- **Validation**: [Zod](https://zod.dev/).
- **Database**: PostgreSQL (e.g., Neon or Supabase).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/).
- **Auth**: [Better-Auth](https://better-auth.com/) (Email/Password, Social Login (Google)).
- **Payments**: [Stripe](https://stripe.com/) (Checkout Sessions, Webhooks).
- **AI Integration**: Vercel AI SDK for standardizing provider interactions and streaming responses.
- **LLM Gateway**: Vercel AI Gateway for unified API key management and model access across all providers (OpenAI, Anthropic, etc.). All provider API keys are configured in Vercel AI Gateway, eliminating the need for separate provider-specific keys in the application.
- **Real-time Communication**: Server-Sent Events (SSE) for streaming AI responses.
- **File Storage**: Vercel Blob Storage for avatar uploads.
- **Error Tracking**: Sentry (or similar) for production error monitoring.
- **Deployment**: Vercel.

### 3.1.1 Real-time & Streaming Architecture
- **Streaming Scope**: AI responses stream only to the user who initiated the message. Other users viewing shared chats see completed messages after refresh.
- **Technology**: Server-Sent Events (SSE) for one-way server-to-client streaming.
- **Integration**: Leverage Vercel AI SDK's native streaming capabilities with Next.js Edge functions.
- **API Gateway**: All LLM requests route through Vercel AI Gateway, which handles provider authentication, rate limiting, and unified API key management. The application only needs a single Vercel AI Gateway API key to access all supported models.

### 3.2 Key Data Models (Draft)

#### Users
- `id` (UUIDv7)
- `email`
- `name`
- `image`
- `createdAt`

#### Teams
- `id` (UUIDv7)
- `name`
- `ownerId` (FK -> User)
- `createdAt`

#### TeamMembers
- `teamId` (FK -> Team)
- `userId` (FK -> User)
- `role` (enum: 'owner' | 'member')
- `joinedAt`

#### TeamInvites
- `id` (UUIDv7)
- `teamId` (FK -> Team)
- `email` (String)
- `token` (String, unique - for secure invite links)
- `role` (enum: 'owner' | 'member')
- `acceptedAt` (Timestamp, nullable)
- `rejectedAt` (Timestamp, nullable)
- `expiresAt` (Timestamp)
- `createdAt` (Timestamp)

#### Sidekiqs
- `id` (UUIDv7)
- `ownerId` (FK -> User)
- `teamId` (FK -> Team, nullable - if set, shared with team)
- `name` (String, max 100 chars)
- `description` (String, optional, max 500 chars)
- `instructions` (Text, max 4000 chars)
- `isPublic` (Boolean, default false)
- `canTeamEdit` (Boolean, default false - if true, team members can edit; if false, only view/use)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Threads (Conversations)
- `id` (UUIDv7)
- `userId` (FK -> User)
- `sidekiqId` (FK -> Sidekiq, nullable)
- `title` (String, auto-generated after first exchange or user-set)
- `activeModel` (String - tracks current model selection for thread)
- `isPinned` (Boolean, default false)
- `isArchived` (Boolean, default false)
- `lastActivityAt` (Timestamp - updated on new messages)
- `messageCount` (Integer, default 0)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Messages
- `id` (UUIDv7)
- `threadId` (FK -> Thread)
- `parentMessageId` (FK -> Message, nullable - for conversation branching)
- `role` (enum: 'user' | 'assistant' | 'system')
- `content` (Text)
- `model` (String, nullable - tracks which model generated assistant messages)
- `inputTokens` (Integer, nullable - for cost tracking)
- `outputTokens` (Integer, nullable - for cost tracking)
- `metadata` (JSONB - flexible field for tool calls, errors, timing, etc.)
- `createdAt` (Timestamp)

#### CreditBalances
- `id` (UUIDv7)
- `userId` (FK -> User, nullable)
- `teamId` (FK -> Team, nullable)
- `balance` (Decimal - current credit balance in USD or credit units)
- `currency` (String, default 'USD')
- `updatedAt` (Timestamp)
- **Constraint**: Exactly one of `userId` or `teamId` must be set (XOR constraint)

#### CreditTransactions
- `id` (UUIDv7)
- `userId` (FK -> User, nullable)
- `teamId` (FK -> Team, nullable)
- `amount` (Decimal - positive for additions, negative for deductions)
- `type` (enum: 'purchase' | 'subscription_credit' | 'deduction' | 'refund' | 'adjustment')
- `description` (String - human-readable description)
- `relatedId` (String, nullable - reference to Stripe payment, thread, or message)
- `createdAt` (Timestamp)
- **Constraint**: Exactly one of `userId` or `teamId` must be set

#### UsageRecords
- `id` (UUIDv7)
- `userId` (FK -> User)
- `teamId` (FK -> Team, nullable - if usage attributed to team)
- `threadId` (FK -> Thread)
- `messageId` (FK -> Message)
- `model` (String - model identifier)
- `inputTokens` (Integer)
- `outputTokens` (Integer)
- `cost` (Decimal - calculated cost in USD)
- `createdAt` (Timestamp)

#### Subscriptions
- `id` (UUIDv7)
- `userId` (FK -> User, nullable)
- `teamId` (FK -> Team, nullable)
- `stripeSubscriptionId` (String, unique)
- `stripeCustomerId` (String)
- `plan` (String - plan identifier, e.g., 'base_20')
- `status` (enum: 'active' | 'canceled' | 'past_due' | 'paused')
- `currentPeriodStart` (Timestamp)
- `currentPeriodEnd` (Timestamp)
- `cancelAtPeriodEnd` (Boolean, default false)
- `monthlyCredits` (Decimal - credits included in plan)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)
- **Constraint**: Exactly one of `userId` or `teamId` must be set

## 4. UI/UX & Design Guidelines

### 4.1 Aesthetics
- **Theme**: Dark/Light/System toggle (default: System).
- **Style**: "Glassmorphism" (translucent backdrops, blurs), subtle gradients.
- **Visual Identity**: Modern and sleek like t3.chat, but with a unique color palette and layout nuance to avoid being a direct clone.
- **Typography**: Modern sans-serif (e.g., Inter, Geist Sans).
- **Interactions**:
  - Hover states on all interactive elements.
  - Smooth transitions between pages.
  - Micro-animations for message appearance (fade-in/slide-up).
  - Loading states (skeletons/spinners) must be polished.

### 4.2 Performance ("Snappy")
- **Optimistic Updates**: UI must react immediately to user actions (sending messages, switching chats) before server confirmation.
- **Streaming**: Instant feedback for AI generation.
- **RSC Payload Optimization**: Minimize client bundle size for fast initial load.

### 4.2 Responsiveness
- Fully responsive mobile view.
- Sidebar essentially becomes a drawer on mobile.

### 4.3 Interaction Patterns & UI Behaviors

#### 4.3.1 Message Editing & Branching
- **Behavior**: Editing any user message ALWAYS creates a new branch (fork) in the conversation tree.
- **UI**: Original message is preserved; edited version becomes a new branch.
- **Navigation**: Users can navigate between branches using `< 2 / 5 >` style controls.
- **Indication**: No confirmation dialog needed; behavior is consistent and predictable.

#### 4.3.2 Model Selection
- **UI Component**: Dropdown menu positioned near the message input area.
- **Persistence**: Model selection persists for the entire thread (sticky).
- **Visual Indicator**: Current model shown in dropdown; no separate system messages for model switches.
- **Quick Access**: Dropdown always visible for easy switching.

#### 4.3.3 Conversation Sidebar
- **Sorting**:
  - Pinned threads appear at top.
  - Unpinned threads sorted by `lastActivityAt` (most recent first).
  - Grouped by date (Today / Yesterday / This Week / Older).
- **Sidekiq Indicators**:
  - Sidekiq icon/avatar next to thread title.
  - Subtle color coding or badge to distinguish Sidekiq chats.
  - Sidekiq name shown in subtitle below thread title.
- **Search**: Full-text search capability across thread titles and content.
- **Scroll Position**: Previous scroll position preserved when switching between threads.

#### 4.3.4 Thread Management
- **Archive**: Soft delete; thread hidden from main sidebar but recoverable from "Archived" section.
- **Delete**: Permanent deletion after confirmation dialog ("Are you sure? This cannot be undone.").
- **Pin**: Toggle pin status; pinned threads stay at top regardless of activity.

#### 4.3.5 Thread Title Generation
- **Timing**: After first user message + AI response exchange.
- **Method**: Use AI (same model or cheaper model) to generate concise title summarizing the conversation.
- **Fallback**: If generation fails, use truncated first user message (max 60 chars).
- **Editability**: Users can manually edit/override generated titles.

#### 4.3.6 Message Regeneration
- **Feature**: Users can regenerate the last AI response.
- **UI**: "Regenerate" button appears on hover/long-press of assistant messages.
- **Behavior**: Creates new assistant message with same prompt; previous response preserved as branch.

#### 4.3.7 Empty States
- **New User Experience**:
  - No threads: Show "Start your first conversation" with prominent CTA button and example prompts.
  - No Sidekiqs: Show "Create your first Sidekiq" with description and "Create" button.
- **Style**: Helpful, encouraging, with clear visual hierarchy.

#### 4.3.8 Loading States
- **Message Sending**: Optimistic UI - message appears immediately with subtle loading indicator.
- **AI Streaming**: Typing indicator followed by token-by-token streaming with cursor animation.
- **Page Transitions**: Skeleton screens for sidebar and main chat area during initial load.
- **Action Feedback**: Button states (loading spinner) for all async actions (save, delete, etc.).

#### 4.3.9 Avatar System
- **Users**: Upload custom avatars via Vercel Blob Storage.
- **Sidekiqs (MVP)**: Text initials only; colored circles with first letter(s) of name.
- **Teams**: Upload custom team avatars (future).

## 5. Business Logic & Rules

### 5.1 Credit System

#### 5.1.1 Credit Scope
- **Both User & Team Level**: Users have personal credit balances AND teams can have shared credit pools.
- **Attribution**: When using team Sidekiqs, costs are deducted from the user's personal credits (not team credits).
- **Selection**: Users can manually choose which credit pool to use for a conversation (future enhancement).

#### 5.1.2 Credit Deduction Flow
- **Timing**: Asynchronous - credits deducted AFTER AI response is delivered.
- **Process**:
  1. User sends message → optimistic UI shows message immediately.
  2. AI generates response and streams to user.
  3. After completion, calculate token usage and cost.
  4. Deduct from user's credit balance.
  5. Create `UsageRecord` and `CreditTransaction` entries.
- **Concurrency**: Use database transactions to prevent race conditions and ensure accurate balances.

#### 5.1.3 Insufficient Credits Handling
- **Check**: Before message is sent, perform soft check of credit balance.
- **If insufficient AND auto-top-up configured**: Trigger automatic top-up via Stripe.
- **If insufficient AND no auto-top-up**: Block message send and show top-up prompt.
- **Negative Balance Grace**: Allow up to $-5 negative balance as grace period. Require top-up before next conversation.
- **UI**: Clear messaging: "Insufficient credits. Add $X to continue."

#### 5.1.4 Subscription Credits
- **Base Plan**: $20/month includes $20 worth of credits (or equivalent credit units).
- **Allocation**: Credits added to user/team balance at subscription start and each renewal.
- **Rollover**: Credits DO NOT roll over; unused credits expire at end of billing period.
- **Cancellation**: If subscription canceled, user retains remaining credits until period ends.

#### 5.1.5 Model Pricing
- **Configuration**: Pricing per model defined in environment variables (e.g., `GPT4O_INPUT_PRICE_PER_1K_TOKENS`, `GPT4O_OUTPUT_PRICE_PER_1K_TOKENS`).
- **Cost Calculation**: `cost = (inputTokens / 1000 * inputPrice) + (outputTokens / 1000 * outputPrice)`.
- **Rounding**: Round to 4 decimal places for display; store exact values in database.

### 5.2 Team Management

#### 5.2.1 Team Deletion
- **Behavior**: When team owner deletes a team, all team-shared Sidekiqs transfer to owner's private collection.
- **Conversations**: Team members' conversations remain with them (not deleted).
- **Warning**: Show confirmation dialog: "Deleting this team will transfer shared Sidekiqs to your account. Members will lose access. Continue?"

#### 5.2.2 Team Invites
- **Method**: Token-based secure invite links.
- **Flow**:
  1. Owner invites user by email.
  2. System generates unique token and sends email with invite link.
  3. Recipient clicks link → redirected to app.
  4. If not logged in: prompt to sign up/sign in.
  5. After auth: automatically join team.
- **Expiration**: Invites expire after 7 days.
- **Revocation**: Owner can revoke pending invites before acceptance.

### 5.3 Sidekiq Permissions

#### 5.3.1 Private Sidekiqs
- **Visibility**: Only owner can view, edit, and use.
- **Sharing**: Not visible to others unless explicitly shared.

#### 5.3.2 Team-Shared Sidekiqs
- **View/Use**: All team members can view instructions and use in conversations.
- **Edit**: Controlled by `canTeamEdit` flag:
  - If `false` (default): Only owner can edit.
  - If `true`: All team members can edit name, description, and instructions.
- **Delete**: Only owner can delete.

#### 5.3.3 Public Sidekiqs
- **Future Scope**: Public directory of Sidekiqs. Anyone can view and clone to their account.
- **MVP**: Not implemented.

### 5.4 Validation Rules

#### 5.4.1 Sidekiq Instructions
- **Max Length**: 4000 characters.
- **Rate Limiting**: Users can create max 100 Sidekiqs per account.
- **Creation Throttle**: Max 10 Sidekiq creations per hour per user (anti-spam).

#### 5.4.2 Messages
- **Max Length**: 50,000 characters per user message.
- **Attachments**: Not supported in MVP.
- **Rate Limiting**: 100 messages per hour per user.

#### 5.4.3 Thread Limits
- **Max Threads**: No hard limit, but archived threads don't count toward active limit.
- **Max Messages per Thread**: Soft limit of 500 messages (UI warning after 400).

### 5.5 Password Reset
- **Method**: Email with reset link + token (traditional flow).
- **Flow**:
  1. User requests password reset.
  2. System generates secure token and sends email.
  3. User clicks link → redirected to password reset form.
  4. User enters new password → token validated and password updated.
- **Expiration**: Reset tokens expire after 1 hour.
- **Security**: Tokens invalidated after use or if new reset requested.

## 6. Error Handling & Edge Cases

### 6.1 Streaming Failures
- **Scenario**: AI response stream fails mid-generation (network error, API timeout, rate limit).
- **Behavior**:
  - Save partial response as-is to database.
  - Show error indicator inline: "Response incomplete. [Retry]" button.
  - User can retry to continue generation from where it stopped (or regenerate entirely).
- **Logging**: Log error details (error type, message ID, model, timestamp) for debugging.

### 6.2 Optimistic Update Failures
- **Scenario**: Server rejects message (validation error, credit check fails, API error).
- **Behavior**:
  - Remove optimistic message from UI with smooth animation.
  - Show error toast with specific reason: "Message failed: Insufficient credits" or "Message too long".
  - User can edit draft and retry.
- **Persistence**: Failed messages not saved to database.

### 6.3 Concurrent Editing
- **Scenario**: Multiple users editing same team Sidekiq simultaneously.
- **Behavior**: Last write wins. Show warning if Sidekiq was updated since user started editing: "This Sidekiq was modified by [User]. Reload to see latest version?"
- **Future**: Implement optimistic locking with version numbers.

### 6.4 Deleted Sidekiq in Active Chat
- **Scenario**: User is chatting with a Sidekiq, then owner deletes it.
- **Behavior**: Current conversation continues (instructions already loaded). User notified: "This Sidekiq was deleted. You can continue this conversation but cannot start new ones."
- **Future Messages**: Sidekiq instructions remain attached to thread but cannot create new threads with deleted Sidekiq.

### 6.5 Token Limit Exceeded
- **Scenario**: Conversation context exceeds model's token limit.
- **Behavior**: Show error: "Conversation too long for selected model. Try: 1) Summarize conversation, 2) Start new thread, 3) Switch to model with larger context."
- **Prevention**: Show warning when approaching limit (e.g., at 80% of max tokens).

## 7. Security & Rate Limiting

### 7.1 Rate Limits
- **Messages**: 100 messages per hour per user.
- **Sidekiq Creation**: 10 Sidekiqs per hour per user.
- **API Requests**: Standard tRPC rate limiting (e.g., 1000 requests per 15 min per user).
- **Implementation**: Use Redis-based rate limiting or Vercel Edge Config.

### 7.2 Input Validation
- **All Inputs**: Validate using Zod schemas on both client and server.
- **Sanitization**: Sanitize user-generated content (Sidekiq names, descriptions, thread titles) to prevent XSS.
- **SQL Injection**: Protected by Drizzle ORM's parameterized queries.

### 7.3 Authentication & Authorization
- **Session Management**: Better-Auth handles session tokens securely.
- **API Protection**: All tRPC routes require authentication (except public auth routes).
- **Team Authorization**: Verify user membership before allowing access to team resources.
- **Sidekiq Authorization**: Check ownership or team membership before edit/delete operations.

### 7.4 Payment Security
- **Stripe Integration**: Use Stripe Checkout Sessions (hosted payment pages) - no direct card handling.
- **Webhook Validation**: Verify webhook signatures to ensure requests from Stripe.
- **Idempotency**: Use idempotency keys for credit additions to prevent duplicate charges.

### 7.5 Data Privacy
- **Conversation Data**: Encrypted at rest (PostgreSQL encryption).
- **API Keys**: Vercel AI Gateway API key stored in environment variables, never exposed to client. Individual provider API keys are managed securely within Vercel AI Gateway configuration, not in the application codebase.
- **User Deletion**: Hard delete user data upon account deletion (GDPR compliance).

## 8. Monitoring & Observability

### 8.1 Error Tracking
- **Tool**: Sentry (or similar).
- **Scope**: Track all unhandled exceptions, API errors, and streaming failures.
- **Alerts**: Real-time alerts for critical errors (payment failures, auth issues).

### 8.2 Analytics (Future Enhancement)
- **User Behavior**: Track feature usage, conversion funnels (sign-up → first chat → Sidekiq creation).
- **Performance**: Monitor API latency, streaming performance, database query times.

### 8.3 Logging
- **Structured Logs**: Use JSON format with consistent fields (userId, requestId, timestamp, level, message).
- **Levels**: DEBUG (development), INFO (key events), WARN (recoverable errors), ERROR (failures).
- **Retention**: 30 days for production logs.


## 10. Key Decisions Summary

This section captures the key architectural and implementation decisions made during PRD refinement:

### Technical Decisions
- **Streaming**: Server-Sent Events (SSE) for AI responses; streaming only to initiating user
- **Branching**: Parent-child message references (parentMessageId) for conversation trees
- **Real-time**: No real-time collaboration in MVP; multi-user streaming deferred
- **File Storage**: Vercel Blob Storage for avatar uploads
- **Monitoring**: Sentry for error tracking in MVP
- **AI Gateway**: Vercel AI Gateway for unified API key management and model access; eliminates need for separate provider API keys in application

### Credit & Payment Decisions
- **Credit Scope**: Both user-level and team-level credit balances
- **Deduction Timing**: Asynchronous (after response delivery) with optimistic UI
- **Credit Attribution**: Team Sidekiq usage deducts from user's personal credits
- **Insufficient Credits**: Auto-top-up if configured, else block with clear prompt
- **Subscription Plan**: Fixed $20/month with $20 credits (no rollover)
- **Model Pricing**: Environment variable configuration (ENV-based for MVP)
- **Grace Period**: Allow -$5 negative balance before hard blocking

### UI/UX Decisions
- **Branching Behavior**: Edit message ALWAYS creates branch; no in-place editing
- **Model Picker**: Dropdown near input; selection persists per thread
- **Sidebar Visual**: Sidekiq icon + color badge + subtitle with Sidekiq name
- **Scroll Position**: Preserved when switching threads
- **Thread Titles**: Auto-generated after first exchange using AI
- **Empty States**: Helpful CTAs with clear guidance for new users
- **Sidekiq Avatars**: Text initials only in MVP (colored circles)
- **Error Handling**: Save partial responses on stream failure with retry button
- **Optimistic UI**: Remove failed message with error toast

### Permission & Security Decisions
- **Team Sidekiq Edit**: Controlled by canTeamEdit flag (default: view/use only)
- **Team Deletion**: Transfers Sidekiqs to owner (not deleted)
- **Team Invites**: Token-based secure links with 7-day expiration
- **Rate Limiting**: 100 messages/hour per user, 10 Sidekiq creations/hour
- **Validation**: Max 4000 chars for Sidekiq instructions, 50k for messages
- **Password Reset**: Traditional email token flow (1-hour expiration)

### Data Model Enhancements
Added tables:
- **CreditBalances**: Track user/team credit balances
- **CreditTransactions**: Audit log of all credit changes
- **UsageRecords**: Detailed token usage per message
- **Subscriptions**: Stripe subscription tracking

Enhanced existing tables:
- **Messages**: Added model, inputTokens, outputTokens, metadata, parentMessageId
- **Threads**: Added activeModel, isPinned, isArchived, lastActivityAt, messageCount
- **Sidekiqs**: Added canTeamEdit, character limits, updatedAt
- **TeamInvites**: Added token field for secure invite links

### Deferred to Future Phases
- Real-time collaborative streaming (multi-user)
- Public Sidekiq directory and sharing via link (Phase 2)
- Thread sharing via public link (Phase 2.4)
- Advanced analytics and performance monitoring
- Sidekiq custom avatar uploads (using initials in MVP)
- Advanced database admin UI for pricing (ENV-based in MVP)

### Open Questions & Future Considerations
- **Context Window Management**: How to handle approaching token limits gracefully? (Warning at 80%, error with suggestions)
- **Concurrent Editing**: Implement optimistic locking in future for team Sidekiqs
- **Redis/Caching**: May need Redis for rate limiting at scale (or use Vercel Edge Config)
- **Folder Organization**: Sidekiq folders may be deferred depending on MVP timeline
- **Export Functionality**: Usage data export to CSV (future enhancement)

---

## Appendix: Environment Variables

### Required ENV Variables
```bash
# Database
DATABASE_URL=

# Better-Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Vercel AI Gateway
# Single unified API key for accessing all models through Vercel AI Gateway
# Provider-specific keys (OpenAI, Anthropic, etc.) are configured in Vercel AI Gateway dashboard
VERCEL_AI_GATEWAY_API_KEY=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=


# Email (for invites and password reset)
RESEND_API_KEY=
FROM_EMAIL=

# App Config
NEXT_PUBLIC_APP_URL=
```

