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
- **Model Selection**: Ability to switch between underlying base models (e.g., GPT-4o, Claude 3.5 Sonnet) - *Implementation detail: abstraction layer for LLM provider.*

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
- **AI Integration**: Vercel AI SDK (recommended for standardizing generic providers).
- **LLM Gateway**: Vercel Gateway.
- **Deployment**: Vercel.

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

### TeamInvites
- `id` (UUIDv7)
- `teamId` (FK -> Team)
- `email` (String)
- `role` (enum: 'owner' | 'member')
- `joinedAt`
- `acceptedAt`
- `rejectedAt`
- `expiresAt`
- `createdAt`

#### Sidekiqs
- `id` (UUIDv7)
- `ownerId` (FK -> User)
- `teamId` (FK -> Team, nullable - if set, shared with team)
- `name` (String)
- `description` (String, optional)
- `instructions` (Text)
- `isPublic` (Boolean, default false)
- `createdAt`

#### Threads (Conversations)
- `id` (UUIDv7)
- `userId` (FK -> User)
- `sidekiqId` (FK -> Sidekiq, nullable)
- `title` (String, auto-generated or user set)
- `createdAt`

#### Messages
- `id` (UUIDv7)
- `threadId` (FK -> Thread)
- `role` (enum: 'user' | 'assistant' | 'system')
- `content` (Text)
- `createdAt`

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

## 5. Implementation Roadmap

### Version 1. MVP
#### Phase 1.0. Foundation
- 1.0.1. Scaffolding Next.js + shadcn/ui + tailwindcss
- 1.0.2. tRPC setup
- 1.0.3. Database setup (PostgreSQL) with Drizzle ORM
- 1.0.4. Drizzle migrations.

#### Phase 1.1. Authentication
- 1.2.1. Better-Auth integration.
- 1.2.2. Email/Password authentication.

#### Phase 1.2. Core Chat
- 1.2.1. Basic chat UI.
- 1.2.2. Integration with a couple of LLM providers (OpenAI/Anthropic).
- 1.2.3. Message persistence.
- 1.2.4. Model picker.
- 1.2.5. Delete a chat.
- 1.2.6. Archive a chat.
- 1.2.7. Pin a chat.
- 1.2.8. Edit a message.

#### Phase 1.3. Sidekiqs (The "Gem" Feature)
- 1.3.1. CRUD pages for Sidekiqs.
- 1.3.2. Chat with a Sidekiq.
- 1.3.3. Public Sidekiqs (share with link).
- 1.3.4. Organize Sidekiqs in folders.

#### Phase 1.4. UI/UX & Polish
- 1.4.1. UI refinements (animations, glass effects).
- 1.4.2. Edge case handling.
- 1.4.3. SEO tags (even for an app, title/meta are important).

#### Phase 1.5. Teams
- 1.5.1. Team creation.
- 1.5.2. Team member invites.
- 1.5.3. Team member management.
- 1.5.4. Sidekiq team sharing logic (share with team members).
- 1.5.5. Sidekiq view/edit/create permissions within a team.

### Version 2. Premium
#### Phase 2.1. Authentication
- 2.1.1. Social login (Google).

#### Phase 2.2. Advanced Chat Features: Tools
- 2.2.1. Web Search: real-time information retrieval.
- 2.2.2. Image Generation: generating images on demand.
- 2.2.3. Deep Research: complex multi-step reasoning/research tasks.

#### Phase 2.3. Advanced Chat Features: Branching
- 2.3.1. Users can edit any user message to fork the conversation tree.
- 2.3.2. Users can navigate between branches (e.g., `< 2 / 5 >` navigation controls).

#### Phase 2.4. Advanced Chat Features: Other Features
- 2.4.1. Share a chat with link (copy link to chat).

#### Phase 2.5. Projects: Organize chats
- 2.5.1. Projects management: create, edit, delete projects.
- 2.5.2. Project membership: add/remove members to a project.
- 2.5.3. Project visibility: public/private.
- 2.5.4. Project settings: edit project name, description, avatar, etc.
- 2.5.5. Project sharing: share a project with team members.
- 2.5.6. Project view/edit/create permissions within a project.

#### Phase 2.5: Payments & Billing
- 2.5.1. Stripe integration (Checkout Sessions, Webhooks) for Top-ups.
- 2.5.2. Subscription logic for Base Plan.
- 2.5.3. Usage tracking middleware to deduct credits.
- 2.5.4. Auto-top-up background jobs (e.g., via Inngest or specialized worker).

