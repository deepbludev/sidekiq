# Codebase Concerns

**Analysis Date:** 2026-01-22

## Test Coverage Gaps

**Unit Tests Coverage:**
- What's not tested: tRPC routers, API endpoints, and server-side business logic
- Files: `src/server/api/routers/health.ts`, `src/server/api/trpc.ts`
- Risk: No validation that API endpoints function correctly or handle errors appropriately. Changes to tRPC configuration or procedure definitions could break API functionality silently.
- Priority: High - Core API functionality depends on tRPC routers which have zero test coverage

**Database and ORM Logic:**
- What's not tested: Drizzle ORM queries, schema validations, and database operations
- Files: `src/server/db/schema.ts`, `src/server/db/index.ts`
- Risk: Database operations cannot be verified without tests. Foreign key cascades, indexes, and relationships are not validated.
- Priority: High - Data persistence is critical

**Component Integration Tests:**
- What's not tested: Component-level integration tests beyond basic Playwright E2E tests
- Files: `src/components/auth/*`, `src/app/(dashboard)/*`
- Risk: Components may break internally or fail to handle edge cases not covered by E2E tests
- Priority: Medium - Basic E2E tests exist but component-level behavior is untested

**Server Functions & Auth Logic:**
- What's not tested: Better Auth configuration, session handling, password reset flow
- Files: `src/server/better-auth/config.ts`, `src/server/better-auth/server.ts`
- Risk: Authentication is foundational; bugs here directly compromise security and user access
- Priority: High

## Security Considerations

**Email Disclosure Prevention:**
- Risk: Forgot password endpoint returns generic message to prevent email enumeration, but implementation relies on proper Better Auth configuration
- Files: `src/components/auth/forgot-password-form.tsx` (line 48-50), `src/server/better-auth/config.ts`
- Current mitigation: Generic error message is shown to users; Better Auth handles backend validation
- Recommendations: Add integration tests to verify email enumeration is actually prevented; validate Better Auth version is up-to-date

**BETTER_AUTH_SECRET in Development:**
- Risk: `BETTER_AUTH_SECRET` is optional in development (line 11 of `src/env.js`), allowing development builds without proper secret key generation
- Files: `src/env.js`
- Current mitigation: Environment validation schema makes it required in production
- Recommendations: Consider requiring secret even in development to catch misconfiguration early; add documentation warning about development-only patterns

**Token Validation:**
- Risk: Reset password token is passed directly from URL query parameter to auth service with minimal client-side validation
- Files: `src/app/(auth)/reset-password/page.tsx`, `src/components/auth/reset-password-form.tsx`
- Current mitigation: Better Auth handles token validation server-side
- Recommendations: Add server-side token validation before rendering form; implement rate limiting on password reset attempts

**Session Token Storage:**
- Risk: Session tokens are stored in cookies managed by Better Auth; depends entirely on Better Auth's secure cookie implementation
- Files: `src/server/better-auth/client.ts`, `src/middleware.ts`
- Current mitigation: Better Auth uses secure, httpOnly cookies by default
- Recommendations: Verify Better Auth version v1.3 has no known security advisories; document session security assumptions

## Fragile Areas

**Middleware Route Protection:**
- Files: `src/middleware.ts`
- Why fragile: Route protection logic is hardcoded in middleware. Adding new protected routes requires modifying middleware directly. Route patterns are string-based without TypeScript validation.
- Safe modification: Define route groups as constants; consider using path matching library instead of string includes; add tests for new route patterns
- Test coverage: Only E2E tests verify redirect behavior (line 92-105 of `tests/e2e/auth.spec.ts`)

**Better Auth Configuration:**
- Files: `src/server/better-auth/config.ts`
- Why fragile: Email template is hardcoded in config (lines 31-45). Changing email appearance requires modifying code. Resend client initialization can fail silently if API key is missing.
- Safe modification: Extract email templates to separate files; wrap Resend initialization in try/catch; add validation for template variables
- Test coverage: No tests verify email is actually sent or template rendering

**Database Connection Caching:**
- Files: `src/server/db/index.ts`
- Why fragile: Development connection is cached on `globalThis` (lines 11-16). This can cause issues if environment variables change during development without full restart. No cleanup/disposal mechanism.
- Safe modification: Add explicit cache clearing method; implement proper connection pooling limits; document that HMR requires server restart for DB URL changes
- Test coverage: No tests verify connection pooling behavior

**Auth Form Error Handling:**
- Files: `src/components/auth/sign-in-form.tsx`, `src/components/auth/sign-up-form.tsx`
- Why fragile: All forms use generic try/catch with "An unexpected error occurred" message. Specific errors from Better Auth are only shown if error.message exists.
- Safe modification: Create error mapping utility to categorize auth errors (network, validation, server); add proper error boundaries; log unexpected errors for monitoring
- Test coverage: E2E tests only check for validation errors, not server error handling

## Missing Critical Features

**Password Security Requirements:**
- Problem: Validation only checks length (8-128 characters) but not complexity (uppercase, lowercase, numbers, special chars)
- Blocks: Users could set weak passwords like "12345678" that meet requirements but offer poor security
- Files: `src/lib/validations/auth.ts` (line 14-15, 50-51)

**Rate Limiting:**
- Problem: No rate limiting on authentication endpoints (sign-in, sign-up, password reset)
- Blocks: System is vulnerable to brute force and credential stuffing attacks
- Files: `src/server/better-auth/config.ts`, `src/app/api/auth/[...all]/route.ts`

**Input Sanitization:**
- Problem: User input (name, email) is not explicitly sanitized before storing; relies on Zod validation alone
- Blocks: Potential for stored XSS if input is displayed without escaping, or injection attacks in future features
- Files: `src/lib/validations/auth.ts` (no sanitization schema)

**Audit Logging:**
- Problem: No audit logs for authentication events, password resets, or sensitive operations
- Blocks: Cannot investigate security incidents or track user activity
- Files: `src/server/better-auth/config.ts` (no logging hooks)

**CSRF Protection Verification:**
- Problem: No visible CSRF protection configuration; relies on framework defaults
- Blocks: If Next.js CSRF protection is accidentally disabled, endpoints become vulnerable
- Files: `next.config.js`, `src/app/api/auth/[...all]/route.ts`

## Performance Bottlenecks

**Database Connection for Every Request:**
- Problem: Each request creates a new Drizzle ORM instance wrapping the cached connection, but connection pooling limits are not explicitly configured
- Files: `src/server/db/index.ts`, `postgres` package configuration
- Cause: Postgres connection pool may become saturated under load with default configuration
- Improvement path: Configure postgres pool limits explicitly; implement connection monitoring; use read replicas for queries if scaling is needed

**Artificial Network Latency in Development:**
- Problem: tRPC timing middleware adds 100-500ms random delay on every API call in development (lines 92-95 of `src/server/api/trpc.ts`)
- Files: `src/server/api/trpc.ts`
- Cause: Intentional for catching waterfalls but makes development feedback slow
- Improvement path: Make latency injection configurable; consider only applying to specific routes; document how to disable for debugging

**No Query Result Caching:**
- Problem: No caching layer for tRPC queries; every request hits the database
- Files: `src/server/api/root.ts` (health router is only defined endpoint)
- Cause: Application architecture appears incomplete; missing user/thread/sidekiq query routers
- Improvement path: Implement Redis caching with invalidation strategy; use React Query with persistent cache; implement incremental static regeneration where appropriate

## Scaling Limits

**Email Sending:**
- Current capacity: Resend free tier allows 100 emails/day in testing, production varies by plan
- Limit: Will hit Resend rate limits with user growth
- Scaling path: Implement email queuing system (Bull/BullMQ); add retry logic with exponential backoff; monitor Resend usage metrics

**Database Scaling:**
- Current capacity: Single PostgreSQL instance with basic indexing on schema
- Limit: Single instance will bottleneck at 1000+ concurrent connections or large datasets
- Scaling path: Implement read replicas for queries; partition hot tables (messages, threads); add pg_partman for time-based partitioning; implement caching layer (Redis)

**File Storage:**
- Current capacity: Vercel Blob configured but no size limits or storage strategy defined
- Limit: Unbounded uploads could exhaust storage quota
- Scaling path: Implement file size validation; set storage quotas per user; implement S3 or similar for cheaper storage at scale

## Dependencies at Risk

**Better Auth v1.3:**
- Risk: Relatively new authentication library with smaller community than established alternatives (NextAuth.js). Risk of API changes or security issues being slower to address.
- Impact: Breaking changes in minor versions could require significant refactoring of auth config and client code
- Migration plan: Monitor GitHub releases; pin exact version; maintain written specs of auth flows for easier migration if needed; consider NextAuth.js or Auth.js for wider ecosystem support

**Drizzle ORM v0.41:**
- Risk: Still in v0.x series indicating API instability. SQL changes could require schema migrations.
- Impact: Query refactoring if ORM API changes; potential migration data issues
- Migration plan: Test minor version upgrades in CI before applying; maintain separate migration scripts; document all custom queries for easier refactoring

**Next.js Middleware:**
- Risk: Middleware routing patterns are framework-specific and may change across versions. Decorators/patterns used in middleware might be deprecated.
- Impact: Middleware would break on major Next.js upgrades
- Migration plan: Keep middleware logic minimal; test major version upgrades early; consider separating route protection to a separate service

## Tech Debt

**Incomplete API Router:**
- Issue: Only `health` router defined in `src/server/api/root.ts`. All planned endpoints (threads, sidekiqs, messages, etc.) are missing.
- Files: `src/server/api/root.ts`, `src/server/api/routers/`
- Impact: Cannot perform any application operations despite complete schema definition
- Fix approach: Implement routers for all database tables; add permission checks; integrate with tRPC middleware

**Hardcoded Email Template:**
- Issue: Password reset email template is embedded in `config.ts` as HTML string. Changes require code deployment.
- Files: `src/server/better-auth/config.ts` (lines 31-45)
- Impact: Marketing/support cannot update emails without engineer; easy to introduce HTML errors; not internationalized
- Fix approach: Move templates to separate files; use template engine (mjml or handlebars); add i18n support

**No Error Monitoring:**
- Issue: Errors are logged to console with no centralized tracking or alerting
- Files: `src/server/better-auth/config.ts` (line 49, 55), `src/components/auth/*` (catch blocks)
- Impact: Production errors go unnoticed; difficult to debug user-reported issues
- Fix approach: Integrate Sentry or similar; add structured logging; set up alerts for critical errors

**Middleware Duplicates Session Lookup:**
- Issue: Middleware calls `getSessionCookie()` for route protection while tRPC context calls `auth.api.getSession()`. Two different session validation paths.
- Files: `src/middleware.ts` (line 34), `src/server/api/trpc.ts` (line 30)
- Impact: Inconsistent session handling; security check could drift; harder to maintain
- Fix approach: Create single session utility function; add tests verifying both paths produce identical results; consider centralizing in middleware

**Console Logging in Production:**
- Issue: Authentication system logs reset URLs and token confirmations to console (lines 18-19 of `config.ts`)
- Files: `src/server/better-auth/config.ts`
- Impact: URLs/tokens will appear in production logs accessible to anyone with log access; potential security exposure
- Fix approach: Replace console.log with structured logging; filter sensitive data; use logger levels appropriately

---

*Concerns audit: 2026-01-22*
