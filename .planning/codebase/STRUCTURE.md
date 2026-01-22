# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
sidekiq-webapp/
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router pages and layouts
│   │   ├── api/
│   │   │   ├── auth/[...all]/      # Better Auth handler (email, OAuth, session)
│   │   │   └── trpc/[trpc]/        # tRPC HTTP endpoint
│   │   ├── (auth)/                 # Public auth routes group
│   │   │   ├── sign-up/
│   │   │   ├── sign-in/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/            # Protected dashboard group
│   │   │   ├── dashboard/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx              # Root layout (TRPCReactProvider)
│   │   └── page.tsx                # Home page (redirect or CTA)
│   ├── components/
│   │   ├── auth/                   # Authentication forms and utilities
│   │   │   ├── sign-up-form.tsx
│   │   │   ├── sign-in-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── reset-password-form.tsx
│   │   │   ├── oauth-buttons.tsx
│   │   │   └── auth-card.tsx
│   │   └── ui/                     # Reusable Radix UI + Tailwind components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── form.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── separator.tsx
│   │       ├── scroll-area.tsx
│   │       ├── sheet.tsx
│   │       ├── tooltip.tsx
│   │       ├── skeleton.tsx
│   │       └── sonner.tsx          # Toast wrapper
│   ├── lib/
│   │   ├── validations/
│   │   │   └── auth.ts             # Zod schemas for auth forms
│   │   ├── utils.ts                # cn() utility for tailwind class merging
│   │   └── blob.ts                 # Vercel Blob integration
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   └── health.ts       # Health check router
│   │   │   ├── trpc.ts             # tRPC context, procedures (public/protected)
│   │   │   └── root.ts             # Main tRPC router (combines all subrouters)
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle ORM instance
│   │   │   └── schema.ts           # Database tables and relations
│   │   └── better-auth/
│   │       ├── index.ts            # Auth export
│   │       ├── config.ts           # Auth instance with email/OAuth setup
│   │       ├── server.ts           # getSession() cache utility
│   │       └── client.ts           # Browser-side auth client
│   ├── trpc/
│   │   ├── react.tsx               # TRPCReactProvider, tRPC + React Query setup
│   │   ├── server.ts               # Server-side tRPC caller
│   │   └── query-client.ts         # React Query client config
│   ├── styles/
│   │   └── globals.css             # Tailwind directives, globals
│   ├── middleware.ts               # Next.js middleware (route protection)
│   └── env.js                      # Environment variable validation with t3-env
├── tests/
│   ├── unit/
│   │   └── validations/
│   │       └── auth.test.ts        # Zod schema validation tests
│   ├── e2e/
│   │   └── auth.spec.ts            # Playwright e2e auth flows
│   └── setup.ts                    # Test environment setup
├── package.json
├── tsconfig.json
├── next.config.js
├── vitest.config.ts                # Vitest unit test configuration
├── playwright.config.ts            # Playwright e2e configuration
├── eslint.config.js                # ESLint configuration
├── .prettierrc                      # Prettier config (Tailwind CSS sort)
└── docker-compose.yml              # Local PostgreSQL + Redis (if used)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages, layouts, and API routes
- Contains: Page components (RSC), layout wrappers, HTTP handlers
- Key files:
  - `layout.tsx` - Root layout with providers
  - `page.tsx` - Homepage redirect logic
  - `(auth)/layout.tsx` - Auth page wrapper (centered, no sidebar)
  - `(dashboard)/layout.tsx` - Protected wrapper with session validation
  - `api/auth/[...all]/route.ts` - Auth flows (signup, signin, logout, password reset)
  - `api/trpc/[trpc]/route.ts` - tRPC endpoint

**`src/components/`:**
- Purpose: Reusable React components (UI primitives and feature components)
- Contains: Radix UI-based unstyled components, auth forms, page-specific components
- Key files:
  - `ui/` - Primitive components (Button, Input, Form, Card, etc.)
  - `auth/` - Auth flows (SignInForm, SignUpForm, OAuthButtons)

**`src/server/api/`:**
- Purpose: tRPC router definitions and request handling
- Contains: Procedure definitions, middleware, context setup
- Key files:
  - `trpc.ts` - Context factory, procedure builders (public/protected)
  - `root.ts` - Router composition
  - `routers/health.ts` - Example router with health check query

**`src/server/db/`:**
- Purpose: Database connection and schema definitions
- Contains: Drizzle ORM instance, table definitions
- Key files:
  - `index.ts` - Postgres connection, global singleton cache
  - `schema.ts` - All tables (user, session, account, verification, teams)

**`src/server/better-auth/`:**
- Purpose: Authentication setup and utilities
- Contains: Auth instance, email providers, session helpers
- Key files:
  - `config.ts` - Auth instance with email/OAuth/password reset
  - `client.ts` - Browser-side auth methods
  - `server.ts` - Server-side `getSession()` utility

**`src/trpc/`:**
- Purpose: Frontend tRPC client setup and configuration
- Contains: React Query + tRPC integration, provider
- Key files:
  - `react.tsx` - TRPCReactProvider (wraps app in root layout)
  - `query-client.ts` - React Query default config

**`src/lib/`:**
- Purpose: Shared utilities and validation schemas
- Contains: Zod schemas, CSS utilities, type helpers
- Key files:
  - `validations/auth.ts` - Zod schemas (signUp, signIn, resetPassword, etc.)
  - `utils.ts` - `cn()` for Tailwind class merging

**`tests/`:**
- Purpose: Unit and E2E tests
- Contains: Vitest unit tests, Playwright e2E specs
- Key files:
  - `unit/validations/auth.test.ts` - Schema validation tests
  - `e2e/auth.spec.ts` - Browser auth flows (signup, signin, logout)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root React component, wraps all pages with providers
- `src/app/page.tsx` - Homepage, public landing
- `src/middleware.ts` - HTTP request middleware, runs before routing

**Configuration:**
- `tsconfig.json` - TypeScript compiler options, path aliases (@sidekiq/*)
- `package.json` - Dependencies, scripts (dev, build, test, lint)
- `src/env.js` - Environment variable schema and runtime validation
- `next.config.js` - Next.js configuration (minimal in this project)

**Core Logic:**
- `src/server/api/root.ts` - Main tRPC router, entry point for all procedures
- `src/server/api/trpc.ts` - Context creation, procedure builders, middleware
- `src/server/better-auth/config.ts` - Auth instance setup with email and OAuth
- `src/server/db/schema.ts` - Complete database schema

**API Handlers:**
- `src/app/api/trpc/[trpc]/route.ts` - HTTP handler for tRPC
- `src/app/api/auth/[...all]/route.ts` - HTTP handler for Better Auth

**Testing:**
- `tests/unit/validations/auth.test.ts` - Zod schema validation unit tests
- `tests/e2e/auth.spec.ts` - Playwright E2E tests for auth flows
- `vitest.config.ts` - Unit test runner configuration
- `playwright.config.ts` - E2E test runner configuration

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Form/Component files: PascalCase: `SignInForm.tsx`, `OAuthButtons.tsx`
- Utility files: camelCase: `utils.ts`, `blob.ts`
- Validation schemas: descriptive: `auth.ts` (contains all auth schemas)
- Test files: match source with `.test.ts` suffix: `auth.test.ts`

**Directories:**
- Feature groups: kebab-case: `(auth)`, `(dashboard)`
- Component groups: lowercase: `auth/`, `ui/`, `routers/`
- Server modules: lowercase: `api/`, `db/`, `better-auth/`

**Functions/Components:**
- React components: PascalCase: `SignInForm`, `OAuthButtons`, `Card`
- Hooks: camelCase with `use` prefix: `useForm` (external), custom in component
- Utilities: camelCase: `cn()`, `getSession()`
- Constants: UPPER_SNAKE_CASE: `publicRoutes`, `authRoutes` (in middleware)

**Types/Interfaces:**
- Type aliases: PascalCase: `SignInInput`, `RouterInputs`, `RouterOutputs`
- Schema inference: `z.infer<typeof schema>`

## Where to Add New Code

**New Feature (Chat, Teams, Sidekiq):**
- Primary code: `src/server/api/routers/{feature}.ts` (tRPC router)
- Database schema: Add tables to `src/server/db/schema.ts`
- Validation: Add schemas to `src/lib/validations/{feature}.ts`
- Frontend pages: `src/app/(dashboard)/{feature}/page.tsx`
- Frontend components: `src/components/{feature}/{ComponentName}.tsx`
- Tests: `tests/unit/{feature}.test.ts` and `tests/e2e/{feature}.spec.ts`

**New Component/Module:**
- UI primitive: `src/components/ui/{ComponentName}.tsx`
- Feature-specific: `src/components/{feature}/{ComponentName}.tsx`
- Export from barrel file (if creating): index.ts in the directory

**Shared Utilities:**
- Type utilities: `src/lib/types/` (create if needed)
- Validation schemas: `src/lib/validations/{domain}.ts`
- CSS utilities: `src/lib/utils.ts`
- Helper functions: `src/lib/{domain}.ts`

**Server-side logic:**
- Database operations: Implement in tRPC procedures in `src/server/api/routers/`
- Database schema: `src/server/db/schema.ts`
- Middleware: Add to existing or create new in `src/server/api/trpc.ts`
- Auth logic: `src/server/better-auth/config.ts` or `server.ts`

## Special Directories

**`src/app/api/`:**
- Purpose: HTTP API routes (tRPC, auth endpoints)
- Generated: No
- Committed: Yes
- Contains dynamic routes that handle requests

**`tests/`:**
- Purpose: Test files (unit, e2e)
- Generated: No
- Committed: Yes
- Watch mode: `npm run test` (vitest), `npm run test:e2e:ui` (playwright)

**`.next/`:**
- Purpose: Build output from `next build`
- Generated: Yes
- Committed: No (in .gitignore)
- Created by: Next.js during build

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes
- Committed: No (in .gitignore)
- Installed by: pnpm install

**`public/`:**
- Purpose: Static files served at root (favicon, images, etc.)
- Generated: No
- Committed: Yes
- Served at: /favicon.ico → public/favicon.ico

**`src/styles/`:**
- Purpose: Global CSS (Tailwind directives)
- Generated: No
- Committed: Yes
- Imported in: `src/app/layout.tsx`

