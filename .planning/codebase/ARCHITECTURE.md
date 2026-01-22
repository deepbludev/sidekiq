# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Full-stack Next.js with tRPC backend-for-frontend (BFF) pattern, using server components for authentication and client components for interactive UI.

**Key Characteristics:**
- Next.js 15 App Router with layout-based architecture
- Type-safe RPC layer via tRPC with React Query client-side
- Server-side session management via Better Auth with middleware protection
- Database-first with Drizzle ORM on PostgreSQL
- Strict TypeScript with Zod runtime validation at all boundaries
- Component-driven UI with Radix UI + Tailwind CSS

## Layers

**Presentation Layer:**
- Purpose: User-facing components and pages rendered via Next.js App Router
- Location: `src/app/`, `src/components/`
- Contains: Page components (RSC), Client components ("use client"), UI components (Radix-based)
- Depends on: tRPC client, server auth, UI libraries
- Used by: End users via HTTP/Browser

**API Gateway Layer:**
- Purpose: HTTP entry points for tRPC and auth endpoints
- Location: `src/app/api/trpc/[trpc]/route.ts`, `src/app/api/auth/[...all]/route.ts`
- Contains: Request handlers delegating to tRPC router and Better Auth handler
- Depends on: tRPC router, Better Auth instance
- Used by: Client-side API calls, auth flows

**Business Logic Layer (tRPC Routers):**
- Purpose: Type-safe procedure definitions with authorization and validation
- Location: `src/server/api/routers/`, `src/server/api/trpc.ts`, `src/server/api/root.ts`
- Contains: Public and protected procedures, middleware, error handling
- Depends on: Database layer, auth context
- Used by: tRPC client (frontend), server-side callers

**Authentication Layer:**
- Purpose: Session management and OAuth/email-password auth flow
- Location: `src/server/better-auth/`
- Contains: Auth config, email sending, OAuth providers, session utilities
- Depends on: Database (session/user/account/verification tables), Resend email service
- Used by: Middleware, layouts, protected pages

**Data Access Layer:**
- Purpose: Type-safe database queries and schema definitions
- Location: `src/server/db/`
- Contains: Drizzle ORM connection, schema definitions with relations
- Depends on: PostgreSQL database
- Used by: tRPC routers, Better Auth adapter

**Middleware/Guards:**
- Purpose: Route protection and session validation
- Location: `src/middleware.ts`
- Contains: Public route definitions, auth route redirects, unauthenticated redirects
- Depends on: Better Auth session cookie utilities
- Used by: Next.js request pipeline

## Data Flow

**Authentication Flow:**

1. User navigates to `/sign-in` or `/sign-up`
2. Middleware checks session cookie via `getSessionCookie()` from better-auth
3. If unauthenticated, middleware allows access to public routes
4. SignInForm/SignUpForm component ("use client") calls `authClient.signIn.email()` or `authClient.signUp.email()`
5. Better Auth handler at `/api/auth/[...all]` processes request
6. Better Auth validates credentials against database, creates session
7. Session cookie set in response headers
8. User redirected to `/dashboard`
9. Middleware sees valid session cookie, allows access to protected routes
10. DashboardLayout and nested pages verify session server-side via `getSession()` cache
11. Protected pages render authenticated content

**API Data Flow (tRPC):**

1. Client component calls `api.health.check.useQuery()`
2. tRPC React Query hook sends HTTP POST to `/api/trpc?batch=1` (batched)
3. HTTP handler at `src/app/api/trpc/[trpc]/route.ts` receives request
4. Handler calls `createContext()` which retrieves session via `auth.api.getSession()`
5. Session added to tRPC context
6. tRPC router processes procedure (timing middleware logs execution)
7. Procedure executes (access to db, session, headers in ctx)
8. Response serialized with SuperJSON and sent back
9. React Query updates state, component re-renders

**State Management:**

- Authentication state: Stored in HTTP-only session cookies (Better Auth)
- Server-side queries: Cached with React's `cache()` in layout/page components (deduped within request)
- Client-side queries: Managed by TanStack React Query with tRPC plugin
- Form state: React Hook Form with Zod validation
- UI notifications: Sonner toast notifications

## Key Abstractions

**Procedure Types:**

- `publicProcedure`: Any caller can invoke. Has timing middleware.
  - Example: `src/server/api/routers/health.ts` health.check
  - Pattern: `publicProcedure.query(() => { ... })`

- `protectedProcedure`: Only authenticated users. Validates session exists, throws UNAUTHORIZED if not.
  - Pattern: `protectedProcedure.mutation(({ ctx }) => { ctx.session.user ... })`
  - ctx.session guaranteed non-null due to middleware

**Schema & Validation:**

- Database schemas: `src/server/db/schema.ts` with Drizzle ORM table definitions
  - Relations defined inline with `relations()` helper
  - Enums: `teamRoleEnum`, `messageRoleEnum`
  - Key tables: user, session, account, verification, teams (todo: messages, sidekiqs)

- Input validation: `src/lib/validations/auth.ts` with Zod schemas
  - Example: `signInSchema = z.object({ email: z.string().email(), password: z.string().min(1) })`
  - Type inference: `type SignInInput = z.infer<typeof signInSchema>`
  - Used in forms with `react-hook-form` via `zodResolver`

**Context Creation:**

- `createTRPCContext()` in `src/server/api/trpc.ts`:
  - Extracts session via `auth.api.getSession({ headers })`
  - Provides `db`, `session`, `headers` to all procedures
  - Called once per HTTP request, caches in development

**Auth Client:**

- `authClient` in `src/server/better-auth/client.ts`: Browser-side auth API
  - Methods: `signIn.email()`, `signUp.email()`, `signOut()`, etc.
  - Handles redirects and error responses

**Session Access:**

- Server-side: `getSession()` cached function in `src/server/better-auth/server.ts`
  - Used in layouts/pages: `const session = await getSession()`
  - Cached per request, prevents duplicate auth API calls
- Middleware: Direct cookie check via `getSessionCookie(request)`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: First load of any route
- Responsibilities: Provides TRPCReactProvider (client state), Sonner Toaster, global styles

**Public Homepage:**
- Location: `src/app/page.tsx`
- Triggers: GET /
- Responsibilities: Redirects authenticated users to /dashboard, shows CTA for unauthenticated

**Auth Routes (Public Group):**
- Location: `src/app/(auth)/layout.tsx` and nested pages
- Triggers: GET /sign-in, /sign-up, /forgot-password, /reset-password
- Responsibilities: Centered auth forms with logo, redirects authenticated users away

**Dashboard Route (Protected Group):**
- Location: `src/app/(dashboard)/layout.tsx` and nested pages
- Triggers: GET /dashboard (and any /dashboard/* child routes)
- Responsibilities: Verifies session server-side, renders protected content

**tRPC API:**
- Location: `src/app/api/trpc/[trpc]/route.ts`
- Triggers: POST/GET /api/trpc?..., /api/trpc/health.check, etc.
- Responsibilities: HTTP request handler, context creation, router dispatch

**Better Auth Handler:**
- Location: `src/app/api/auth/[...all]/route.ts`
- Triggers: POST/GET /api/auth/sign-up, /api/auth/sign-in, /api/auth/sign-out, etc.
- Responsibilities: Auth flows (signup, signin, password reset), session management

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every HTTP request (except static assets, Next.js internals)
- Responsibilities: Route protection, session validation, redirects

## Error Handling

**Strategy:** Async/await with try/catch for control flow; Zod for input validation; tRPC TRPCError for API errors.

**Patterns:**

- **Form validation:** Zod schema validation, errors displayed inline via `FormMessage` component
  - Example: `signInSchema` rejects empty passwords, mismatched confirmations
  - Errors shown per-field in form UI

- **API errors:** tRPC catches errors, formats with `zodError` if cause is ZodError
  - Protected procedures throw `TRPCError({ code: "UNAUTHORIZED" })`
  - Client receives typed error via React Query error state

- **Auth failures:** Better Auth returns `{ error }` in response
  - Forms check `if (error)` and display toast via `toast.error()`
  - Example in `SignInForm`: catch block handles auth failure

- **Database errors:** Not explicitly caught (Drizzle throws, bubbles to tRPC error formatter)
  - Development logs tRPC failures to console
  - Production returns generic error to client

- **Session missing:** Middleware redirects to /sign-in with callbackUrl
  - Layouts additionally redirect if session falsy
  - Double-layer protection (middleware + layout)

## Cross-Cutting Concerns

**Logging:**
- Development only via console statements
- tRPC timing middleware logs procedure execution time: `[TRPC] {path} took {ms}ms`
- Auth logging: password reset, email send success/failure in `src/server/better-auth/config.ts`

**Validation:**
- Input: Zod schemas at form level (`react-hook-form`) and API level (tRPC procedures accept zod schemas)
- Output: Implicit via TypeScript types; Zod inferred types guide frontend
- Environment: `src/env.js` validates server and client env vars at startup

**Authentication:**
- Better Auth handles credential verification, OAuth, session lifecycle
- Middleware protects routes at HTTP level
- Layouts provide secondary defense server-side
- Client components trust session from context

**Type Safety:**
- TypeScript strict mode enforced (tsconfig.json)
- tRPC infers types: `RouterInputs`, `RouterOutputs` generated from router
- Zod ensures runtime validation matches static types
- Server-only imports via `server-only` package in auth/db modules

