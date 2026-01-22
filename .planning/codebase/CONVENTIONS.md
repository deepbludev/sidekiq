# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `SignInForm`, `AuthCard`)
- Pages: kebab-case or PascalCase in app router (e.g., `sign-up/page.tsx`, `SignUpPage`)
- Utilities: camelCase (e.g., `utils.ts`, `blob.ts`)
- Validation schemas: camelCase (e.g., `signUpSchema`, `authSchema`)
- Database schema: camelCase for tables (e.g., `teams`, `sidekiqs`, `threads`)

**Functions:**
- React components: PascalCase (e.g., `Card`, `SignInForm`)
- Utility functions: camelCase (e.g., `cn()`, `onSubmit()`)
- Server functions: camelCase (e.g., `createTRPCContext()`, `protectedProcedure`)
- Database operations: camelCase (e.g., `getUserByEmail()`)

**Variables:**
- State and local variables: camelCase (e.g., `isLoading`, `callbackURL`, `emailVerified`)
- Constants: camelCase or UPPER_SNAKE_CASE for env vars (e.g., `DATABASE_URL`, `NODE_ENV`)
- Database columns: camelCase (e.g., `createdAt`, `updatedAt`, `emailVerified`)

**Types:**
- Interface/Type names: PascalCase (e.g., `SignInInput`, `SignInFormProps`)
- Generic type parameters: PascalCase (e.g., `T`, `Props`)
- Enum values: lowercase or UPPER_SNAKE_CASE based on use (e.g., `"owner"`, `"member"` for enums)

## Code Style

**Formatting:**
- Prettier with tailwindcss plugin
- Default Prettier settings with no explicit config beyond plugin
- Tailwind class ordering via `prettier-plugin-tailwindcss`
- File types formatted: `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mdx`

**Linting:**
- ESLint with TypeScript support (typescript-eslint)
- Flat config format (`eslint.config.js`)
- Next.js and core-web-vitals rules
- Drizzle ORM linting for database safety

**Key ESLint Rules:**
- `@typescript-eslint/consistent-type-imports`: Enabled with inline-type-imports (warn)
- `@typescript-eslint/no-unused-vars`: Variables prefixed with `_` are ignored
- `@typescript-eslint/no-misused-promises`: Checks for void return in async attributes
- `drizzle/enforce-delete-with-where`: All deletes must have WHERE clause
- `drizzle/enforce-update-with-where`: All updates must have WHERE clause
- Array types: Off (allows both `T[]` and `Array<T>`)
- Type definitions: Off (allows both `type` and `interface`)

## Import Organization

**Order:**
1. React/Next.js imports: `react`, `react-dom`, `next/*`
2. Third-party library imports: `@hookform`, `zod`, `lucide-react`, `sonner`, etc.
3. Internal alias imports: `@sidekiq/*`
4. Relative imports: `./`, `../` (rarely used due to path aliases)

**Path Aliases:**
- `@sidekiq/*` → `./src/*`
- Used consistently throughout codebase for non-relative imports
- Never use relative paths when alias is available

**Example:**
```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@sidekiq/server/better-auth/client";
import { signInSchema, type SignInInput } from "@sidekiq/lib/validations/auth";
import { Button } from "@sidekiq/components/ui/button";
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations
- User-facing errors via toast notifications (`toast.error()`, `toast.success()`)
- Generic error messages for unexpected errors: `"An unexpected error occurred"`
- Zod validation errors handled at form level via `zodResolver`
- tRPC error formatting with Zod error details:

```typescript
errorFormatter({ shape, error }) {
  return {
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  };
}
```

- Protected procedures throw `TRPCError` with `"UNAUTHORIZED"` code for auth failures
- Database operations assume no errors (trust framework/schema guarantees)

## Logging

**Framework:** `console` (via tRPC timing middleware)

**Patterns:**
- Timing logs for tRPC procedures: `console.log(\`[TRPC] ${path} took ${end - start}ms\`)`
- Development-only artificial network delay (100-500ms) via timing middleware
- No structured logging framework detected; console logging used ad-hoc

## Comments

**When to Comment:**
- JSDoc comments for exported functions, components, and constants
- Inline comments for complex logic or non-obvious decisions
- Section headers for major code blocks (e.g., `/** 1. CONTEXT */`)
- Description comments for tRPC procedures and middleware

**JSDoc/TSDoc:**
- Used extensively for exported items
- Format: `/** description */`
- Used to document procedure purposes, schema intentions, and component props
- Examples:
```typescript
/**
 * Schema for user sign up form validation
 */
export const signUpSchema = z...

/**
 * Auth layout with centered content and redirect for authenticated users
 */
export default async function AuthLayout({...})

/**
 * Sign in form with email/password authentication
 */
export function SignInForm({ callbackURL = "/dashboard" }: SignInFormProps)
```

## Function Design

**Size:** Prefer small functions; components typically 50-150 lines

**Parameters:**
- Use object destructuring for multiple parameters
- TypeScript for all parameters (strict mode enabled)
- Props interfaces for components: `interface ComponentNameProps { ... }`

**Return Values:**
- Explicit return types on all exported functions
- Async functions return promises
- React components return JSX elements
- Example: `async function onSubmit(values: SignInInput): Promise<void>`

## Module Design

**Exports:**
- Named exports for reusable components and utilities
- Export types separately with `type` keyword
- Barrel files not detected; direct file imports preferred
- Each file exports a single primary export (functions) or multiple related exports (UI components)

**Barrel Files:**
- Not used in current structure
- Component subdirectories (`ui/`, `auth/`) have individual file imports

**Examples:**
```typescript
// Validation schema with type export
export const signUpSchema = z...
export type SignUpInput = z.infer<typeof signUpSchema>;

// Component with related sub-components
export { Card, CardHeader, CardFooter, CardTitle, ... }

// Single function export
export const cn(...inputs: ClassValue[]) { ... }
```

## Database Conventions

**Schema Naming:**
- Table names: camelCase (e.g., `user`, `teams`, `sidekiqs`, `teamMembers`)
- Column names: camelCase with PostgreSQL snake_case in quotes (e.g., `createdAt` → `"created_at"`)
- Enum types: camelCase (e.g., `teamRoleEnum`, `messageRoleEnum`)

**Relations:**
- Named relations at bottom of schema file
- One-to-many and one-to-one relationships explicitly defined
- Cascade delete for dependent records
- Optional relations set to null on delete

---

*Convention analysis: 2026-01-22*
