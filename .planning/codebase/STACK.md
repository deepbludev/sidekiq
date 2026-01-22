# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.8.2 - Full application (frontend and backend)
- JavaScript - Build configuration and utilities

**Secondary:**
- SQL (PostgreSQL dialect) - Database queries via Drizzle ORM
- CSS - Styling via Tailwind CSS v4

## Runtime

**Environment:**
- Node.js v22.9.0
- Browser (React 19 for client-side)

**Package Manager:**
- pnpm 10.10.0
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Next.js 15.2.3 - Full-stack React framework with App Router
- React 19.0.0 - UI component library
- React DOM 19.0.0 - DOM rendering

**API & State Management:**
- tRPC 11.0.0 - End-to-end typesafe APIs
  - `@trpc/server` 11.0.0
  - `@trpc/client` 11.0.0
  - `@trpc/react-query` 11.0.0
- TanStack React Query 5.69.0 - Server state management
- Zod 3.24.2 - Runtime type validation and schema

**Authentication:**
- better-auth 1.3 - Full-featured authentication library
  - `@auth/drizzle-adapter` 1.7.2 - Database integration for sessions/users
  - Email and password authentication
  - GitHub OAuth provider
  - Password reset via email

**Forms & Validation:**
- React Hook Form 7.71.1 - Form state management
- `@hookform/resolvers` 5.2.2 - Validation resolver integration

**Database:**
- Drizzle ORM 0.41.0 - TypeScript ORM with PostgreSQL support
- drizzle-kit 0.30.5 - Migration and schema tooling
- postgres 3.4.4 - PostgreSQL client driver

**UI Components:**
- Radix UI (multiple packages) - Headless UI primitive components
  - `@radix-ui/react-avatar` 1.1.11
  - `@radix-ui/react-dialog` 1.1.15
  - `@radix-ui/react-dropdown-menu` 2.1.16
  - `@radix-ui/react-label` 2.1.8
  - `@radix-ui/react-scroll-area` 1.2.10
  - `@radix-ui/react-separator` 1.1.8
  - `@radix-ui/react-slot` 1.2.4
  - `@radix-ui/react-tooltip` 1.2.8
- Tailwind CSS 4.0.15 - Utility-first CSS framework
- class-variance-authority 0.7.1 - Component style variations
- clsx 2.1.1 - Classname utility
- tailwind-merge 3.4.0 - Intelligent Tailwind class merging
- tw-animate-css 1.4.0 - Animation utilities
- lucide-react 0.562.0 - Icon library

**UI Enhancements:**
- next-themes 0.4.6 - Dark mode and theme support
- sonner 2.0.7 - Toast notification library

**Testing:**
- Vitest 4.0.17 - Unit test framework
- `@testing-library/react` 16.3.2 - React component testing utilities
- `@testing-library/dom` 10.4.1 - DOM testing utilities
- `@testing-library/jest-dom` 6.9.1 - DOM matchers
- `@testing-library/user-event` 14.6.1 - User interaction simulation
- happy-dom 20.3.4 - Lightweight DOM implementation for tests
- jsdom 27.4.0 - JavaScript implementation of web standards
- Playwright 1.57.0 - E2E testing framework
  - `@playwright/test` 1.57.0

**Build & Dev Tools:**
- Next.js built-in webpack bundler (via Turbo)
- PostCSS 8.5.3 - CSS transformation
- `@vitejs/plugin-react` 5.1.2 - React plugin for Vite
- prettier-plugin-tailwindcss 0.6.11 - Tailwind class sorting

**Linting & Formatting:**
- ESLint 9.23.0 - Code linting
  - eslint-config-next 15.2.3 - Next.js rules
  - `@eslint/eslintrc` 3.3.1 - ESLint config compatibility
  - typescript-eslint 8.27.0 - TypeScript linting rules
  - eslint-plugin-drizzle 0.2.3 - Drizzle ORM rules
- Prettier 3.5.3 - Code formatter

**Environment & Configuration:**
- `@t3-oss/env-nextjs` 0.12.0 - Server and client env validation
- server-only 0.0.1 - Ensure server-only code isn't sent to client

**Utilities:**
- superjson 2.2.1 - JSON serialization for complex types
- `@vercel/blob` 2.0.0 - File storage via Vercel Blob
- resend 6.8.0 - Email service for transactional emails

## Configuration

**Environment:**
- `.env` file for local development (gitignored)
- `.env.example` for reference
- Validated via `@t3-oss/env-nextjs` at `src/env.js`
- Server-side validation enforced at build time

**Key env vars required:**
- `BETTER_AUTH_SECRET` - Auth signing secret
- `BETTER_AUTH_URL` - Auth redirect base URL
- `BETTER_AUTH_GITHUB_CLIENT_ID` - GitHub OAuth
- `BETTER_AUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth
- `DATABASE_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (optional)
- `RESEND_API_KEY` - Email service token (optional)
- `EMAIL_FROM` - Sender email address

**Build:**
- `tsconfig.json` - TypeScript strict mode enabled
  - ES2022 target
  - Strict null checks and unchecked indexed access
  - Path alias: `@sidekiq/*` → `./src/*`
- `next.config.js` - Minimal Next.js config
- `drizzle.config.ts` - ORM migration configuration
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- Node.js 22.9.0+
- PostgreSQL database (Docker Compose provided)
- pnpm 10.10.0

**Production:**
- Node.js 22.9.0+
- PostgreSQL database
- Vercel Blob storage (for avatars)
- Resend email service (for password resets)
- Docker containerization supported

---

*Stack analysis: 2026-01-22*
