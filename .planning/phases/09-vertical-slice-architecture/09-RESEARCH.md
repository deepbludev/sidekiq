# Phase 9: Vertical Slice Architecture - Research

**Researched:** 2026-01-27
**Domain:** Next.js codebase restructuring from horizontal layers to vertical feature slices
**Confidence:** HIGH

## Summary

This phase is a structural refactor of a 169-file Next.js App Router + tRPC codebase from horizontal layers (`components/`, `hooks/`, `server/`, `lib/`) to vertical feature slices under `src/features/` with shared cross-cutting code in `src/shared/`. The codebase currently uses a T3 Stack pattern (create-t3-app) with well-defined layers: 26+ UI components, 5 tRPC routers, 10 hooks, 6 validation schemas, and supporting library code.

The current codebase uses `@sidekiq/*` path aliases that map to `./src/*`. The refactor requires updating these to point at feature barrel files (`@sidekiq/chats` -> `src/features/chats/index.ts`) and shared code (`@sidekiq/shared/*`). All 43 test files (both unit and E2E) must continue passing, which means the alias configuration in `tsconfig.json`, `vitest.config.ts`, and import paths in test files must all stay consistent. The current tRPC setup is a standard T3 pattern where router infrastructure (`trpc.ts`) creates the context/procedures and feature routers are merged in `root.ts`.

Research confirms that barrel files for feature public APIs are acceptable in Next.js when used as controlled public API boundaries (not catch-all re-exports), but `optimizePackageImports` does NOT work for internal project barrel files. Since the barrel files here are thin index.ts files exporting only the public API of each feature (not re-exporting hundreds of components), the bundle impact is manageable. The key risk is importing a barrel file that transitively pulls in server-only code on the client.

**Primary recommendation:** Execute the restructure as a series of mechanical file moves per feature domain, updating path aliases incrementally, and verifying `tsc --noEmit` + `vitest run` + `pnpm build` after each feature slice is complete.

## Standard Stack

This phase introduces no new libraries. It restructures existing code using existing tooling.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.8.2 | Type checking validates all import paths after moves | Compiler catches broken imports immediately |
| Next.js | ^15.2.3 | App Router pages remain as thin routing wrappers | `app/` directory is purely routing |
| tRPC | ^11.0.0 | Feature routers merged into root appRouter | Standard mergeRouters/createTRPCRouter pattern |
| Vitest | ^4.0.17 | Unit test runner with `@sidekiq` alias resolution | Validates zero behavior change |
| Playwright | ^1.57.0 | E2E tests validate full app behavior | End-to-end regression safety net |
| ESLint | ^9.23.0 | Linting with flat config (typescript-eslint + drizzle) | Can enforce import boundaries |

### Supporting (Recommended Addition)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-boundaries | ^5.x | Enforce architectural layer rules (shared -> features -> app) | After restructure is complete, to prevent regression |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| eslint-plugin-boundaries | ESLint built-in `no-restricted-imports` + `import/no-restricted-paths` | Built-in is simpler but less expressive; boundaries plugin understands architectural layers natively |
| Manual barrel files | No barrel files (direct imports only) | Direct imports are safer for bundle size but sacrifice the clean public API boundary that makes cross-feature imports manageable |

**Installation (if adding boundaries plugin):**
```bash
pnpm add -D eslint-plugin-boundaries
```

## Architecture Patterns

### Target Project Structure
```
sidekiq-webapp/src/
├── app/                          # Next.js App Router (thin routing wrappers only)
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Dashboard route group
│   ├── api/                      # API route handlers (thin wrappers)
│   │   ├── auth/[...all]/route.ts
│   │   ├── chat/route.ts         # Thin wrapper -> features/chats/api/
│   │   └── trpc/[trpc]/route.ts  # Root tRPC handler
│   └── layout.tsx
├── features/                     # Feature slices (the core of this refactor)
│   ├── chats/                    # Chat feature
│   │   ├── index.ts              # Public API barrel file
│   │   ├── components/           # Chat UI components
│   │   ├── hooks/                # Shared hooks (feature-scoped)
│   │   └── api/                  # Server-side code
│   │       ├── router.ts         # tRPC router (was server/api/routers/thread.ts)
│   │       ├── service.ts        # Business logic (extracted from route.ts)
│   │       └── queries.ts        # DB operations
│   ├── sidekiqs/                 # Sidekiq feature
│   │   ├── index.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   │       ├── router.ts
│   │       ├── service.ts
│   │       └── queries.ts
│   ├── auth/                     # Authentication feature
│   │   ├── index.ts
│   │   ├── components/
│   │   └── api/                  # better-auth config, server helpers
│   ├── user/                     # User profile & preferences
│   │   ├── index.ts
│   │   ├── components/
│   │   └── api/
│   │       └── router.ts
│   ├── ai/                       # AI model selection & gateway
│   │   ├── index.ts
│   │   ├── components/           # model-picker components
│   │   ├── hooks/
│   │   └── api/                  # gateway.ts, models.ts, title.ts
│   ├── workspace/                # Teams -> Workspaces (future-proofing)
│   │   ├── index.ts
│   │   ├── components/           # team-* components
│   │   ├── hooks/
│   │   └── api/
│   │       └── router.ts
│   └── billing/                  # Billing (placeholder for future)
│       └── index.ts
├── shared/                       # Cross-cutting shared code
│   ├── ui/                       # Design system (shadcn/ui components)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...                   # All current components/ui/* files
│   ├── db/                       # Database infrastructure
│   │   ├── index.ts              # Drizzle client + connection
│   │   └── schema.ts             # Centralized Drizzle schema (ARCH-03)
│   ├── trpc/                     # tRPC infrastructure
│   │   ├── trpc.ts               # Context, procedures, middleware
│   │   ├── react.tsx             # Client-side tRPC provider
│   │   ├── server.ts             # RSC tRPC caller
│   │   └── query-client.ts       # TanStack Query client factory
│   ├── lib/                      # Cross-cutting utilities
│   │   ├── utils.ts              # cn() and generic helpers
│   │   ├── date-grouping.ts      # Used by multiple features
│   │   └── blob.ts               # Vercel Blob utilities
│   ├── icons/                    # Shared icon components
│   │   └── provider-icons.tsx
│   ├── env.js                    # Environment variable validation
│   └── constants/                # Shared constants
│       └── emoji-data.ts
├── middleware.ts                  # Next.js middleware (stays at src root)
└── styles/
    └── globals.css
```

### Pattern 1: Feature Barrel File as Public API
**What:** Each feature exports its public API through `index.ts`. Only exports intended for cross-feature consumption go here.
**When to use:** Every feature slice must have one.
**Example:**
```typescript
// src/features/chats/index.ts
// Components
export { ChatInterface } from "./components/chat-interface";
export { ChatHeader } from "./components/chat-header";

// Hooks
export { useThreadActions } from "./hooks/use-thread-actions";

// Types (re-exported for cross-feature use)
export type { ThreadListItem } from "./api/router";
```

**Critical rule:** Barrel files must NOT re-export server-only code that would be imported on the client. The `api/` subfolder contents should only be exported when explicitly needed by other server-side consumers (e.g., tRPC root router).

### Pattern 2: tRPC Router in Feature Directory
**What:** Each feature's tRPC router lives inside its `api/` directory. The root router imports and merges them.
**When to use:** Every feature that has server-side data operations.
**Example:**
```typescript
// src/features/chats/api/router.ts
import { createTRPCRouter, protectedProcedure } from "@sidekiq/shared/trpc/trpc";
import { threads } from "@sidekiq/shared/db/schema";
// ... (same logic as before, just new import paths)

export const threadRouter = createTRPCRouter({ /* ... */ });
```

```typescript
// src/app/api/trpc/[trpc]/route.ts (or a separate root-router.ts)
import { threadRouter } from "@sidekiq/chats/api/router";
import { sidekiqRouter } from "@sidekiq/sidekiqs/api/router";
// ... merge into appRouter
```

### Pattern 3: Thin App Router Page Wrappers
**What:** `app/` pages import and render feature components, containing minimal logic.
**When to use:** All dashboard pages.
**Example:**
```typescript
// src/app/(dashboard)/sidekiqs/page.tsx
// This page is already mostly a thin wrapper -- import paths change, logic stays
import { SidekiqList } from "@sidekiq/sidekiqs";
import { DeleteSidekiqDialog } from "@sidekiq/sidekiqs";
import { useSidekiqActions } from "@sidekiq/sidekiqs";
```

### Pattern 4: Path Alias Configuration
**What:** TypeScript path aliases map `@sidekiq/` prefix to features and shared code.
**When to use:** All cross-module imports.
**Example:**
```jsonc
// tsconfig.json paths
{
  "paths": {
    // Feature aliases (barrel files)
    "@sidekiq/chats": ["./src/features/chats/index.ts"],
    "@sidekiq/chats/*": ["./src/features/chats/*"],
    "@sidekiq/sidekiqs": ["./src/features/sidekiqs/index.ts"],
    "@sidekiq/sidekiqs/*": ["./src/features/sidekiqs/*"],
    "@sidekiq/auth": ["./src/features/auth/index.ts"],
    "@sidekiq/auth/*": ["./src/features/auth/*"],
    "@sidekiq/user": ["./src/features/user/index.ts"],
    "@sidekiq/user/*": ["./src/features/user/*"],
    "@sidekiq/ai": ["./src/features/ai/index.ts"],
    "@sidekiq/ai/*": ["./src/features/ai/*"],
    "@sidekiq/workspace": ["./src/features/workspace/index.ts"],
    "@sidekiq/workspace/*": ["./src/features/workspace/*"],
    "@sidekiq/billing": ["./src/features/billing/index.ts"],
    "@sidekiq/billing/*": ["./src/features/billing/*"],
    // Shared aliases
    "@sidekiq/shared/*": ["./src/shared/*"],
    "@sidekiq/ui/*": ["./src/shared/ui/*"],
    // Fallback for env.js and other root-level src files
    "@sidekiq/*": ["./src/*"]
  }
}
```

**Critical ordering note:** TypeScript resolves paths in order. Specific aliases (`@sidekiq/chats`) MUST come before the wildcard fallback (`@sidekiq/*`). This is how the old `@sidekiq/components/chat/...` imports are gradually replaced -- during migration, the fallback still resolves old paths until they are updated.

### Pattern 5: Vitest Alias Mirroring
**What:** vitest.config.ts must mirror the tsconfig.json path aliases.
**When to use:** After updating tsconfig.json.
**Example:**
```typescript
// vitest.config.ts
resolve: {
  alias: {
    // Feature aliases
    "@sidekiq/chats": path.resolve(__dirname, "./src/features/chats/index.ts"),
    "@sidekiq/sidekiqs": path.resolve(__dirname, "./src/features/sidekiqs/index.ts"),
    "@sidekiq/auth": path.resolve(__dirname, "./src/features/auth/index.ts"),
    "@sidekiq/user": path.resolve(__dirname, "./src/features/user/index.ts"),
    "@sidekiq/ai": path.resolve(__dirname, "./src/features/ai/index.ts"),
    "@sidekiq/workspace": path.resolve(__dirname, "./src/features/workspace/index.ts"),
    "@sidekiq/billing": path.resolve(__dirname, "./src/features/billing/index.ts"),
    // Shared
    "@sidekiq/shared": path.resolve(__dirname, "./src/shared"),
    "@sidekiq/ui": path.resolve(__dirname, "./src/shared/ui"),
    // Fallback
    "@sidekiq": path.resolve(__dirname, "./src"),
  },
},
```

**Alternative (simpler):** Use `vite-tsconfig-paths` plugin to automatically read from `tsconfig.json`, avoiding duplication. Currently the project uses manual alias config.

### Anti-Patterns to Avoid
- **Fat barrel files:** Do NOT re-export every file from a feature. Only export the public API. Fat barrels cause bundle bloat because `optimizePackageImports` does not work for internal project files.
- **Cross-feature deep imports:** Never import `@sidekiq/chats/components/chat-input` from another feature. Always go through the barrel: `@sidekiq/chats`.
- **Server code in client barrel:** Never export `api/router.ts` or `api/queries.ts` from the feature's `index.ts`. These are server-only and would break client bundles if accidentally imported.
- **Moving files AND changing logic:** This phase is structural only. If a file moves, its content must NOT change (except import paths). This makes git blame useful and reduces risk.
- **Big-bang migration:** Do NOT move all files at once. Move one feature slice at a time, verify after each.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import path updates after file moves | Manually search-replace all imports | TypeScript compiler errors (`tsc --noEmit`) | The compiler will tell you exactly which imports broke. Fix them one by one. |
| Circular dependency detection | Visual inspection of imports | `madge --circular --extensions ts,tsx src/` or `import/no-cycle` ESLint rule | Circular deps are invisible until runtime. Tools detect them statically. |
| Path alias resolution in tests | Duplicate alias configs in vitest | `vite-tsconfig-paths` plugin (reads tsconfig.json automatically) | Single source of truth for aliases. Currently the project has manual duplication. |
| Import boundary enforcement | Code review only | `eslint-plugin-boundaries` or `no-restricted-imports` | Rules are checked automatically on every lint run. Code review misses violations. |

**Key insight:** This refactor is 95% mechanical file moves and import path updates. The compiler and test suite are your safety net -- trust them over manual verification.

## Common Pitfalls

### Pitfall 1: Server/Client Boundary Violations
**What goes wrong:** Moving a file that uses `"use client"` into a feature barrel that also exports server-only code. Next.js throws "You're importing a component that needs 'server-only'" or silently bundles server code into the client.
**Why it happens:** Barrel files re-export everything, and Next.js cannot tree-shake internal barrel files.
**How to avoid:** Feature barrel files (`index.ts`) must ONLY export client-safe code. Server-side exports (routers, queries, services) are imported directly via `@sidekiq/chats/api/router` -- never through the barrel.
**Warning signs:** Build errors mentioning `server-only`, or unexpected increase in client bundle size.

### Pitfall 2: Breaking the tRPC Root Router
**What goes wrong:** Moving router files to new locations but forgetting to update the root router imports. The app starts but API calls fail with "procedure not found."
**Why it happens:** tRPC routers are dynamically composed at startup. TypeScript catches the missing import, but if you suppress the error, runtime fails silently.
**How to avoid:** Update root router (`src/app/api/trpc/[trpc]/route.ts` or separate root file) immediately after moving each feature router. Run `tsc --noEmit` before proceeding.
**Warning signs:** tRPC procedures returning 404 or "NOT_FOUND" errors.

### Pitfall 3: Drizzle Config Path Breaks
**What goes wrong:** The `drizzle.config.ts` references `schema: "./src/server/db/schema.ts"`. If schema moves to `./src/shared/db/schema.ts`, drizzle-kit commands (`db:generate`, `db:migrate`) silently fail to find the schema.
**Why it happens:** Drizzle config uses a file path string, not a TypeScript import. It is not covered by `tsc --noEmit`.
**How to avoid:** Update `drizzle.config.ts` schema path immediately when moving the schema file. Verify with `pnpm db:generate` (should produce "No schema changes").
**Warning signs:** `drizzle-kit generate` producing unexpected migration files (because it sees an empty schema).

### Pitfall 4: Test Import Paths Breaking Silently
**What goes wrong:** Unit tests import source files via `@sidekiq/components/chat/chat-input`. After the file moves, the alias still resolves (because the `@sidekiq/*` fallback exists) but points to a non-existent location, causing test failures.
**Why it happens:** The `@sidekiq/*` wildcard fallback in `tsconfig.json` resolves to `./src/*`, which may no longer have the file.
**How to avoid:** After moving each feature, run `vitest run` immediately. Update test imports to use the new path aliases. The vitest alias config must also be updated to match tsconfig.
**Warning signs:** `MODULE_NOT_FOUND` errors in test output, or tests importing stale paths.

### Pitfall 5: Circular Dependencies Between Features
**What goes wrong:** Feature A imports from Feature B's barrel, and Feature B imports from Feature A's barrel. This creates a circular dependency that may cause undefined imports at runtime.
**Why it happens:** In a horizontal layer structure, circular deps between `components/chat` and `components/sidebar` are hidden because they are in the same layer. When moved to separate features, the barrel file creates an explicit cycle.
**How to avoid:** Before moving files, audit cross-component imports. If chat components reference sidebar components (and vice versa), extract the shared dependency into `src/shared/` or restructure the dependency direction. Use `madge --circular` to detect.
**Warning signs:** `undefined is not a function` errors at runtime, or components rendering as `null`.

### Pitfall 6: Git History Loss
**What goes wrong:** If files are deleted and recreated (instead of git-moved), `git log --follow` cannot track the file history.
**Why it happens:** `git mv` vs `rm + add` -- git detects renames by content similarity, but if you also change import paths in the same commit, the diff may be too large for rename detection.
**How to avoid:** Split each feature migration into two commits: (1) `git mv` files to new locations, (2) update import paths. Or accept that git may not track all renames if changes are combined. At 169 files, the pragmatic approach is to move files and update imports together, accepting some history loss.
**Warning signs:** `git log --follow path/to/file` showing the file was created at the refactor commit, not the original creation.

### Pitfall 7: next.config.js Env Import Path
**What goes wrong:** `next.config.js` has `import "./src/env.js"` -- if `env.js` moves to `src/shared/env.js`, this static import path breaks the Next.js build at startup.
**Why it happens:** `next.config.js` runs before TypeScript compilation, so path aliases don't apply. It uses a raw filesystem path.
**How to avoid:** Keep `src/env.js` at the src root (or update the next.config.js import to `"./src/shared/env.js"`). The env.js file is cross-cutting infrastructure, so `src/shared/env.js` is the correct location, but the next.config.js import must be updated simultaneously.
**Warning signs:** Build fails immediately with "Cannot find module './src/env.js'".

## Code Examples

### Feature Barrel File (Chats)
```typescript
// src/features/chats/index.ts

// Components (client-safe)
export { ChatInterface } from "./components/chat-interface";
export { ChatHeader } from "./components/chat-header";
export { ChatInput } from "./components/chat-input";
export { EmptyState } from "./components/empty-state";
export { MessageList } from "./components/message-list";
export { MessageItem } from "./components/message-item";
export { MessageContent } from "./components/message-content";
export { MessageActions } from "./components/message-actions";
export { ChatScrollAnchor } from "./components/chat-scroll-anchor";
export { ScrollToBottom } from "./components/scroll-to-bottom";
export { TypingIndicator } from "./components/typing-indicator";
export { ModelSwitchHint } from "./components/model-switch-hint";

// Hooks (client-safe)
export { useThreadActions } from "./hooks/use-thread-actions";
export { useAutoScroll } from "./hooks/use-auto-scroll";
export { useScrollPosition } from "./hooks/use-scroll-position";
export { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";

// NOTE: api/router.ts, api/service.ts, api/queries.ts are NOT exported here.
// They are imported directly by the tRPC root router and app/api/chat route.
```

### tRPC Root Router After Restructure
```typescript
// src/shared/trpc/root.ts (or kept at src/app/api/trpc/ -- user decision)
import { createTRPCRouter, createCallerFactory } from "./trpc";

// Import feature routers directly (NOT through barrel files)
import { threadRouter } from "@sidekiq/chats/api/router";
import { sidekiqRouter } from "@sidekiq/sidekiqs/api/router";
import { teamRouter } from "@sidekiq/workspace/api/router";
import { userRouter } from "@sidekiq/user/api/router";
import { healthRouter } from "@sidekiq/shared/trpc/routers/health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  sidekiq: sidekiqRouter,
  team: teamRouter,
  thread: threadRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
```

### Updated tsconfig.json Paths
```jsonc
{
  "compilerOptions": {
    "paths": {
      // Feature barrel aliases (specific, higher priority)
      "@sidekiq/chats": ["./src/features/chats/index.ts"],
      "@sidekiq/chats/*": ["./src/features/chats/*"],
      "@sidekiq/sidekiqs": ["./src/features/sidekiqs/index.ts"],
      "@sidekiq/sidekiqs/*": ["./src/features/sidekiqs/*"],
      "@sidekiq/auth": ["./src/features/auth/index.ts"],
      "@sidekiq/auth/*": ["./src/features/auth/*"],
      "@sidekiq/user": ["./src/features/user/index.ts"],
      "@sidekiq/user/*": ["./src/features/user/*"],
      "@sidekiq/ai": ["./src/features/ai/index.ts"],
      "@sidekiq/ai/*": ["./src/features/ai/*"],
      "@sidekiq/workspace": ["./src/features/workspace/index.ts"],
      "@sidekiq/workspace/*": ["./src/features/workspace/*"],
      "@sidekiq/billing": ["./src/features/billing/index.ts"],
      "@sidekiq/billing/*": ["./src/features/billing/*"],
      // Shared aliases
      "@sidekiq/shared/*": ["./src/shared/*"],
      "@sidekiq/ui/*": ["./src/shared/ui/*"],
      // Fallback (keeps old paths working during migration)
      "@sidekiq/*": ["./src/*"]
    }
  }
}
```

### Drizzle Config Update
```typescript
// drizzle.config.ts
export default {
  schema: "./src/shared/db/schema.ts",  // Updated from ./src/server/db/schema.ts
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
} satisfies Config;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Horizontal layers (`components/`, `hooks/`, `server/`) | Vertical feature slices (`features/chats/`, etc.) | 2023-2025 mainstream | Better code locality, easier feature development, clearer ownership |
| Deep barrel re-exports | Thin barrel files as public API only | 2024 (Vercel barrel file blog post) | Prevents bundle bloat; `optimizePackageImports` only works for external packages |
| Single tRPC routers directory | Feature-owned routers merged at root | tRPC v11 (2024) | Routers live with their feature code |
| `modularizeImports` config | `optimizePackageImports` (external) + direct imports (internal) | Next.js 13.5+ | Simpler config for externals; direct imports for own code |

**Deprecated/outdated:**
- `modularizeImports` in next.config.js: Superseded by `optimizePackageImports` in Next.js 13.5+
- Full FSD (Feature-Sliced Design) layer system (app/processes/pages/widgets/features/entities/shared): Overly complex for this project size; the simpler feature-slice approach is sufficient
- Catch-all barrel files that re-export everything: Known to cause bundle bloat in Next.js

## Discretion Recommendations

The CONTEXT.md marked several areas as "Claude's Discretion." Here are research-backed recommendations:

### 1. Zod Schema Placement
**Recommendation:** Co-locate Zod schemas with the feature that defines them.
- `src/features/chats/validations.ts` (contains `chatRequestSchema`, `threadInputSchemas`)
- `src/features/sidekiqs/validations.ts` (contains `sidekiqSchemas`)
- `src/features/workspace/validations.ts` (contains `teamSchemas`)
- `src/features/auth/validations.ts` (contains `authSchemas`)
- `src/features/user/validations.ts` (contains `userSchemas`)

Currently these are in `src/lib/validations/`. They are feature-specific, so they belong in features.

### 2. Constants Organization
**Recommendation:** Move feature-specific constants into their feature. Keep truly shared constants in `src/shared/constants/`.
- `emoji-data.ts` is used by sidekiqs (emoji picker) -- move to `src/features/sidekiqs/constants/emoji-data.ts`
- If emoji-data is also used elsewhere, keep in `src/shared/constants/`

### 3. Atomic Design Depth for shared/ui/
**Recommendation:** Atoms-only. The current `components/ui/` directory contains shadcn/ui primitives (Button, Dialog, Input, etc.) which are all atoms. There are no molecules or organisms in the shared UI layer. Feature-specific composed components live in their feature's `components/` directory.
- `src/shared/ui/` = flat list of shadcn/ui primitives (no subdirectories)
- Complex composed components (e.g., `sidekiq-form.tsx`) live in `src/features/sidekiqs/components/`

### 4. Barrel File Strategy for shared/
**Recommendation:** No barrel file for `src/shared/` root. Import directly from subdirectories:
- `import { cn } from "@sidekiq/shared/lib/utils"`
- `import { Button } from "@sidekiq/ui/button"`
- `import { db } from "@sidekiq/shared/db"`

Reason: The shared directory contains very different concerns (UI, DB, tRPC, utils). A barrel file would mix server and client code, causing the server/client boundary pitfall described above.

### 5. Shared Alias Strategy
**Recommendation:** Use `@sidekiq/shared/*` for most shared code, with a shorthand `@sidekiq/ui/*` for UI components since they are the most frequently imported (51+ imports of `lib/utils`, 40+ imports of `ui/button`).

### 6. ESLint Enforcement vs Convention-Only
**Recommendation:** Convention-first during migration, ESLint enforcement after. Adding `eslint-plugin-boundaries` rules during the restructure would create noise. Add boundary rules in a follow-up task after all files are moved.

### 7. Cross-Feature State Sharing
**Recommendation:** No shared state layer needed. Features currently share state via:
- tRPC cache (TanStack Query) -- already works cross-feature
- React context for sidebar layout -- keep in shared layout component
- URL state (route params) -- managed by Next.js router

No new state mechanism is needed. If features need to communicate, they invalidate each other's tRPC cache via `utils.feature.query.invalidate()`.

### 8. API Barrel File Strategy
**Recommendation:** Unified barrel file per feature. The `api/` subfolder does NOT get its own barrel file. Instead:
- Feature barrel (`index.ts`) exports client-safe code only
- Server-side consumers import directly: `@sidekiq/chats/api/router`
- This keeps the public API clean while still allowing direct server imports

## File Movement Mapping

Based on codebase analysis, here is the mapping of current files to their target locations:

### Feature: chats
| Current Location | Target Location |
|-----------------|-----------------|
| `components/chat/*` (12 files) | `features/chats/components/` |
| `components/thread/*` (5 files) | `features/chats/components/` (threads are part of chat) |
| `hooks/use-thread-actions.ts` | `features/chats/hooks/` |
| `hooks/use-auto-scroll.ts` | `features/chats/hooks/` |
| `hooks/use-scroll-position.ts` | `features/chats/hooks/` |
| `hooks/use-keyboard-shortcuts.ts` | `features/chats/hooks/` |
| `hooks/use-thread-search.tsx` | `features/chats/hooks/` |
| `server/api/routers/thread.ts` | `features/chats/api/router.ts` |
| `lib/validations/thread.ts` | `features/chats/validations.ts` (merge) |
| `lib/validations/chat.ts` | `features/chats/validations.ts` (merge) |
| Business logic from `app/api/chat/route.ts` | `features/chats/api/service.ts` |

### Feature: sidekiqs
| Current Location | Target Location |
|-----------------|-----------------|
| `components/sidekiq/*` (14 files) | `features/sidekiqs/components/` |
| `hooks/use-sidekiq-actions.ts` | `features/sidekiqs/hooks/` |
| `server/api/routers/sidekiq.ts` | `features/sidekiqs/api/router.ts` |
| `lib/validations/sidekiq.ts` | `features/sidekiqs/validations.ts` |
| `lib/constants/emoji-data.ts` | `features/sidekiqs/constants/` |

### Feature: auth
| Current Location | Target Location |
|-----------------|-----------------|
| `components/auth/*` (6 files) | `features/auth/components/` |
| `server/better-auth/*` (4 files) | `features/auth/api/` |
| `lib/validations/auth.ts` | `features/auth/validations.ts` |

### Feature: user
| Current Location | Target Location |
|-----------------|-----------------|
| `server/api/routers/user.ts` | `features/user/api/router.ts` |
| `lib/validations/user.ts` | `features/user/validations.ts` |
| `hooks/use-view-preference.ts` | `features/user/hooks/` |

### Feature: ai
| Current Location | Target Location |
|-----------------|-----------------|
| `components/model-picker/*` (6 files) | `features/ai/components/` |
| `hooks/use-model-selection.ts` | `features/ai/hooks/` |
| `lib/ai/*` (4 files) | `features/ai/api/` |

### Feature: workspace
| Current Location | Target Location |
|-----------------|-----------------|
| `components/team/*` (12 files) | `features/workspace/components/` |
| `hooks/use-active-team.ts` | `features/workspace/hooks/` |
| `hooks/use-member-search.tsx` | `features/workspace/hooks/` |
| `server/api/routers/team.ts` | `features/workspace/api/router.ts` |
| `lib/validations/team.ts` | `features/workspace/validations.ts` |
| `lib/team-permissions.ts` | `features/workspace/lib/permissions.ts` |
| `lib/emails/team-invite.ts` | `features/workspace/api/emails.ts` |

### Shared
| Current Location | Target Location |
|-----------------|-----------------|
| `components/ui/*` (27 files) | `shared/ui/` |
| `components/icons/provider-icons.tsx` | `shared/icons/` |
| `components/theme/*` (2 files) | `shared/theme/` |
| `server/db/*` (3 files) | `shared/db/` |
| `server/api/trpc.ts` | `shared/trpc/trpc.ts` |
| `server/api/root.ts` | `shared/trpc/root.ts` |
| `server/api/routers/health.ts` | `shared/trpc/routers/health.ts` |
| `trpc/react.tsx` | `shared/trpc/react.tsx` |
| `trpc/server.ts` | `shared/trpc/server.ts` |
| `trpc/query-client.ts` | `shared/trpc/query-client.ts` |
| `lib/utils.ts` | `shared/lib/utils.ts` |
| `lib/utils/avatar.ts` | `shared/lib/avatar.ts` |
| `lib/date-grouping.ts` | `shared/lib/date-grouping.ts` |
| `lib/blob.ts` | `shared/lib/blob.ts` |
| `lib/sidebar-utils.ts` | `shared/lib/sidebar-utils.ts` |
| `env.js` | `shared/env.js` |

### Sidebar Distribution
The sidebar is distributed across features per CONTEXT.md:
| Current Location | Target Location |
|-----------------|-----------------|
| `components/sidebar/sidebar-layout.tsx` | `shared/layout/sidebar-layout.tsx` (composes feature sections) |
| `components/sidebar/sidebar-icon-rail.tsx` | `shared/layout/sidebar-icon-rail.tsx` |
| `components/sidebar/sidebar-panel.tsx` | `shared/layout/sidebar-panel.tsx` |
| `components/sidebar/sidebar-mobile-overlay.tsx` | `shared/layout/sidebar-mobile-overlay.tsx` |
| `components/sidebar/sidebar-mobile-tabs.tsx` | `shared/layout/sidebar-mobile-tabs.tsx` |
| `components/sidebar/sidebar-search.tsx` | `shared/layout/sidebar-search.tsx` |
| `components/sidebar/sidebar-panel-chats.tsx` | `features/chats/components/sidebar-panel-chats.tsx` |
| `components/sidebar/sidebar-panel-sidekiqs.tsx` | `features/sidekiqs/components/sidebar-panel-sidekiqs.tsx` |
| `components/sidebar/sidebar-panel-teams.tsx` | `features/workspace/components/sidebar-panel-teams.tsx` |
| `components/sidebar/sidebar-thread-list.tsx` | `features/chats/components/sidebar-thread-list.tsx` |
| `components/sidebar/sidebar-thread-group.tsx` | `features/chats/components/sidebar-thread-group.tsx` |

## Open Questions

1. **Chat route.ts refactoring depth**
   - What we know: The CONTEXT.md says business logic moves to `features/chats/api/`, and the route handler stays as a thin wrapper. The current `route.ts` is 319 lines with deeply interleaved auth, validation, DB operations, and streaming logic.
   - What's unclear: How much to extract into `service.ts` vs `queries.ts` in this phase, vs leaving the extraction for a later refactor. The CONTEXT.md says "no new capabilities" but extracting service layers IS a structural change.
   - Recommendation: Move `route.ts` content as-is into `features/chats/api/chat-handler.ts` and keep the app/api/chat/route.ts as a one-line re-export. Defer service/query layer extraction to avoid scope creep. The three-layer split (router, service, queries) can happen in a follow-up.

2. **Sidebar layout component ownership**
   - What we know: Sidebar layout is a shared composition shell. Individual panels are feature-owned. The current sidebar-layout.tsx imports from multiple features.
   - What's unclear: Should the shared layout component import feature sidebar panels directly, or should features register their panels through a composition pattern?
   - Recommendation: Direct imports from feature barrels. The layout component imports `SidebarPanelChats` from `@sidekiq/chats`, `SidebarPanelSidekiqs` from `@sidekiq/sidekiqs`, etc. Simple and explicit.

3. **Unit test co-location timing**
   - What we know: CONTEXT.md says unit tests should be co-located (`chat-input.test.ts` next to `chat-input.tsx`). Currently they are in a separate `tests/unit/` directory mirroring the src structure.
   - What's unclear: Moving 43 test files from `tests/unit/` into feature directories in the same phase adds significant complexity. Should test co-location happen in this phase or as a follow-up?
   - Recommendation: Defer test co-location. Keep `tests/unit/` and `tests/e2e/` as-is in this phase. Update import paths in test files to use new aliases, but don't move test files themselves. This keeps the verification step simple (all tests must pass). Test co-location is a separate, low-risk task that can follow.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All 169 source files, tsconfig.json, vitest.config.ts, eslint.config.js, next.config.js, drizzle.config.ts, playwright.config.ts examined directly
- Import dependency analysis: `grep -r 'from "@sidekiq/'` across all source and test files (87 unique import paths)
- [Next.js official project structure docs](https://nextjs.org/docs/app/getting-started/project-structure) - confirms Next.js is unopinionated, `app/` should be routing-focused
- [Vercel barrel files blog](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) - `optimizePackageImports` is for external packages only, not internal barrel files
- [Next.js optimizePackageImports docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports) - config reference

### Secondary (MEDIUM confidence)
- [Feature-Sliced Design + Next.js guide](https://feature-sliced.design/docs/guides/tech/with-nextjs) - FSD/Next.js integration patterns
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries) - architectural boundary enforcement
- [tRPC v11 Next.js setup guide](https://dev.to/matowang/trpc-11-setup-for-nextjs-app-router-2025-33fo) - confirms feature router merge pattern
- [GitHub issue: optimizePackageImports + local packages](https://github.com/vercel/next.js/issues/75148) - confirms limitation with internal barrel files

### Tertiary (LOW confidence)
- [Feature Driven Architecture for Next.js](https://medium.com/@JMauclair/feature-driven-architecture-fda-a-scalable-way-to-structure-your-next-js-applications-b8c1703a29c0) - community patterns
- [Barrel files performance impact blog](https://javascript.plainenglish.io/why-i-stopped-using-barrel-files-in-next-js-and-cut-my-first-load-js-from-1-5-mb-to-200-kb-3afdf5f359fd) - real-world bundle size data
- [Circular dependency detection in Next.js](https://github.com/tiaanduplessis/next-circular-dependency) - tooling reference

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, just restructuring existing code; full codebase analysis performed
- Architecture: HIGH - Target structure derived from CONTEXT.md decisions + codebase analysis; every file mapped to its target location
- Pitfalls: HIGH - Based on direct analysis of the actual import graph, configuration files, and known Next.js barrel file behavior
- Discretion recommendations: MEDIUM - Based on codebase patterns and community best practices; reasonable people could choose differently

**Research date:** 2026-01-27
**Valid until:** 2026-03-27 (stable -- this is a refactoring pattern, not a fast-moving library)
