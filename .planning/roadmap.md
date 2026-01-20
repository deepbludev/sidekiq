# 9. Implementation Roadmap

## Version 0. MVP
### Phase 0.0. Foundation ✅
- [x] 0.0.1. Scaffolding Next.js + shadcn/ui + tailwindcss + better-auth base setup
- [x] 0.0.2. tRPC setup with type-safe routes and Zod validation
- [x] 0.0.3. Database setup (PostgreSQL) with Drizzle ORM
- [x] 0.0.4. Drizzle migrations for core data models (Users, Teams, TeamMembers, TeamInvites, Sidekiqs, Threads, Messages)
- [x] 0.0.6. Vercel Blob Storage setup for avatar uploads

### Phase 0.1. Authentication 🟡
- [x] 0.1.1. Better-Auth integration (GitHub OAuth configured)
- [ ] 0.1.2. Email/Password authentication with validation
- [ ] 0.1.3. Password reset flow with email tokens (1-hour expiration)
- [~] 0.1.4. Protected routes and middleware for authenticated pages (tRPC procedures done, page middleware pending)

### Phase 0.2. Core Chat
- [ ] 0.2.1. Basic chat UI with sidebar (history) and main chat area
- [ ] 0.2.2. Integration with LLM providers (OpenAI/Anthropic) using Vercel AI SDK
- [ ] 0.2.3. Server-Sent Events (SSE) for streaming AI responses
- [ ] 0.2.4. Message persistence with enhanced schema (model, tokens, metadata, parentMessageId)
- [ ] 0.2.5. Thread management: create, auto-title generation after first exchange
- [ ] 0.2.6. Model picker (dropdown near input) with persistent selection per thread
- [ ] 0.2.7. Delete a thread (permanent with confirmation dialog)
- [ ] 0.2.8. Archive a thread (soft delete, recoverable)
- [ ] 0.2.9. Pin a thread (sticky to top of sidebar)
- [ ] 0.2.10. Edit a message (always creates branch with parent-child references)
- [ ] 0.2.11. Message regeneration (regenerate last AI response)
- [ ] 0.2.12. Conversation branching navigation (< 2 / 5 > controls)
- [ ] 0.2.13. Optimistic UI for message sending with error rollback
- [ ] 0.2.14. Empty states with CTAs for new users
- [ ] 0.2.15. Loading states (skeletons, streaming indicators)
- [ ] 0.2.16. Scroll position preservation when switching threads
- [ ] 0.2.17. Sidebar search functionality (search threads by title/content)
- [ ] 0.2.18. Date grouping in sidebar (Today/Yesterday/This Week/Older)

### Phase 0.3. Sidekiqs (The "Gem" Feature)
- [ ] 0.3.1. CRUD pages for Sidekiqs with validation (max 4000 char instructions, 100 char names)
- [ ] 0.3.2. Text initial avatars for Sidekiqs (colored circles with initials)
- [ ] 0.3.3. Chat with a Sidekiq (instructions prepended as system message)
- [ ] 0.3.4. Sidekiq visual indicators in sidebar (icon, badge, subtitle with Sidekiq name)
- [ ] 0.3.5. Rate limiting: max 100 Sidekiqs per user, 10 creations per hour
- [ ] 0.3.6. Empty states for users with no Sidekiqs
- [ ] 0.3.7. Organize Sidekiqs in folders (optional, may defer)

### Phase 0.4. UI/UX & Polish
- [ ] 0.4.1. UI refinements (animations, glass effects).
- [ ] 0.4.2. Edge case handling.
- [ ] 0.4.3. SEO tags (even for an app, title/meta are important).

### Phase 0.5. Teams
- [ ] 0.5.1. Team creation and management pages
- [ ] 0.5.2. Token-based team member invites (email with secure link, 7-day expiration)
- [ ] 0.5.3. Team member management (view members, roles, remove members)
- [ ] 0.5.4. Sidekiq team sharing logic (canTeamEdit flag for permissions)
- [ ] 0.5.5. Team Sidekiq permissions: view/use for all, edit based on canTeamEdit flag
- [ ] 0.5.6. Team deletion flow (transfers team Sidekiqs to owner with confirmation)
- [ ] 0.5.7. Team authorization middleware for secure access control


## Version 1. Advanced Features & Monetization

### Phase 1.1. Advanced Chat Features: Tools
- [ ] 1.1.1. Web Search: real-time information retrieval.
- [ ] 1.1.2. Image Generation: generating images on demand.
- [ ] 1.1.3. Deep Research: complex multi-step reasoning/research tasks.

### Phase 1.2. Advanced Chat Features: Branching
- [ ] 1.2.1. Users can edit any user message to fork the conversation tree.
- [ ] 1.2.2. Users can navigate between branches (e.g., `< 2 / 5 >` navigation controls).

### Phase 1.3. Advanced Chat Features: Other Features
- [ ] 1.3.1. Share a chat with link (copy link to chat).

### Phase 1.4. Projects: Organize chats
- [ ] 1.4.1. Projects management: create, edit, delete projects.
- [ ] 1.4.2. Project membership: add/remove members to a project.
- [ ] 1.4.3. Project visibility: public/private.
- [ ] 1.4.4. Project settings: edit project name, description, avatar, etc.
- [ ] 1.4.5. Project sharing: share a project with team members.
- [ ] 1.4.6. Project view/edit/create permissions within a project.

### Phase 1.5: Payments & Billing
- [ ] 1.5.1. Database migrations for CreditBalances, CreditTransactions, UsageRecords, Subscriptions tables
- [ ] 1.5.2. Stripe integration (Checkout Sessions, Webhooks) for top-ups
- [ ] 1.5.3. Base subscription plan ($20/month with $20 credits, no rollover)
- [ ] 1.5.4. Credit deduction middleware (asynchronous, after response delivery)
- [ ] 1.5.5. Usage tracking per message (tokens, model, cost calculation from ENV variables)
- [ ] 1.5.6. User & team credit balance management (dual-level tracking)
- [ ] 1.5.7. Insufficient credits handling (auto-top-up if configured, else block with prompt)
- [ ] 1.5.8. Negative balance grace period (-$5 max)
- [ ] 1.5.9. Auto-top-up configuration and background jobs (Inngest or Vercel Cron)
- [ ] 1.5.10. Usage dashboard: view usage by model with graphs (total usage + usage over time)
- [ ] 1.5.11. Stripe webhook handlers with signature validation and idempotency

### Phase 1.6. General Improvements
- [ ] 1.6.1. Social login (Google).
- [ ] 1.6.2. Vercel Observability for monitoring and logging.
- [ ] 1.6.3. UI/UX improvements and refinements.
---