# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**Email Service:**
- Resend - Transactional email provider
  - SDK/Client: `resend` v6.8.0
  - Auth: `RESEND_API_KEY` environment variable
  - Usage: Password reset emails via `src/server/better-auth/config.ts`
  - Configuration: Email sender address via `EMAIL_FROM` env var

**File Storage:**
- Vercel Blob - Cloud file storage
  - SDK/Client: `@vercel/blob` v2.0.0
  - Auth: `BLOB_READ_WRITE_TOKEN` environment variable
  - Usage: Avatar image uploads/management at `src/lib/blob.ts`
  - Access level: Public storage with path-based organization

**Authentication Providers:**
- GitHub OAuth
  - Integration: Via better-auth GitHub provider
  - Credentials: `BETTER_AUTH_GITHUB_CLIENT_ID` and `BETTER_AUTH_GITHUB_CLIENT_SECRET`
  - Setup: Create OAuth app at https://github.com/settings/developers

## Data Storage

**Databases:**
- PostgreSQL 17 (Alpine)
  - Connection: `DATABASE_URL` environment variable
  - Client: postgres driver v3.4.4 with Drizzle ORM
  - Port: 5432 (default), 5433 (Docker Compose)
  - Adapter: `@auth/drizzle-adapter` for better-auth integration

**Database Tables:**
- `user` - User accounts (from better-auth)
- `session` - Active sessions
- `account` - OAuth provider accounts
- `verification` - Email verification codes
- `team` - Team collaboration groups
- Additional tables for chats, sidekiq assistants, and messages (schema at `src/server/db/schema.ts`)

**File Storage:**
- Vercel Blob for user avatars
  - Path structure: `avatars/{userId}/{timestamp}.{ext}`
  - Public accessibility enabled
  - File types: JPEG, PNG, GIF, WebP
  - Max size: 5MB

**Caching:**
- None configured - In-memory React Query client caching only

## Authentication & Identity

**Auth Provider:**
- better-auth v1.3
  - Implementation: Full-featured auth library with session management
  - Email/password authentication enabled
  - GitHub OAuth provider configured
  - Password reset functionality with email verification

**Session Management:**
- Database-persisted sessions via Drizzle ORM
- Session table structure:
  - `id`, `token` (unique), `expiresAt`
  - `userId`, `ipAddress`, `userAgent`
  - Cookies: Via `better-auth/cookies` utility
  - Middleware: Session validation at `src/middleware.ts`

**OAuth Flow:**
- GitHub provider via better-auth
- Credentials stored in `account` table with refresh token support
- Automatic account linking

## Monitoring & Observability

**Error Tracking:**
- Not detected - Console logging only

**Logs:**
- Console-based logging
  - Authentication events logged at `src/server/better-auth/config.ts`
  - Error tracking via console.error() and console.log()

**Performance:**
- React Query devtools available (client-side)

## CI/CD & Deployment

**Hosting:**
- Docker containerization with Docker Compose (development)
- Deployment ready for: Vercel, Railway, or any Node.js host

**CI Pipeline:**
- Not detected - No GitHub Actions workflows in repository

**Database Migrations:**
- drizzle-kit for schema management
- Commands:
  - `npm run db:generate` - Generate migration files
  - `npm run db:migrate` - Run pending migrations
  - `npm run db:push` - Push schema to database
  - `npm run db:studio` - Open Drizzle Studio GUI

## Environment Configuration

**Required env vars (production):**
- `BETTER_AUTH_SECRET` - Auth session signing (required in production)
- `BETTER_AUTH_URL` - Auth callback base URL (e.g., https://yourdomain.com)
- `BETTER_AUTH_GITHUB_CLIENT_ID` - GitHub OAuth credential
- `BETTER_AUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth credential
- `DATABASE_URL` - PostgreSQL connection string (postgresql://user:pass@host:port/db)

**Optional env vars:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage (required for avatar uploads)
- `RESEND_API_KEY` - Email service (required for password reset emails)
- `EMAIL_FROM` - Sender email (defaults to noreply@sidekiq.app)
- `NODE_ENV` - Environment (development/test/production, defaults to development)

**Secrets location:**
- Local: `.env` file (gitignored, not committed)
- CI/CD: Environment variables (not configured yet)
- Production: Deployment platform secrets (Vercel, Railway, Docker, etc.)

## Webhooks & Callbacks

**Incoming:**
- `/api/auth/[...all]` - better-auth route handler
  - Handles: OAuth callbacks, password reset links, email verification
  - Location: `src/app/api/auth/[...all]/route.ts`

**Outgoing:**
- Resend email webhooks (optional, not currently configured)
- No other outgoing webhooks detected

## API Architecture

**RPC Framework:**
- tRPC v11.0.0 - End-to-end typesafe RPC
  - Server: `@trpc/server` at `src/server/api/`
  - Client: `@trpc/client` with React Query integration
  - Endpoint: `/api/trpc/[trpc]` (dynamic route)
  - Serialization: superjson for complex types (Date, Map, Set, etc.)

**Current Routers:**
- `health` - Health check endpoint

**Authentication Context:**
- Sessions validated via better-auth middleware
- User context available in tRPC procedures
- Type-safe session data via Drizzle adapter

---

*Integration audit: 2026-01-22*
